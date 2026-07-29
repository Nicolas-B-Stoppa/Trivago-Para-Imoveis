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

## Extensao para coletar uma listagem

A pasta `extensao/` contem uma extensao para Edge e Chrome. Ela usa uma aba
normal do seu navegador, percorre os anuncios da listagem de forma sequencial e
exporta os resultados em CSV.

No Edge:

1. Abra `edge://extensions`.
2. Ative o **Modo de desenvolvedor**.
3. Clique em **Carregar sem pacote**.
4. Escolha a pasta `extensao` deste projeto.
5. Abra uma listagem do Imovelweb e conclua qualquer verificacao normalmente.
6. Abra a extensao, escolha os limites e clique em **Iniciar coleta**.

Comece com uma pagina e poucos anuncios. A extensao reutiliza a mesma aba e
espera o intervalo configurado entre navegacoes. Se encontrar outra verificacao,
ela pausa para que voce a conclua manualmente. Depois, abra a extensao e clique
em **Continuar**. Ao final, use **Exportar Excel** para gerar uma planilha
`.xlsx` formatada ou **Exportar CSV** para o formato de texto compativel com
Excel em portugues.

## Testes

```powershell
python -m pytest
```
