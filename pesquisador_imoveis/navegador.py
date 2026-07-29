import sys

from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.edge.options import Options
from selenium.webdriver.support.ui import WebDriverWait


class ErroAoCarregarPagina(RuntimeError):
    pass


def _pagina_de_seguranca(html: str) -> bool:
    html = html.lower()
    marcadores = (
        "executando verificação",
        "executando verifica",
        "checking your browser",
        "verify you are human",
        "verifique se você é humano",
        "verifique se voce e humano",
        "cf-challenge",
        "challenge-platform",
    )
    return any(marcador in html for marcador in marcadores)


def obter_html(
    url: str,
    *,
    visivel: bool = False,
    timeout_segundos: int = 30,
    timeout_verificacao_segundos: int = 180,
) -> str:
    """Abre o anúncio no Edge e devolve o HTML depois da verificação."""

    opcoes = Options()
    opcoes.add_argument("--lang=pt-BR")
    if visivel:
        opcoes.add_argument("--start-maximized")
    else:
        opcoes.add_argument("--headless=new")
        opcoes.add_argument("--disable-gpu")
        opcoes.add_argument("--window-size=1440,1200")

    navegador = None
    try:
        navegador = webdriver.Edge(options=opcoes)
        navegador.set_page_load_timeout(timeout_segundos)
        navegador.get(url)
        html = navegador.page_source
        if _pagina_de_seguranca(html):
            espera = timeout_verificacao_segundos if visivel else timeout_segundos
            if visivel:
                print(
                    "Verificação de segurança detectada. "
                    "Conclua-a manualmente na janela do Edge.",
                    file=sys.stderr,
                )
            try:
                WebDriverWait(navegador, espera).until(
                    lambda driver: not _pagina_de_seguranca(driver.page_source)
                )
            except TimeoutException as erro:
                if visivel:
                    mensagem = (
                        "A verificação de segurança não foi concluída em "
                        f"{espera} segundos."
                    )
                else:
                    mensagem = (
                        "O Imovelweb bloqueou o navegador automatizado na "
                        "verificação de segurança. Tente novamente com --visivel."
                    )
                raise ErroAoCarregarPagina(
                    mensagem
                ) from erro
            html = navegador.page_source
            if visivel:
                print(
                    "Verificação concluída. Coletando os dados do anúncio...",
                    file=sys.stderr,
                )
        return html
    except TimeoutException as erro:
        raise ErroAoCarregarPagina(
            f"A pagina nao respondeu em {timeout_segundos} segundos."
        ) from erro
    except WebDriverException as erro:
        raise ErroAoCarregarPagina(f"Nao foi possivel abrir o anuncio: {erro}") from erro
    finally:
        if navegador is not None:
            navegador.quit()
