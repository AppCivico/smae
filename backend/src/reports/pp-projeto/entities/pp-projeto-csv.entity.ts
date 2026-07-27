import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

/**
 * Schemas das colunas dos CSVs **brutos** da fonte `Projeto` (relatório de um projeto só).
 *
 * Contexto: antes desta migração quase nenhum arquivo deste relatório declarava `fields` —
 * o cabeçalho nascia do `flatten()` do json2csv sobre o DTO, ou seja, era a chave técnica
 * (`orgao_responsavel_descricao`, `hirearquia`, ...). O conjunto de colunas sempre foi
 * estável (o `flatten()` do json2csv **não** achata arrays por padrão, então campo array
 * vira uma célula só); ele apenas nunca tinha sido declarado. Aqui ele passa a ser, e os
 * rótulos técnicos viram rótulos PT-BR legíveis.
 *
 * Duas exceções, onde `fields` já existia e os rótulos são preservados byte-a-byte:
 * `arquivos.csv` e `enderecos.csv` — inclusive as esquisitices deste último, cujos rótulos
 * são caminhos do GeoJSON (`geojson.properties.cep`). Rótulo com ponto é permitido; o que
 * não pode ter ponto é o **nome** da coluna, porque o builder DuckDB leria `a.b` como
 * referência qualificada por fonte. O aninhamento nos nomes usa `__`.
 *
 * Regra geral: valores aqui são "compute store" — números como números, datas em ISO
 * (`YYYY-MM-DD`), sem máscara de moeda e sem o hack `="valor"`. Moeda, separador decimal,
 * `dd/mm/aaaa` e o guard de texto do Excel são aplicados no pós-processamento.
 *
 * Traduções de **domínio** (enum de status de risco → texto humano, `ProjetoStatusParaExibicao`)
 * continuam na extração: não são formatação de locale.
 */

/**
 * Colunas do CSV bruto de `detalhes-do-projeto.csv` (sempre uma única linha).
 *
 * A ordem reproduz a ordem de inserção das chaves no objeto `detail` montado em `asJSON()`
 * — que era exatamente o que definia o cabeçalho antes, já que não havia `fields`.
 *
 * Dois campos do `detail` são objetos e, portanto, achatados: `projeto_etapa` (`IdDesc`) e
 * `meta` (`ProjetoMetaDetailDto`).
 */
@ReportRows({
    arquivo: 'detalhes-do-projeto.csv',
    fontes: ['Projeto'],
    descricao: 'Linha única com o cabeçalho/detalhes do projeto.',
})
export class RelProjetoDetalheCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    /** Guard: códigos como `2024.03` seriam reinterpretados como número/data pelo Excel. */
    @ReportColumn({ type: 'VARCHAR', label: 'Código', format: { excelTextGuard: true } })
    codigo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Portfólio', format: { raw: true }, customizavel: false })
    portfolio_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome' })
    nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Portfólio' })
    portfolio_titulo: string;

    /** Descrições das tags de portfólio, separadas por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Etiquetas' })
    etiquetas: string | null;

    /** Valor cru do enum `ProjetoStatus`. A versão humana sai em `status_traduzido`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Status' })
    status: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'Etapa - ID', format: { raw: true } })
    projeto_etapa__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Etapa' })
    projeto_etapa__descricao: string | null;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Início' })
    previsao_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Término' })
    previsao_termino: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Previsão de Duração (dias)', format: { raw: true } })
    previsao_duracao: number | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Previsão de Custo', format: { currency: 'R$', decimalPlaces: 2 } })
    previsao_custo: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto' })
    objeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Objetivo' })
    objetivo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Não Escopo' })
    nao_escopo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'Órgão Responsável - ID', format: { raw: true } })
    orgao_responsavel_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Responsável (Sigla)' })
    orgao_responsavel_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Responsável' })
    orgao_responsavel_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'Responsável - ID', format: { raw: true } })
    responsavel_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Responsável' })
    responsavel_nome_exibicao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'Órgão Gestor - ID', format: { raw: true } })
    orgao_gestor_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Gestor (Sigla)' })
    orgao_gestor_sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Gestor' })
    orgao_gestor_descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Meta', format: { raw: true } })
    meta_id: number | null;

    /** Nomes de exibição dos responsáveis no órgão gestor, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Responsáveis no Órgão Gestor' })
    responsaveis_no_orgao_gestor: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Tipo de Origem' })
    origem_tipo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Origem (Outro)' })
    origem_outro: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Secretário Responsável' })
    secretario_responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Secretário Executivo' })
    secretario_executivo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Coordenador da UE' })
    coordenador_ue: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Aprovação' })
    data_aprovacao: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Revisão' })
    data_revisao: string | null;

    /** Guard: versões como `1.10` viram número no Excel. */
    @ReportColumn({ type: 'VARCHAR', label: 'Versão', format: { excelTextGuard: true } })
    versao: string | null;

    @ReportColumn({ type: 'BOOLEAN', label: 'Arquivado' })
    arquivado: boolean | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Iniciativa', format: { raw: true } })
    iniciativa_id: number | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Atividade', format: { raw: true } })
    atividade_id: number | null;

    /** Guard: códigos de meta são numéricos com pontos (`1.2.3`). */
    @ReportColumn({ type: 'VARCHAR', label: 'Código da Meta', format: { excelTextGuard: true } })
    meta_codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Resumo' })
    resumo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Público Alvo' })
    publico_alvo: string | null;

    @ReportColumn({ type: 'DATE', label: 'Início Realizado' })
    realizado_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'Término Realizado' })
    realizado_termino: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Custo Realizado', format: { currency: 'R$', decimalPlaces: 2 } })
    realizado_custo: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Principais Etapas' })
    principais_etapas: string | null;

    @ReportColumn({ type: 'BOOLEAN', label: 'É Prioritário' })
    eh_prioritario: boolean | null;

    @ReportColumn({ type: 'INTEGER', label: 'Atraso (dias)', format: { raw: true } })
    atraso: number | null;

    @ReportColumn({ type: 'BOOLEAN', label: 'Em Atraso' })
    em_atraso: boolean | null;

    @ReportColumn({ type: 'INTEGER', label: 'Tolerância de Atraso (dias)', format: { raw: true } })
    tolerancia_atraso: number | null;

    @ReportColumn({ type: 'DATE', label: 'Projeção de Término' })
    projecao_termino: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Duração Realizada (dias)', format: { raw: true } })
    realizado_duracao: number | null;

    @ReportColumn({ type: 'DOUBLE', label: 'Percentual Concluído', format: { decimalPlaces: 2, unit: '%' } })
    percentual_concluido: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'Nível Máximo de Tarefa do Portfólio', format: { raw: true } })
    portfolio_nivel_maximo_tarefa: number | null;

    // `detail.meta` é o objeto `ProjetoMetaDetailDto`. As cinco colunas abaixo são o conjunto
    // estável dele. O `...projeto.meta` do `findOne` carrega ainda um `pdm: { nome }` aninhado
    // quando a meta vem direta (mas não quando vem via iniciativa/atividade), o que gerava a
    // coluna `meta.pdm.nome` só em parte dos projetos; ela não é declarada aqui porque tem
    // exatamente o mesmo valor de `meta__pdm_nome`, que existe nos dois caminhos.
    @ReportColumn({ type: 'BIGINT', label: 'Meta - ID', format: { raw: true } })
    meta__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Meta - Código', format: { excelTextGuard: true } })
    meta__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Meta - Título' })
    meta__titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'Meta - ID do PdM', format: { raw: true } })
    meta__pdm_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Meta - PdM' })
    meta__pdm_nome: string | null;

    /** `descrição da fonte: valor`, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Fontes de Recurso' })
    fonte_recursos: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Premissas' })
    premissas: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Restrições' })
    restricoes: string | null;

    /** Siglas dos órgãos participantes, separadas por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Órgãos Participantes' })
    orgaos_participantes: string | null;

    /**
     * Status já traduzido por `ProjetoStatusParaExibicao` — é tradução de domínio, então
     * segue sendo feita na extração.
     *
     * A chave era injetada como `status-traduzido`; o nome de máquina virou
     * `status_traduzido` (identificador limpo para filtro/ordenação no modelo), mas o
     * rótulo entregue no arquivo é mantido como estava.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'status-traduzido' })
    status_traduzido: string | null;
}

/**
 * Colunas do CSV bruto de `cronograma.csv` da fonte `Projeto` (uma linha por tarefa).
 *
 * O nome `hirearquia` tem o typo de origem preservado: é o nome da propriedade no DTO
 * `RelProjetoCronogramaDto` (que também é resposta da API `POST /relatorio/projeto`) e
 * renomeá-lo mudaria o contrato daquele endpoint. O rótulo sai correto.
 */
@ReportRows({
    arquivo: 'cronograma.csv',
    fontes: ['Projeto'],
    descricao: 'Linhas do cronograma (tarefas) do projeto.',
})
export class RelProjetoCronogramaCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Tarefa', format: { raw: true }, customizavel: false })
    tarefa_id: number;

    /** Guard: `1.2.3` seria reinterpretado como número/data pelo Excel. */
    @ReportColumn({ type: 'VARCHAR', label: 'Hierarquia', format: { excelTextGuard: true } })
    hirearquia: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Tarefa' })
    tarefa: string;

    @ReportColumn({ type: 'DATE', label: 'Início Planejado' })
    inicio_planejado: string | null;

    @ReportColumn({ type: 'DATE', label: 'Término Planejado' })
    termino_planejado: string | null;

    /**
     * VARCHAR (e não DECIMAL) de propósito: quando a tarefa tem custo anualizado o valor é o
     * texto `ano: valor; ano: valor`; só no fallback (`backup_custo_estimado`) é um número.
     * Sem guard justamente por isso — no caso numérico o guard transformaria um número em
     * texto no Excel, e o caso textual não corre risco de reinterpretação.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Custo Estimado' })
    custo_estimado: string | number | null;

    @ReportColumn({ type: 'INTEGER', label: 'Duração Planejada (dias)', format: { raw: true } })
    duracao_planejado: number | null;

    @ReportColumn({ type: 'DATE', label: 'Início Real' })
    inicio_real: string | null;

    @ReportColumn({ type: 'DATE', label: 'Término Real' })
    termino_real: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Duração Real (dias)', format: { raw: true } })
    duracao_real: number | null;

    @ReportColumn({ type: 'DOUBLE', label: 'Percentual Concluído', format: { decimalPlaces: 2, unit: '%' } })
    percentual_concluido: number | null;

    /** Mesmo tratamento de `custo_estimado`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Custo Real' })
    custo_real: string | number | null;
}

/** Colunas do CSV bruto de `acompanhamentos.csv` (uma linha por acompanhamento do projeto). */
@ReportRows({
    arquivo: 'acompanhamentos.csv',
    fontes: ['Projeto'],
    descricao: 'Acompanhamentos registrados no projeto.',
})
export class RelProjetoAcompanhamentoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Acompanhamento', format: { raw: true }, customizavel: false })
    acompanhamento_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Tipo de Acompanhamento' })
    acompanhamento_tipo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Número', format: { raw: true } })
    numero: number | null;

    @ReportColumn({ type: 'DATE', label: 'Data do Registro' })
    data_registro: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Participantes' })
    participantes: string | null;

    /** HTML como veio do editor. A versão sem marcação sai em `detalhamento_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento' })
    detalhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Observação' })
    observacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento do Status' })
    detalhamento_status: string | null;

    /** HTML como veio do editor. Versão sem marcação em `pontos_atencao_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Pontos de Atenção' })
    pontos_atencao: string | null;

    /** HTML como veio do editor. Versão sem marcação em `pauta_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Pauta' })
    pauta: string | null;

    @ReportColumn({ type: 'BOOLEAN', label: 'Cronograma Paralisado' })
    cronograma_paralisado: boolean | null;

    /** Códigos dos riscos vinculados, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Riscos' })
    riscos: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Pauta (texto)' })
    pauta_texto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento (texto)' })
    detalhamento_texto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Pontos de Atenção (texto)' })
    pontos_atencao_texto: string | null;
}

/** Colunas do CSV bruto de `encaminhamentos.csv` (uma linha por encaminhamento). */
@ReportRows({
    arquivo: 'encaminhamentos.csv',
    fontes: ['Projeto'],
    descricao: 'Encaminhamentos dos acompanhamentos do projeto.',
})
export class RelProjetoEncaminhamentoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Acompanhamento', format: { raw: true }, customizavel: false })
    acompanhamento_id: number;

    /** Guard: identificadores como `1.2` viram número/data no Excel. */
    @ReportColumn({ type: 'VARCHAR', label: 'Número do Encaminhamento', format: { excelTextGuard: true } })
    numero_encaminhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Encaminhamento' })
    encaminhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Responsável' })
    responsavel: string | null;

    @ReportColumn({ type: 'DATE', label: 'Prazo do Encaminhamento' })
    prazo_encaminhamento: string | null;

    @ReportColumn({ type: 'DATE', label: 'Prazo Realizado' })
    prazo_realizado: string | null;
}

/** Colunas do CSV bruto de `planos-acao.csv` (uma linha por plano de ação de risco). */
@ReportRows({
    arquivo: 'planos-acao.csv',
    fontes: ['Projeto'],
    descricao: 'Planos de ação dos riscos do projeto.',
})
export class RelProjetoPlanoAcaoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Risco', format: { raw: true }, customizavel: false })
    risco_id: number;

    @ReportColumn({ type: 'INTEGER', label: 'Código do Risco', format: { raw: true } })
    codigo_risco: number | null;

    /** HTML como veio do editor. Versão sem marcação em `contramedida_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Contramedida' })
    contramedida: string | null;

    @ReportColumn({ type: 'DATE', label: 'Prazo da Contramedida' })
    prazo_contramedida: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Responsável' })
    responsavel: string | null;

    /** HTML como veio do editor. Versão sem marcação em `medidas_de_contingencia_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Medidas de Contingência' })
    medidas_de_contingencia: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Contramedida (texto)' })
    contramedida_texto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Medidas de Contingência (texto)' })
    medidas_de_contingencia_texto: string | null;
}

/** Colunas do CSV bruto de `riscos.csv` (uma linha por risco do projeto). */
@ReportRows({
    arquivo: 'riscos.csv',
    fontes: ['Projeto'],
    descricao: 'Riscos registrados no projeto.',
})
export class RelProjetoRiscoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Risco', format: { raw: true }, customizavel: false })
    risco_id: number;

    @ReportColumn({ type: 'INTEGER', label: 'Código', format: { raw: true } })
    codigo: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título' })
    titulo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição' })
    descricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Probabilidade', format: { raw: true } })
    probabilidade: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição da Probabilidade' })
    probabilidade_descricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Impacto', format: { raw: true } })
    impacto: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição do Impacto' })
    impacto_descricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Grau', format: { raw: true } })
    grau: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição do Grau' })
    grau_descricao: string | null;

    /** Já traduzido por `ProjetoRiscoStatus` na extração (tradução de domínio). */
    @ReportColumn({ type: 'VARCHAR', label: 'Status' })
    status: string | null;
}

/**
 * Colunas do CSV bruto de `arquivos.csv` (uma linha por documento anexado ao projeto).
 *
 * Este arquivo já tinha `fields` explícito: os rótulos abaixo são **byte-a-byte** os que o
 * relatório emite hoje, incluindo `descricao do Documento` (sem acento e com "do Documento"
 * em maiúscula) e `ID do arquivo` — corrigir rótulo entregue ao usuário é decisão de negócio.
 */
@ReportRows({
    arquivo: 'arquivos.csv',
    fontes: ['Projeto'],
    descricao: 'Documentos anexados ao projeto.',
})
export class RelProjetoArquivoCsvRow {
    @ReportColumn({ type: 'VARCHAR', label: 'Nome Original' })
    arquivo__nome_original: string | null;

    @ReportColumn({ type: 'TIMESTAMP', label: 'Criado em' })
    criado_em: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'Criador (ID)', format: { raw: true }, customizavel: false })
    criador__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Criador (Nome de Exibição)' })
    criador__nome_exibicao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Caminho no Object Storage' })
    arquivo__caminho: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'descricao do Documento' })
    descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do arquivo', format: { raw: true }, customizavel: false })
    arquivo__id: number | null;
}

/** Colunas do CSV bruto de `contratos.csv` da fonte `Projeto` (uma linha por contrato). */
@ReportRows({
    arquivo: 'contratos.csv',
    fontes: ['Projeto'],
    descricao: 'Contratos vinculados ao projeto.',
})
export class RelProjetoContratoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Contrato', format: { raw: true }, customizavel: false })
    contrato_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    /** Guard: número de contrato é código, não valor numérico. */
    @ReportColumn({ type: 'VARCHAR', label: 'Número do Contrato', format: { excelTextGuard: true } })
    numero: string | null;

    @ReportColumn({ type: 'BOOLEAN', label: 'Exclusivo' })
    exclusivo: boolean | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Status' })
    status: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto' })
    objeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição Detalhada' })
    descricao_detalhada: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Contratante' })
    contratante: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Empresa Contratada' })
    empresa_contratada: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Prazo', format: { raw: true } })
    prazo: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Unidade do Prazo' })
    unidade_prazo: string | null;

    /** `mes/ano` (ex.: `3/2024`). Guard obrigatório: o Excel leria como data. */
    @ReportColumn({ type: 'VARCHAR', label: 'Data Base', format: { excelTextGuard: true } })
    data_base: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Início' })
    data_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Término' })
    data_termino: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Término Atualizada' })
    data_termino_atualizada: string | null;

    /**
     * Emitido como string na extração para não perder precisão do `Decimal` do Prisma —
     * o DuckDB relê como `DECIMAL(18,2)` sem passar por `double`. Vale para todos os
     * valores monetários deste arquivo.
     */
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

    @ReportColumn({ type: 'BIGINT', label: 'Modalidade de Licitação - ID', format: { raw: true } })
    modalidade_licitacao__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Modalidade de Licitação' })
    modalidade_licitacao__nome: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'Área Gestora - ID', format: { raw: true } })
    area_gestora__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Área Gestora (Sigla)' })
    area_gestora__sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Área Gestora' })
    area_gestora__descricao: string | null;

    @ReportColumn({ type: 'DECIMAL(18,4)', label: 'Percentual Medido', format: { decimalPlaces: 2, unit: '%' } })
    percentual_medido: string | null;

    /** Processos SEI já formatados, separados por `|`. Guard: são números com pontos. */
    @ReportColumn({ type: 'VARCHAR', label: 'Processos SEI', format: { excelTextGuard: true } })
    processos_sei: string | null;

    /** Códigos SOF separados por `|`. Guard: preservam zeros à esquerda. */
    @ReportColumn({ type: 'VARCHAR', label: 'Fontes de Recurso', format: { excelTextGuard: true } })
    fontes_recurso: string | null;

    /** Já formatado por `f_formata_cnpj` no SQL. Guard: senão vira número no Excel. */
    @ReportColumn({ type: 'VARCHAR', label: 'CNPJ da Contratada', format: { excelTextGuard: true } })
    cnpj_contratada: string | null;
}

/** Colunas do CSV bruto de `aditivos.csv` da fonte `Projeto` (uma linha por aditivo). */
@ReportRows({
    arquivo: 'aditivos.csv',
    fontes: ['Projeto'],
    descricao: 'Aditivos e reajustes dos contratos vinculados ao projeto.',
})
export class RelProjetoAditivoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Aditivo', format: { raw: true }, customizavel: false })
    aditivo_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Contrato', format: { raw: true }, customizavel: false })
    contrato_id: number;

    /** `Aditivo` ou `Reajuste`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Categoria do Tipo' })
    tipo_categoria: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'Tipo de Aditivo - ID', format: { raw: true } })
    tipo__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Tipo de Aditivo' })
    tipo__nome: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data' })
    data: string | null;

    /** String na extração pelo mesmo motivo de `contratos.valor`. */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor', format: { currency: 'R$', decimalPlaces: 2 } })
    valor: string | null;

    @ReportColumn({ type: 'DECIMAL(18,4)', label: 'Percentual Medido', format: { decimalPlaces: 2, unit: '%' } })
    percentual_medido: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Término Atual' })
    data_termino_atual: string | null;
}

/** Colunas do CSV bruto de `origens.csv` da fonte `Projeto`. */
@ReportRows({
    arquivo: 'origens.csv',
    fontes: ['Projeto'],
    descricao: 'Origens (meta/iniciativa/atividade do PdM) vinculadas ao projeto.',
})
export class RelProjetoOrigemCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'ID do PdM', format: { raw: true } })
    pdm_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'PdM' })
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

/** Colunas do CSV bruto de `termos-encerramento.csv` da fonte `Projeto`. */
@ReportRows({
    arquivo: 'termos-encerramento.csv',
    fontes: ['Projeto'],
    descricao: 'Última versão do termo de encerramento do projeto.',
})
export class RelProjetoTermoEncerramentoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID do Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código do Projeto', format: { excelTextGuard: true } })
    projeto_codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Projeto' })
    nome_projeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Responsável' })
    orgao_responsavel_nome: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Portfólios' })
    portfolios_nomes: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto' })
    objeto: string | null;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Início' })
    previsao_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Término' })
    previsao_termino: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Início Real' })
    data_inicio_real: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Término Real' })
    data_termino_real: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Previsão de Custo', format: { currency: 'R$', decimalPlaces: 2 } })
    previsao_custo: number | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Valor Executado Total',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    valor_executado_total: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Status Final' })
    status_final: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Etapa' })
    etapa_nome: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Justificativa' })
    justificativa: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Complemento da Justificativa' })
    justificativa_complemento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Responsável pelo Encerramento' })
    responsavel_encerramento_nome: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Encerramento' })
    data_encerramento: string | null;
}

/**
 * Colunas do CSV bruto de `enderecos.csv` da fonte `Projeto`.
 *
 * Este arquivo já tinha `fields` explícito e os rótulos abaixo são **byte-a-byte** os que o
 * relatório emite hoje — incluindo os que são caminhos dentro do GeoJSON de origem
 * (`geojson.properties.cep`, `geojson.geometry_name`, ...) e os cinco primeiros, que são o
 * próprio nome técnico da coluna em minúsculas. Rótulo com ponto é permitido (é só o
 * cabeçalho); o que não pode ter ponto é o nome da coluna.
 */
@ReportRows({
    arquivo: 'enderecos.csv',
    fontes: ['Projeto'],
    descricao: 'Endereços (geolocalização) vinculados ao projeto.',
})
export class RelProjetoEnderecoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'projeto_id', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'endereco' })
    endereco: string | null;

    /** Regiões de nível 2, separadas por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'zona' })
    zona: string | null;

    /** Regiões de nível 4, separadas por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'distrito' })
    distrito: string | null;

    /** Regiões de nível 3, separadas por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'subprefeitura' })
    subprefeitura: string | null;

    /** `lat,lon` — o par de vírgulas já impede o Excel de ler como número, sem guard. */
    @ReportColumn({ type: 'VARCHAR', label: 'geojson.geometry.coordinates' })
    coordinates: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.type' })
    geojson_type: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.geometry.type' })
    geometry_type: string | null;

    /** Guard: CEP tem zeros à esquerda. */
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

    /** Array JSON serializado (`[x,y,x,y]`). */
    @ReportColumn({ type: 'VARCHAR', label: 'geojson.bbox' })
    bbox: string | null;
}
