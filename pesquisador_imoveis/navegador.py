from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.edge.options import Options
from selenium.webdriver.support.ui import WebDriverWait


class ErroAoCarregarPagina(RuntimeError):
    pass


def _pagina_de_seguranca(html: str) -> bool:
    html = html.lower()
    return "cloudflare" in html and (
        "executando verifica" in html or "checking your browser" in html
    )


def obter_html(url: str, *, timeout_segundos: int = 30) -> str:
    """Abre o anuncio no Edge invisivel e devolve o HTML carregado."""

    opcoes = Options()
    opcoes.add_argument("--headless=new")
    opcoes.add_argument("--disable-gpu")
    opcoes.add_argument("--window-size=1440,1200")
    opcoes.add_argument("--lang=pt-BR")
    opcoes.add_argument("--disable-blink-features=AutomationControlled")

    navegador = None
    try:
        navegador = webdriver.Edge(options=opcoes)
        navegador.set_page_load_timeout(timeout_segundos)
        navegador.get(url)
        html = navegador.page_source
        if _pagina_de_seguranca(html):
            try:
                WebDriverWait(navegador, timeout_segundos).until(
                    lambda driver: not _pagina_de_seguranca(driver.page_source)
                )
            except TimeoutException as erro:
                raise ErroAoCarregarPagina(
                    "O Imovelweb bloqueou o navegador automatizado na verificacao de seguranca."
                ) from erro
            html = navegador.page_source
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
