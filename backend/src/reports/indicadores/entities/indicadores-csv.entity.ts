import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

/**
 * Colunas dos CSVs **brutos** do relatório de Indicadores (`indicadores.csv` e `regioes.csv`).
 *
 * Este relatório não usa o caminho `json2csv + fields` de uma vez só: ele grava por streaming
 * (`createWriteStream` + `writeCsvHeader` + lotes de 500 linhas). Isso não muda nada aqui — o
 * conjunto de colunas é fixo, então o schema é declarado normalmente e o writer passou a emitir
 * `schema.colunas.map((c) => c.name)`, na ordem do schema.
 *
 * Regra geral: valores são "compute store" — números como números, datas em ISO (`YYYY-MM-DD`),
 * `null` para ausência de valor, sem máscara de moeda e sem o hack `="valor"`. Rótulos,
 * separador decimal pt-BR e `dd/mm/aaaa` são aplicados no pós-processamento.
 *
 * Os nomes usam `__` no lugar do `.` do `flatten()` porque o builder DuckDB interpreta ponto
 * como referência qualificada por fonte (há inclusive teste de invariante para isso).
 *
 * **Variante `tipo_pdm`**: a coluna `pdm_nome` só é emitida quando `params.tipo_pdm == 'PS'`
 * (Plano Setorial). No PDM antigo o arquivo começa direto em `meta__codigo`. Como as duas
 * classes abaixo são o superconjunto (com `pdm_nome`), o `describeSchema()` do serviço faz o
 * recorte removendo a coluna quando o relatório é de PDM. Optei pelo recorte em vez de classes
 * separadas porque o PDM antigo está fora desta iniciativa — declarar uma classe só para ele
 * colocaria a fonte `Indicadores` na listagem de colunas por fonte e na documentação.
 *
 * **`params.tipo` / `params.periodo` não mudam o conjunto de colunas.** Analítico, Consolidado,
 * Mensal, Anual e Semestral alteram apenas a janela da consulta e o *conteúdo* da coluna `data`
 * (ver a nota em `data`), nunca quais colunas saem. Por isso `describeSchema()` não ramifica
 * nesses parâmetros.
 *
 * Vários rótulos são configuráveis por PDM (`rotulo_iniciativa`, `rotulo_atividade`,
 * `rotulo_contexto_meta`, `rotulo_complementacao_meta`). Como `@ReportColumn` só aceita label
 * estático, aqui ficam os padrões do banco e o serviço aplica a sobrescrita via
 * `rotulosPdmIndicadores()`.
 *
 * Nenhuma coluna leva `excelTextGuard`: o relatório nunca emitiu o hack `="valor"`, e
 * acrescentá-lo agora mudaria o conteúdo das células.
 */

/**
 * Colunas comuns a `indicadores.csv` e `regioes.csv` — o "cabeçalho base" que o
 * `buildBaseCsvFields()` montava para os dois arquivos.
 *
 * Aqui a herança do `@ReportColumn` funciona a favor: nos dois arquivos este bloco vem
 * **primeiro**, e `coletarColunas()` põe as colunas da classe-base antes das próprias.
 */
abstract class RelIndicadoresBaseCsvRow {
    /**
     * Só existe na variante Plano Setorial (`tipo_pdm == 'PS'`); no PDM antigo o
     * `describeSchema()` remove esta coluna. Ver a nota no topo do arquivo.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Plano Setorial' })
    pdm_nome: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Meta' })
    meta__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Meta' })
    meta__titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Meta', format: { raw: true }, customizavel: false })
    meta__id: number | null;

    /** Descrições das tags da meta, concatenadas com `;` na extração (regra de domínio). */
    @ReportColumn({ type: 'VARCHAR', label: 'Meta Tags' })
    meta_tags_descricao: string | null;

    /**
     * IDs das tags da meta, concatenados com `;`. Continua VARCHAR (é uma lista, não um id
     * único) e continua customizável — a chave de conciliação da linha é `meta__id`.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Tags IDs' })
    meta_tags_ids: string | null;

    /** Rótulo sobrescrito com `pdm.rotulo_iniciativa` — ver `rotulosPdmIndicadores()`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Código da Iniciativa' })
    iniciativa__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Iniciativa' })
    iniciativa__titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Iniciativa', format: { raw: true }, customizavel: false })
    iniciativa__id: number | null;

    /** Rótulo sobrescrito com `pdm.rotulo_atividade` — ver `rotulosPdmIndicadores()`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Código da Atividade' })
    atividade__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Atividade' })
    atividade__titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Atividade', format: { raw: true }, customizavel: false })
    atividade__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Código do Indicador' })
    indicador__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título do Indicador' })
    indicador__titulo: string | null;

    /**
     * Rótulo sobrescrito com `pdm.rotulo_contexto_meta` (default do banco: "Contexto") —
     * o relatório sempre usou o rótulo do PDM como cabeçalho desta coluna.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Contexto' })
    indicador__contexto: string | null;

    /** Idem, com `pdm.rotulo_complementacao_meta` (default do banco: "Complementação"). */
    @ReportColumn({ type: 'VARCHAR', label: 'Complementação' })
    indicador__complemento: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Indicador', format: { raw: true }, customizavel: false })
    indicador__id: number | null;
}

/**
 * `indicadores.csv` — série do indicador (valor consolidado do próprio indicador).
 */
@ReportRows({
    arquivo: 'indicadores.csv',
    // A fonte `Indicadores` (PDM antigo) também cai neste arquivo e continua funcionando em
    // runtime pelo mesmo `toFileOutput`/`describeSchema`, mas não é declarada aqui: o PDM
    // antigo está sendo descontinuado e ficou deliberadamente fora deste trabalho (não entra
    // na listagem de colunas por fonte nem ganha modelos de relatório).
    fontes: ['PSIndicadores'],
    descricao: 'Uma linha por indicador, série (Realizado / RealizadoAcumulado) e período do recorte solicitado.',
})
export class RelIndicadoresCsvRow extends RelIndicadoresBaseCsvRow {
    /** Início do período da linha, sempre `YYYY-MM-DD` (`dt.dt::date::text` no SQL). */
    @ReportColumn({ type: 'DATE', label: 'Data de Referência' })
    data_referencia: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Serie' })
    serie: string | null;

    /**
     * VARCHAR, e não DATE, de propósito: o conteúdo depende de `periodo`/`tipo`. Em Anual
     * Analítico e Mensal sai uma data (`2024-01-01`); em Anual Consolidado e em Semestral sai
     * o intervalo `2024-01-01/2024-12-01`. Tipar como DATE quebraria a leitura no DuckDB nos
     * recortes consolidados/semestrais.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Data' })
    data: string | null;

    /**
     * `valor_nominal` de `valor_indicador_em_json`, já arredondado no banco pelas casas
     * decimais do indicador (`variavel.casas_decimais`) e emitido como número pela extração.
     *
     * **VARCHAR de propósito.** A precisão é variável por indicador, e a única formatação
     * numérica que o pós-processamento sabe fazer exige `decimalPlaces` fixo
     * (`format('{:t..Nf}', ...)`): com N fixo, `0` de um indicador inteiro viraria `0,0000`.
     * Sem `decimalPlaces` a coluna numérica cai no pass-through do cast DOUBLE→VARCHAR do
     * DuckDB, que escreve `12.0` — ponto decimal dentro de um arquivo que formata todo o
     * resto em pt-BR, ou seja duas convenções no mesmo CSV. Entre distorcer a precisão e
     * misturar convenções, mantive o valor **exatamente** como o relatório sempre entregou.
     *
     * O custo é conhecido e aceito: no modelo de relatório esta coluna filtra/ordena como
     * texto, não por faixa numérica, e no XLSX a célula nasce texto.
     *
     * `null` (e não `''`) quando não há valor no período, e também quando o indicador é
     * `Categorica` — nesse caso o valor útil está em `valores_categorica`, regra de domínio
     * que continua na extração.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Valor' })
    valor: number | null;

    /** Booleano traduzido na extração (`Sim`/`Não`): tradução de domínio, não de locale. */
    @ReportColumn({ type: 'VARCHAR', label: 'É Prévia' })
    eh_previa: string;

    /** `titulo: quantidade` por categoria, concatenado com `; ` na extração. */
    @ReportColumn({ type: 'VARCHAR', label: 'Valores Categórica' })
    valores_categorica: string | null;
}

/**
 * `regioes.csv` — série das variáveis regionalizadas dos mesmos indicadores.
 *
 * Mesmo cabeçalho base do `indicadores.csv`, acrescido do recorte de variável/órgão/região.
 */
@ReportRows({
    arquivo: 'regioes.csv',
    // Ver a nota de `RelIndicadoresCsvRow`: a fonte `Indicadores` fica fora de propósito.
    fontes: ['PSIndicadores'],
    descricao:
        'Uma linha por variável regionalizada do indicador, série e período, com a hierarquia de regiões resolvida.',
})
export class RelIndicadoresRegioesCsvRow extends RelIndicadoresBaseCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do órgão', format: { raw: true }, customizavel: false })
    variavel__orgao__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla do órgão' })
    variavel__orgao__sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Variável' })
    variavel__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Variável' })
    variavel__titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Variável', format: { raw: true }, customizavel: false })
    variavel__id: number | null;

    /**
     * Região à qual a variável está amarrada (`v.regiao_id`) — pode ser de qualquer nível da
     * hierarquia. As colunas seguintes são os ancestrais dela, resolvidos por nível.
     *
     * **Rótulo alterado** (era 'ID da região'): ele diferia de 'ID da Região'
     * (`regiao_nivel_2__id`) só pela caixa, e o DuckDB compara identificadores sem diferenciar
     * maiúsculas — a saída vinha com a segunda coluna desambiguada para `ID da Região_1`. Como
     * o cabeçalho ia mudar de qualquer jeito, mudou para algo deliberado. Renomeei esta e não
     * a de nível 2 porque lá o rótulo faz parte do trio consistente
     * 'ID/Código/Descrição da Região', igual aos trios de Distrito e Subprefeitura.
     */
    @ReportColumn({
        type: 'BIGINT',
        label: 'ID da Região da Variável',
        format: { raw: true },
        customizavel: false,
    })
    regiao_id: number | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Distrito', format: { raw: true }, customizavel: false })
    regiao_nivel_4__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Código do Distrito' })
    regiao_nivel_4__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição do Distrito' })
    regiao_nivel_4__descricao: string | null;

    /**
     * Rótulo mantido como está ("ID do Subprefeitura", com a concordância errada): é o
     * cabeçalho que o relatório já entrega hoje, e corrigi-lo é decisão de negócio.
     */
    @ReportColumn({ type: 'BIGINT', label: 'ID do Subprefeitura', format: { raw: true }, customizavel: false })
    regiao_nivel_3__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Subprefeitura' })
    regiao_nivel_3__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição da Subprefeitura' })
    regiao_nivel_3__descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Região', format: { raw: true }, customizavel: false })
    regiao_nivel_2__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Região' })
    regiao_nivel_2__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição da Região' })
    regiao_nivel_2__descricao: string | null;

    /** Ver `RelIndicadoresCsvRow.data_referencia`. */
    @ReportColumn({ type: 'DATE', label: 'Data de Referência' })
    data_referencia: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Serie' })
    serie: string | null;

    /** VARCHAR pelo mesmo motivo de `RelIndicadoresCsvRow.data`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Data' })
    data: string | null;

    /**
     * `valor_nominal` de `valor_variavel_em_json`. VARCHAR pelo mesmo motivo de
     * `RelIndicadoresCsvRow.valor`: precisão variável por variável, e a formatação numérica
     * do pós-processamento exige casas decimais fixas.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Valor' })
    valor: number | null;

    /**
     * Rótulo no singular ("Valor Categórica"), diferente do plural usado em
     * `indicadores.csv` — mantido como está para não mudar o arquivo entregue.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Valor Categórica' })
    valores_categorica: string | null;
}

/**
 * Rótulos configuráveis por PDM, aplicados sobre os labels estáticos das classes acima.
 *
 * Reproduz o `'Código da ' + pdm.rotulo_iniciativa` (e afins) que o `buildBaseCsvFields()`
 * montava antes de o schema existir.
 */
export function rotulosPdmIndicadores(pdm: {
    rotulo_iniciativa: string;
    rotulo_atividade: string;
    rotulo_contexto_meta: string;
    rotulo_complementacao_meta: string;
}): Record<string, string | undefined> {
    return {
        iniciativa__codigo: 'Código da ' + pdm.rotulo_iniciativa,
        iniciativa__titulo: 'Título da ' + pdm.rotulo_iniciativa,
        iniciativa__id: 'ID da ' + pdm.rotulo_iniciativa,
        atividade__codigo: 'Código da ' + pdm.rotulo_atividade,
        atividade__titulo: 'Título da ' + pdm.rotulo_atividade,
        atividade__id: 'ID da ' + pdm.rotulo_atividade,
        indicador__contexto: pdm.rotulo_contexto_meta,
        indicador__complemento: pdm.rotulo_complementacao_meta,
    };
}
