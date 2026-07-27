# enderecos.csv

Uma linha por endereço/geolocalização vinculada a uma demanda.
Uma linha por localização geográfica (ou região) vinculada à obra.
Endereços (geolocalização) vinculados ao projeto.

Fontes que produzem este arquivo: `Demandas`, `Obras`, `Projeto`

23 colunas.

## `RelDemandasEnderecosCsvRow`

Colunas do CSV bruto de `enderecos.csv`.

Arquivo **condicional**: só é emitido quando há ao menos uma referência de
geolocalização nas demandas filtradas. O schema, porém, é sempre declarado — do
contrário um modelo salvo não teria como referenciar o arquivo.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `demanda_id` | `BIGINT` | ID da Demanda | não | sem formatação | — |
| `nome_projeto` | `VARCHAR` | Nome do Projeto | sim | guard Excel | — |
| `cep` | `VARCHAR` | CEP | sim | guard Excel | — |
| `endereco` | `VARCHAR` | Endereço | sim | guard Excel | — |
| `bairro` | `VARCHAR` | Bairro | sim | guard Excel | — |
| `subprefeitura` | `VARCHAR` | Subprefeitura | sim | guard Excel | — |
| `distrito` | `VARCHAR` | Distrito | sim | guard Excel | — |

## `RelObrasEnderecosCsvRow`

Colunas do CSV bruto de `enderecos.csv`.

Único arquivo deste relatório que já declarava rótulos próprios (`fields` com
`{ value, label }`). Eles foram preservados **byte-a-byte**, inclusive os pontos de
`geojson.properties.*`: são o que documenta a proveniência de cada campo dentro do
GeoJSON e trocá-los mudaria o cabeçalho entregue hoje. Ponto no `label` é inofensivo —
a restrição de `.` vale só para o `name` da coluna.

Mesmo nome de arquivo do `enderecos.csv` de `Demandas`; veja a nota em
`RelObrasCronogramaCsvRow`.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `obra_id` | `BIGINT` | obra_id | não | sem formatação | — |
| `endereco` | `VARCHAR` | endereco | sim | — | — |
| `zona` | `VARCHAR` | zona | sim | — | — |
| `distrito` | `VARCHAR` | distrito | sim | — | — |
| `subprefeitura` | `VARCHAR` | subprefeitura | sim | — | — |
| `coordinates` | `VARCHAR` | geojson.geometry.coordinates | sim | guard Excel | — |
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
| `bbox` | `VARCHAR` | geojson.bbox | sim | guard Excel | — |

## `RelProjetoEnderecoCsvRow`

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
