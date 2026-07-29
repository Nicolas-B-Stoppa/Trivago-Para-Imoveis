# Pesquisador de Imoveis

Primeira etapa do projeto: abrir o link de **um unico anuncio** do Imovelweb e
mostrar no terminal os dados encontrados. Esta versao ainda nao percorre paginas
de busca, grava no SQLite nem exporta para Excel.

## Instalacao

No PowerShell, dentro da pasta do projeto:

```powershell
python -m venv .venv
.\.venv\bin\Activate.ps1
python -m pip install -e ".[dev]"
```

O programa usa o Microsoft Edge instalado no computador para carregar a pagina.
Por padrao, ele funciona sem abrir uma janela.

## Uso

```powershell
python main.py "https://www.imovelweb.com.br/propriedades/SEU-ANUNCIO.html"
```

Se o site mostrar uma verificacao de seguranca, use o modo visivel:

```powershell
python main.py "https://www.imovelweb.com.br/propriedades/SEU-ANUNCIO.html" --visivel
```

O Edge sera aberto e o programa aguardara por ate 3 minutos. Conclua manualmente
a verificacao na janela; depois disso, a coleta continuara automaticamente. O
programa nao resolve nem contorna CAPTCHA.

## Testes

```powershell
python -m pytest
```
