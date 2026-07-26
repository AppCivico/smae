# encaminhamentos.csv

Encaminhamentos dos acompanhamentos do projeto.

Fontes que produzem este arquivo: `Projeto`

6 colunas.

Classe de linha: `RelProjetoEncaminhamentoCsvRow`

Colunas do CSV bruto de `encaminhamentos.csv` (uma linha por encaminhamento).

| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |
| --- | --- | --- | --- | --- | --- |
| `acompanhamento_id` | `BIGINT` | ID do Acompanhamento | não | sem formatação | — |
| `numero_encaminhamento` | `VARCHAR` | Número do Encaminhamento | sim | guard Excel | — |
| `encaminhamento` | `VARCHAR` | Encaminhamento | sim | — | — |
| `responsavel` | `VARCHAR` | Responsável | sim | — | — |
| `prazo_encaminhamento` | `DATE` | Prazo do Encaminhamento | sim | — | — |
| `prazo_realizado` | `DATE` | Prazo Realizado | sim | — | — |

[← todos os arquivos](../report-columns.md)
