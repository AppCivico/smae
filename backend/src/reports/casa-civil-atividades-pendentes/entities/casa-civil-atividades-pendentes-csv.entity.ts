import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

/**
 * Colunas do CSV **bruto** de `atividades-pendentes.csv`.
 *
 * A ordem de declaração é a ordem das colunas no arquivo bruto e também a ordem padrão
 * quando nenhum modelo é aplicado — ela reproduz exatamente o array `fields` que o
 * relatório usava antes da migração.
 *
 * O relatório é plano (uma linha por tarefa atrasada, vinda de um `$queryRaw` sem
 * objetos aninhados), então nenhum nome precisa do separador `__` usado nos relatórios
 * aninhados.
 *
 * Regra geral: valores aqui são "compute store" — números como números, datas em ISO
 * (`YYYY-MM-DD`), `null` para ausência de valor, sem máscara de moeda e sem o hack
 * `="valor"`. Moeda, separador decimal, `dd/mm/aaaa` e o guard de texto do Excel são
 * aplicados na etapa de pós-processamento.
 */
@ReportRows({
    arquivo: 'atividades-pendentes.csv',
    fontes: ['AtvPendentes'],
    descricao: 'Uma linha por tarefa de cronograma de transferência com término planejado vencido e sem término real.',
})
export class RelCasaCivilAtividadesPendentesCsvRow {
    /**
     * Identificador da transferência (ex.: `2024/00123`). É a chave que o consumidor usa
     * para conciliar a atividade com a transferência, por isso não pode ser removida nem
     * renomeada por um modelo.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Identificador', customizavel: false })
    identificador: string;

    /** Nomes dos parlamentares vinculados à transferência, separados por `, `. */
    @ReportColumn({ type: 'VARCHAR', label: 'Parlamentares' })
    parlamentares: string | null;

    /**
     * Valor de repasse da **transferência** (não da atividade). Emitido como string na
     * extração para não perder precisão do `Decimal` do Prisma — o DuckDB relê a coluna
     * como `DECIMAL(18,2)`, então a conversão é exata; `toNumber()` passaria por `double`.
     *
     * O nome da coluna continua `valor` porque é assim que a query nomeia o campo.
     */
    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Valor do Repasse',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    valor: string | null;

    /** Título da tarefa do cronograma (`tarefa.tarefa`). */
    @ReportColumn({ type: 'VARCHAR', label: 'Atividade' })
    atividade: string;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Início' })
    inicio_planejado: string | null;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Término' })
    termino_planejado: string | null;

    @ReportColumn({ type: 'DATE', label: 'Início Real' })
    inicio_real: string | null;

    /**
     * Sigla do órgão responsável pela tarefa. O rótulo mantém 'Orgão' (sem o til em
     * "Órgão") porque é o cabeçalho que o relatório já entrega hoje: corrigir texto
     * entregue ao usuário é decisão de negócio, não desta refatoração.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Orgão Responsável' })
    orgao_responsavel: string | null;

    /** Texto livre de `tarefa.recursos`: quem executa a tarefa, não necessariamente no SMAE. */
    @ReportColumn({ type: 'VARCHAR', label: 'Responsável pela Atividade' })
    responsavel_atividade: string;
}
