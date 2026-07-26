# enderecos.csv

Uma linha por localização geográfica (ou região) vinculada à obra.

Fontes que produzem este arquivo: `Obras`

20 colunas.

Classe de linha: `RelObrasEnderecosCsvRow`

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

[← todos os arquivos](../report-columns.md)
