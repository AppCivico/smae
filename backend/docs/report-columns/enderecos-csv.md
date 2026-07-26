# enderecos.csv

Uma linha por endereço/geolocalização vinculada a uma demanda.

Fontes que produzem este arquivo: `Demandas`

7 colunas.

Classe de linha: `RelDemandasEnderecosCsvRow`

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

[← todos os arquivos](../report-columns.md)
