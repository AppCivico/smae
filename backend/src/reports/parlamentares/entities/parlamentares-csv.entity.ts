import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

/**
 * Colunas do CSV **bruto** de `parlamentares.csv`.
 *
 * A ordem de declaração é a ordem das colunas no arquivo bruto e também a ordem padrão
 * quando nenhum modelo é aplicado. Ela reproduz o array `fields` que o relatório usava —
 * repare que ela **não** é a ordem das propriedades de `RelParlamentaresDto` (`ano_eleicao`
 * sai como 5ª coluna, logo depois da sigla do partido). O schema é plano (uma linha por
 * parlamentar/mandato), então nenhum nome precisa do `__` usado nos relatórios aninhados.
 *
 * Regra geral: valores aqui são "compute store" — números como números, `null` para
 * ausência de valor, sem máscara e sem o hack de forçar texto no Excel. Rótulos e o guard
 * de texto são aplicados na etapa de pós-processamento.
 *
 * Os rótulos abaixo reproduzem exatamente os cabeçalhos que o relatório já emitia hoje,
 * incluindo a capitalização irregular de 'Zona de atuação' (todos os demais usam Title
 * Case): mudar cabeçalho entregue ao usuário é decisão de negócio, não desta refatoração.
 */
@ReportRows({
    arquivo: 'parlamentares.csv',
    fontes: ['Parlamentares'],
    descricao: 'Uma linha por parlamentar, com o mandato e o partido atual (view_parlamentares_mandatos_part_atual).',
})
export class RelParlamentaresCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID do Parlamentar', format: { raw: true }, customizavel: false })
    id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome Civil' })
    nome_civil: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome Parlamentar' })
    nome_parlamentar: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla do Partido' })
    partido_sigla: string;

    /** Ano da eleição: número, mas sem separador de milhar (`2024`, não `2.024`). */
    @ReportColumn({ type: 'INTEGER', label: 'Ano da Eleição', format: { raw: true } })
    ano_eleicao: number | null;

    /**
     * Valor cru do enum `ParlamentarCargo` (`DeputadoEstadual`, `Vereador`, ...).
     *
     * Existe um `EnumHumano(ParlamentarCargo, ...)` em `reports/utils/utils.service`, mas ele
     * nunca foi aplicado nesta coluna — só na aba de parâmetros do relatório. Passar a
     * humanizar aqui mudaria o conteúdo entregue ao usuário, o que está fora do escopo desta
     * refatoração (a saída pós-processada tem de ser equivalente à atual).
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Cargo' })
    cargo: string | null;

    /** Valor cru do enum `ParlamentarUF` (já é a própria sigla: `SP`, `RJ`, ...). */
    @ReportColumn({ type: 'VARCHAR', label: 'UF' })
    uf: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Titular/Suplente/Efetivado' })
    titular_suplente: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Endereço' })
    endereco: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Gabinete' })
    gabinete: string | null;

    /**
     * A extração emite o telefone cru (ou `null`); o guard de texto vem do pós-processamento.
     *
     * Antes a própria extração prefixava o valor com U+200C (zero-width non-joiner) para o
     * Excel não reinterpretar `11 3396-4000` / `(11) 3396-4000` como número ou data — é o
     * mesmo problema que o `excelTextGuard` resolve, só que de forma declarada e sem sujar o
     * dado com um caractere invisível (que também vazava para o XLSX e para quem lia o CSV
     * programaticamente).
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Telefone', format: { excelTextGuard: true } })
    telefone: string | null;

    /** Dia do mês (1–31): número sem formatação de locale. */
    @ReportColumn({ type: 'INTEGER', label: 'Dia Aniversário', format: { raw: true } })
    dia_aniversario: number | null;

    /** Mês (1–12) — número, como sempre foi; não é convertido para nome do mês. */
    @ReportColumn({ type: 'INTEGER', label: 'Mês Aniversário', format: { raw: true } })
    mes_aniversario: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'E-mail' })
    email: string | null;

    /** Rótulo com a capitalização original ('atuação' minúsculo) — ver nota da classe. */
    @ReportColumn({ type: 'VARCHAR', label: 'Zona de atuação' })
    zona_atuacao: string | null;
}
