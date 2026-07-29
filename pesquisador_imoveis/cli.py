import argparse
import sys

from .imovelweb import extrair_imovel, validar_url
from .navegador import ErroAoCarregarPagina, obter_html


def criar_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Abre um anuncio do Imovelweb e mostra os dados encontrados."
    )
    parser.add_argument("url", help="link de um unico anuncio do Imovelweb")
    parser.add_argument(
        "--visivel",
        action="store_true",
        help="abre o Edge para permitir concluir a verificacao manualmente",
    )
    return parser


def main() -> None:
    argumentos = criar_parser().parse_args()
    try:
        url = validar_url(argumentos.url)
        print("Carregando anuncio...", file=sys.stderr)
        imovel = extrair_imovel(
            obter_html(url, visivel=argumentos.visivel),
            url,
        )
    except (ValueError, ErroAoCarregarPagina) as erro:
        print(f"Erro: {erro}", file=sys.stderr)
        raise SystemExit(1) from erro

    print("\nDados encontrados")
    print("-" * 60)
    for nome, valor in imovel.linhas_para_exibicao():
        print(f"{nome:10}: {valor}")
