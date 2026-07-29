import json
from pathlib import Path


RAIZ = Path(__file__).parents[1]
PASTA_EXTENSAO = RAIZ / "extensao"


def test_manifesto_da_extensao_referencia_arquivos_existentes() -> None:
    manifesto = json.loads((PASTA_EXTENSAO / "manifest.json").read_text(encoding="utf-8"))

    arquivos = [
        manifesto["action"]["default_popup"],
        manifesto["background"]["service_worker"],
        *manifesto["content_scripts"][0]["js"],
    ]

    assert manifesto["manifest_version"] == 3
    assert all((PASTA_EXTENSAO / arquivo).is_file() for arquivo in arquivos)


def test_extensao_so_tem_permissao_de_host_para_imovelweb() -> None:
    manifesto = json.loads((PASTA_EXTENSAO / "manifest.json").read_text(encoding="utf-8"))

    assert manifesto["host_permissions"] == ["https://www.imovelweb.com.br/*"]


def test_popup_carrega_exportador_xlsx_local() -> None:
    popup = (PASTA_EXTENSAO / "popup.html").read_text(encoding="utf-8")

    assert '<script src="xlsx.js"></script>' in popup
    assert (PASTA_EXTENSAO / "xlsx.js").is_file()
    assert "Exportar Excel" in popup
