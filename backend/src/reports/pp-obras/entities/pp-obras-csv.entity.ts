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
 * `="valor"` — que não existe mais em ponto nenhum do pipeline. Moeda, separador decimal
 * pt-BR e `dd/mm/aaaa` são aplicados na etapa de pós-processamento.
 *
 * Várias colunas abaixo (`codigo`, `numero`, `data_base`, `processos_sei`, códigos SOF,
 * CEP…) o Excel reinterpreta ao abrir o CSV direto; o caminho para quem trabalha no Excel é
 * o `.xlsx`, que sai ao lado do CSV e já nasce com a célula tipada. As notas por coluna
 * registram onde o risco existe.
 *
 * Particularidade deste relatório: a extração é feita por consultas SQL planas
 * (`streamQueryToCSV`), então **não havia rótulos humanos** — o cabeçalho era o próprio
 * nome técnico da coluna SQL. Os `label` abaixo repetem esse nome de propósito: o cabeçalho
 * é contrato com quem consome o arquivo por automação, e traduzi-lo para PT-BR é decisão de
 * negócio, não desta refatoração. `enderecos.csv` é o único arquivo que já declarava rótulos
 * próprios, e eles seguem preservados byte-a-byte.
 *
 * Quem quiser rótulos legíveis pode renomear coluna por coluna num modelo de relatório —
 * é exatamente para isso que o `rename` do pós-processamento existe.
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
    @ReportColumn({ type: 'BIGINT', label: 'obra_id', format: { raw: true } })
    obra_id: number;

    /** Código do tipo `2024.0001`: o Excel o converte em número ao abrir o CSV direto. */
    @ReportColumn({ type: 'VARCHAR', label: 'codigo' })
    codigo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'portfolio_id', format: { raw: true } })
    portfolio_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'nome' })
    nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'portfolio_titulo' })
    portfolio_titulo: string | null;

    /** Descrições das etiquetas da obra, separadas por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'etiquetas' })
    etiquetas: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'status' })
    status: string;

    @ReportColumn({ type: 'VARCHAR', label: 'projeto_etapa' })
    projeto_etapa: string | null;

    /** Títulos dos grupos de observadores vinculados diretamente à obra, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'grupos_observadores' })
    grupos_observadores: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'mdo_observacoes' })
    mdo_observacoes: string | null;

    /** Vem do cronograma (`tarefa_cronograma.previsao_inicio`), não do cadastro da obra. */
    @ReportColumn({ type: 'DATE', label: 'inicio_planejado' })
    inicio_planejado: string | null;

    /** Vem do cronograma (`tarefa_cronograma.previsao_termino`). */
    @ReportColumn({ type: 'DATE', label: 'termino_planejado' })
    termino_planejado: string | null;

    @ReportColumn({ type: 'DATE', label: 'previsao_inicio' })
    previsao_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'previsao_termino' })
    previsao_termino: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'previsao_duracao', format: { raw: true } })
    previsao_duracao: number | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'previsao_custo',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    previsao_custo: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'custo_planejado', format: { currency: 'R$', decimalPlaces: 2 } })
    custo_planejado: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'objeto' })
    objeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'objetivo' })
    objetivo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'escopo' })
    escopo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'nao_escopo' })
    nao_escopo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'grupo_tematico_id', format: { raw: true } })
    grupo_tematico_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'grupo_tematico_nome' })
    grupo_tematico_nome: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'tipo_intervencao_id', format: { raw: true } })
    tipo_intervencao_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'tipo_intervencao_nome' })
    tipo_intervencao_nome: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'tipo_intervencao_conceito' })
    tipo_intervencao_conceito: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'equipamento_id', format: { raw: true } })
    equipamento_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'equipamento_nome' })
    equipamento_nome: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'orgao_responsavel_id', format: { raw: true } })
    orgao_responsavel_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_responsavel_sigla' })
    orgao_responsavel_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_responsavel_descricao' })
    orgao_responsavel_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'responsavel_id', format: { raw: true } })
    responsavel_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'responsavel_nome_exibicao' })
    responsavel_nome_exibicao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'orgao_gestor_id', format: { raw: true } })
    orgao_gestor_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_gestor_sigla' })
    orgao_gestor_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_gestor_descricao' })
    orgao_gestor_descricao: string | null;

    /** Órgão **participante** (`projeto_orgao_participante`) — é o join 1:N que multiplica linhas. */
    @ReportColumn({ type: 'BIGINT', label: 'orgao_id', format: { raw: true } })
    orgao_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_sigla' })
    orgao_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_descricao' })
    orgao_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'orgao_executor_id', format: { raw: true } })
    orgao_executor_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_executor_sigla' })
    orgao_executor_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_executor_descricao' })
    orgao_executor_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'orgao_origem_id', format: { raw: true } })
    orgao_origem_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_origem_sigla' })
    orgao_origem_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_origem_descricao' })
    orgao_origem_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'orgao_colaborador_id', format: { raw: true } })
    orgao_colaborador_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_colaborador_sigla' })
    orgao_colaborador_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_colaborador_descricao' })
    orgao_colaborador_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'meta_id', format: { raw: true } })
    meta_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'meta_nome' })
    meta_nome: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'pdm_id', format: { raw: true } })
    pdm_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'pdm_nome' })
    pdm_nome: string | null;

    /** Nomes de exibição dos responsáveis no órgão gestor, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'assessores' })
    assessores: string | null;

    /** Nomes de exibição dos colaboradores no órgão, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'pontos_focais_colaboradores' })
    pontos_focais_colaboradores: string | null;

    /**
     * Percentual da fonte de recurso do join 1:N. Sem `unit: '%'`: não foi possível
     * confirmar sem banco se o valor é 0–100 ou 0–1, e apor o sufixo errado seria pior
     * que não apor nenhum.
     */
    @ReportColumn({ type: 'DOUBLE', label: 'fonte_recurso_valor_pct', format: { decimalPlaces: 2 } })
    fonte_recurso_valor_pct: number | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'fonte_recurso_valor_nominal',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    fonte_recurso_valor_nominal: string | null;

    /** `projeto.mdo_detalhamento`. */
    @ReportColumn({ type: 'VARCHAR', label: 'detalhamento' })
    detalhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'origem_tipo' })
    origem_tipo: string;

    /** `projeto.origem_outro` — texto livre usado quando a origem não é uma meta do PdM. */
    @ReportColumn({ type: 'VARCHAR', label: 'descricao' })
    descricao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'secretario_colaborador' })
    secretario_colaborador: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_inauguracao_planejada' })
    data_inauguracao_planejada: string | null;

    /** Descrições das regiões da obra, separadas por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'subprefeituras' })
    subprefeituras: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'programa_habitacional' })
    programa_habitacional: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'empreendimento_id', format: { raw: true } })
    empreendimento_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'empreendimento_identificador' })
    empreendimento_identificador: string | null;

    /** Títulos dos portfólios em que a obra foi compartilhada, separados por ` | `. */
    @ReportColumn({ type: 'VARCHAR', label: 'portfolios_compartilhados_titulos' })
    portfolios_compartilhados_titulos: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'secretario_responsavel' })
    secretario_responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'secretario_executivo' })
    secretario_executivo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'coordenador_ue' })
    coordenador_ue: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_aprovacao' })
    data_aprovacao: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_revisao' })
    data_revisao: string | null;

    /** Texto livre (ex.: `1.0`): o Excel o transforma em número ao abrir o CSV direto. */
    @ReportColumn({ type: 'VARCHAR', label: 'versao' })
    versao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'n_unidades_habitacionais', format: { raw: true } })
    n_unidades_habitacionais: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'n_familias_beneficiadas', format: { raw: true } })
    n_familias_beneficiadas: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'n_unidades_atendidas', format: { raw: true } })
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
    @ReportColumn({ type: 'BIGINT', label: 'obra_id', format: { raw: true } })
    obra_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'obra_codigo' })
    obra_codigo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'tarefa_id', format: { raw: true } })
    tarefa_id: number;

    /**
     * Numeração hierárquica da tarefa (`1.2.3`).
     *
     * Sai vazia neste arquivo desde sempre: a consulta seleciona `'' AS hierarquia`, porque
     * a numeração é montada em memória por `TarefaService.tarefasHierarquia()` e não existe
     * no SQL. Ficou fora deste PR de propósito — preencher exige carregar o cronograma
     * inteiro de cada obra em memória, o que é uma mudança de arquitetura da extração e não
     * de apresentação.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'hierarquia' })
    hierarquia: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'numero', format: { raw: true } })
    numero: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'nivel', format: { raw: true } })
    nivel: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'tarefa' })
    tarefa: string;

    @ReportColumn({ type: 'DATE', label: 'inicio_planejado' })
    inicio_planejado: string | null;

    @ReportColumn({ type: 'DATE', label: 'termino_planejado' })
    termino_planejado: string | null;

    /**
     * `VARCHAR`, não moeda: a consulta já entrega texto. Quando a tarefa tem custo
     * anualizado a coluna vira `2024: 1000 ; 2025: 2000`; só quando não tem é que sai o
     * `backup_custo_estimado` convertido para texto. Tipar como número quebraria o
     * primeiro caso.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'custo_estimado' })
    custo_estimado: string | null;

    @ReportColumn({ type: 'DATE', label: 'inicio_real' })
    inicio_real: string | null;

    @ReportColumn({ type: 'DATE', label: 'termino_real' })
    termino_real: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'duracao_real', format: { raw: true } })
    duracao_real: number | null;

    /** Sem `unit: '%'` pelo mesmo motivo de `fonte_recurso_valor_pct` em `obras.csv`. */
    @ReportColumn({ type: 'DOUBLE', label: 'percentual_concluido', format: { decimalPlaces: 2 } })
    percentual_concluido: number | null;

    /** Mesma regra de `custo_estimado`. */
    @ReportColumn({ type: 'VARCHAR', label: 'custo_real' })
    custo_real: string | null;

    /**
     * Dependências serializadas pela consulta como objetos JSON separados por `/`
     * (`{"id":1,"tipo":"termina_pro_inicio","latencia":0}`). Difere da versão legível do
     * `asJSON`, que resolve id → hierarquia; manter como está preserva a saída atual.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'dependencias' })
    dependencias: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'atraso', format: { raw: true } })
    atraso: number | null;

    @ReportColumn({ type: 'BIGINT', label: 'responsavel_id', format: { raw: true } })
    responsavel_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'responsavel_nome_exibicao' })
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
    @ReportColumn({ type: 'BIGINT', label: 'obra_id', format: { raw: true } })
    obra_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'obra_codigo' })
    obra_codigo: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_registro' })
    data_registro: string;

    @ReportColumn({ type: 'VARCHAR', label: 'participantes' })
    participantes: string;

    /**
     * Corrigida no lugar: saía como `cronograma_paralizado`, com o typo de origem.
     *
     * A posição é a mesma, então quem lê o arquivo por índice não sente. Quem lê pelo
     * cabeçalho precisa passar a usar `cronograma_paralisado` — que é como a coluna do banco
     * sempre se chamou, e como a fonte `Projeto` já emitia.
     */
    @ReportColumn({ type: 'BOOLEAN', label: 'cronograma_paralisado' })
    cronograma_paralisado: boolean | null;

    @ReportColumn({ type: 'DATE', label: 'prazo_encaminhamento' })
    prazo_encaminhamento: string | null;

    /** HTML, como cadastrado. A versão em texto puro vem na coluna seguinte. */
    @ReportColumn({ type: 'VARCHAR', label: 'pauta' })
    pauta: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'pauta_texto' })
    pauta_texto: string | null;

    @ReportColumn({ type: 'DATE', label: 'prazo_realizado' })
    prazo_realizado: string | null;

    /** HTML, como cadastrado. */
    @ReportColumn({ type: 'VARCHAR', label: 'detalhamento' })
    detalhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'detalhamento_texto' })
    detalhamento_texto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'encaminhamento' })
    encaminhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'responsavel' })
    responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'observacao' })
    observacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'detalhamento_status' })
    detalhamento_status: string | null;

    /** HTML, como cadastrado. */
    @ReportColumn({ type: 'VARCHAR', label: 'pontos_atencao' })
    pontos_atencao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'pontos_atencao_texto' })
    pontos_atencao_texto: string | null;

    /** Códigos dos riscos vinculados ao acompanhamento, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'riscos' })
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
    @ReportColumn({ type: 'BIGINT', label: 'obra_id', format: { raw: true } })
    obra_id: number;

    /** Sem `unit: '%'` — veja a nota em `RelObrasCsvRow.fonte_recurso_valor_pct`. */
    @ReportColumn({ type: 'DOUBLE', label: 'valor_percentual', format: { decimalPlaces: 2 } })
    valor_percentual: number | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'valor_nominal', format: { currency: 'R$', decimalPlaces: 2 } })
    valor_nominal: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'fonte_recurso_ano', format: { raw: true } })
    fonte_recurso_ano: number;

    /** Código SOF (`00`, `01`…): o Excel come o zero à esquerda ao abrir o CSV direto. */
    @ReportColumn({ type: 'VARCHAR', label: 'fonte_recurso_cod_sof' })
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
    @ReportColumn({ type: 'BIGINT', label: 'contrato_id', format: { raw: true } })
    contrato_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'obra_id', format: { raw: true } })
    obra_id: number;

    /** Número do tipo `001/2024`: o Excel o lê como data ao abrir o CSV direto. */
    @ReportColumn({ type: 'VARCHAR', label: 'numero' })
    numero: string;

    @ReportColumn({ type: 'BOOLEAN', label: 'exclusivo' })
    exclusivo: boolean;

    @ReportColumn({ type: 'VARCHAR', label: 'status' })
    status: string;

    @ReportColumn({ type: 'VARCHAR', label: 'objeto' })
    objeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'descricao_detalhada' })
    descricao_detalhada: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'contratante' })
    contratante: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'empresa_contratada' })
    empresa_contratada: string | null;

    /** Já sai mascarado pela função SQL `f_formata_cnpj` — é limpeza de dado, não locale. */
    @ReportColumn({ type: 'VARCHAR', label: 'cnpj_contratada' })
    cnpj_contratada: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'prazo', format: { raw: true } })
    prazo: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'unidade_prazo' })
    unidade_prazo: string | null;

    /** `mês/ano` montado no SQL (ex.: `6/2024`): o Excel o converte em data ao abrir o CSV direto. */
    @ReportColumn({ type: 'VARCHAR', label: 'data_base' })
    data_base: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_assinatura' })
    data_assinatura: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_inicio' })
    data_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_termino' })
    data_termino: string | null;

    /** Maior `data_termino_atualizada` entre os aditivos do contrato. */
    @ReportColumn({ type: 'DATE', label: 'data_termino_atualizada' })
    data_termino_atualizada: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'valor', format: { currency: 'R$', decimalPlaces: 2 } })
    valor: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'observacoes' })
    observacoes: string | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'valor_contrato_atualizado',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    valor_contrato_atualizado: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'total_aditivos', format: { currency: 'R$', decimalPlaces: 2 } })
    total_aditivos: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'total_reajustes', format: { currency: 'R$', decimalPlaces: 2 } })
    total_reajustes: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'modalidade_contratacao_id', format: { raw: true } })
    modalidade_contratacao_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'modalidade_contratacao_nome' })
    modalidade_contratacao_nome: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'orgao_id', format: { raw: true } })
    orgao_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_sigla' })
    orgao_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_descricao' })
    orgao_descricao: string | null;

    /**
     * `DECIMAL(18,4)` porque a origem é `numeric(7,4)`; emitido como string na extração
     * para não perder precisão passando por `double`. Sem `unit: '%'` — veja a nota em
     * `RelObrasCsvRow.fonte_recurso_valor_pct`.
     */
    @ReportColumn({ type: 'DECIMAL(18,4)', label: 'percentual_medido', format: { decimalPlaces: 2 } })
    percentual_medido: string | null;

    /** Processos SEI já formatados por `format_proc_sei_sinproc`, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'processos_sei' })
    processos_sei: string | null;

    /** Códigos SOF das fontes do contrato, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'fontes_recurso' })
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
    @ReportColumn({ type: 'BIGINT', label: 'aditivo_id', format: { raw: true } })
    aditivo_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'contrato_id', format: { raw: true } })
    contrato_id: number;

    /** `contrato_aditivo.numero` é texto no banco; mesmo risco no Excel que o número do contrato. */
    @ReportColumn({ type: 'VARCHAR', label: 'numero' })
    numero: string;

    @ReportColumn({ type: 'BIGINT', label: 'tipo_aditivo_id', format: { raw: true } })
    tipo_aditivo_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'tipo_aditivo_nome' })
    tipo_aditivo_nome: string;

    /** `Aditivo` ou `Reajuste` — é o que separa os dois totais em `contratos.csv`. */
    @ReportColumn({ type: 'VARCHAR', label: 'tipo_categoria' })
    tipo_categoria: string;

    @ReportColumn({ type: 'DATE', label: 'data' })
    data: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_termino_atual' })
    data_termino_atual: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'valor', format: { currency: 'R$', decimalPlaces: 2 } })
    valor: string | null;

    /** `numeric(7,4)` na origem — veja a nota em `RelObrasContratosCsvRow.percentual_medido`. */
    @ReportColumn({ type: 'DECIMAL(18,4)', label: 'percentual_medido', format: { decimalPlaces: 2 } })
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
    @ReportColumn({ type: 'BIGINT', label: 'obra_id', format: { raw: true } })
    obra_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'pdm_id', format: { raw: true } })
    pdm_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'pdm_titulo' })
    pdm_titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'meta_id', format: { raw: true } })
    meta_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'meta_titulo' })
    meta_titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'iniciativa_id', format: { raw: true } })
    iniciativa_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'iniciativa_titulo' })
    iniciativa_titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'atividade_id', format: { raw: true } })
    atividade_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'atividade_titulo' })
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
    @ReportColumn({ type: 'BIGINT', label: 'obra_id', format: { raw: true } })
    obra_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'categoria' })
    categoria: string;

    /**
     * Já formatado por `format_proc_sei_sinproc` na consulta (limpeza de dado, não locale).
     * `6016.2024/0000000-0` é reinterpretado pelo Excel ao abrir o CSV direto.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'processo_sei' })
    processo_sei: string;

    @ReportColumn({ type: 'VARCHAR', label: 'descricao' })
    descricao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'link' })
    link: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'comentarios' })
    comentarios: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'observacoes' })
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
    @ReportColumn({ type: 'BIGINT', label: 'obra_id', format: { raw: true } })
    obra_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'endereco' })
    endereco: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'zona' })
    zona: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'distrito' })
    distrito: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'subprefeitura' })
    subprefeitura: string | null;

    /** `lat,long` concatenado no SQL: o Excel tenta interpretar ao abrir o CSV direto. */
    @ReportColumn({ type: 'VARCHAR', label: 'geojson.geometry.coordinates' })
    coordinates: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.type' })
    geojson_type: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.geometry.type' })
    geometry_type: string | null;

    /** CEP com zeros à esquerda. */
    @ReportColumn({ type: 'VARCHAR', label: 'geojson.properties.cep' })
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
    @ReportColumn({ type: 'VARCHAR', label: 'geojson.bbox' })
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
    @ReportColumn({ type: 'BIGINT', label: 'obra_id', format: { raw: true } })
    obra_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'obra_codigo' })
    obra_codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'nome_original' })
    nome_original: string;

    /** `timestamptz` do vínculo do documento com a obra (não do upload do arquivo). */
    @ReportColumn({ type: 'TIMESTAMP', label: 'criado_em' })
    criado_em: string;

    @ReportColumn({ type: 'BIGINT', label: 'criador_id', format: { raw: true } })
    criador_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'criador_nome_exibicao' })
    criador_nome_exibicao: string | null;

    /** Caminho do arquivo no storage — é a chave para baixá-lo fora do SMAE. */
    @ReportColumn({ type: 'VARCHAR', label: 'caminho' })
    caminho: string;

    @ReportColumn({ type: 'VARCHAR', label: 'descricao' })
    descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'arquivo_id', format: { raw: true } })
    arquivo_id: number;
}
