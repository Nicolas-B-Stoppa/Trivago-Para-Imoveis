const elementos = {
  status: document.querySelector("#status"),
  paginas: document.querySelector("#paginas"),
  resultados: document.querySelector("#resultados"),
  fila: document.querySelector("#fila"),
  maxPaginas: document.querySelector("#maxPaginas"),
  maxAnuncios: document.querySelector("#maxAnuncios"),
  intervalo: document.querySelector("#intervalo"),
  iniciar: document.querySelector("#iniciar"),
  continuar: document.querySelector("#continuar"),
  parar: document.querySelector("#parar"),
  exportar: document.querySelector("#exportar"),
  limpar: document.querySelector("#limpar")
};

async function mensagem(dados) {
  return chrome.runtime.sendMessage(dados);
}

function numero(elemento, minimo, maximo) {
  const valor = Number.parseInt(elemento.value, 10);
  return Math.min(maximo, Math.max(minimo, valor || minimo));
}

function renderizar(estado) {
  elementos.status.textContent = estado.mensagem;
  elementos.paginas.textContent = estado.paginasLidas;
  elementos.resultados.textContent = estado.resultados.length;
  elementos.fila.textContent = estado.fila.length;

  elementos.iniciar.disabled = estado.executando;
  elementos.parar.disabled = !estado.executando;
  elementos.continuar.disabled =
    !estado.executando || !estado.aguardandoSeguranca;
  elementos.exportar.disabled = estado.resultados.length === 0;
  elementos.limpar.disabled = estado.executando;
}

async function abaAtual() {
  const [aba] = await chrome.tabs.query({ active: true, currentWindow: true });
  return aba;
}

elementos.iniciar.addEventListener("click", async () => {
  const aba = await abaAtual();
  if (!aba?.url?.startsWith("https://www.imovelweb.com.br/")) {
    elementos.status.textContent =
      "Abra uma listagem em www.imovelweb.com.br antes de iniciar.";
    return;
  }
  renderizar(
    await mensagem({
      tipo: "iniciar",
      tabId: aba.id,
      maxPaginas: numero(elementos.maxPaginas, 1, 100),
      maxAnuncios: numero(elementos.maxAnuncios, 1, 1000),
      intervaloSegundos: numero(elementos.intervalo, 3, 120)
    })
  );
});

elementos.continuar.addEventListener("click", async () => {
  const aba = await abaAtual();
  renderizar(await mensagem({ tipo: "continuar", tabId: aba.id }));
});

elementos.parar.addEventListener("click", async () => {
  renderizar(await mensagem({ tipo: "parar" }));
});

elementos.exportar.addEventListener("click", async () => {
  await mensagem({ tipo: "exportar" });
});

elementos.limpar.addEventListener("click", async () => {
  renderizar(await mensagem({ tipo: "limpar" }));
});

async function atualizar() {
  renderizar(await mensagem({ tipo: "obterEstado" }));
}

atualizar();
setInterval(atualizar, 1000);
