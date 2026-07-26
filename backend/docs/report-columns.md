# Colunas dos relatórios

<!-- Gerado por bin/report-columns-gen.ts — não edite à mão. -->

3 arquivos de relatório com schema de colunas declarado.

## Arquivos

| Arquivo | Fontes | Colunas | Doc |
| --- | --- | --- | --- |
| `cronograma.csv` | `Transferencias` | 7 | [detalhes](./report-columns/cronograma-csv.md) |
| `transferencias.csv` | `Transferencias` | 68 | [detalhes](./report-columns/transferencias-csv.md) |
| `tribunal-de-contas.csv` | `TribunalDeContas` | 13 | [detalhes](./report-columns/tribunal-de-contas-csv.md) |

## Fontes por arquivo

```mermaid
flowchart LR
    transferencias["Transferencias"] --> cronograma-csv["cronograma.csv"]
    transferencias["Transferencias"] --> transferencias-csv["transferencias.csv"]
    tribunaldecontas["TribunalDeContas"] --> tribunal-de-contas-csv["tribunal-de-contas.csv"]
```
