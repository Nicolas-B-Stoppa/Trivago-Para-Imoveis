function texto(elemento) {
  if (!elemento) return null;
  return elemento.textContent.replace(/\s+/g, " ").trim() || null;
}

function primeiroTexto(seletores) {
  for (const seletor of seletores) {
    const valor = texto(document.querySelector(seletor));
    if (valor) return valor;
  }
  return null;
}

function meta(...propriedades) {
  for (const propriedade of propriedades) {
    const elemento = document.querySelector(
      `meta[property="${propriedade}"], meta[name="${propriedade}"]`
    );
    if (elemento?.content) return elemento.content.trim();
  }
  return null;
}

function objetosJsonLd() {
  const objetos = [];
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const valor = JSON.parse(script.textContent);
      const itens = Array.isArray(valor) ? valor : [valor];
      for (const item of itens) {
        if (!item || typeof item !== "object") continue;
        if (Array.isArray(item["@graph"])) objetos.push(...item["@graph"]);
        objetos.push(item);
      }
    } catch {
      // Alguns anúncios contêm JSON-LD inválido; os seletores HTML são o fallback.
    }
  }
  return objetos;
}

function jsonLdImovel() {
  const tipos = new Set([
    "Apartment",
    "House",
    "Product",
    "Residence",
    "SingleFamilyResidence"
  ]);
  const objetos = objetosJsonLd();
  return (
    objetos.find((objeto) => {
      const tipo = Array.isArray(objeto?.["@type"])
        ? objeto["@type"]
        : [objeto?.["@type"]];
      return tipo.some((item) => tipos.has(item));
    }) ||
    objetos.find((objeto) => objeto?.name) ||
    {}
  );
}

function caracteristica(textoPagina, expressao) {
  return textoPagina.match(expressao)?.[1]?.trim() || null;
}

function enderecoJson(valor) {
  if (typeof valor === "string") return valor.trim() || null;
  if (!valor || typeof valor !== "object") return null;
  return [
    valor.streetAddress,
    valor.addressLocality,
    valor.addressRegion,
    valor.postalCode
  ]
    .filter(Boolean)
    .map((parte) => String(parte).trim())
    .join(", ") || null;
}

function precoJson(objeto) {
  let oferta = objeto.offers;
  if (Array.isArray(oferta)) oferta = oferta[0];
  if (!oferta || typeof oferta !== "object" || oferta.price == null) return null;
  const prefixo =
    oferta.priceCurrency === "BRL"
      ? "R$ "
      : oferta.priceCurrency
        ? `${oferta.priceCurrency} `
        : "";
  return `${prefixo}${oferta.price}`;
}

function paginaDeSeguranca() {
  const conteudoVisivel = (document.body?.innerText || "").toLowerCase();
  const titulo = document.title.toLowerCase();
  const marcadores = [
    "checking your browser",
    "verify you are human",
    "verifique se você é humano",
    "verifique se voce e humano",
    "executando verificação",
    "executando verifica"
  ];
  const tituloDeDesafio =
    titulo.includes("just a moment") ||
    titulo.includes("um momento") ||
    titulo.includes("attention required");
  const formularioDeDesafio = [
    ...document.querySelectorAll(
      "#challenge-form, #challenge-running, #cf-challenge-running"
    )
  ].some((elemento) => {
    const estilo = getComputedStyle(elemento);
    const retangulo = elemento.getBoundingClientRect();
    return (
      estilo.display !== "none" &&
      estilo.visibility !== "hidden" &&
      Number.parseFloat(estilo.opacity || "1") > 0 &&
      retangulo.width > 0 &&
      retangulo.height > 0
    );
  });

  return Boolean(
    tituloDeDesafio ||
      formularioDeDesafio ||
      marcadores.some((marcador) => conteudoVisivel.includes(marcador))
  );
}

function coletarLinksDaListagem() {
  const links = new Set();
  for (const ancora of document.querySelectorAll("a[href]")) {
    try {
      const url = new URL(ancora.href, location.href);
      if (
        url.hostname === "www.imovelweb.com.br" &&
        url.pathname.includes("/propriedades/") &&
        url.pathname.endsWith(".html")
      ) {
        url.hash = "";
        links.add(url.href);
      }
    } catch {
      // Ignora links incompletos ou inválidos.
    }
  }
  return [...links];
}

function proximaPagina() {
  const seletores = [
    'a[rel="next"]',
    'a[data-qa*="PAGING_NEXT"]',
    'a[data-qa*="NEXT"]',
    'a[aria-label*="Próxima" i]',
    'a[aria-label*="Proxima" i]',
    'a[aria-label*="Seguinte" i]'
  ];
  for (const seletor of seletores) {
    const link = document.querySelector(seletor);
    if (link?.href) return link.href;
  }

  for (const link of document.querySelectorAll("a[href]")) {
    const rotulo = `${texto(link) || ""} ${link.getAttribute("aria-label") || ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (/\b(proxima|seguinte|next)\b/.test(rotulo)) return link.href;
  }

  const paginaAtual =
    Number.parseInt(location.pathname.match(/-pagina-(\d+)\.html$/)?.[1], 10) || 1;
  const caminhoBase = location.pathname.replace(
    /(?:-pagina-\d+)?\.html$/,
    ".html"
  );
  const paginasPosteriores = [...document.querySelectorAll("a[href]")]
    .map((link) => {
      try {
        const url = new URL(link.href, location.href);
        const numero = Number.parseInt(
          url.pathname.match(/-pagina-(\d+)\.html$/)?.[1],
          10
        );
        const base = url.pathname.replace(/-pagina-\d+\.html$/, ".html");
        return { url, numero, base };
      } catch {
        return null;
      }
    })
    .filter(
      (item) =>
        item &&
        item.url.hostname === location.hostname &&
        item.base === caminhoBase &&
        item.numero > paginaAtual
    )
    .sort((a, b) => a.numero - b.numero);

  if (paginasPosteriores.length) return paginasPosteriores[0].url.href;
  return null;
}

function extrairAnuncio() {
  const jsonLd = jsonLdImovel();
  const textoPagina = document.body?.innerText.replace(/\s+/g, " ").trim() || "";
  const titulo =
    jsonLd.name ||
    primeiroTexto([
      "h1",
      '[data-qa="POSTING_CARD_TITLE"]',
      '[class*="title"]'
    ]) ||
    meta("og:title");
  const descricao =
    jsonLd.description ||
    meta("description", "og:description") ||
    primeiroTexto([
      '[data-qa="DESCRIPTION_TEXT"]',
      '[class*="description"]'
    ]);

  return {
    url: location.href,
    titulo: titulo ? String(titulo).trim() : null,
    preco:
      precoJson(jsonLd) ||
      primeiroTexto([
        '[data-qa="POSTING_CARD_PRICE"]',
        '[class*="price"]'
      ]),
    endereco:
      enderecoJson(jsonLd.address) ||
      primeiroTexto([
        '[data-qa="POSTING_CARD_LOCATION"]',
        '[class*="location"]',
        "address"
      ]),
    area: caracteristica(textoPagina, /([\d.,]+\s*m(?:²|2))/i),
    quartos: caracteristica(
      textoPagina,
      /(\d+)\s*(?:quartos?|dormit[oó]rios?)/i
    ),
    banheiros: caracteristica(textoPagina, /(\d+)\s*banheiros?/i),
    vagas: caracteristica(textoPagina, /(\d+)\s*(?:vagas?|garagens?)/i),
    descricao: descricao ? String(descricao).trim() : null,
    codigo: caracteristica(
      textoPagina,
      /(?:c[oó]digo|ref(?:er[eê]ncia)?)[\s:#-]*([\w.-]+)/i
    ),
    coletado_em: new Date().toISOString()
  };
}

chrome.runtime.onMessage.addListener((mensagem, _remetente, responder) => {
  if (mensagem?.tipo !== "analisarPagina") return;

  if (paginaDeSeguranca()) {
    responder({ tipo: "seguranca" });
    return;
  }

  if (location.pathname.includes("/propriedades/")) {
    responder({ tipo: "anuncio", imovel: extrairAnuncio() });
    return;
  }

  const links = coletarLinksDaListagem();
  responder({
    tipo: "listagem",
    links,
    proximaPagina: proximaPagina()
  });
});
