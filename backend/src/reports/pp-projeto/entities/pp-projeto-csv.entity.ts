import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

/**
 * Schemas das colunas dos CSVs **brutos** da fonte `Projeto` (relatório de um projeto só).
 *
 * Contexto: antes desta migração quase nenhum arquivo deste relatório declarava `fields` —
 * o cabeçalho nascia do `flatten()` do json2csv sobre o DTO, ou seja, era a chave técnica
 * (`orgao_responsavel_descricao`, `duracao_planejado`, ...). O conjunto de colunas sempre foi
 * estável (o `flatten()` do json2csv **não** achata arrays por padrão, então campo array
 * vira uma célula só); ele apenas nunca tinha sido declarado. Aqui ele passa a ser, e os
 * `label` repetem esse mesmo cabeçalho técnico — inclusive o ponto do aninhamento
 * (`meta.codigo`, `area_gestora.sigla`), que era o que o `flatten()` emitia. O cabeçalho é
 * contrato com quem consome o arquivo por automação; traduzi-lo para PT-BR é decisão de
 * negócio, e quem quiser rótulos legíveis pode renomear coluna por coluna num modelo de
 * relatório — é para isso que o `rename` do pós-processamento existe.
 *
 * Duas exceções, onde `fields` já existia e os rótulos são preservados byte-a-byte:
 * `arquivos.csv` e `enderecos.csv` — inclusive as esquisitices deste último, cujos rótulos
 * são caminhos do GeoJSON (`geojson.properties.cep`). Rótulo com ponto é permitido; o que
 * não pode ter ponto é o **nome** da coluna, porque o builder DuckDB leria `a.b` como
 * referência qualificada por fonte. O aninhamento nos nomes usa `__`.
 *
 * Regra geral: valores aqui são "compute store" — números como números, datas em ISO
 * (`YYYY-MM-DD`), sem máscara de moeda e sem o hack `="valor"` — que não existe mais em
 * ponto nenhum do pipeline. Moeda, separador decimal e `dd/mm/aaaa` são aplicados no
 * pós-processamento.
 *
 * Várias colunas abaixo (`codigo`, `versao`, `hierarquia`, `data_base`, `processos_sei`,
 * CEP…) o Excel reinterpreta ao abrir o CSV direto; o caminho para quem trabalha no Excel é
 * o `.xlsx`, que sai ao lado do CSV e já nasce com a célula tipada. As notas por coluna
 * registram onde o risco existe.
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
    @ReportColumn({ type: 'BIGINT', label: 'projeto_id', format: { raw: true } })
    projeto_id: number;

    /** Códigos como `2024.03` o Excel reinterpreta como número/data ao abrir o CSV direto. */
    @ReportColumn({ type: 'VARCHAR', label: 'codigo' })
    codigo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'portfolio_id', format: { raw: true } })
    portfolio_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'nome' })
    nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'portfolio_titulo' })
    portfolio_titulo: string;

    /** Descrições das tags de portfólio, separadas por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'etiquetas' })
    etiquetas: string | null;

    /** Valor cru do enum `ProjetoStatus`. A versão humana sai em `status_traduzido`. */
    @ReportColumn({ type: 'VARCHAR', label: 'status' })
    status: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'projeto_etapa.id', format: { raw: true } })
    projeto_etapa__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'projeto_etapa.descricao' })
    projeto_etapa__descricao: string | null;

    @ReportColumn({ type: 'DATE', label: 'previsao_inicio' })
    previsao_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'previsao_termino' })
    previsao_termino: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'previsao_duracao', format: { raw: true } })
    previsao_duracao: number | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'previsao_custo', format: { currency: 'R$', decimalPlaces: 2 } })
    previsao_custo: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'objeto' })
    objeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'objetivo' })
    objetivo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'nao_escopo' })
    nao_escopo: string | null;

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

    @ReportColumn({ type: 'BIGINT', label: 'meta_id', format: { raw: true } })
    meta_id: number | null;

    /** Nomes de exibição dos responsáveis no órgão gestor, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'responsaveis_no_orgao_gestor' })
    responsaveis_no_orgao_gestor: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'origem_tipo' })
    origem_tipo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'origem_outro' })
    origem_outro: string | null;

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

    /** Versões como `1.10` viram número no Excel ao abrir o CSV direto. */
    @ReportColumn({ type: 'VARCHAR', label: 'versao' })
    versao: string | null;

    @ReportColumn({ type: 'BOOLEAN', label: 'arquivado' })
    arquivado: boolean | null;

    @ReportColumn({ type: 'BIGINT', label: 'iniciativa_id', format: { raw: true } })
    iniciativa_id: number | null;

    @ReportColumn({ type: 'BIGINT', label: 'atividade_id', format: { raw: true } })
    atividade_id: number | null;

    /** Códigos de meta são numéricos com pontos (`1.2.3`) — o Excel os reinterpreta. */
    @ReportColumn({ type: 'VARCHAR', label: 'meta_codigo' })
    meta_codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'resumo' })
    resumo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'publico_alvo' })
    publico_alvo: string | null;

    @ReportColumn({ type: 'DATE', label: 'realizado_inicio' })
    realizado_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'realizado_termino' })
    realizado_termino: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'realizado_custo', format: { currency: 'R$', decimalPlaces: 2 } })
    realizado_custo: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'principais_etapas' })
    principais_etapas: string | null;

    @ReportColumn({ type: 'BOOLEAN', label: 'eh_prioritario' })
    eh_prioritario: boolean | null;

    @ReportColumn({ type: 'INTEGER', label: 'atraso', format: { raw: true } })
    atraso: number | null;

    @ReportColumn({ type: 'BOOLEAN', label: 'em_atraso' })
    em_atraso: boolean | null;

    @ReportColumn({ type: 'INTEGER', label: 'tolerancia_atraso', format: { raw: true } })
    tolerancia_atraso: number | null;

    @ReportColumn({ type: 'DATE', label: 'projecao_termino' })
    projecao_termino: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'realizado_duracao', format: { raw: true } })
    realizado_duracao: number | null;

    @ReportColumn({ type: 'DOUBLE', label: 'percentual_concluido', format: { decimalPlaces: 2, unit: '%' } })
    percentual_concluido: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'portfolio_nivel_maximo_tarefa', format: { raw: true } })
    portfolio_nivel_maximo_tarefa: number | null;

    // `detail.meta` é o objeto `ProjetoMetaDetailDto`. As cinco colunas abaixo são o conjunto
    // estável dele. O `...projeto.meta` do `findOne` carrega ainda um `pdm: { nome }` aninhado
    // quando a meta vem direta (mas não quando vem via iniciativa/atividade), o que gerava a
    // coluna `meta.pdm.nome` só em parte dos projetos; ela não é declarada aqui porque tem
    // exatamente o mesmo valor de `meta__pdm_nome`, que existe nos dois caminhos.
    @ReportColumn({ type: 'BIGINT', label: 'meta.id', format: { raw: true } })
    meta__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'meta.codigo' })
    meta__codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'meta.titulo' })
    meta__titulo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'meta.pdm_id', format: { raw: true } })
    meta__pdm_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'meta.pdm_nome' })
    meta__pdm_nome: string | null;

    /** `descrição da fonte: valor`, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'fonte_recursos' })
    fonte_recursos: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'premissas' })
    premissas: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'restricoes' })
    restricoes: string | null;

    /** Siglas dos órgãos participantes, separadas por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'orgaos_participantes' })
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
 * A coluna de numeração hierárquica saía como `hirearquia` — typo herdado do nome da
 * propriedade no DTO `RelProjetoCronogramaDto`. No CSV o nome foi corrigido para
 * `hierarquia`, que é como o mesmo arquivo já sai nas fontes `Obras`, `Projetos` e
 * `Transferencias`; o cabeçalho antigo não é mais emitido. No DTO da API
 * (`POST /relatorio/projeto`) o campo com typo continua existindo, marcado como deprecado
 * e ao lado do `hierarquia` correto, porque ali remover quebraria o contrato.
 */
@ReportRows({
    arquivo: 'cronograma.csv',
    fontes: ['Projeto'],
    descricao: 'Linhas do cronograma (tarefas) do projeto.',
})
export class RelProjetoCronogramaCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'projeto_id', format: { raw: true } })
    projeto_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'tarefa_id', format: { raw: true } })
    tarefa_id: number;

    /** `1.2.3` o Excel reinterpreta como número/data ao abrir o CSV direto. */
    @ReportColumn({ type: 'VARCHAR', label: 'hierarquia' })
    hierarquia: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'tarefa' })
    tarefa: string;

    @ReportColumn({ type: 'DATE', label: 'inicio_planejado' })
    inicio_planejado: string | null;

    @ReportColumn({ type: 'DATE', label: 'termino_planejado' })
    termino_planejado: string | null;

    /**
     * VARCHAR (e não DECIMAL) de propósito: quando a tarefa tem custo anualizado o valor é o
     * texto `ano: valor; ano: valor`; só no fallback (`backup_custo_estimado`) é um número.
     * O caso textual não corre risco de reinterpretação pelo Excel.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'custo_estimado' })
    custo_estimado: string | number | null;

    @ReportColumn({ type: 'INTEGER', label: 'duracao_planejado', format: { raw: true } })
    duracao_planejado: number | null;

    @ReportColumn({ type: 'DATE', label: 'inicio_real' })
    inicio_real: string | null;

    @ReportColumn({ type: 'DATE', label: 'termino_real' })
    termino_real: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'duracao_real', format: { raw: true } })
    duracao_real: number | null;

    @ReportColumn({ type: 'DOUBLE', label: 'percentual_concluido', format: { decimalPlaces: 2, unit: '%' } })
    percentual_concluido: number | null;

    /** Mesmo tratamento de `custo_estimado`. */
    @ReportColumn({ type: 'VARCHAR', label: 'custo_real' })
    custo_real: string | number | null;
}

/** Colunas do CSV bruto de `acompanhamentos.csv` (uma linha por acompanhamento do projeto). */
@ReportRows({
    arquivo: 'acompanhamentos.csv',
    fontes: ['Projeto'],
    descricao: 'Acompanhamentos registrados no projeto.',
})
export class RelProjetoAcompanhamentoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'acompanhamento_id', format: { raw: true } })
    acompanhamento_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'projeto_id', format: { raw: true } })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'acompanhamento_tipo' })
    acompanhamento_tipo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'numero', format: { raw: true } })
    numero: number | null;

    @ReportColumn({ type: 'DATE', label: 'data_registro' })
    data_registro: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'participantes' })
    participantes: string | null;

    /** HTML como veio do editor. A versão sem marcação sai em `detalhamento_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'detalhamento' })
    detalhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'observacao' })
    observacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'detalhamento_status' })
    detalhamento_status: string | null;

    /** HTML como veio do editor. Versão sem marcação em `pontos_atencao_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'pontos_atencao' })
    pontos_atencao: string | null;

    /** HTML como veio do editor. Versão sem marcação em `pauta_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'pauta' })
    pauta: string | null;

    @ReportColumn({ type: 'BOOLEAN', label: 'cronograma_paralisado' })
    cronograma_paralisado: boolean | null;

    /** Códigos dos riscos vinculados, separados por `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'riscos' })
    riscos: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'pauta_texto' })
    pauta_texto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'detalhamento_texto' })
    detalhamento_texto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'pontos_atencao_texto' })
    pontos_atencao_texto: string | null;
}

/** Colunas do CSV bruto de `encaminhamentos.csv` (uma linha por encaminhamento). */
@ReportRows({
    arquivo: 'encaminhamentos.csv',
    fontes: ['Projeto'],
    descricao: 'Encaminhamentos dos acompanhamentos do projeto.',
})
export class RelProjetoEncaminhamentoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'acompanhamento_id', format: { raw: true } })
    acompanhamento_id: number;

    /** Identificadores como `1.2` viram número/data no Excel ao abrir o CSV direto. */
    @ReportColumn({ type: 'VARCHAR', label: 'numero_encaminhamento' })
    numero_encaminhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'encaminhamento' })
    encaminhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'responsavel' })
    responsavel: string | null;

    @ReportColumn({ type: 'DATE', label: 'prazo_encaminhamento' })
    prazo_encaminhamento: string | null;

    @ReportColumn({ type: 'DATE', label: 'prazo_realizado' })
    prazo_realizado: string | null;
}

/** Colunas do CSV bruto de `planos-acao.csv` (uma linha por plano de ação de risco). */
@ReportRows({
    arquivo: 'planos-acao.csv',
    fontes: ['Projeto'],
    descricao: 'Planos de ação dos riscos do projeto.',
})
export class RelProjetoPlanoAcaoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'risco_id', format: { raw: true } })
    risco_id: number;

    @ReportColumn({ type: 'INTEGER', label: 'codigo_risco', format: { raw: true } })
    codigo_risco: number | null;

    /** HTML como veio do editor. Versão sem marcação em `contramedida_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'contramedida' })
    contramedida: string | null;

    @ReportColumn({ type: 'DATE', label: 'prazo_contramedida' })
    prazo_contramedida: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'responsavel' })
    responsavel: string | null;

    /** HTML como veio do editor. Versão sem marcação em `medidas_de_contingencia_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'medidas_de_contingencia' })
    medidas_de_contingencia: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'contramedida_texto' })
    contramedida_texto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'medidas_de_contingencia_texto' })
    medidas_de_contingencia_texto: string | null;
}

/** Colunas do CSV bruto de `riscos.csv` (uma linha por risco do projeto). */
@ReportRows({
    arquivo: 'riscos.csv',
    fontes: ['Projeto'],
    descricao: 'Riscos registrados no projeto.',
})
export class RelProjetoRiscoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'risco_id', format: { raw: true } })
    risco_id: number;

    @ReportColumn({ type: 'INTEGER', label: 'codigo', format: { raw: true } })
    codigo: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'titulo' })
    titulo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'descricao' })
    descricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'probabilidade', format: { raw: true } })
    probabilidade: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'probabilidade_descricao' })
    probabilidade_descricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'impacto', format: { raw: true } })
    impacto: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'impacto_descricao' })
    impacto_descricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'grau', format: { raw: true } })
    grau: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'grau_descricao' })
    grau_descricao: string | null;

    /** Já traduzido por `ProjetoRiscoStatus` na extração (tradução de domínio). */
    @ReportColumn({ type: 'VARCHAR', label: 'status' })
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

    @ReportColumn({ type: 'BIGINT', label: 'Criador (ID)', format: { raw: true } })
    criador__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Criador (Nome de Exibição)' })
    criador__nome_exibicao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Caminho no Object Storage' })
    arquivo__caminho: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'descricao do Documento' })
    descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do arquivo', format: { raw: true } })
    arquivo__id: number | null;
}

/** Colunas do CSV bruto de `contratos.csv` da fonte `Projeto` (uma linha por contrato). */
@ReportRows({
    arquivo: 'contratos.csv',
    fontes: ['Projeto'],
    descricao: 'Contratos vinculados ao projeto.',
})
export class RelProjetoContratoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'contrato_id', format: { raw: true } })
    contrato_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'projeto_id', format: { raw: true } })
    projeto_id: number;

    /** Número de contrato é código, não valor numérico — o Excel o reinterpreta. */
    @ReportColumn({ type: 'VARCHAR', label: 'numero' })
    numero: string | null;

    @ReportColumn({ type: 'BOOLEAN', label: 'exclusivo' })
    exclusivo: boolean | null;

    @ReportColumn({ type: 'VARCHAR', label: 'status' })
    status: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'objeto' })
    objeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'descricao_detalhada' })
    descricao_detalhada: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'contratante' })
    contratante: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'empresa_contratada' })
    empresa_contratada: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'prazo', format: { raw: true } })
    prazo: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'unidade_prazo' })
    unidade_prazo: string | null;

    /** `mes/ano` (ex.: `3/2024`): o Excel lê como data ao abrir o CSV direto. */
    @ReportColumn({ type: 'VARCHAR', label: 'data_base' })
    data_base: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_assinatura' })
    data_assinatura: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_inicio' })
    data_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_termino' })
    data_termino: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_termino_atualizada' })
    data_termino_atualizada: string | null;

    /**
     * Emitido como string na extração para não perder precisão do `Decimal` do Prisma —
     * o DuckDB relê como `DECIMAL(18,2)` sem passar por `double`. Vale para todos os
     * valores monetários deste arquivo.
     */
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

    @ReportColumn({ type: 'BIGINT', label: 'modalidade_licitacao.id', format: { raw: true } })
    modalidade_licitacao__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'modalidade_licitacao.nome' })
    modalidade_licitacao__nome: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'area_gestora.id', format: { raw: true } })
    area_gestora__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'area_gestora.sigla' })
    area_gestora__sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'area_gestora.descricao' })
    area_gestora__descricao: string | null;

    @ReportColumn({ type: 'DECIMAL(18,4)', label: 'percentual_medido', format: { decimalPlaces: 2, unit: '%' } })
    percentual_medido: string | null;

    /** Processos SEI já formatados, separados por `|`: são números com pontos. */
    @ReportColumn({ type: 'VARCHAR', label: 'processos_sei' })
    processos_sei: string | null;

    /** Códigos SOF separados por `|`: têm zeros à esquerda, que o Excel come. */
    @ReportColumn({ type: 'VARCHAR', label: 'fontes_recurso' })
    fontes_recurso: string | null;

    /** Já formatado por `f_formata_cnpj` no SQL. O Excel o lê como número. */
    @ReportColumn({ type: 'VARCHAR', label: 'cnpj_contratada' })
    cnpj_contratada: string | null;
}

/** Colunas do CSV bruto de `aditivos.csv` da fonte `Projeto` (uma linha por aditivo). */
@ReportRows({
    arquivo: 'aditivos.csv',
    fontes: ['Projeto'],
    descricao: 'Aditivos e reajustes dos contratos vinculados ao projeto.',
})
export class RelProjetoAditivoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'aditivo_id', format: { raw: true } })
    aditivo_id: number;

    @ReportColumn({ type: 'BIGINT', label: 'contrato_id', format: { raw: true } })
    contrato_id: number;

    /** `Aditivo` ou `Reajuste`. */
    @ReportColumn({ type: 'VARCHAR', label: 'tipo_categoria' })
    tipo_categoria: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'tipo.id', format: { raw: true } })
    tipo__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'tipo.nome' })
    tipo__nome: string | null;

    @ReportColumn({ type: 'DATE', label: 'data' })
    data: string | null;

    /** String na extração pelo mesmo motivo de `contratos.valor`. */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'valor', format: { currency: 'R$', decimalPlaces: 2 } })
    valor: string | null;

    @ReportColumn({ type: 'DECIMAL(18,4)', label: 'percentual_medido', format: { decimalPlaces: 2, unit: '%' } })
    percentual_medido: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_termino_atual' })
    data_termino_atual: string | null;
}

/** Colunas do CSV bruto de `origens.csv` da fonte `Projeto`. */
@ReportRows({
    arquivo: 'origens.csv',
    fontes: ['Projeto'],
    descricao: 'Origens (meta/iniciativa/atividade do PdM) vinculadas ao projeto.',
})
export class RelProjetoOrigemCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'projeto_id', format: { raw: true } })
    projeto_id: number;

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

/** Colunas do CSV bruto de `termos-encerramento.csv` da fonte `Projeto`. */
@ReportRows({
    arquivo: 'termos-encerramento.csv',
    fontes: ['Projeto'],
    descricao: 'Última versão do termo de encerramento do projeto.',
})
export class RelProjetoTermoEncerramentoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'projeto_id', format: { raw: true } })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'projeto_codigo' })
    projeto_codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'nome_projeto' })
    nome_projeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'orgao_responsavel_nome' })
    orgao_responsavel_nome: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'portfolios_nomes' })
    portfolios_nomes: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'objeto' })
    objeto: string | null;

    @ReportColumn({ type: 'DATE', label: 'previsao_inicio' })
    previsao_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'previsao_termino' })
    previsao_termino: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_inicio_real' })
    data_inicio_real: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_termino_real' })
    data_termino_real: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'previsao_custo', format: { currency: 'R$', decimalPlaces: 2 } })
    previsao_custo: number | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'valor_executado_total',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    valor_executado_total: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'status_final' })
    status_final: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'etapa_nome' })
    etapa_nome: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'justificativa' })
    justificativa: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'justificativa_complemento' })
    justificativa_complemento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'responsavel_encerramento_nome' })
    responsavel_encerramento_nome: string | null;

    @ReportColumn({ type: 'DATE', label: 'data_encerramento' })
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
    @ReportColumn({ type: 'BIGINT', label: 'projeto_id', format: { raw: true } })
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

    /** `lat,lon` — o par de vírgulas já impede o Excel de ler como número. */
    @ReportColumn({ type: 'VARCHAR', label: 'geojson.geometry.coordinates' })
    coordinates: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.type' })
    geojson_type: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.geometry.type' })
    geometry_type: string | null;

    /** CEP tem zeros à esquerda, que o Excel come ao abrir o CSV direto. */
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

    /** Array JSON serializado (`[x,y,x,y]`). */
    @ReportColumn({ type: 'VARCHAR', label: 'geojson.bbox' })
    bbox: string | null;
}
