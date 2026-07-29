const COLUNAS_XLSX = [
  ["titulo", "Título", 38],
  ["preco", "Preço", 18],
  ["endereco", "Endereço", 42],
  ["area", "Área", 13],
  ["quartos", "Quartos", 11],
  ["banheiros", "Banheiros", 12],
  ["vagas", "Vagas", 9],
  ["codigo", "Código", 16],
  ["descricao", "Descrição", 80],
  ["url", "URL", 55],
  ["coletado_em", "Coletado em", 24]
];

function xml(valor) {
  return String(valor ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function nomeColuna(indice) {
  let nome = "";
  let numero = indice + 1;
  while (numero > 0) {
    numero -= 1;
    nome = String.fromCharCode(65 + (numero % 26)) + nome;
    numero = Math.floor(numero / 26);
  }
  return nome;
}

function celulaInline(referencia, valor, estilo) {
  return (
    `<c r="${referencia}" t="inlineStr" s="${estilo}">` +
    `<is><t xml:space="preserve">${xml(valor)}</t></is></c>`
  );
}

function planilhaXml(resultados) {
  const ultimaLinha = Math.max(1, resultados.length + 1);
  const ultimaColuna = nomeColuna(COLUNAS_XLSX.length - 1);
  const cabecalho = COLUNAS_XLSX.map(([, titulo], indice) =>
    celulaInline(`${nomeColuna(indice)}1`, titulo, 1)
  ).join("");
  const linhas = resultados
    .map((item, indiceLinha) => {
      const numeroLinha = indiceLinha + 2;
      const celulas = COLUNAS_XLSX.map(([chave], indiceColuna) =>
        celulaInline(
          `${nomeColuna(indiceColuna)}${numeroLinha}`,
          item[chave],
          2
        )
      ).join("");
      return `<row r="${numeroLinha}">${celulas}</row>`;
    })
    .join("");
  const colunas = COLUNAS_XLSX.map(
    ([, , largura], indice) =>
      `<col min="${indice + 1}" max="${indice + 1}" width="${largura}" customWidth="1"/>`
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${ultimaColuna}${ultimaLinha}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <cols>${colunas}</cols>
  <sheetData><row r="1">${cabecalho}</row>${linhas}</sheetData>
  <autoFilter ref="A1:${ultimaColuna}${ultimaLinha}"/>
</worksheet>`;
}

function arquivosXlsx(resultados) {
  return {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Imóveis" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFF6600"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD9D9D9"/></left><right style="thin"><color rgb="FFD9D9D9"/></right><top style="thin"><color rgb="FFD9D9D9"/></top><bottom style="thin"><color rgb="FFD9D9D9"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
    "xl/worksheets/sheet1.xml": planilhaXml(resultados)
  };
}

function tabelaCrc32() {
  return Array.from({ length: 256 }, (_, numero) => {
    let crc = numero;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) ? 0xEDB88320 ^ (crc >>> 1) : crc >>> 1;
    }
    return crc >>> 0;
  });
}

const CRC32 = tabelaCrc32();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (const byte of bytes) crc = CRC32[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function escrever16(view, posicao, valor) {
  view.setUint16(posicao, valor, true);
}

function escrever32(view, posicao, valor) {
  view.setUint32(posicao, valor >>> 0, true);
}

function juntar(partes) {
  const tamanho = partes.reduce((total, parte) => total + parte.length, 0);
  const resultado = new Uint8Array(tamanho);
  let posicao = 0;
  for (const parte of partes) {
    resultado.set(parte, posicao);
    posicao += parte.length;
  }
  return resultado;
}

function zipSemCompressao(arquivos) {
  const encoder = new TextEncoder();
  const locais = [];
  const centrais = [];
  let deslocamento = 0;

  for (const [nome, conteudo] of Object.entries(arquivos)) {
    const nomeBytes = encoder.encode(nome);
    const dados = encoder.encode(conteudo);
    const soma = crc32(dados);

    const cabecalhoLocal = new Uint8Array(30);
    const local = new DataView(cabecalhoLocal.buffer);
    escrever32(local, 0, 0x04034B50);
    escrever16(local, 4, 20);
    escrever16(local, 6, 0x0800);
    escrever16(local, 8, 0);
    escrever16(local, 12, 0x0021);
    escrever32(local, 14, soma);
    escrever32(local, 18, dados.length);
    escrever32(local, 22, dados.length);
    escrever16(local, 26, nomeBytes.length);
    locais.push(cabecalhoLocal, nomeBytes, dados);

    const cabecalhoCentral = new Uint8Array(46);
    const central = new DataView(cabecalhoCentral.buffer);
    escrever32(central, 0, 0x02014B50);
    escrever16(central, 4, 20);
    escrever16(central, 6, 20);
    escrever16(central, 8, 0x0800);
    escrever16(central, 10, 0);
    escrever16(central, 14, 0x0021);
    escrever32(central, 16, soma);
    escrever32(central, 20, dados.length);
    escrever32(central, 24, dados.length);
    escrever16(central, 28, nomeBytes.length);
    escrever32(central, 42, deslocamento);
    centrais.push(cabecalhoCentral, nomeBytes);

    deslocamento += cabecalhoLocal.length + nomeBytes.length + dados.length;
  }

  const diretorio = juntar(centrais);
  const fim = new Uint8Array(22);
  const viewFim = new DataView(fim.buffer);
  escrever32(viewFim, 0, 0x06054B50);
  escrever16(viewFim, 8, Object.keys(arquivos).length);
  escrever16(viewFim, 10, Object.keys(arquivos).length);
  escrever32(viewFim, 12, diretorio.length);
  escrever32(viewFim, 16, deslocamento);

  return juntar([...locais, diretorio, fim]);
}

function criarArquivoXlsx(resultados) {
  const bytes = zipSemCompressao(arquivosXlsx(resultados));
  return new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}
