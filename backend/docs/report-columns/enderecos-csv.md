# enderecos.csv

Endereços (geolocalização) vinculados ao projeto.

Fontes que produzem este arquivo: `Projeto`

20 colunas.

Classe de linha: `RelProjetoEnderecoCsvRow`

Colunas do CSV bruto de `enderecos.csv` da fonte `Projeto`.

Este arquivo já tinha `fields` explícito e os rótulos abaixo são **byte-a-byte** os que o
relatório emite hoje — incluindo os que são caminhos dentro do GeoJSON de origem
(`geojson.properties.cep`, `geojson.geometry_name`, ...) e os cinco primeiros, que são o
próprio nome técnico da coluna em minúsculas. Rótulo com ponto é permitido (é só o
cabeçalho); o que não pode ter ponto é o nome da coluna.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `BIGINT` | projeto_id | não | sem formatação | — |
| `endereco` | `VARCHAR` | endereco | sim | — | — |
| `zona` | `VARCHAR` | zona | sim | — | — |
| `distrito` | `VARCHAR` | distrito | sim | — | — |
| `subprefeitura` | `VARCHAR` | subprefeitura | sim | — | — |
| `coordinates` | `VARCHAR` | geojson.geometry.coordinates | sim | — | — |
| `geojson_type` | `VARCHAR` | geojson.type | sim | — | — |
| `geometry_type` | `VARCHAR` | geojson.geometry.type | sim | — | — |
| `cep` | `VARCHAR` | geojson.properties.cep | sim | guard Excel | — |
| `rua` | `VARCHAR` | geojson.properties.rua | sim | — | — |
| `pais` | `VARCHAR` | geojson.properties.pais | sim | — | — |
| `bairro` | `VARCHAR` | geojson.properties.bairro | sim | — | — |
| `cidade` | `VARCHAR` | geojson.properties.cidade | sim | — | — |
| `estado` | `VARCHAR` | geojson.properties.estado | sim | — | — |
| `rotulo` | `VARCHAR` | geojson.properties.rotulo | sim | — | — |
| `osm_type` | `VARCHAR` | geojson.properties.osm_type | sim | — | — |
| `codigo_pais` | `VARCHAR` | geojson.properties.codigo_pais | sim | — | — |
| `string_endereco` | `VARCHAR` | geojson.properties.string_endereco | sim | — | — |
| `geometry_name` | `VARCHAR` | geojson.geometry_name | sim | — | — |
| `bbox` | `VARCHAR` | geojson.bbox | sim | — | — |

[← todos os arquivos](../report-columns.md)
