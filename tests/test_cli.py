from pesquisador_imoveis.cli import criar_parser


def test_modo_invisivel_e_o_padrao() -> None:
    argumentos = criar_parser().parse_args(
        ["https://www.imovelweb.com.br/propriedades/123.html"]
    )

    assert argumentos.visivel is False


def test_aceita_modo_visivel() -> None:
    argumentos = criar_parser().parse_args(
        [
            "https://www.imovelweb.com.br/propriedades/123.html",
            "--visivel",
        ]
    )

    assert argumentos.visivel is True
