# geoloc.csv

Uma linha por endereço/geolocalização vinculada aos projetos filtrados.

Fontes que produzem este arquivo: `Projetos`

20 colunas.

Classe de linha: `RelProjetosGeolocCsvRow`

Os rótulos deste arquivo são caminhos do GeoJSON de origem (`geojson.properties.cep`, ...).
São técnicos, mas é o que o relatório entrega hoje — mantidos byte-a-byte. Os nomes de
máquina continuam sendo os campos planos do DTO (`cep`, `rua`, ...), sem ponto.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `projeto_id` | `INTEGER` | ID Projeto | não | sem formatação | — |
| `endereco` | `VARCHAR` | Endereço | sim | — | — |
| `zona` | `VARCHAR` | Zona | sim | — | — |
| `distrito` | `VARCHAR` | Distrito | sim | — | — |
| `subprefeitura` | `VARCHAR` | Subprefeitura | sim | — | — |
| `coordinates` | `VARCHAR` | geojson.geometry.coordinates | sim | — | — |
| `geojson_type` | `VARCHAR` | geojson.type | sim | — | — |
| `geometry_type` | `VARCHAR` | geojson.geometry.type | sim | — | — |
| `cep` | `VARCHAR` | geojson.properties.cep | sim | — | — |
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
