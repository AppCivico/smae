import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

/**
 * Colunas do CSV **bruto** do relatório de status de projeto/obra.
 *
 * A ordem de declaração é a ordem das colunas no arquivo bruto e também a ordem padrão
 * quando nenhum modelo é aplicado. Ela reproduz exatamente a ordem em que o `flatten()`
 * do json2csv emitia as chaves de `RelProjetoStatusRelatorioDto` (a ordem do literal
 * montado em `mapToRelProjetoStatusRelatorio`), então quem já consome o arquivo continua
 * vendo as mesmas colunas na mesma posição.
 *
 * Regra geral: valores aqui são "compute store" — números como números, sem máscara de
 * moeda e sem o hack `="valor"`. Moeda e separador decimal pt-BR são aplicados na etapa
 * de pós-processamento.
 *
 * Sobre os rótulos: este relatório **nunca** teve rótulos humanos — o `toFileOutput` não
 * passava `fields`, então o cabeçalho saía com a chave crua do DTO (`orgao_responsavel_sigla`,
 * `pontos_atencao`, ...). Como não havia rótulo entregue ao usuário, não há contrato de
 * rótulo a preservar e os labels abaixo foram escritos em PT-BR legível.
 *
 * Sobre o guard do Excel: nenhuma coluna recebe `excelTextGuard`. A extração atual não
 * emite `="..."` em campo nenhum, e ligar o guard mudaria os bytes do arquivo para quem
 * consome o CSV programaticamente. Manter a equivalência com a saída de hoje vale mais do
 * que corrigir a interpretação do Excel numa refatoração de infraestrutura.
 */
export abstract class RelPPStatusCsvRowBase {
    /** Id do projeto/obra. Chave de conciliação: não pode ser removida por um modelo. */
    @ReportColumn({ type: 'INTEGER', label: 'ID', format: { raw: true }, customizavel: false })
    id: number;

    /** Chave de conciliação com o portfólio informado nos parâmetros do relatório. */
    @ReportColumn({ type: 'INTEGER', label: 'ID do Portfólio', format: { raw: true }, customizavel: false })
    portfolio_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código' })
    codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome' })
    nome: string;

    /**
     * Previsão de custo do cronograma; cai para a previsão do próprio projeto quando não
     * há cronograma. `Float` no Postgres (não `Decimal`), então não há precisão exata a
     * preservar — `DOUBLE` é o tipo honesto e a apresentação arredonda em 2 casas.
     */
    @ReportColumn({ type: 'DOUBLE', label: 'Previsão de Custo', format: { currency: 'R$', decimalPlaces: 2 } })
    previsao_custo: number | null;

    /** Idem `previsao_custo`: `Float` no Postgres. */
    @ReportColumn({ type: 'DOUBLE', label: 'Custo Realizado', format: { currency: 'R$', decimalPlaces: 2 } })
    realizado_custo: number | null;

    /**
     * `Paralisado` / `Atrasado` / `Em dia`, derivado do acompanhamento e do cronograma.
     * Tradução de domínio — continua sendo feita na extração, não é formatação de locale.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Cronograma' })
    cronograma: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Responsável' })
    orgao_responsavel_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento' })
    detalhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Pontos de Atenção' })
    pontos_atencao: string | null;

    /**
     * Tarefas de nível 1 concatenadas como `nome=status`, separadas por `/`. A montagem
     * (inclusive o status `Concluída`/`Em andamento`/`Não iniciada`) é regra de domínio e
     * permanece na extração.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Tarefas' })
    tarefas: string | null;
}

/**
 * O nome do arquivo depende de `params.tipo_pdm` (`projeto-status.csv` para `PP`,
 * `obra-status.csv` caso contrário), e `@ReportRows.arquivo` é estático — daí duas classes.
 * As colunas são idênticas entre as duas variantes, então ficam declaradas uma única vez na
 * base: `getReportRowSchema` percorre a cadeia de protótipos e herda as colunas do pai.
 */
@ReportRows({
    arquivo: 'projeto-status.csv',
    fontes: ['ProjetoStatus'],
    descricao: 'Uma linha por projeto do portfólio, com o status do cronograma e o último acompanhamento.',
})
export class RelProjetoStatusCsvRow extends RelPPStatusCsvRowBase {}

@ReportRows({
    arquivo: 'obra-status.csv',
    fontes: ['ObraStatus'],
    descricao: 'Uma linha por obra do portfólio, com o status do cronograma e o último acompanhamento.',
})
export class RelObraStatusCsvRow extends RelPPStatusCsvRowBase {}
