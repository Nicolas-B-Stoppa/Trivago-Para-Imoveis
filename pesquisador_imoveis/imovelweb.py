import json
import re
from collections.abc import Iterable
from typing import Any
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from .models import Imovel


def validar_url(url: str) -> str:
    url = url.strip()
    partes = urlparse(url)
    host = (partes.hostname or "").lower()
    if partes.scheme not in {"http", "https"} or not (
        host == "imovelweb.com.br" or host.endswith(".imovelweb.com.br")
    ):
        raise ValueError("Informe uma URL http(s) pertencente ao dominio imovelweb.com.br.")
    return url


def _texto(elemento: Any) -> str | None:
    if elemento is None:
        return None
    texto = elemento.get_text(" ", strip=True)
    return re.sub(r"\s+", " ", texto) or None


def _primeiro_texto(soup: BeautifulSoup, seletores: Iterable[str]) -> str | None:
    for seletor in seletores:
        if texto := _texto(soup.select_one(seletor)):
            return texto
    return None


def _meta(soup: BeautifulSoup, *propriedades: str) -> str | None:
    for propriedade in propriedades:
        elemento = soup.find("meta", attrs={"property": propriedade})
        if elemento is None:
            elemento = soup.find("meta", attrs={"name": propriedade})
        if elemento and elemento.get("content"):
            return str(elemento["content"]).strip()
    return None


def _objetos_json_ld(soup: BeautifulSoup) -> Iterable[dict[str, Any]]:
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            valor = json.loads(script.string or script.get_text())
        except (json.JSONDecodeError, TypeError):
            continue
        itens = valor if isinstance(valor, list) else [valor]
        for item in itens:
            if not isinstance(item, dict):
                continue
            grafo = item.get("@graph")
            if isinstance(grafo, list):
                yield from (objeto for objeto in grafo if isinstance(objeto, dict))
            yield item


def _buscar_json_ld(soup: BeautifulSoup) -> dict[str, Any]:
    melhor: dict[str, Any] = {}
    for objeto in _objetos_json_ld(soup):
        tipo = objeto.get("@type", "")
        tipos = tipo if isinstance(tipo, list) else [tipo]
        if any(
            tipo_imovel
            in {"Apartment", "House", "Product", "Residence", "SingleFamilyResidence"}
            for tipo_imovel in tipos
        ):
            return objeto
        if objeto.get("name") and len(objeto) > len(melhor):
            melhor = objeto
    return melhor


def _endereco_json(valor: Any) -> str | None:
    if isinstance(valor, str):
        return valor.strip() or None
    if not isinstance(valor, dict):
        return None
    partes = [
        valor.get("streetAddress"),
        valor.get("addressLocality"),
        valor.get("addressRegion"),
        valor.get("postalCode"),
    ]
    return ", ".join(str(parte).strip() for parte in partes if parte) or None


def _preco_json(objeto: dict[str, Any]) -> str | None:
    oferta = objeto.get("offers")
    if isinstance(oferta, list):
        oferta = oferta[0] if oferta else None
    if not isinstance(oferta, dict) or oferta.get("price") is None:
        return None
    moeda = oferta.get("priceCurrency")
    prefixo = "R$ " if moeda == "BRL" else f"{moeda} " if moeda else ""
    return f"{prefixo}{oferta['price']}"


def _somente_preco(valor: str | None) -> str | None:
    if not valor:
        return None
    if correspondencia := re.search(r"R\$\s*[\d.]+(?:,\d{1,2})?", valor):
        return re.sub(r"\s+", " ", correspondencia.group(0))
    if re.search(r"consultar\s+pre[cç]o", valor, flags=re.IGNORECASE):
        return "Consultar preço"
    return None


def _preco_pagina(soup: BeautifulSoup, texto_pagina: str) -> str | None:
    seletores = (
        '[data-qa="POSTING_CARD_PRICE"]',
        '[data-qa="POSTING_PRICE"]',
        '[data-qa="PRICE"]',
        '[data-testid*="price" i]',
        '[class*="price" i]',
    )
    for seletor in seletores:
        for elemento in soup.select(seletor):
            if preco := _somente_preco(_texto(elemento)):
                return preco
    return _somente_preco(texto_pagina)


def _caracteristica(texto_pagina: str, padroes: Iterable[str]) -> str | None:
    for padrao in padroes:
        if correspondencia := re.search(padrao, texto_pagina, flags=re.IGNORECASE):
            return correspondencia.group(1).strip()
    return None


def extrair_imovel(html: str, url: str) -> Imovel:
    """Converte o HTML de um anuncio em um objeto Imovel."""

    soup = BeautifulSoup(html, "html.parser")
    json_ld = _buscar_json_ld(soup)
    texto_pagina = soup.get_text(" ", strip=True)

    titulo = json_ld.get("name") or _primeiro_texto(
        soup, ("h1", '[data-qa="POSTING_CARD_TITLE"]', '[class*="title"]')
    )
    descricao = json_ld.get("description") or _meta(soup, "description", "og:description")
    if not descricao:
        descricao = _primeiro_texto(
            soup,
            ('[data-qa="DESCRIPTION_TEXT"]', '[class*="description"]'),
        )

    return Imovel(
        url=url,
        titulo=str(titulo).strip() if titulo else _meta(soup, "og:title"),
        preco=_somente_preco(_preco_json(json_ld))
        or _preco_pagina(soup, texto_pagina),
        endereco=_endereco_json(json_ld.get("address"))
        or _primeiro_texto(
            soup,
            (
                '[data-qa="POSTING_CARD_LOCATION"]',
                '[class*="location"]',
                "address",
            ),
        ),
        area=_caracteristica(texto_pagina, (r"([\d.,]+\s*m(?:²|2))",)),
        quartos=_caracteristica(
            texto_pagina,
            (r"(\d+)\s*(?:quartos?|dormit[oó]rios?)",),
        ),
        banheiros=_caracteristica(texto_pagina, (r"(\d+)\s*banheiros?",)),
        vagas=_caracteristica(
            texto_pagina,
            (r"(\d+)\s*(?:vagas?|garagens?)",),
        ),
        descricao=str(descricao).strip() if descricao else None,
        codigo=_caracteristica(
            texto_pagina,
            (r"(?:c[oó]digo|ref(?:er[eê]ncia)?)[\s:#-]*([\w.-]+)",),
        ),
    )
