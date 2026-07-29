from pesquisador_imoveis.imovelweb import extrair_imovel, validar_url


HTML_ANUNCIO = """
<html>
  <head>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Apartment",
        "name": "Apartamento ensolarado",
        "description": "Apartamento perto do metro.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Rua Exemplo, 123",
          "addressLocality": "Sao Paulo",
          "addressRegion": "SP"
        },
        "offers": {"@type": "Offer", "price": "850000", "priceCurrency": "BRL"}
      }
    </script>
  </head>
  <body>
    <p>72 m², 2 quartos, 2 banheiros e 1 vaga. Código 12345</p>
  </body>
</html>
"""


def test_extrai_dados_do_anuncio() -> None:
    imovel = extrair_imovel(
        HTML_ANUNCIO,
        "https://www.imovelweb.com.br/propriedades/123.html",
    )

    assert imovel.titulo == "Apartamento ensolarado"
    assert imovel.preco == "R$ 850000"
    assert imovel.endereco == "Rua Exemplo, 123, Sao Paulo, SP"
    assert imovel.area == "72 m²"
    assert imovel.quartos == "2"
    assert imovel.banheiros == "2"
    assert imovel.vagas == "1"
    assert imovel.codigo == "12345"


def test_extrai_variacoes_de_area_quartos_e_referencia() -> None:
    html = """
    <html>
      <body>
        <h1>Casa térrea</h1>
        <p>Área útil: 85,5 m2, 3 dormitórios e referência: ABC-987</p>
      </body>
    </html>
    """

    imovel = extrair_imovel(
        html,
        "https://www.imovelweb.com.br/propriedades/456.html",
    )

    assert imovel.area == "85,5 m2"
    assert imovel.quartos == "3"
    assert imovel.codigo == "ABC-987"


def test_ignora_ocultar_anuncio_ao_extrair_preco() -> None:
    html = """
    <html>
      <body>
        <button class="price-action">Ocultar anúncio</button>
        <h2>Venda R$ 200.000</h2>
      </body>
    </html>
    """

    imovel = extrair_imovel(
        html,
        "https://www.imovelweb.com.br/propriedades/789.html",
    )

    assert imovel.preco == "R$ 200.000"


def test_rejeita_url_de_outro_site() -> None:
    try:
        validar_url("https://example.com/anuncio")
    except ValueError:
        pass
    else:
        raise AssertionError("A URL deveria ter sido rejeitada")
