from dataclasses import dataclass


@dataclass(slots=True)
class Imovel:
    """Dados que conseguimos extrair de um unico anuncio."""

    url: str
    titulo: str | None = None
    preco: str | None = None
    endereco: str | None = None
    area: str | None = None
    quartos: str | None = None
    banheiros: str | None = None
    vagas: str | None = None
    descricao: str | None = None
    codigo: str | None = None

    def linhas_para_exibicao(self) -> list[tuple[str, str]]:
        campos = (
            ("Titulo", self.titulo),
            ("Preco", self.preco),
            ("Endereco", self.endereco),
            ("Area", self.area),
            ("Quartos", self.quartos),
            ("Banheiros", self.banheiros),
            ("Vagas", self.vagas),
            ("Codigo", self.codigo),
            ("Descricao", self.descricao),
            ("URL", self.url),
        )
        return [(nome, valor or "Nao encontrado") for nome, valor in campos]

