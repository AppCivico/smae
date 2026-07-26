# Colunas dos relatórios

<!-- Gerado por bin/report-columns-gen.ts — não edite à mão. -->

4 arquivos de relatório com schema de colunas declarado.

## Arquivos

| Arquivo | Fontes | Colunas | Doc |
| --- | --- | --- | --- |
| `cronograma.csv` | `Transferencias` | 7 | [detalhes](./report-columns/cronograma-csv.md) |
| `previsao-custo.csv` | `PSPrevisaoCusto`, `ProjetoPrevisaoCusto`, `ObrasPrevisaoCusto` | 20 | [detalhes](./report-columns/previsao-custo-csv.md) |
| `transferencias.csv` | `Transferencias` | 68 | [detalhes](./report-columns/transferencias-csv.md) |
| `tribunal-de-contas.csv` | `TribunalDeContas` | 13 | [detalhes](./report-columns/tribunal-de-contas-csv.md) |

## Fontes por arquivo

```mermaid
flowchart LR
    transferencias["Transferencias"] --> cronograma-csv["cronograma.csv"]
    psprevisaocusto["PSPrevisaoCusto"] --> previsao-custo-csv["previsao-custo.csv"]
    projetoprevisaocusto["ProjetoPrevisaoCusto"] --> previsao-custo-csv["previsao-custo.csv"]
    obrasprevisaocusto["ObrasPrevisaoCusto"] --> previsao-custo-csv["previsao-custo.csv"]
    transferencias["Transferencias"] --> transferencias-csv["transferencias.csv"]
    tribunaldecontas["TribunalDeContas"] --> tribunal-de-contas-csv["tribunal-de-contas.csv"]
```
