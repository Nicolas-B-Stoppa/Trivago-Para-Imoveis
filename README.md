# Pesquisador de Imóveis

Extensão para Microsoft Edge e Google Chrome que coleta anúncios de uma
listagem do Imovelweb e os organiza em uma planilha. Ela navega pelos anúncios
usando uma aba normal do navegador, para que o usuário possa concluir
verificações de segurança quando forem exibidas.

## O que a extensão coleta

Para cada anúncio encontrado, a extensão registra título, preço, endereço,
área, quantidade de quartos, banheiros e vagas, código de referência,
descrição, URL e data/hora da coleta. Os resultados podem ser baixados em
`.xlsx` (Excel) ou `.csv`.

É possível limitar a quantidade de páginas e anúncios, além de configurar o
intervalo entre as navegações. A coleta pode ser parada e retomada; caso o
Imovelweb peça uma verificação, conclua-a na aba e use **Continuar** na
extensão. Ela não resolve nem contorna CAPTCHAs.

## Instalação da extensão

1. Abra `edge://extensions` no Edge ou `chrome://extensions` no Chrome.
2. Ative o **Modo de desenvolvedor**.
3. Clique em **Carregar sem pacote**.
4. Selecione a pasta `extensao` deste projeto.
5. Abra uma página de listagem em `www.imovelweb.com.br`.
6. Abra a extensão, defina os limites e clique em **Iniciar coleta**.

Comece com uma página e poucos anúncios para validar a coleta. Não feche a aba
usada durante o processo. Ao terminar, escolha **Exportar Excel** ou
**Exportar CSV**.

## Coleta de um anúncio pela linha de comando

O projeto também inclui uma ferramenta Python para abrir o link de um único
anúncio do Imovelweb e mostrar os dados extraídos no terminal. Ela não percorre
listagens nem exporta planilhas.

### Instalação

No PowerShell, dentro da pasta do projeto:

```powershell
python -m venv .venv
.\.venv\bin\Activate.ps1
python -m pip install -e ".[dev]"
```

### Uso

```powershell
python main.py "https://www.imovelweb.com.br/propriedades/SEU-ANUNCIO.html"
```

Se o site exibir uma verificação de segurança, abra o navegador em modo
visível e conclua-a manualmente:

```powershell
python main.py "https://www.imovelweb.com.br/propriedades/SEU-ANUNCIO.html" --visivel
```

## Testes

```powershell
python -m pytest
```
