from pesquisador_imoveis.navegador import _pagina_de_seguranca


def test_detecta_verificacao_de_seguranca() -> None:
    assert _pagina_de_seguranca("<p>Verify you are human</p>")
    assert _pagina_de_seguranca('<script src="/challenge-platform/test.js"></script>')


def test_nao_confunde_anuncio_com_verificacao() -> None:
    assert not _pagina_de_seguranca("<h1>Apartamento com 2 quartos</h1>")
