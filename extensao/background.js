const ESTADO_INICIAL = {
  executando: false,
  aguardandoSeguranca: false,
  mensagem: "Abra uma listagem do Imovelweb para começar.",
  tabId: null,
  fila: [],
  vistos: [],
  resultados: [],
  proximaListagem: null,
  paginasLidas: 0,
  maxPaginas: 1,
  maxAnuncios: 20,
  intervaloSegundos: 8
};

let processando = false;
let temporizador = null;

async function obterEstado() {
  const { coleta } = await chrome.storage.local.get("coleta");
  return { ...ESTADO_INICIAL, ...(coleta || {}) };
}

async function salvarEstado(alteracoes) {
  const atual = await obterEstado();
  const novo = { ...atual, ...alteracoes };
  await chrome.storage.local.set({ coleta: novo });
  return novo;
}

async function atualizarAba(url, estado) {
  if (!estado.executando || !estado.tabId) return;
  await chrome.tabs.update(estado.tabId, { url, active: true });
}

function agendar(funcao, segundos) {
  clearTimeout(temporizador);
  temporizador = setTimeout(funcao, Math.max(1, segundos) * 1000);
}

async function proximoDestino(estado) {
  if (!estado.executando) return;

  if (estado.resultados.length >= estado.maxAnuncios) {
    await finalizar("Limite de anúncios atingido.");
    return;
  }

  if (estado.fila.length) {
    const [url, ...restante] = estado.fila;
    const novo = await salvarEstado({
      fila: restante,
      mensagem: `Abrindo anúncio ${estado.resultados.length + 1}...`
    });
    agendar(() => atualizarAba(url, novo), novo.intervaloSegundos);
    return;
  }

  if (estado.proximaListagem && estado.paginasLidas < estado.maxPaginas) {
    const url = estado.proximaListagem;
    const novo = await salvarEstado({
      proximaListagem: null,
      mensagem: `Abrindo página ${estado.paginasLidas + 1} da listagem...`
    });
    agendar(() => atualizarAba(url, novo), novo.intervaloSegundos);
    return;
  }

  await finalizar("Coleta concluída.");
}

async function finalizar(mensagem) {
  clearTimeout(temporizador);
  await salvarEstado({
    executando: false,
    aguardandoSeguranca: false,
    mensagem
  });
}

async function analisarAba(tabId) {
  if (processando) return;
  processando = true;
  try {
    let estado = await obterEstado();
    if (!estado.executando || estado.tabId !== tabId) return;

    let resposta;
    try {
      resposta = await chrome.tabs.sendMessage(tabId, { tipo: "analisarPagina" });
    } catch {
      await salvarEstado({
        mensagem: "A página ainda está carregando. Use Continuar em alguns segundos."
      });
      return;
    }

    if (resposta.tipo === "seguranca") {
      await salvarEstado({
        aguardandoSeguranca: true,
        mensagem:
          "Verificação detectada. Resolva-a manualmente e clique em Continuar."
      });
      return;
    }

    if (resposta.tipo === "listagem") {
      const vistos = new Set(estado.vistos);
      const novosLinks = resposta.links.filter((url) => !vistos.has(url));
      novosLinks.forEach((url) => vistos.add(url));
      const vagas = Math.max(0, estado.maxAnuncios - estado.resultados.length);
      estado = await salvarEstado({
        aguardandoSeguranca: false,
        fila: [...estado.fila, ...novosLinks].slice(0, vagas),
        vistos: [...vistos],
        proximaListagem: resposta.proximaPagina,
        paginasLidas: estado.paginasLidas + 1,
        mensagem: `${novosLinks.length} anúncios novos encontrados nesta página.`
      });
      await proximoDestino(estado);
      return;
    }

    if (resposta.tipo === "anuncio") {
      const jaColetado = estado.resultados.some(
        (imovel) => imovel.url === resposta.imovel.url
      );
      const resultados = jaColetado
        ? estado.resultados
        : [...estado.resultados, resposta.imovel];
      estado = await salvarEstado({
        aguardandoSeguranca: false,
        resultados,
        mensagem: `${resultados.length} anúncio(s) coletado(s).`
      });
      await proximoDestino(estado);
    }
  } finally {
    processando = false;
  }
}

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "complete") analisarAba(tabId);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const estado = await obterEstado();
  if (estado.executando && estado.tabId === tabId) {
    await finalizar("A aba usada na coleta foi fechada.");
  }
});

chrome.runtime.onMessage.addListener((mensagem, _remetente, responder) => {
  if (mensagem?.tipo === "obterEstado") {
    obterEstado().then(responder);
    return true;
  }

  if (mensagem?.tipo === "iniciar") {
    (async () => {
      const estado = {
        ...ESTADO_INICIAL,
        executando: true,
        tabId: mensagem.tabId,
        maxPaginas: mensagem.maxPaginas,
        maxAnuncios: mensagem.maxAnuncios,
        intervaloSegundos: mensagem.intervaloSegundos,
        mensagem: "Analisando a primeira página da listagem..."
      };
      await chrome.storage.local.set({ coleta: estado });
      await analisarAba(mensagem.tabId);
      responder(await obterEstado());
    })();
    return true;
  }

  if (mensagem?.tipo === "parar") {
    finalizar("Coleta interrompida pelo usuário.").then(async () => {
      responder(await obterEstado());
    });
    return true;
  }

  if (mensagem?.tipo === "continuar") {
    (async () => {
      await salvarEstado({
        executando: true,
        aguardandoSeguranca: false,
        mensagem: "Verificando a página novamente..."
      });
      await analisarAba(mensagem.tabId);
      responder(await obterEstado());
    })();
    return true;
  }

  if (mensagem?.tipo === "limpar") {
    chrome.storage.local.set({ coleta: ESTADO_INICIAL }).then(() => {
      responder(ESTADO_INICIAL);
    });
    return true;
  }

  if (mensagem?.tipo === "exportar") {
    (async () => {
      const estado = await obterEstado();
      const colunas = [
        "titulo",
        "preco",
        "endereco",
        "area",
        "quartos",
        "banheiros",
        "vagas",
        "codigo",
        "descricao",
        "url",
        "coletado_em"
      ];
      const escapar = (valor) =>
        `"${String(valor ?? "").replaceAll('"', '""')}"`;
      const csv = [
        colunas.join(","),
        ...estado.resultados.map((item) =>
          colunas.map((coluna) => escapar(item[coluna])).join(",")
        )
      ].join("\r\n");
      const url = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
      await chrome.downloads.download({
        url,
        filename: `imoveis-${new Date().toISOString().slice(0, 10)}.csv`,
        saveAs: true
      });
      responder({ ok: true });
    })();
    return true;
  }
});
