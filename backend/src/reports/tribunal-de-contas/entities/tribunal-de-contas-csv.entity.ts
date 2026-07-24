import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

/**
 * Colunas do CSV **bruto** de `tribunal-de-contas.csv`.
 *
 * A ordem de declaração é a ordem das colunas no arquivo bruto e também a ordem padrão
 * quando nenhum modelo é aplicado. O schema é plano (uma linha por distribuição de
 * recurso), então nenhum nome precisa do `__` usado nos relatórios aninhados.
 *
 * Regra geral: valores aqui são "compute store" — números como números, datas em ISO
 * (`YYYY-MM-DD`), sem máscara de moeda e sem o hack `="valor"`. Moeda, separador decimal,
 * `dd/mm/aaaa` e o guard de texto do Excel são aplicados na etapa de pós-processamento.
 *
 * Os rótulos abaixo reproduzem exatamente os cabeçalhos que o relatório já emitia hoje,
 * incluindo 'Dotação Orçamentaria' (sem o acento em "Orçamentária"): o arquivo é entregue
 * ao Tribunal de Contas e a correção do rótulo teria de ser combinada com o negócio.
 */
@ReportRows({
    arquivo: 'tribunal-de-contas.csv',
    fontes: ['TribunalDeContas'],
    descricao: 'Uma linha por distribuição de recurso das transferências, no layout do Tribunal de Contas.',
})
export class RelTribunalDeContasCsvRow {
    /**
     * Já vem com os não-dígitos removidos na extração: é regra de limpeza de dado
     * (o Tribunal só aceita o número da emenda), não formatação de locale.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Emenda', format: { excelTextGuard: true } })
    emenda: string | null;

    /** Idem `emenda`: apenas dígitos, definido na extração. */
    @ReportColumn({ type: 'VARCHAR', label: 'Programa', format: { excelTextGuard: true } })
    programa: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Ano', format: { raw: true } })
    ano: number | null;

    /** Nomes populares dos parlamentares com valor na distribuição, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Parlamentar' })
    parlamentar: string;

    /**
     * Emitido como string na extração para não perder precisão do `Decimal` do Prisma —
     * o DuckDB relê a coluna como `DECIMAL(18,2)` sem passar por `double`.
     */
    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Valor de Repasse',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    valor_repasse: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Ação' })
    acao: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Gestor Municipal' })
    gestor_municipal: string;

    @ReportColumn({ type: 'DATE', label: 'Prazo de Vigência' })
    prazo_vigencia: string | null;

    /**
     * Concatenação das dotações da distribuição com os vínculos de dotação, separadas
     * por ` | `. Precisa do guard: `0001.02...` seria reinterpretado como número no Excel.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Dotação Orçamentaria', format: { excelTextGuard: true } })
    dotacao_orcamentaria: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Rubrica de Receita' })
    rubrica_de_receita: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Política pública' })
    finalidade: string | null;

    /** String na extração pelo mesmo motivo de `valor_repasse`. */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Empenho', format: { currency: 'R$', decimalPlaces: 2 } })
    valor_empenho: string | null;

    /** String na extração pelo mesmo motivo de `valor_repasse`. */
    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Liquidação/Pagamento',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    liquidacao_pagamento: string | null;
}
