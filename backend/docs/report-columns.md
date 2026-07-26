# Colunas dos relatórios

<!-- Gerado por bin/report-columns-gen.ts — não edite à mão. -->

14 arquivos de relatório com schema de colunas declarado.

## Arquivos

| Arquivo | Fontes | Colunas | Doc |
| --- | --- | --- | --- |
| `acompanhamentos.csv` | `Projeto` | 16 | [detalhes](./report-columns/acompanhamentos-csv.md) |
| `aditivos.csv` | `Projeto` | 9 | [detalhes](./report-columns/aditivos-csv.md) |
| `arquivos.csv` | `Projeto` | 7 | [detalhes](./report-columns/arquivos-csv.md) |
| `contratos.csv` | `Projeto` | 29 | [detalhes](./report-columns/contratos-csv.md) |
| `cronograma.csv` | `Projeto`, `Transferencias` | 15 | [detalhes](./report-columns/cronograma-csv.md) |
| `detalhes-do-projeto.csv` | `Projeto` | 62 | [detalhes](./report-columns/detalhes-do-projeto-csv.md) |
| `encaminhamentos.csv` | `Projeto` | 6 | [detalhes](./report-columns/encaminhamentos-csv.md) |
| `enderecos.csv` | `Projeto` | 20 | [detalhes](./report-columns/enderecos-csv.md) |
| `origens.csv` | `Projeto` | 9 | [detalhes](./report-columns/origens-csv.md) |
| `planos-acao.csv` | `Projeto` | 8 | [detalhes](./report-columns/planos-acao-csv.md) |
| `riscos.csv` | `Projeto` | 11 | [detalhes](./report-columns/riscos-csv.md) |
| `termos-encerramento.csv` | `Projeto` | 18 | [detalhes](./report-columns/termos-encerramento-csv.md) |
| `transferencias.csv` | `Transferencias` | 68 | [detalhes](./report-columns/transferencias-csv.md) |
| `tribunal-de-contas.csv` | `TribunalDeContas` | 13 | [detalhes](./report-columns/tribunal-de-contas-csv.md) |

## Fontes por arquivo

```mermaid
flowchart LR
    projeto["Projeto"] --> acompanhamentos-csv["acompanhamentos.csv"]
    projeto["Projeto"] --> aditivos-csv["aditivos.csv"]
    projeto["Projeto"] --> arquivos-csv["arquivos.csv"]
    projeto["Projeto"] --> contratos-csv["contratos.csv"]
    projeto["Projeto"] --> cronograma-csv["cronograma.csv"]
    transferencias["Transferencias"] --> cronograma-csv["cronograma.csv"]
    projeto["Projeto"] --> detalhes-do-projeto-csv["detalhes-do-projeto.csv"]
    projeto["Projeto"] --> encaminhamentos-csv["encaminhamentos.csv"]
    projeto["Projeto"] --> enderecos-csv["enderecos.csv"]
    projeto["Projeto"] --> origens-csv["origens.csv"]
    projeto["Projeto"] --> planos-acao-csv["planos-acao.csv"]
    projeto["Projeto"] --> riscos-csv["riscos.csv"]
    projeto["Projeto"] --> termos-encerramento-csv["termos-encerramento.csv"]
    transferencias["Transferencias"] --> transferencias-csv["transferencias.csv"]
    tribunaldecontas["TribunalDeContas"] --> tribunal-de-contas-csv["tribunal-de-contas.csv"]
```
