import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';
import { ReportFileSchema } from '../../post-process/report-schema';

/**
 * Colunas dos CSVs **brutos** do relatório orçamentário (`executado.csv` e `planejado.csv`).
 *
 * ## Superconjunto + recorte em `describeSchema`
 *
 * Este relatório não tem um conjunto fixo de colunas: o `fields` do `toFileOutput` sempre foi
 * montado em tempo de execução e varia em duas dimensões independentes:
 *
 *   1. **Plano x Projeto** — com `pdm` saem as colunas de meta/iniciativa/atividade; sem `pdm`
 *      (Projeto/Obras) saem as de projeto. Nunca as duas.
 *   2. **Analítico x Consolidado** — só o Analítico emite as colunas de ano/mês
 *      (`mes`, `ano`, `mes_corrente` no executado; `ano` no planejado).
 *
 * Como `@ReportRows.arquivo` e a lista de colunas são estáticos, as classes abaixo declaram o
 * **superconjunto** e o `describeSchema(params)` do service devolve só o recorte da execução,
 * via {@link recortarSchema}. `ReportFileSchema` é dado puro, então filtrar/reordenar
 * o resultado de `getReportRowSchema()` é legítimo — e é o que garante que o schema e o CSV
 * nunca divirjam, já que o `toFileOutput` escreve `fields: schema.colunas.map((c) => c.name)`.
 *
 * A alternativa seria uma classe por variante (2 arquivos x 2 x 2 = 8 classes praticamente
 * idênticas), o que multiplicaria a documentação gerada e o risco de as variantes divergirem
 * na manutenção.
 *
 * ## Nomes com `__`
 *
 * Os campos aninhados (`meta`, `iniciativa`, `atividade`, `projeto`, `orgao`, `unidade`,
 * `fonte`) usam `__` no lugar de `.` porque o builder DuckDB interpreta ponto como referência
 * qualificada por fonte (`orgao.codigo` viraria "coluna codigo da fonte orgao"). O **rótulo**
 * continua sendo exatamente o cabeçalho de hoje — que, nas colunas técnicas, é o próprio nome
 * com ponto (`orgao.codigo`).
 *
 * ## Formatação
 *
 * Diferente de `tribunal-de-contas` e `transferencias`, este relatório **nunca** formatou nada
 * na extração: não havia `Intl.NumberFormat`, máscara de moeda, `="valor"` nem conversão de
 * data. Os valores monetários já saem do banco como texto com 2 casas (`to_char_numeric`) e os
 * timestamps saem em ISO-8601. Portanto os `@ReportColumn` abaixo **não** declaram `currency`
 * nem `dateFormat`: declarar mudaria a saída entregue hoje, e essa é decisão de negócio.
 * O ganho aqui é o **tipo**: o XLSX passa a ter célula numérica somável onde antes havia texto,
 * e um modelo de relatório pode pedir `decimais`/moeda sem tocar no código.
 */

/** Rótulo padrão de iniciativa/atividade; `recortarSchema` sobrescreve com o rótulo do PDM. */
const ROTULO_INICIATIVA_PADRAO = 'Iniciativa';
const ROTULO_ATIVIDADE_PADRAO = 'Atividade';

/**
 * Colunas de ano/mês — só entram no Analítico.
 * @see recortarSchema
 */
const COLUNAS_ANO_MES = new Set(['mes', 'ano', 'mes_corrente']);

/** Colunas de meta/iniciativa/atividade — só entram quando o relatório roda sobre um PDM/PS. */
const COLUNAS_PDM = new Set([
    'meta__codigo',
    'meta__titulo',
    'meta__id',
    'iniciativa__codigo',
    'iniciativa__titulo',
    'iniciativa__id',
    'atividade__codigo',
    'atividade__titulo',
    'atividade__id',
]);

/** Colunas de projeto — só entram quando **não** há PDM (Projeto/Obras). */
const COLUNAS_PROJETO = new Set(['projeto__codigo', 'projeto__nome', 'projeto__id']);

/**
 * Rótulos que dependem do PDM: `pdm.rotulo_iniciativa` / `pdm.rotulo_atividade` vêm do banco e
 * não cabem num decorador estático, então são aplicados por cima do rótulo padrão.
 */
function rotulosDoPdm(rotuloIniciativa: string, rotuloAtividade: string): Record<string, string> {
    return {
        iniciativa__codigo: 'Código da ' + rotuloIniciativa,
        iniciativa__titulo: 'Título da ' + rotuloIniciativa,
        iniciativa__id: 'ID da ' + rotuloIniciativa,
        atividade__codigo: 'Código da ' + rotuloAtividade,
        atividade__titulo: 'Título da ' + rotuloAtividade,
        atividade__id: 'ID da ' + rotuloAtividade,
    };
}

/** Rótulos de iniciativa/atividade do plano; `null` quando o relatório é de projeto. */
export type RotulosPdm = { rotulo_iniciativa: string; rotulo_atividade: string } | null;

/**
 * Recorta o superconjunto declarado nas classes acima para as colunas que **esta** execução vai
 * realmente escrever, e aplica os rótulos vindos do plano.
 *
 * `ReportFileSchema` é dado puro, então filtrar/reordenar o resultado de `getReportRowSchema()`
 * é legítimo. O `toFileOutput` monta o `fields` a partir do resultado, então o schema e o CSV
 * não têm como divergir.
 */
export function recortarSchema(schema: ReportFileSchema, pdm: RotulosPdm, analitico: boolean): ReportFileSchema {
    const rotulos = pdm ? rotulosDoPdm(pdm.rotulo_iniciativa, pdm.rotulo_atividade) : {};

    const colunas = schema.colunas
        .filter((c) => {
            // ano/mês: só no Analítico (o Consolidado agrupa o período inteiro).
            if (COLUNAS_ANO_MES.has(c.name)) return analitico;
            // meta/iniciativa/atividade x projeto: exclusivos entre si.
            if (COLUNAS_PDM.has(c.name)) return pdm != null;
            if (COLUNAS_PROJETO.has(c.name)) return pdm == null;
            return true;
        })
        .map((c) => (rotulos[c.name] ? { ...c, label: rotulos[c.name] } : c));

    return { arquivo: schema.arquivo, colunas };
}

/**
 * Superconjunto das colunas de `executado.csv`.
 *
 * `fontes` lista apenas as três fontes ativas. A fonte `Orcamento` (PDM antigo) usa o **mesmo**
 * service e continua passando por este schema em tempo de execução — ela só ficou de fora da
 * listagem porque está sendo descontinuada e não deve aparecer como customizável na API.
 */
@ReportRows({
    arquivo: 'executado.csv',
    fontes: ['PSOrcamento', 'ProjetoOrcamento', 'ObrasOrcamento'],
    descricao:
        'Orçamento executado (realizado). Uma linha por item de orçamento realizado no Analítico, ' +
        'ou por dotação/processo/nota agrupada no Consolidado. As colunas de ano/mês só existem no ' +
        'Analítico e as de meta/iniciativa/atividade só existem quando o relatório roda sobre um plano ' +
        '(sem plano, saem as colunas de projeto).',
})
export class RelOrcamentoExecutadoCsvRow {
    /** Só no Analítico. Rótulo minúsculo e acentuado é o cabeçalho histórico do arquivo. */
    @ReportColumn({ type: 'INTEGER', label: 'mês', format: { raw: true } })
    mes: number | null;

    /** Só no Analítico. `raw` para não sair como `2.024`. */
    @ReportColumn({ type: 'INTEGER', label: 'ano', format: { raw: true } })
    ano: number | null;

    /**
     * Só no Analítico. `Sim`/`Não` é tradução de domínio (não formatação de locale), por isso
     * continua sendo resolvida na extração e a coluna permanece `VARCHAR`.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'mês corrente' })
    mes_corrente: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Meta' })
    meta__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Meta' })
    meta__titulo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID da Meta', format: { raw: true }, customizavel: false })
    meta__id: number | null;

    /** Rótulo real vem de `pdm.rotulo_iniciativa` — sobrescrito por `recortarSchema`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Código da ' + ROTULO_INICIATIVA_PADRAO })
    iniciativa__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da ' + ROTULO_INICIATIVA_PADRAO })
    iniciativa__titulo: string | null;

    @ReportColumn({
        type: 'INTEGER',
        label: 'ID da ' + ROTULO_INICIATIVA_PADRAO,
        format: { raw: true },
        customizavel: false,
    })
    iniciativa__id: number | null;

    /** Rótulo real vem de `pdm.rotulo_atividade` — sobrescrito por `recortarSchema`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Código da ' + ROTULO_ATIVIDADE_PADRAO })
    atividade__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da ' + ROTULO_ATIVIDADE_PADRAO })
    atividade__titulo: string | null;

    @ReportColumn({
        type: 'INTEGER',
        label: 'ID da ' + ROTULO_ATIVIDADE_PADRAO,
        format: { raw: true },
        customizavel: false,
    })
    atividade__id: number | null;

    /** Rótulo 'Código Projeto' (sem "do") é o cabeçalho histórico; corrigir é decisão de negócio. */
    @ReportColumn({ type: 'VARCHAR', label: 'Código Projeto' })
    projeto__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Projeto' })
    projeto__nome: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID do Projeto', format: { raw: true }, customizavel: false })
    projeto__id: number | null;

    /**
     * Dotação já concatenada com o complemento na extração (`dotacao.complemento`).
     *
     * Sem `excelTextGuard`: o relatório nunca emitiu `="..."` aqui e ligar o guard agora mudaria
     * o conteúdo da célula entregue hoje.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'dotacao' })
    dotacao: string;

    @ReportColumn({ type: 'VARCHAR', label: 'processo' })
    processo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'nota_empenho' })
    nota_empenho: string | null;

    // Os rótulos abaixo são os nomes de máquina com ponto — é literalmente o cabeçalho que o
    // relatório emite hoje (json2csv usa a própria string do campo como label). O `name` usa
    // `__` porque ponto é proibido no schema.
    @ReportColumn({ type: 'VARCHAR', label: 'orgao.codigo' })
    orgao__codigo: string;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao.nome' })
    orgao__nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'unidade.codigo' })
    unidade__codigo: string;

    @ReportColumn({ type: 'VARCHAR', label: 'unidade.nome' })
    unidade__nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'fonte.codigo' })
    fonte__codigo: string;

    @ReportColumn({ type: 'VARCHAR', label: 'fonte.nome' })
    fonte__nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'acao_orcamentaria' })
    acao_orcamentaria: string;

    /**
     * Timestamp em ISO-8601 UTC (`2024-01-15T13:45:00.000Z`), como o relatório sempre entregou.
     *
     * Deliberadamente **não** virou `TIMESTAMP`: o pós-processamento formataria como
     * `dd/mm/aaaa hh:mm:ss` em pt-BR, o que além de mudar a saída de hoje esconderia que o
     * horário está em UTC (o `Z` some). Converter para America/Sao_Paulo seria mudar o valor.
     * As duas opções são decisão de negócio, então a coluna fica `VARCHAR`.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'plan_dotacao_sincronizado_em' })
    plan_dotacao_sincronizado_em: string | null;

    /**
     * Vem do banco via `to_char_numeric()`, que já devolve exatamente 2 casas decimais (ou vazio
     * quando nulo) — a releitura como `DECIMAL(18,2)` reproduz o texto atual byte a byte, sem
     * passar por `double`. Sem `currency`: o relatório nunca emitiu máscara de moeda.
     */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'plan_sof_val_orcado_atualizado' })
    plan_sof_val_orcado_atualizado: string | null;

    /** Idem `plan_sof_val_orcado_atualizado`. */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'plan_valor_planejado' })
    plan_valor_planejado: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'plan_dotacao_ano_utilizado', format: { raw: true } })
    plan_dotacao_ano_utilizado: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'plan_dotacao_mes_utilizado', format: { raw: true } })
    plan_dotacao_mes_utilizado: string | null;

    /** ISO-8601 UTC, mesmo motivo de `plan_dotacao_sincronizado_em`. */
    @ReportColumn({ type: 'VARCHAR', label: 'dotacao_sincronizado_em' })
    dotacao_sincronizado_em: string | null;

    /**
     * Valor do SOF: `Decimal(15,2)` que chega do `$queryRaw` **sem** passar por
     * `to_char_numeric`. A releitura como `DECIMAL(18,2)` normaliza a escala, ou seja, um valor
     * cujo texto hoje sai como `1234.5` passa a sair `1234.50` — mesmo número, agora consistente
     * com as colunas `smae_valor_*` ao lado. Nenhum dígito significativo é perdido: a origem
     * tem escala 2.
     */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'dotacao_valor_empenhado' })
    dotacao_valor_empenhado: string | null;

    /** Idem `dotacao_valor_empenhado`. */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'dotacao_valor_liquidado' })
    dotacao_valor_liquidado: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'dotacao_ano_utilizado', format: { raw: true } })
    dotacao_ano_utilizado: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'dotacao_mes_utilizado', format: { raw: true } })
    dotacao_mes_utilizado: string | null;

    /** `to_char_numeric()` nos dois modos — 2 casas garantidas. */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'smae_valor_empenhado' })
    smae_valor_empenhado: string | null;

    /** Idem `smae_valor_empenhado`. */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'smae_valor_liquidado' })
    smae_valor_liquidado: string | null;

    /**
     * **Coluna corrigida: saía sempre vazia.** O `fields` do relatório sempre pediu
     * `smae_percentual_empenhado`, mas o DTO expõe `smae_percentual_empenho` — o nome nunca casou
     * e a célula saía em branco desde a origem. O nome e a posição da coluna são preservados; a
     * extração passa a preencher o valor (ver `toFileOutput`).
     *
     * A correção é intencional e não cosmética: no pós-processamento cada coluna do schema também
     * vira filtro e critério de ordenação do modelo de relatório, e uma coluna eternamente `NULL`
     * entregaria um filtro que nunca casa.
     *
     * `VARCHAR` pelo mesmo motivo de {@link smae_percentual_liquidado}: a extração é inconsistente
     * entre os modos (Analítico passa por `to_char_numeric()`, Consolidado devolve o `Decimal(7,4)`
     * cru), então nenhuma escala única é fiel aos dois.
     */
    @ReportColumn({
        type: 'VARCHAR',
        label: 'smae_percentual_empenhado',
        descricao: 'Percentual empenhado apurado pelo SMAE (`smae_percentual_empenho` no DTO).',
    })
    smae_percentual_empenhado: string | null;

    /**
     * Fica `VARCHAR` de propósito. A extração é inconsistente entre os dois modos: o Analítico
     * passa por `to_char_numeric()` (2 casas, ex.: `33.33`) e o Consolidado devolve o
     * `Decimal(7,4)` cru (ex.: `33.3333`). Nenhuma escala única reproduz os dois textos —
     * `DECIMAL(18,2)` arredondaria o Consolidado e `DECIMAL(18,4)` acrescentaria zeros ao
     * Analítico. Uniformizar é mudança de conteúdo; sem isso, o tipo textual é o único fiel.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'smae_percentual_liquidado' })
    smae_percentual_liquidado: string | null;

    /**
     * Texto multilinha: os logs da linha são unidos por CRLF numa única célula. O json2csv sempre
     * envolve string em aspas e dobra as aspas internas, e o `read_csv` do DuckDB relê o campo
     * entre aspas com quebra de linha sem perder nada (verificado em round-trip).
     */
    @ReportColumn({ type: 'VARCHAR', label: 'logs' })
    logs: string | null;
}

/**
 * Superconjunto das colunas de `planejado.csv`.
 *
 * Mesmo bloco de meta/iniciativa/atividade/projeto do executado, sem as colunas de execução.
 * Ver o comentário de `fontes` em {@link RelOrcamentoExecutadoCsvRow}.
 */
@ReportRows({
    arquivo: 'planejado.csv',
    fontes: ['PSOrcamento', 'ProjetoOrcamento', 'ObrasOrcamento'],
    descricao:
        'Orçamento planejado. Uma linha por registro de orçamento planejado no Analítico, ou por ' +
        'dotação/ano agrupada no Consolidado. As colunas de meta/iniciativa/atividade só existem ' +
        'quando o relatório roda sobre um plano (sem plano, saem as colunas de projeto).',
})
export class RelOrcamentoPlanejadoCsvRow {
    /**
     * **Coluna corrigida: saía sempre vazia.** Presente apenas no Analítico.
     *
     * O `toFileOutput` reaproveitava a primeira definição do bloco de ano/mês do executado
     * (`camposAno[0] = camposAnoMes[0]`), que aponta para `mes` — campo que
     * `OrcamentoPlanejadoSaidaDto` não possui, porque o planejado é **anual**
     * (`op.ano_referencia as ano` nas duas queries de planejado). O resultado era uma coluna `mês`
     * em branco no início do arquivo.
     *
     * A variável se chama `camposAno` e o único campo de período do planejado é `ano`, então o
     * campo pretendido é inequívoco. A posição (primeira coluna, só no Analítico) é preservada e o
     * rótulo passa a ser `ano` — manter `mês` sobre um valor anual seria incoerente. Mesmo tipo e
     * mesmo `raw` da coluna `ano` do executado, para não sair como `2.024`.
     */
    @ReportColumn({
        type: 'INTEGER',
        label: 'ano',
        format: { raw: true },
        descricao: 'Ano de referência do orçamento planejado.',
    })
    ano: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Meta' })
    meta__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Meta' })
    meta__titulo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID da Meta', format: { raw: true }, customizavel: false })
    meta__id: number | null;

    /** Rótulo real vem de `pdm.rotulo_iniciativa` — sobrescrito por `recortarSchema`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Código da ' + ROTULO_INICIATIVA_PADRAO })
    iniciativa__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da ' + ROTULO_INICIATIVA_PADRAO })
    iniciativa__titulo: string | null;

    @ReportColumn({
        type: 'INTEGER',
        label: 'ID da ' + ROTULO_INICIATIVA_PADRAO,
        format: { raw: true },
        customizavel: false,
    })
    iniciativa__id: number | null;

    /** Rótulo real vem de `pdm.rotulo_atividade` — sobrescrito por `recortarSchema`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Código da ' + ROTULO_ATIVIDADE_PADRAO })
    atividade__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da ' + ROTULO_ATIVIDADE_PADRAO })
    atividade__titulo: string | null;

    @ReportColumn({
        type: 'INTEGER',
        label: 'ID da ' + ROTULO_ATIVIDADE_PADRAO,
        format: { raw: true },
        customizavel: false,
    })
    atividade__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Código Projeto' })
    projeto__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Projeto' })
    projeto__nome: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID do Projeto', format: { raw: true }, customizavel: false })
    projeto__id: number | null;

    /** Sem complemento aqui (o planejado não tem `dotacao_complemento`) e sem guard, como hoje. */
    @ReportColumn({ type: 'VARCHAR', label: 'dotacao' })
    dotacao: string;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao.codigo' })
    orgao__codigo: string;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao.nome' })
    orgao__nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'unidade.codigo' })
    unidade__codigo: string;

    @ReportColumn({ type: 'VARCHAR', label: 'unidade.nome' })
    unidade__nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'fonte.codigo' })
    fonte__codigo: string;

    @ReportColumn({ type: 'VARCHAR', label: 'fonte.nome' })
    fonte__nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'acao_orcamentaria' })
    acao_orcamentaria: string;

    /** ISO-8601 UTC, mesmo motivo do executado. */
    @ReportColumn({ type: 'VARCHAR', label: 'plan_dotacao_sincronizado_em' })
    plan_dotacao_sincronizado_em: string | null;

    /** `to_char_numeric()` — 2 casas garantidas. */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'plan_sof_val_orcado_atualizado' })
    plan_sof_val_orcado_atualizado: string | null;

    /** Idem `plan_sof_val_orcado_atualizado`. */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'plan_valor_planejado' })
    plan_valor_planejado: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'plan_dotacao_ano_utilizado', format: { raw: true } })
    plan_dotacao_ano_utilizado: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'plan_dotacao_mes_utilizado', format: { raw: true } })
    plan_dotacao_mes_utilizado: string | null;

    /** Texto multilinha, igual ao executado. */
    @ReportColumn({ type: 'VARCHAR', label: 'logs' })
    logs: string | null;
}
