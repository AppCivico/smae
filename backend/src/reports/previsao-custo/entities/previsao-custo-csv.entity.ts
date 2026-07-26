import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

/**
 * Colunas do CSV **bruto** de `previsao-custo.csv`.
 *
 * O relatório tem **duas variantes** de cabeçalho, decididas na extração pelo `pdm_id`:
 * quando ele existe as três primeiras colunas viram Meta/Iniciativa/Atividade
 * (`RelPrevisaoCustoPdmCsvRow`), quando não existe viram as do Projeto
 * (`RelPrevisaoCustoProjetoCsvRow`). As duas classes compartilham o mesmo `arquivo` e o
 * `describeSchema()` do serviço devolve só a que corresponde aos parâmetros da execução.
 *
 * As colunas comuns estão repetidas nas duas classes de propósito: elas aparecem **depois**
 * do bloco variável, e a herança do `@ReportColumn` coloca as colunas da classe-base
 * primeiro — o que inverteria a ordem do arquivo.
 *
 * Os nomes usam `__` no lugar de `.` para o aninhamento (`meta`, `iniciativa`, `atividade`,
 * `projeto`) porque o builder DuckDB interpreta ponto como referência qualificada por fonte.
 *
 * Nas colunas comuns o rótulo é o **nome de máquina** (`id`, `criado_em`, `custo_previsto`,
 * ...): no relatório atual esses campos são declarados como string solta no `fields` do
 * json2csv, que usa o próprio nome como cabeçalho. Traduzi-los para rótulos humanos mudaria o
 * arquivo entregue ao usuário — decisão de negócio, não desta refatoração.
 *
 * A única exceção é `versao_anterior_id`, cujo rótulo permanece `id_versao_anterior`: era esse o
 * cabeçalho emitido (por um `fields` que apontava para um campo inexistente) e ele é preservado,
 * enquanto o nome de máquina passa a ser o do campo que realmente existe. Ver o comentário na
 * própria coluna.
 *
 * Nenhuma coluna leva `excelTextGuard`: o relatório nunca emitiu o hack `="valor"`, e
 * acrescentá-lo agora mudaria o conteúdo das células.
 *
 * Regra geral: valores aqui são "compute store" — números como números, datas em ISO, sem
 * máscara de moeda e sem o hack `="valor"`. Separador decimal pt-BR, `dd/mm/aaaa` e rótulos
 * são aplicados na etapa de pós-processamento.
 */

/**
 * Variante com PDM: as três primeiras colunas descrevem Meta / Iniciativa / Atividade.
 *
 * Os rótulos de iniciativa e atividade são configuráveis por PDM (`rotulo_iniciativa` /
 * `rotulo_atividade`). Aqui ficam os padrões do banco ("Iniciativa"/"Atividade"); o
 * `describeSchema()` do serviço sobrescreve com os rótulos do PDM da execução, reproduzindo
 * o `'Código da ' + pdm.rotulo_iniciativa` que a extração montava antes.
 */
@ReportRows({
    arquivo: 'previsao-custo.csv',
    // A fonte `PrevisaoCusto` (PDM antigo) também cai neste arquivo e continua funcionando em
    // runtime pelo mesmo `describeSchema`, mas não é declarada aqui: o PDM antigo está sendo
    // descontinuado e ficou deliberadamente fora deste trabalho (não entra na listagem de
    // colunas por fonte nem ganha modelos de relatório).
    fontes: ['PSPrevisaoCusto'],
    descricao:
        'Uma linha por orçamento previsto (última revisão) do ano de referência, com o recorte de Meta/Iniciativa/Atividade.',
})
export class RelPrevisaoCustoPdmCsvRow {
    @ReportColumn({ type: 'VARCHAR', label: 'Código da Meta' })
    meta__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Meta' })
    meta__titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Meta', format: { raw: true }, customizavel: false })
    meta__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Iniciativa' })
    iniciativa__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Iniciativa' })
    iniciativa__titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Iniciativa', format: { raw: true }, customizavel: false })
    iniciativa__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Atividade' })
    atividade__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Atividade' })
    atividade__titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Atividade', format: { raw: true }, customizavel: false })
    atividade__id: number | null;

    // --- colunas comuns às duas variantes (ver nota no topo do arquivo) ---

    @ReportColumn({ type: 'BIGINT', label: 'id', format: { raw: true }, customizavel: false })
    id: number;

    /**
     * Correção de bug histórico: a coluna sempre saiu **vazia** porque o `fields` do json2csv
     * pedia `id_versao_anterior`, nome que nunca existiu na linha — a extração seleciona
     * `versao_anterior_id` (nome do campo em `OrcamentoPrevisto`, único candidato no modelo).
     *
     * O nome de máquina passa a ser `versao_anterior_id`, igual ao do banco e ao que a extração
     * já produz: assim a coluna carrega o dado real sem precisar de apelido na extração. O
     * **rótulo** continua sendo `id_versao_anterior` e a **posição** é a mesma, então o cabeçalho
     * do arquivo entregue não muda — só as células, que deixam de ser vazias.
     *
     * Motivo de corrigir em vez de preservar: no pós-processamento cada coluna também vira filtro
     * e critério de ordenação; uma coluna eternamente `NULL` ofereceria um filtro que nunca casa.
     */
    @ReportColumn({
        type: 'BIGINT',
        label: 'id_versao_anterior',
        format: { raw: true },
        customizavel: false,
        descricao: 'ID da revisão anterior deste orçamento previsto (vazio na primeira versão).',
    })
    versao_anterior_id: number | null;

    /** Descrição do projeto/atividade da dotação, resolvida via SOF na extração. */
    @ReportColumn({ type: 'VARCHAR', label: 'projeto_atividade' })
    projeto_atividade: string | null;

    /**
     * Instante de criação em UTC, como o relatório já emitia (a extração serializava o `Date`
     * em ISO com `Z`). Converter para America/Sao_Paulo seria colocar apresentação de volta na
     * extração — e mudaria o horário exibido. O pós-processamento renderiza `dd/mm/aaaa hh:mi:ss`.
     */
    @ReportColumn({ type: 'TIMESTAMP', label: 'criado_em' })
    criado_em: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ano_referencia', format: { raw: true } })
    ano_referencia: number;

    /**
     * String na extração (`Decimal.toFixed(2)`) para não perder precisão do `Decimal` do Prisma:
     * o DuckDB relê como `DECIMAL(18,2)` sem passar por double.
     *
     * Sem `currency`: o relatório nunca aplicou máscara de moeda nesta coluna (saía `1234.50`
     * cru). O pós-processamento só passa a usar o separador decimal pt-BR (`1.234,50`), que é
     * inerente ao pipeline; acrescentar `R$` seria mudar o conteúdo entregue.
     */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'custo_previsto', format: { decimalPlaces: 2 } })
    custo_previsto: string;

    /** Já expandida na extração (`*` vira `**`/`****`/`********`): é regra de domínio. */
    @ReportColumn({ type: 'VARCHAR', label: 'parte_dotacao' })
    parte_dotacao: string;

    /** Idem `criado_em`: UTC. */
    @ReportColumn({ type: 'TIMESTAMP', label: 'atualizado_em' })
    atualizado_em: string | null;
}

/**
 * Variante sem PDM (Portfólio de Projetos / Obras): as três primeiras colunas descrevem o
 * Projeto. As demais são idênticas às da variante de PDM.
 */
@ReportRows({
    arquivo: 'previsao-custo.csv',
    fontes: ['ProjetoPrevisaoCusto', 'ObrasPrevisaoCusto'],
    descricao: 'Uma linha por orçamento previsto (última revisão) do ano de referência, com o recorte de Projeto/Obra.',
})
export class RelPrevisaoCustoProjetoCsvRow {
    @ReportColumn({ type: 'VARCHAR', label: 'Código Projeto' })
    projeto__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Projeto' })
    projeto__nome: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Projeto', format: { raw: true }, customizavel: false })
    projeto__id: number | null;

    // --- colunas comuns às duas variantes (ver nota no topo do arquivo) ---

    @ReportColumn({ type: 'BIGINT', label: 'id', format: { raw: true }, customizavel: false })
    id: number;

    /** Ver `RelPrevisaoCustoPdmCsvRow.versao_anterior_id`: rótulo/posição antigos, valor agora preenchido. */
    @ReportColumn({
        type: 'BIGINT',
        label: 'id_versao_anterior',
        format: { raw: true },
        customizavel: false,
        descricao: 'ID da revisão anterior deste orçamento previsto (vazio na primeira versão).',
    })
    versao_anterior_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'projeto_atividade' })
    projeto_atividade: string | null;

    /** UTC, como o relatório já emitia — ver `RelPrevisaoCustoPdmCsvRow.criado_em`. */
    @ReportColumn({ type: 'TIMESTAMP', label: 'criado_em' })
    criado_em: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ano_referencia', format: { raw: true } })
    ano_referencia: number;

    /** Ver `RelPrevisaoCustoPdmCsvRow.custo_previsto`: string na extração, sem máscara de moeda. */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'custo_previsto', format: { decimalPlaces: 2 } })
    custo_previsto: string;

    @ReportColumn({ type: 'VARCHAR', label: 'parte_dotacao' })
    parte_dotacao: string;

    /** Idem `criado_em`: UTC. */
    @ReportColumn({ type: 'TIMESTAMP', label: 'atualizado_em' })
    atualizado_em: string | null;
}

/**
 * Rótulos das colunas de iniciativa/atividade em função dos rótulos configurados no PDM.
 *
 * Reproduz o `'Código da ' + pdm.rotulo_iniciativa` que a extração montava: como o
 * `@ReportColumn` só aceita label estático, o serviço aplica esta sobrescrita em cima do
 * schema declarado.
 */
export function rotulosPdmPrevisaoCusto(
    rotuloIniciativa: string,
    rotuloAtividade: string
): Record<string, string | undefined> {
    return {
        iniciativa__codigo: 'Código da ' + rotuloIniciativa,
        iniciativa__titulo: 'Título da ' + rotuloIniciativa,
        iniciativa__id: 'ID da ' + rotuloIniciativa,
        atividade__codigo: 'Código da ' + rotuloAtividade,
        atividade__titulo: 'Título da ' + rotuloAtividade,
        atividade__id: 'ID da ' + rotuloAtividade,
    };
}
