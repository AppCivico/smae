import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

const MOEDA = { currency: 'R$', decimalPlaces: 2 } as const;

/**
 * Colunas do CSV bruto de `execucao-orcamentaria.csv`. `orgao`, `unidade` e `fonte` usam `__`
 * no nome porque o builder DuckDB lê `.` como referência qualificada.
 */
@ReportRows({
    arquivo: 'execucao-orcamentaria.csv',
    fontes: ['TransferenciasOrcamento'],
    descricao:
        'Uma linha por registro de execução orçamentária das transferências e distribuições, ' +
        'com os valores do mês corrente no SMAE e os valores do SOF.',
})
export class RelTransferenciasOrcamentoCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID da Transferência', format: { raw: true } })
    transferencia_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Identificador' })
    transferencia_identificador: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Esfera' })
    esfera: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Tipo' })
    tipo: string;

    @ReportColumn({ type: 'INTEGER', label: 'Ano da Transferência', format: { raw: true } })
    ano: number | null;

    /** Vazio quando o registro é da própria transferência, sem distribuição. */
    @ReportColumn({ type: 'INTEGER', label: 'ID da Distribuição', format: { raw: true } })
    distribuicao_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Distribuição' })
    distribuicao_nome: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Gestor Municipal' })
    orgao_gestor: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Dotação' })
    dotacao: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Processo' })
    processo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nota de Empenho' })
    nota_empenho: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Ano de Referência', format: { raw: true } })
    ano_referencia: number;

    @ReportColumn({ type: 'INTEGER', label: 'Mês', format: { raw: true } })
    mes: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Ação Orçamentária' })
    acao_orcamentaria: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Código do Órgão' })
    orgao__codigo: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão' })
    orgao__nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Unidade' })
    unidade__codigo: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Unidade' })
    unidade__nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Fonte' })
    fonte__codigo: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Fonte' })
    fonte__nome: string;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor Empenhado (SMAE)', format: MOEDA })
    smae_valor_empenhado: string;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor Liquidado (SMAE)', format: MOEDA })
    smae_valor_liquidado: string;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: '% Empenhado (SMAE)' })
    smae_percentual_empenho: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: '% Liquidado (SMAE)' })
    smae_percentual_liquidado: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor Empenhado (SOF)', format: MOEDA })
    dotacao_valor_empenhado: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor Liquidado (SOF)', format: MOEDA })
    dotacao_valor_liquidado: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Ano Consultado no SOF' })
    dotacao_ano_utilizado: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Mês Consultado no SOF' })
    dotacao_mes_utilizado: string;

    /** ISO-8601 UTC, como no relatório de orçamento. */
    @ReportColumn({ type: 'VARCHAR', label: 'Sincronizado com o SOF em' })
    dotacao_sincronizado_em: string | null;
}
