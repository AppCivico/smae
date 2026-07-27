import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

/**
 * Colunas dos CSVs **brutos** do relatório de Obras (fonte `Obras`, módulo MDO).
 *
 * Uma classe por arquivo emitido pelo `toFileOutput`, na mesma ordem em que os arquivos
 * são produzidos. A ordem de declaração das propriedades é a ordem das colunas no arquivo
 * bruto e também a ordem padrão quando nenhum modelo é aplicado.
 *
 * Regra geral: os valores aqui são "compute store" — números como números, datas em ISO
 * (`YYYY-MM-DD`), `null` para ausência de valor, sem máscara de moeda e sem o hack
 * `="valor"`. Moeda, separador decimal pt-BR, `dd/mm/aaaa` e o guard de texto do Excel são
 * aplicados na etapa de pós-processamento.
 *
 * Particularidade deste relatório: a extração é feita por consultas SQL planas
 * (`streamQueryToCSV`), então **não havia rótulos humanos** — o cabeçalho era o próprio
 * nome técnico da coluna SQL. Os `label` abaixo são, portanto, rótulos novos em PT-BR
 * (exceto em `enderecos.csv`, único arquivo que já declarava rótulos próprios e onde eles
 * foram preservados byte-a-byte).
 *
 * Nenhum nome precisa do `__` de aninhamento: as linhas vêm direto do SQL, já planas.
 */

/**
 * Colunas do CSV bruto de `obras.csv`.
 *
 * As colunas seguem exatamente a ordem do `SELECT` de `buildObrasBaseQuery()` — era dele
 * que o cabeçalho nascia, já que este arquivo nunca passou uma lista `fields` explícita.
 *
 * Uma obra pode aparecer em mais de uma linha: a consulta faz `LEFT JOIN` com
 * `projeto_fonte_recurso` e `projeto_orgao_participante`, que são 1:N.
 */
@ReportRows({
    arquivo: 'obras.csv',
    fontes: ['Obras'],
    descricao: 'Uma linha por combinação de obra × fonte de recurso × órgão participante (efeito dos LEFT JOINs 1:N).',
})
export class RelObrasCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID da Obra', format: { raw: true }, customizavel: false })
    obra_id: number;

    /** Código do tipo `2024.0001`: sem o guard o Excel o converteria em número. */
    @ReportColumn({ type: 'VARCHAR', label: 'Código', format: { excelTextGuard: true } })
    codigo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Portfólio', format: { raw: true }, customizavel: false })
    portfolio_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome' })
    nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Portfólio' })
    portfolio_titulo: string | null;

    /** Descrições das etiquetas da obra, separadas por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Etiquetas' })
    etiquetas: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Status' })
    status: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Etapa' })
    projeto_etapa: string | null;

    /** Vem do cronograma (`tarefa_cronograma.previsao_inicio`), não do cadastro da obra. */
    @ReportColumn({ type: 'DATE', label: 'Início Planejado' })
    inicio_planejado: string | null;

    /** Vem do cronograma (`tarefa_cronograma.previsao_termino`). */
    @ReportColumn({ type: 'DATE', label: 'Término Planejado' })
    termino_planejado: string | null;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Início' })
    previsao_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Término' })
    previsao_termino: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Previsão de Duração', format: { raw: true } })
    previsao_duracao: number | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Previsão de Custo',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    previsao_custo: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Custo Planejado', format: { currency: 'R$', decimalPlaces: 2 } })
    custo_planejado: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto' })
    objeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Objetivo' })
    objetivo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Escopo' })
    escopo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Não Escopo' })
    nao_escopo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Grupo Temático', format: { raw: true } })
    grupo_tematico_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Grupo Temático' })
    grupo_tematico_nome: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Tipo de Intervenção', format: { raw: true } })
    tipo_intervencao_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Tipo de Intervenção' })
    tipo_intervencao_nome: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conceito do Tipo de Intervenção' })
    tipo_intervencao_conceito: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Equipamento', format: { raw: true } })
    equipamento_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Equipamento' })
    equipamento_nome: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Órgão Responsável', format: { raw: true } })
    orgao_responsavel_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla do Órgão Responsável' })
    orgao_responsavel_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Responsável' })
    orgao_responsavel_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Responsável', format: { raw: true } })
    responsavel_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Responsável' })
    responsavel_nome_exibicao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Órgão Gestor', format: { raw: true } })
    orgao_gestor_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla do Órgão Gestor' })
    orgao_gestor_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Gestor' })
    orgao_gestor_descricao: string | null;

    /** Órgão **participante** (`projeto_orgao_participante`) — é o join 1:N que multiplica linhas. */
    @ReportColumn({ type: 'BIGINT', label: 'ID do Órgão Participante', format: { raw: true } })
    orgao_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla do Órgão Participante' })
    orgao_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Participante' })
    orgao_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Órgão Executor', format: { raw: true } })
    orgao_executor_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla do Órgão Executor' })
    orgao_executor_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Executor' })
    orgao_executor_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Órgão de Origem', format: { raw: true } })
    orgao_origem_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla do Órgão de Origem' })
    orgao_origem_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão de Origem' })
    orgao_origem_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Órgão Colaborador', format: { raw: true } })
    orgao_colaborador_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla do Órgão Colaborador' })
    orgao_colaborador_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Colaborador' })
    orgao_colaborador_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Meta', format: { raw: true } })
    meta_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Meta' })
    meta_nome: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Programa de Metas', format: { raw: true } })
    pdm_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Programa de Metas' })
    pdm_nome: string | null;

    /** Nomes de exibição dos responsáveis no órgão gestor, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Assessores' })
    assessores: string | null;

    /** Nomes de exibição dos colaboradores no órgão, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Pontos Focais Colaboradores' })
    pontos_focais_colaboradores: string | null;

    /**
     * Percentual da fonte de recurso do join 1:N. Sem `unit: '%'`: não foi possível
     * confirmar sem banco se o valor é 0–100 ou 0–1, e apor o sufixo errado seria pior
     * que não apor nenhum.
     */
    @ReportColumn({ type: 'DOUBLE', label: 'Fonte de Recurso - Percentual', format: { decimalPlaces: 2 } })
    fonte_recurso_valor_pct: number | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Fonte de Recurso - Valor Nominal',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    fonte_recurso_valor_nominal: string | null;

    /** `projeto.mdo_detalhamento`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento' })
    detalhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Tipo de Origem' })
    origem_tipo: string;

    /** `projeto.origem_outro` — texto livre usado quando a origem não é uma meta do PdM. */
    @ReportColumn({ type: 'VARCHAR', label: 'Descrição da Origem' })
    descricao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Secretário Colaborador' })
    secretario_colaborador: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Inauguração Planejada' })
    data_inauguracao_planejada: string | null;

    /** Descrições das regiões da obra, separadas por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Subprefeituras' })
    subprefeituras: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Programa Habitacional' })
    programa_habitacional: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Empreendimento', format: { raw: true } })
    empreendimento_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Identificador do Empreendimento', format: { excelTextGuard: true } })
    empreendimento_identificador: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Observações' })
    mdo_observacoes: string | null;

    /** Títulos dos portfólios em que a obra foi compartilhada, separados por ` | `. */
    @ReportColumn({ type: 'VARCHAR', label: 'Portfólios Compartilhados' })
    portfolios_compartilhados_titulos: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Secretário Responsável' })
    secretario_responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Secretário Executivo' })
    secretario_executivo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Coordenador da Unidade Executora' })
    coordenador_ue: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Aprovação' })
    data_aprovacao: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Revisão' })
    data_revisao: string | null;

    /** Texto livre (ex.: `1.0`): guard para o Excel não o transformar em número. */
    @ReportColumn({ type: 'VARCHAR', label: 'Versão', format: { excelTextGuard: true } })
    versao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Nº de Unidades Habitacionais', format: { raw: true } })
    n_unidades_habitacionais: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'Nº de Famílias Beneficiadas', format: { raw: true } })
    n_familias_beneficiadas: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'Nº de Unidades Atendidas', format: { raw: true } })
    n_unidades_atendidas: number | null;
}

/**
 * Colunas do CSV bruto de `cronograma.csv` das obras.
 *
 * Mesmo nome de arquivo do `cronograma.csv` de `Transferencias` — isso é esperado e não
 * conflita: `describeSchema` devolve só os schemas da execução corrente e `findFileSchema`
 * casa por nome dentro dessa lista.
 *
 * A ordem reproduz exatamente o antigo array `cronogramaFields`.
 */
@ReportRows({
    arquivo: 'cronograma.csv',
    fontes: ['Obras'],
    descricao: 'Uma linha por tarefa do cronograma das obras filtradas.',
})
export class RelObrasCronogramaCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID da Obra', format: { raw: true }, customizavel: false })
    obra_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Obra', format: { excelTextGuard: true } })
    obra_codigo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Tarefa', format: { raw: true }, customizavel: false })
    tarefa_id: number;

    /**
     * Numeração hierárquica da tarefa (`1.2.3`).
     *
     * Sai vazia neste arquivo desde sempre: a consulta seleciona `'' AS hierarquia`, porque
     * a numeração é montada em memória por `TarefaService.tarefasHierarquia()` e não existe
     * no SQL. Ficou fora deste PR de propósito — preencher exige carregar o cronograma
     * inteiro de cada obra em memória, o que é uma mudança de arquitetura da extração e não
     * de apresentação. O guard fica declarado para quando a coluna passar a ter conteúdo.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Hierarquia', format: { excelTextGuard: true } })
    hierarquia: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Número', format: { raw: true } })
    numero: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'Nível', format: { raw: true } })
    nivel: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Tarefa' })
    tarefa: string;

    @ReportColumn({ type: 'DATE', label: 'Início Planejado' })
    inicio_planejado: string | null;

    @ReportColumn({ type: 'DATE', label: 'Término Planejado' })
    termino_planejado: string | null;

    /**
     * `VARCHAR`, não moeda: a consulta já entrega texto. Quando a tarefa tem custo
     * anualizado a coluna vira `2024: 1000 ; 2025: 2000`; só quando não tem é que sai o
     * `backup_custo_estimado` convertido para texto. Tipar como número quebraria o
     * primeiro caso.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Custo Estimado' })
    custo_estimado: string | null;

    @ReportColumn({ type: 'DATE', label: 'Início Real' })
    inicio_real: string | null;

    @ReportColumn({ type: 'DATE', label: 'Término Real' })
    termino_real: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Duração Real', format: { raw: true } })
    duracao_real: number | null;

    /** Sem `unit: '%'` pelo mesmo motivo de `fonte_recurso_valor_pct` em `obras.csv`. */
    @ReportColumn({ type: 'DOUBLE', label: 'Percentual Concluído', format: { decimalPlaces: 2 } })
    percentual_concluido: number | null;

    /** Mesma regra de `custo_estimado`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Custo Real' })
    custo_real: string | null;

    /**
     * Dependências serializadas pela consulta como objetos JSON separados por `/`
     * (`{"id":1,"tipo":"termina_pro_inicio","latencia":0}`). Difere da versão legível do
     * `asJSON`, que resolve id → hierarquia; manter como está preserva a saída atual.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Dependências' })
    dependencias: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Atraso (dias)', format: { raw: true } })
    atraso: number | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Responsável', format: { raw: true } })
    responsavel_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Responsável' })
    responsavel_nome_exibicao: string | null;
}

/**
 * Colunas do CSV bruto de `acompanhamentos.csv`.
 *
 * A ordem reproduz exatamente o antigo array `acompanhamentosFields`.
 */
@ReportRows({
    arquivo: 'acompanhamentos.csv',
    fontes: ['Obras'],
    descricao: 'Uma linha por item de acompanhamento das obras (acompanhamento × item, via LEFT JOIN 1:N).',
})
export class RelObrasAcompanhamentosCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID da Obra', format: { raw: true }, customizavel: false })
    obra_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Obra', format: { excelTextGuard: true } })
    obra_codigo: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data do Registro' })
    data_registro: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Participantes' })
    participantes: string;

    /**
     * Nome mantido com `z` (a coluna do banco é `cronograma_paralisado`, com `s`).
     *
     * A divergência era um bug: a consulta expunha o alias `cronograma_paralisado` e o
     * `fields` pedia `cronograma_paralizado`, então a coluna saía **sempre vazia**. A
     * consulta passou a apelidar a coluna como `cronograma_paralizado`; o nome e a posição
     * foram preservados para não quebrar quem já consome o arquivo.
     */
    @ReportColumn({ type: 'BOOLEAN', label: 'Cronograma Paralisado' })
    cronograma_paralizado: boolean | null;

    @ReportColumn({ type: 'DATE', label: 'Prazo do Encaminhamento' })
    prazo_encaminhamento: string | null;

    /** HTML, como cadastrado. A versão em texto puro vem na coluna seguinte. */
    @ReportColumn({ type: 'VARCHAR', label: 'Pauta' })
    pauta: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Pauta (texto)' })
    pauta_texto: string | null;

    @ReportColumn({ type: 'DATE', label: 'Prazo Realizado' })
    prazo_realizado: string | null;

    /** HTML, como cadastrado. */
    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento' })
    detalhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento (texto)' })
    detalhamento_texto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Encaminhamento' })
    encaminhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Responsável' })
    responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Observação' })
    observacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento do Status' })
    detalhamento_status: string | null;

    /** HTML, como cadastrado. */
    @ReportColumn({ type: 'VARCHAR', label: 'Pontos de Atenção' })
    pontos_atencao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Pontos de Atenção (texto)' })
    pontos_atencao_texto: string | null;

    /** Códigos dos riscos vinculados ao acompanhamento, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Riscos' })
    riscos: string | null;
}

/**
 * Colunas do CSV bruto de `fontes_recurso.csv`.
 *
 * Ordem do `SELECT` de `_queryDataFontesRecurso()` — o arquivo nunca teve `fields`
 * explícito, então o cabeçalho vinha da própria consulta.
 */
@ReportRows({
    arquivo: 'fontes_recurso.csv',
    fontes: ['Obras'],
    descricao: 'Uma linha por fonte de recurso vinculada à obra.',
})
export class RelObrasFontesRecursoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID da Obra', format: { raw: true }, customizavel: false })
    obra_id: number;

    /** Sem `unit: '%'` — veja a nota em `RelObrasCsvRow.fonte_recurso_valor_pct`. */
    @ReportColumn({ type: 'DOUBLE', label: 'Percentual', format: { decimalPlaces: 2 } })
    valor_percentual: number | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor Nominal', format: { currency: 'R$', decimalPlaces: 2 } })
    valor_nominal: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Ano', format: { raw: true } })
    fonte_recurso_ano: number;

    /** Código SOF (`00`, `01`…): guard para o Excel não comer o zero à esquerda. */
    @ReportColumn({ type: 'VARCHAR', label: 'Código SOF', format: { excelTextGuard: true } })
    fonte_recurso_cod_sof: string;
}

/**
 * Colunas do CSV bruto de `contratos.csv`.
 *
 * A ordem reproduz exatamente o antigo array `contratosFields`.
 */
@ReportRows({
    arquivo: 'contratos.csv',
    fontes: ['Obras'],
    descricao: 'Uma linha por contrato vinculado à obra.',
})
export class RelObrasContratosCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Contrato', format: { raw: true }, customizavel: false })
    contrato_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Obra', format: { raw: true }, customizavel: false })
    obra_id: number;

    /** Número do tipo `001/2024`: guard obrigatório, o Excel o leria como data. */
    @ReportColumn({ type: 'VARCHAR', label: 'Número', format: { excelTextGuard: true } })
    numero: string;

    @ReportColumn({ type: 'BOOLEAN', label: 'Exclusivo' })
    exclusivo: boolean;

    @ReportColumn({ type: 'VARCHAR', label: 'Status' })
    status: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto' })
    objeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição Detalhada' })
    descricao_detalhada: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Contratante' })
    contratante: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Empresa Contratada' })
    empresa_contratada: string | null;

    /** Já sai mascarado pela função SQL `f_formata_cnpj` — é limpeza de dado, não locale. */
    @ReportColumn({ type: 'VARCHAR', label: 'CNPJ da Contratada', format: { excelTextGuard: true } })
    cnpj_contratada: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Prazo', format: { raw: true } })
    prazo: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Unidade do Prazo' })
    unidade_prazo: string | null;

    /** `mês/ano` montado no SQL (ex.: `6/2024`): sem guard o Excel o converteria em data. */
    @ReportColumn({ type: 'VARCHAR', label: 'Data Base', format: { excelTextGuard: true } })
    data_base: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Início' })
    data_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Término' })
    data_termino: string | null;

    /** Maior `data_termino_atualizada` entre os aditivos do contrato. */
    @ReportColumn({ type: 'DATE', label: 'Data de Término Atualizada' })
    data_termino_atualizada: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor', format: { currency: 'R$', decimalPlaces: 2 } })
    valor: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Observações' })
    observacoes: string | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Valor do Contrato Atualizado',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    valor_contrato_atualizado: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Total de Aditivos', format: { currency: 'R$', decimalPlaces: 2 } })
    total_aditivos: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Total de Reajustes', format: { currency: 'R$', decimalPlaces: 2 } })
    total_reajustes: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Modalidade de Contratação', format: { raw: true } })
    modalidade_contratacao_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Modalidade de Contratação' })
    modalidade_contratacao_nome: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Área Gestora', format: { raw: true } })
    orgao_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla da Área Gestora' })
    orgao_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Área Gestora' })
    orgao_descricao: string | null;

    /**
     * `DECIMAL(18,4)` porque a origem é `numeric(7,4)`; emitido como string na extração
     * para não perder precisão passando por `double`. Sem `unit: '%'` — veja a nota em
     * `RelObrasCsvRow.fonte_recurso_valor_pct`.
     */
    @ReportColumn({ type: 'DECIMAL(18,4)', label: 'Percentual Medido', format: { decimalPlaces: 2 } })
    percentual_medido: string | null;

    /** Processos SEI já formatados por `format_proc_sei_sinproc`, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Processos SEI', format: { excelTextGuard: true } })
    processos_sei: string | null;

    /** Códigos SOF das fontes do contrato, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Fontes de Recurso', format: { excelTextGuard: true } })
    fontes_recurso: string | null;
}

/**
 * Colunas do CSV bruto de `aditivos.csv`.
 *
 * Ordem do `SELECT` de `_queryDataAditivos()` — sem `fields` explícito.
 */
@ReportRows({
    arquivo: 'aditivos.csv',
    fontes: ['Obras'],
    descricao: 'Uma linha por aditivo dos contratos vinculados às obras.',
})
export class RelObrasAditivosCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Aditivo', format: { raw: true }, customizavel: false })
    aditivo_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Contrato', format: { raw: true }, customizavel: false })
    contrato_id: number;

    /** `contrato_aditivo.numero` é texto no banco; guard pelo mesmo motivo do contrato. */
    @ReportColumn({ type: 'VARCHAR', label: 'Número', format: { excelTextGuard: true } })
    numero: string;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Tipo de Aditivo', format: { raw: true } })
    tipo_aditivo_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Tipo de Aditivo' })
    tipo_aditivo_nome: string;

    /** `Aditivo` ou `Reajuste` — é o que separa os dois totais em `contratos.csv`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Categoria do Tipo' })
    tipo_categoria: string;

    @ReportColumn({ type: 'DATE', label: 'Data' })
    data: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Término Atual' })
    data_termino_atual: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor', format: { currency: 'R$', decimalPlaces: 2 } })
    valor: string | null;

    /** `numeric(7,4)` na origem — veja a nota em `RelObrasContratosCsvRow.percentual_medido`. */
    @ReportColumn({ type: 'DECIMAL(18,4)', label: 'Percentual Medido', format: { decimalPlaces: 2 } })
    percentual_medido: string | null;
}

/**
 * Colunas do CSV bruto de `origens.csv`.
 *
 * Ordem do `SELECT` de `_queryDataOrigens()` — sem `fields` explícito.
 */
@ReportRows({
    arquivo: 'origens.csv',
    fontes: ['Obras'],
    descricao: 'Uma linha por origem (meta / iniciativa / atividade do PdM) vinculada à obra.',
})
export class RelObrasOrigensCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID da Obra', format: { raw: true }, customizavel: false })
    obra_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Programa de Metas', format: { raw: true } })
    pdm_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Programa de Metas' })
    pdm_titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Meta', format: { raw: true } })
    meta_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Meta' })
    meta_titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Iniciativa', format: { raw: true } })
    iniciativa_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Iniciativa' })
    iniciativa_titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Atividade', format: { raw: true } })
    atividade_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Atividade' })
    atividade_titulo: string | null;
}

/**
 * Colunas do CSV bruto de `processos_sei.csv`.
 *
 * Ordem do `SELECT` de `_queryDataObrasSei()` — sem `fields` explícito.
 */
@ReportRows({
    arquivo: 'processos_sei.csv',
    fontes: ['Obras'],
    descricao: 'Uma linha por processo SEI registrado na obra.',
})
export class RelObrasProcessosSeiCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID da Obra', format: { raw: true }, customizavel: false })
    obra_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Categoria' })
    categoria: string;

    /**
     * Já formatado por `format_proc_sei_sinproc` na consulta (limpeza de dado, não locale).
     * Guard obrigatório: `6016.2024/0000000-0` seria reinterpretado pelo Excel.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Processo SEI', format: { excelTextGuard: true } })
    processo_sei: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição' })
    descricao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Link' })
    link: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Comentários' })
    comentarios: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Observações' })
    observacoes: string | null;
}

/**
 * Colunas do CSV bruto de `enderecos.csv`.
 *
 * Único arquivo deste relatório que já declarava rótulos próprios (`fields` com
 * `{ value, label }`). Eles foram preservados **byte-a-byte**, inclusive os pontos de
 * `geojson.properties.*`: são o que documenta a proveniência de cada campo dentro do
 * GeoJSON e trocá-los mudaria o cabeçalho entregue hoje. Ponto no `label` é inofensivo —
 * a restrição de `.` vale só para o `name` da coluna.
 *
 * Mesmo nome de arquivo do `enderecos.csv` de `Demandas`; veja a nota em
 * `RelObrasCronogramaCsvRow`.
 */
@ReportRows({
    arquivo: 'enderecos.csv',
    fontes: ['Obras'],
    descricao: 'Uma linha por localização geográfica (ou região) vinculada à obra.',
})
export class RelObrasEnderecosCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'obra_id', format: { raw: true }, customizavel: false })
    obra_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'endereco' })
    endereco: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'zona' })
    zona: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'distrito' })
    distrito: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'subprefeitura' })
    subprefeitura: string | null;

    /** `lat,long` concatenado no SQL: guard para o Excel não tentar interpretar. */
    @ReportColumn({ type: 'VARCHAR', label: 'geojson.geometry.coordinates', format: { excelTextGuard: true } })
    coordinates: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.type' })
    geojson_type: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.geometry.type' })
    geometry_type: string | null;

    /** CEP com zeros à esquerda. */
    @ReportColumn({ type: 'VARCHAR', label: 'geojson.properties.cep', format: { excelTextGuard: true } })
    cep: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.properties.rua' })
    rua: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.properties.pais' })
    pais: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.properties.bairro' })
    bairro: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.properties.cidade' })
    cidade: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.properties.estado' })
    estado: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.properties.rotulo' })
    rotulo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.properties.osm_type' })
    osm_type: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.properties.codigo_pais' })
    codigo_pais: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.properties.string_endereco' })
    string_endereco: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.geometry_name' })
    geometry_name: string | null;

    /** Array JSON serializado como texto. */
    @ReportColumn({ type: 'VARCHAR', label: 'geojson.bbox', format: { excelTextGuard: true } })
    bbox: string | null;
}

/**
 * Colunas do CSV bruto de `arquivos.csv`.
 *
 * Ordem do `SELECT` de `_queryDataArquivos()` — sem `fields` explícito.
 */
@ReportRows({
    arquivo: 'arquivos.csv',
    fontes: ['Obras'],
    descricao: 'Uma linha por documento anexado à obra.',
})
export class RelObrasArquivosCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID da Obra', format: { raw: true }, customizavel: false })
    obra_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Obra', format: { excelTextGuard: true } })
    obra_codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Arquivo' })
    nome_original: string;

    /** `timestamptz` do vínculo do documento com a obra (não do upload do arquivo). */
    @ReportColumn({ type: 'TIMESTAMP', label: 'Criado em' })
    criado_em: string;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Criador', format: { raw: true } })
    criador_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Criador' })
    criador_nome_exibicao: string | null;

    /** Caminho do arquivo no storage — é a chave para baixá-lo fora do SMAE. */
    @ReportColumn({ type: 'VARCHAR', label: 'Caminho' })
    caminho: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição' })
    descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Arquivo', format: { raw: true }, customizavel: false })
    arquivo_id: number;
}
