# Colunas dos relatórios

<!-- Gerado por bin/report-columns-gen.ts — não edite à mão. -->

5 arquivos de relatório com schema de colunas declarado.

## Arquivos

| Arquivo | Fontes | Colunas | Doc |
| --- | --- | --- | --- |
| `cronograma.csv` | `Transferencias` | 7 | [detalhes](./report-columns/cronograma-csv.md) |
| `executado.csv` | `PSOrcamento`, `ProjetoOrcamento`, `ObrasOrcamento` | 40 | [detalhes](./report-columns/executado-csv.md) |
| `planejado.csv` | `PSOrcamento`, `ProjetoOrcamento`, `ObrasOrcamento` | 27 | [detalhes](./report-columns/planejado-csv.md) |
| `transferencias.csv` | `Transferencias` | 68 | [detalhes](./report-columns/transferencias-csv.md) |
| `tribunal-de-contas.csv` | `TribunalDeContas` | 13 | [detalhes](./report-columns/tribunal-de-contas-csv.md) |

## Fontes por arquivo

```mermaid
flowchart LR
    transferencias["Transferencias"] --> cronograma-csv["cronograma.csv"]
    psorcamento["PSOrcamento"] --> executado-csv["executado.csv"]
    projetoorcamento["ProjetoOrcamento"] --> executado-csv["executado.csv"]
    obrasorcamento["ObrasOrcamento"] --> executado-csv["executado.csv"]
    psorcamento["PSOrcamento"] --> planejado-csv["planejado.csv"]
    projetoorcamento["ProjetoOrcamento"] --> planejado-csv["planejado.csv"]
    obrasorcamento["ObrasOrcamento"] --> planejado-csv["planejado.csv"]
    transferencias["Transferencias"] --> transferencias-csv["transferencias.csv"]
    tribunaldecontas["TribunalDeContas"] --> tribunal-de-contas-csv["tribunal-de-contas.csv"]
```
