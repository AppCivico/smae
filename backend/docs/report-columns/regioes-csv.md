# regioes.csv

Uma linha por variável regionalizada do indicador, série e período, com a hierarquia de regiões resolvida.

Fontes que produzem este arquivo: `PSIndicadores`

37 colunas.

Classe de linha: `RelIndicadoresRegioesCsvRow`

`regioes.csv` — série das variáveis regionalizadas dos mesmos indicadores.

Mesmo cabeçalho base do `indicadores.csv`, acrescido do recorte de variável/órgão/região.

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `pdm_nome` | `VARCHAR` | Plano Setorial | sim | — | — |
| `meta__codigo` | `VARCHAR` | Código da Meta | sim | — | — |
| `meta__titulo` | `VARCHAR` | Título da Meta | sim | — | — |
| `meta__id` | `BIGINT` | ID da Meta | não | sem formatação | — |
| `meta_tags_descricao` | `VARCHAR` | Meta Tags | sim | — | — |
| `meta_tags_ids` | `VARCHAR` | Tags IDs | sim | — | — |
| `iniciativa__codigo` | `VARCHAR` | Código da Iniciativa | sim | — | — |
| `iniciativa__titulo` | `VARCHAR` | Título da Iniciativa | sim | — | — |
| `iniciativa__id` | `BIGINT` | ID da Iniciativa | não | sem formatação | — |
| `atividade__codigo` | `VARCHAR` | Código da Atividade | sim | — | — |
| `atividade__titulo` | `VARCHAR` | Título da Atividade | sim | — | — |
| `atividade__id` | `BIGINT` | ID da Atividade | não | sem formatação | — |
| `indicador__codigo` | `VARCHAR` | Código do Indicador | sim | — | — |
| `indicador__titulo` | `VARCHAR` | Título do Indicador | sim | — | — |
| `indicador__contexto` | `VARCHAR` | Contexto | sim | — | — |
| `indicador__complemento` | `VARCHAR` | Complementação | sim | — | — |
| `indicador__id` | `BIGINT` | ID do Indicador | não | sem formatação | — |
| `variavel__orgao__id` | `BIGINT` | ID do órgão | não | sem formatação | — |
| `variavel__orgao__sigla` | `VARCHAR` | Sigla do órgão | sim | — | — |
| `variavel__codigo` | `VARCHAR` | Código da Variável | sim | — | — |
| `variavel__titulo` | `VARCHAR` | Título da Variável | sim | — | — |
| `variavel__id` | `BIGINT` | ID da Variável | não | sem formatação | — |
| `regiao_id` | `BIGINT` | ID da Região da Variável | não | sem formatação | — |
| `regiao_nivel_4__id` | `BIGINT` | ID do Distrito | não | sem formatação | — |
| `regiao_nivel_4__codigo` | `VARCHAR` | Código do Distrito | sim | — | — |
| `regiao_nivel_4__descricao` | `VARCHAR` | Descrição do Distrito | sim | — | — |
| `regiao_nivel_3__id` | `BIGINT` | ID do Subprefeitura | não | sem formatação | — |
| `regiao_nivel_3__codigo` | `VARCHAR` | Código da Subprefeitura | sim | — | — |
| `regiao_nivel_3__descricao` | `VARCHAR` | Descrição da Subprefeitura | sim | — | — |
| `regiao_nivel_2__id` | `BIGINT` | ID da Região | não | sem formatação | — |
| `regiao_nivel_2__codigo` | `VARCHAR` | Código da Região | sim | — | — |
| `regiao_nivel_2__descricao` | `VARCHAR` | Descrição da Região | sim | — | — |
| `data_referencia` | `DATE` | Data de Referência | sim | — | — |
| `serie` | `VARCHAR` | Serie | sim | — | — |
| `data` | `VARCHAR` | Data | sim | — | — |
| `valor` | `VARCHAR` | Valor | sim | — | — |
| `valores_categorica` | `VARCHAR` | Valor Categórica | sim | — | — |

[← todos os arquivos](../report-columns.md)
