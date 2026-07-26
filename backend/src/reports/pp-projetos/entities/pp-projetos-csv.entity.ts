import { flatten } from '@json2csv/transforms';
import { Date2YMD } from '../../../common/date2ymd';
import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';
import { ReportFileSchema } from '../../post-process/report-schema';
import { CsvTransforms } from '../../shared/csv-file-handler';

/**
 * Colunas dos CSVs **brutos** do relatório de portfólio (fonte `Projetos`).
 *
 * São treze arquivos, um por bloco de dados do portfólio. Cada classe abaixo corresponde a
 * um arquivo e a ordem de declaração das propriedades é a ordem das colunas — ela reproduz
 * exatamente o array `<bloco>Fields` que existia no `toFileOutput`, e cada `label` é
 * byte-a-byte o rótulo do `<bloco>FieldNames` correspondente.
 *
 * Regra geral: os valores aqui são "compute store" — números como números, datas em ISO
 * (`YYYY-MM-DD`) e `null` para ausência de valor. Separador decimal pt-BR, `dd/mm/aaaa` e
 * máscara de moeda são aplicados na etapa de pós-processamento.
 *
 * ## Nomes com `__`
 *
 * Vários campos vinham de objetos aninhados do DTO e apareciam no `fields` como
 * `orgao_responsavel.id`, `fonte_recurso.valor_nominal`, `premissa.id`... O builder DuckDB
 * trata `.` como referência qualificada por fonte, então o `flatten()` do json2csv passou a
 * usar `__` como separador (veja `ppProjetosTransforms`, declarada junto com estas classes) e os
 * nomes de máquina abaixo acompanham. O rótulo entregue ao usuário não mudou.
 *
 * O `flatten` roda com `arrays: false` (padrão do json2csv): campo array vira **uma** célula
 * serializada, nunca N colunas. É isso que mantém o conjunto de colunas fixo mesmo com a
 * extração em lotes (`processDataInBatches`).
 *
 * ## Guard do Excel
 *
 * Nenhuma coluna recebe `excelTextGuard`. A extração deste relatório nunca emitiu `="..."`
 * em campo nenhum — ligar o guard mudaria os bytes do arquivo para quem consome o CSV
 * programaticamente. Manter a equivalência com a saída de hoje vale mais do que corrigir a
 * interpretação do Excel numa refatoração de infraestrutura.
 *
 * ## Tipos
 *
 * `INTEGER` para as colunas `Int` do Postgres, `DOUBLE` para as `Float` (não há precisão
 * exata a preservar) e `DECIMAL(18,2)` / `DECIMAL(18,4)` para as `Decimal` de contrato e
 * aditivo — o `Decimal` do Prisma é serializado como string pelo json2csv, então a precisão
 * chega intacta no DuckDB.
 */

@ReportRows({
    arquivo: 'projetos.csv',
    fontes: ['Projetos'],
    descricao:
        'Uma linha por combinação de projeto × órgão participante × premissa × restrição × fonte de recurso ' +
        '(o SQL faz LEFT JOIN em todas elas, então um projeto pode aparecer em várias linhas).',
})
export class RelProjetosCsvRow {
    /** Chave de conciliação do projeto: não pode ser removida por um modelo. */
    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código' })
    codigo: string | null;

    /** Chave de conciliação com o portfólio informado nos parâmetros do relatório. */
    @ReportColumn({ type: 'INTEGER', label: 'ID Portfólio', format: { raw: true }, customizavel: false })
    portfolio_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Projeto' })
    nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Título do Portfólio' })
    portfolio_titulo: string;

    /** Etiquetas (tags de portfólio) concatenadas com ` | `. */
    @ReportColumn({ type: 'VARCHAR', label: 'Etiquetas' })
    etiquetas: string | null;

    /**
     * Valor cru do enum `ProjetoStatus` (ex.: `EmAcompanhamento`). O nome de exibição sai em
     * `status_traduzido`; as duas colunas sempre existiram lado a lado.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Status (Banco)' })
    status: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Projeto Etapa' })
    projeto_etapa: string | null;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Início' })
    previsao_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Término' })
    previsao_termino: string | null;

    /** Em dias. `raw` para não levar separador de milhar. */
    @ReportColumn({ type: 'INTEGER', label: 'Previsão de Duração', format: { raw: true } })
    previsao_duracao: number | null;

    @ReportColumn({ type: 'DOUBLE', label: 'Previsão de Custo', format: { currency: 'R$', decimalPlaces: 2 } })
    previsao_custo: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto' })
    objeto: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Objetivo' })
    objetivo: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Escopo' })
    escopo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Não Escopo' })
    nao_escopo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Órgão Responsável', format: { raw: true } })
    orgao_responsavel__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla Órgão Responsável' })
    orgao_responsavel__sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição Órgão Responsável' })
    orgao_responsavel__descricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Responsável', format: { raw: true } })
    responsavel__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Responsável' })
    responsavel__nome_exibicao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Órgão Gestor', format: { raw: true } })
    orgao_gestor__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla Órgão Gestor' })
    orgao_gestor__sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição Órgão Gestor' })
    orgao_gestor__descricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Órgão Participante', format: { raw: true } })
    orgao_participante__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Sigla Órgão Participante' })
    orgao_participante__sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição Órgão Participante' })
    orgao_participante__descricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Meta', format: { raw: true } })
    meta_id: number | null;

    /** Responsáveis no órgão gestor, concatenados com `/`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Gestores do Projeto' })
    gestores: string | null;

    @ReportColumn({ type: 'DOUBLE', label: 'Valor Percentual da Fonte', format: { decimalPlaces: 2 } })
    fonte_recurso__valor_percentual: number | null;

    @ReportColumn({
        type: 'DOUBLE',
        label: 'Valor Nominal da Fonte',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    fonte_recurso__valor_nominal: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Portfólios Compartilhados' })
    portfolios_compartilhados_titulos: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Secretário Responsável' })
    secretario_responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Secretário Executivo' })
    secretario_executivo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Coordenador UE' })
    coordenador_ue: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Aprovação' })
    data_aprovacao: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Revisão' })
    data_revisao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Versão' })
    versao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Iniciativa', format: { raw: true } })
    iniciativa_id: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Atividade', format: { raw: true } })
    atividade_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Público-Alvo' })
    publico_alvo: string | null;

    /**
     * Nome de exibição do status (`ProjetoStatusParaExibicao`). A chave no CSV bruto era
     * `status-traduzido`; o hífen não serve como nome de máquina (vira identificador SQL no
     * pós-processamento), então virou `status_traduzido`. O rótulo entregue segue `Status`.
     *
     * Tradução de domínio: continua sendo feita na extração, não é formatação de locale.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Status' })
    status_traduzido: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Premissa', format: { raw: true } })
    premissa__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição da Premissa' })
    premissa__premissa: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Restrição', format: { raw: true } })
    restricao__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição da Restrição' })
    restricao__restricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Fonte de Recurso', format: { raw: true } })
    fonte_recurso__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome da Fonte de Recurso' })
    fonte_recurso__nome: string | null;

    /** Código SOF: identificador, fica `VARCHAR` para não perder zeros à esquerda. */
    @ReportColumn({ type: 'VARCHAR', label: 'Código SOF da Fonte' })
    fonte_recurso__fonte_recurso_cod_sof: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Ano da Fonte', format: { raw: true } })
    fonte_recurso__fonte_recurso_ano: number | null;
}

@ReportRows({
    arquivo: 'cronograma.csv',
    fontes: ['Projetos'],
    descricao: 'Uma linha por tarefa do cronograma dos projetos filtrados.',
})
export class RelProjetosCronogramaCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código do Projeto' })
    projeto_codigo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID da Tarefa', format: { raw: true }, customizavel: false })
    tarefa_id: number;

    /** Numeração hierárquica montada por `tarefasHierarquia` (ex.: `1.2.3`). */
    @ReportColumn({ type: 'VARCHAR', label: 'Hierarquia' })
    hierarquia: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Número', format: { raw: true } })
    numero: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'Nível', format: { raw: true } })
    nivel: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Tarefa' })
    tarefa: string;

    @ReportColumn({ type: 'DATE', label: 'Início Planejado' })
    inicio_planejado: string | null;

    @ReportColumn({
        type: 'DATE',
        label: 'Término Planejado',
    })
    termino_planejado: string | null;

    /**
     * `VARCHAR` de propósito: quando a tarefa é anualizada o valor sai como
     * `2024: 1000 ; 2025: 2000` — não é um número. Sem cronograma anualizado o valor é o
     * `backup_custo_estimado`, ainda assim numérico. Tipar como número quebraria a leitura
     * do CSV no primeiro projeto anualizado.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Custo Estimado' })
    custo_estimado: string | null;

    @ReportColumn({ type: 'DATE', label: 'Início Real' })
    inicio_real: string | null;

    @ReportColumn({ type: 'DATE', label: 'Término Real' })
    termino_real: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Duração Real (dias)', format: { raw: true } })
    duracao_real: number | null;

    @ReportColumn({ type: 'DOUBLE', label: '% Concluído', format: { decimalPlaces: 2 } })
    percentual_concluido: number | null;

    /** Idem `custo_estimado`: pode sair anualizado, então `VARCHAR`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Custo Real' })
    custo_real: string | null;

    /** `hierarquia sigla latência` por dependência, concatenadas com `/`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Dependências' })
    dependencias: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Atraso (dias)', format: { raw: true } })
    atraso: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID do Responsável', format: { raw: true } })
    responsavel__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Responsável' })
    responsavel__nome_exibicao: string | null;
}

@ReportRows({
    arquivo: 'riscos.csv',
    fontes: ['Projetos'],
    descricao: 'Uma linha por risco registrado nos projetos filtrados.',
})
export class RelProjetosRiscosCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código do Projeto' })
    projeto_codigo: string | null;

    /** `projeto_risco.codigo` é `Int` no banco — sequencial do risco dentro do projeto. */
    @ReportColumn({ type: 'INTEGER', label: 'Código', format: { raw: true }, customizavel: false })
    codigo: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Título' })
    titulo: string;

    /** `registrado_em`: data pura (validada com `IsOnlyDate` no cadastro). */
    @ReportColumn({ type: 'DATE', label: 'Data de Registro' })
    data_registro: string;

    /** Nome de exibição do enum `StatusRisco` — tradução de domínio, feita na extração. */
    @ReportColumn({ type: 'VARCHAR', label: 'Status do Risco' })
    status_risco: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição' })
    descricao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Causa' })
    causa: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Consequência' })
    consequencia: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Probabilidade', format: { raw: true } })
    probabilidade: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição da Probabilidade' })
    probabilidade_descricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Impacto', format: { raw: true } })
    impacto: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição do Impacto' })
    impacto_descricao: string | null;

    /** Calculado: probabilidade × impacto. */
    @ReportColumn({ type: 'INTEGER', label: 'Nível', format: { raw: true } })
    nivel: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'Grau', format: { raw: true } })
    grau: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição do Grau' })
    grau_descricao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Resposta' })
    resposta: string | null;

    /** Nomes das tarefas afetadas, concatenados com `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Tarefas Afetadas' })
    tarefas_afetadas: string | null;
}

@ReportRows({
    arquivo: 'planos_de_acao.csv',
    fontes: ['Projetos'],
    descricao: 'Uma linha por plano de ação (contramedida) dos riscos dos projetos filtrados.',
})
export class RelProjetosPlanoAcaoCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código do Projeto' })
    projeto_codigo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID do Plano de Ação', format: { raw: true }, customizavel: false })
    plano_acao_id: number;

    /** `projeto_risco.codigo` (`Int`), para conciliar com `riscos.csv`. */
    @ReportColumn({ type: 'INTEGER', label: 'Código do Risco', format: { raw: true }, customizavel: false })
    risco_codigo: number;

    /** HTML como veio do banco. A versão em texto puro está em `contramedida_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Contramedida' })
    contramedida: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Contramedida Texto' })
    contramedida_texto: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Medidas de Contingência' })
    medidas_de_contingencia: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Medidas de Contingência Texto' })
    medidas_de_contingencia_texto: string;

    @ReportColumn({ type: 'DATE', label: 'Prazo da Contramedida' })
    prazo_contramedida: string | null;

    @ReportColumn({ type: 'DOUBLE', label: 'Custo (R$)', format: { currency: 'R$', decimalPlaces: 2 } })
    custo: number | null;

    /** Custo em relação ao projeto todo. O rótulo já traz o `%`, então não há `unit`. */
    @ReportColumn({ type: 'DOUBLE', label: 'Custo (%)', format: { decimalPlaces: 2 } })
    custo_percentual: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Responsável' })
    responsavel: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Término' })
    data_termino: string | null;
}

@ReportRows({
    arquivo: 'monitoramento_planos_de_acao.csv',
    fontes: ['Projetos'],
    descricao: 'Uma linha por aferição de monitoramento dos planos de ação.',
})
export class RelProjetosPlanoAcaoMonitoramentoCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    // Rótulo sem o "do" — é o que o relatório entrega hoje neste arquivo (em `planos_de_acao.csv`
    // a mesma coluna sai como "Código do Projeto"). Mantido byte-a-byte.
    @ReportColumn({ type: 'VARCHAR', label: 'Código Projeto' })
    projeto_codigo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Código Risco', format: { raw: true }, customizavel: false })
    risco_codigo: number;

    @ReportColumn({ type: 'INTEGER', label: 'ID Plano de Ação', format: { raw: true }, customizavel: false })
    plano_acao_id: number;

    @ReportColumn({ type: 'DATE', label: 'Data de aferição' })
    data_afericao: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição' })
    descricao: string;
}

@ReportRows({
    arquivo: 'licoes_aprendidas.csv',
    fontes: ['Projetos'],
    descricao: 'Uma linha por lição aprendida registrada nos projetos filtrados.',
})
export class RelProjetosLicoesAprendidasCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código do Projeto' })
    projeto_codigo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Sequencial', format: { raw: true } })
    sequencial: number;

    @ReportColumn({ type: 'DATE', label: 'Data de Registro' })
    data_registro: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Responsável' })
    responsavel: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição' })
    descricao: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Observação' })
    observacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Contexto' })
    contexto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Resultado' })
    resultado: string | null;
}

@ReportRows({
    arquivo: 'acompanhamentos.csv',
    fontes: ['Projetos'],
    descricao:
        'Uma linha por item de acompanhamento (o acompanhamento se repete quando tem mais de um encaminhamento).',
})
export class RelProjetosAcompanhamentosCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código do Projeto' })
    projeto_codigo: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data do Registro' })
    data_registro: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Participantes' })
    participantes: string;

    // A coluna do banco é `cronograma_paralisado`; o alias `cronograma_paralizado` (com z) é o
    // nome de máquina que o CSV sempre teve. Preservado para não quebrar quem consome o arquivo.
    @ReportColumn({ type: 'BOOLEAN', label: 'Cronograma Paralisado' })
    cronograma_paralizado: boolean;

    @ReportColumn({ type: 'DATE', label: 'Prazo de Encaminhamento' })
    prazo_encaminhamento: string | null;

    /** HTML como veio do banco. A versão em texto puro está em `pauta_texto`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Pauta' })
    pauta: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Pauta Texto' })
    pauta_texto: string | null;

    @ReportColumn({ type: 'DATE', label: 'Prazo Realizado' })
    prazo_realizado: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento' })
    detalhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento Texto' })
    detalhamento_texto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Encaminhamento' })
    encaminhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Responsável' })
    responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Observação' })
    observacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Status Detalhado' })
    detalhamento_status: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Pontos de Atenção' })
    pontos_atencao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Pontos de Atenção Texto' })
    pontos_atencao_texto: string | null;

    /** Códigos dos riscos associados ao acompanhamento, concatenados com `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Códigos dos Riscos' })
    riscos: string | null;
}

@ReportRows({
    arquivo: 'contratos.csv',
    fontes: ['Projetos'],
    descricao: 'Uma linha por contrato vinculado aos projetos filtrados.',
})
export class RelProjetosContratosCsvRow {
    // O rótulo é literalmente `contrato_id` — é o único cabeçalho técnico do relatório hoje.
    // Corrigir rótulo entregue ao usuário é decisão de negócio, então fica como está.
    @ReportColumn({ type: 'INTEGER', label: 'contrato_id', format: { raw: true }, customizavel: false })
    contrato_id: number;

    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Número' })
    numero: string;

    @ReportColumn({ type: 'BOOLEAN', label: 'Exclusivo' })
    exclusivo: boolean;

    /** Valor cru do enum `StatusContrato`. */
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

    @ReportColumn({ type: 'INTEGER', label: 'Prazo', format: { raw: true } })
    prazo: number | null;

    /** Valor cru do enum `ContratoPrazoUnidade` (`Dias`, `Meses`, ...). */
    @ReportColumn({ type: 'VARCHAR', label: 'Unidade Prazo' })
    unidade_prazo: string | null;

    /** `mes/ano` montado no SQL — texto, não data. */
    @ReportColumn({ type: 'VARCHAR', label: 'Data-base' })
    data_base: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data Início' })
    data_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data Término' })
    data_termino: string | null;

    /** Maior `data_termino_atualizada` entre os aditivos do contrato. */
    @ReportColumn({ type: 'DATE', label: 'Data Término Atualizada' })
    data_termino_atualizada: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor', format: { currency: 'R$', decimalPlaces: 2 } })
    valor: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Observações' })
    observacoes: string | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Valor Contrato Atualizado',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    valor_contrato_atualizado: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Total Aditivos', format: { currency: 'R$', decimalPlaces: 2 } })
    total_aditivos: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Total Reajustes', format: { currency: 'R$', decimalPlaces: 2 } })
    total_reajustes: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Modalidade de Licitação - ID', format: { raw: true } })
    modalidade_licitacao__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Modalidade de Licitação - Nome' })
    modalidade_licitacao__nome: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Área Gestora - ID', format: { raw: true } })
    area_gestora__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Área Gestora - Sigla' })
    area_gestora__sigla: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Área Gestora - Descrição' })
    area_gestora__descricao: string | null;

    /** Maior `percentual_medido` entre os aditivos. `Decimal(7,4)` no banco. */
    @ReportColumn({ type: 'DECIMAL(18,4)', label: 'Máximo % Execução', format: { decimalPlaces: 4 } })
    percentual_medido: string | null;

    /** Processos SEI já formatados por `format_proc_sei_sinproc`, concatenados com `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Processos SEI' })
    processos_sei: string | null;

    /** Códigos SOF das fontes de recurso do contrato, concatenados com `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Fontes de Recurso' })
    fontes_recurso: string | null;

    /** Já formatado por `f_formata_cnpj` — limpeza/máscara de domínio, feita no SQL. */
    @ReportColumn({ type: 'VARCHAR', label: 'CNPJ Contratada' })
    cnpj_contratada: string | null;
}

@ReportRows({
    arquivo: 'aditivos.csv',
    fontes: ['Projetos'],
    descricao: 'Uma linha por aditivo/reajuste dos contratos dos projetos filtrados.',
})
export class RelProjetosAditivosCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID Aditivo', format: { raw: true }, customizavel: false })
    aditivo_id: number;

    /** Chave de conciliação com `contratos.csv`. */
    @ReportColumn({ type: 'INTEGER', label: 'ID Contrato', format: { raw: true }, customizavel: false })
    contrato_id: number;

    /** `Aditivo` ou `Reajuste`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Categoria' })
    tipo_categoria: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Tipo Aditivo' })
    tipo__nome: string;

    @ReportColumn({ type: 'DATE', label: 'Data' })
    data: string | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor', format: { currency: 'R$', decimalPlaces: 2 } })
    valor: string | null;

    /** `Decimal(7,4)` no banco. O rótulo já traz o `%`, então não há `unit`. */
    @ReportColumn({ type: 'DECIMAL(18,4)', label: '% Execução', format: { decimalPlaces: 4 } })
    percentual_medido: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data Término Atual' })
    data_termino_atual: string | null;
}

@ReportRows({
    arquivo: 'origens.csv',
    fontes: ['Projetos'],
    descricao: 'Uma linha por origem (meta/iniciativa/atividade de PDM) vinculada ao projeto.',
})
export class RelProjetosOrigensCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'INTEGER', label: 'ID PDM', format: { raw: true } })
    pdm_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título do PDM' })
    pdm_titulo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Meta', format: { raw: true } })
    meta_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Meta' })
    meta_titulo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Iniciativa', format: { raw: true } })
    iniciativa_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Iniciativa' })
    iniciativa_titulo: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID Atividade', format: { raw: true } })
    atividade_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Atividade' })
    atividade_titulo: string | null;
}

@ReportRows({
    arquivo: 'arquivos.csv',
    fontes: ['Projetos'],
    descricao: 'Uma linha por documento anexado aos projetos filtrados.',
})
export class RelProjetosArquivosCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código do Projeto' })
    projeto_codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome Original' })
    nome_original: string;

    /**
     * `projeto_documento.criado_em` é `timestamptz` — única coluna do relatório com hora,
     * daí `TIMESTAMP` em vez de `DATE`.
     */
    @ReportColumn({ type: 'TIMESTAMP', label: 'Criado em' })
    criado_em: string;

    @ReportColumn({ type: 'INTEGER', label: 'Criador (ID)', format: { raw: true } })
    criador_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Criador (Nome de Exibição)' })
    criador_nome_exibicao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Caminho no Object Storage' })
    caminho: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição do Documento' })
    descricao: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'ID do Arquivo', format: { raw: true }, customizavel: false })
    arquivo_id: number;
}

/**
 * Os rótulos deste arquivo são caminhos do GeoJSON de origem (`geojson.properties.cep`, ...).
 * São técnicos, mas é o que o relatório entrega hoje — mantidos byte-a-byte. Os nomes de
 * máquina continuam sendo os campos planos do DTO (`cep`, `rua`, ...), sem ponto.
 */
@ReportRows({
    arquivo: 'geoloc.csv',
    fontes: ['Projetos'],
    descricao: 'Uma linha por endereço/geolocalização vinculada aos projetos filtrados.',
})
export class RelProjetosGeolocCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Endereço' })
    endereco: string;

    /** Regiões de nível 2 do endereço, concatenadas com `|`. */
    @ReportColumn({ type: 'VARCHAR', label: 'Zona' })
    zona: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Distrito' })
    distrito: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Subprefeitura' })
    subprefeitura: string | null;

    /** `latitude,longitude` — texto, para não perder o par ao abrir na planilha. */
    @ReportColumn({ type: 'VARCHAR', label: 'geojson.geometry.coordinates' })
    coordinates: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.type' })
    geojson_type: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.geometry.type' })
    geometry_type: string | null;

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

    @ReportColumn({ type: 'VARCHAR', label: 'geojson.bbox' })
    bbox: string | null;
}

@ReportRows({
    arquivo: 'termos_encerramento.csv',
    fontes: ['Projetos'],
    descricao: 'Uma linha por termo de encerramento (última versão) dos projetos filtrados.',
})
export class RelProjetosTermoEncerramentoCsvRow {
    @ReportColumn({ type: 'INTEGER', label: 'ID Projeto', format: { raw: true }, customizavel: false })
    projeto_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código do Projeto' })
    projeto_codigo: string | null;

    /** Snapshot: o termo congela os dados do projeto no momento do encerramento. */
    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Projeto' })
    nome_projeto: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Órgão Responsável' })
    orgao_responsavel_nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Portfólios' })
    portfolios_nomes: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto' })
    objeto: string;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Início' })
    previsao_inicio: string | null;

    @ReportColumn({ type: 'DATE', label: 'Previsão de Término' })
    previsao_termino: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Início Real' })
    data_inicio_real: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Término Real' })
    data_termino_real: string | null;

    @ReportColumn({ type: 'DOUBLE', label: 'Previsão de Custo', format: { currency: 'R$', decimalPlaces: 2 } })
    previsao_custo: number | null;

    @ReportColumn({ type: 'DOUBLE', label: 'Valor Executado Total', format: { currency: 'R$', decimalPlaces: 2 } })
    valor_executado_total: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Status Final' })
    status_final: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Etapa' })
    etapa_nome: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Justificativa' })
    justificativa: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Justificativa Complemento' })
    justificativa_complemento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Responsável pelo Encerramento' })
    responsavel_encerramento_nome: string;

    @ReportColumn({ type: 'DATE', label: 'Data de Encerramento' })
    data_encerramento: string;
}

const PPProjetosFlatten = flatten({ objects: true, arrays: false, separator: '__' });

/**
 * Normaliza `Date` para ISO `YYYY-MM-DD` nas colunas declaradas como `DATE`.
 *
 * Parte da extração devolve o `Date` do Prisma direto (contratos, aditivos, riscos, aprovação
 * e revisão do projeto), e o json2csv serializa `Date` via `JSON.stringify` — sai
 * `2024-03-05T00:00:00.000Z`. O `read_csv` tipado do DuckDB hoje aceita esse formato numa coluna
 * `DATE` (truncando a hora), mas depender disso é frágil: o contrato do CSV bruto é data em ISO
 * curto, então é aqui que ele é cumprido.
 *
 * Feito no caminho do CSV, guiado pelo tipo do schema, e **não** nos conversores: os DTOs de
 * `asJSON` são resposta da API (`POST /relatorio/projetos`) e trocar `Date` por `string` lá
 * mudaria o contrato para outros consumidores.
 *
 * Colunas `TIMESTAMP` (só `arquivos.criado_em`) ficam como estão — ali a hora é o dado.
 */
function normalizarDatasDoSchema(schema: ReportFileSchema) {
    const colunasData = new Set(schema.colunas.filter((c) => c.type === 'DATE').map((c) => c.name));

    return (row: Record<string, any>): Record<string, any> => {
        for (const nome of colunasData) {
            const valor = row[nome];
            if (valor instanceof Date) row[nome] = Date2YMD.toString(valor);
        }
        return row;
    };
}

/**
 * O CSV bruto usa `__` como separador do aninhamento (`orgao_responsavel`, `fonte_recurso`,
 * `premissa`, `modalidade_licitacao`, ...) porque o builder DuckDB trata `.` como referência
 * qualificada por fonte — `fonte_recurso.id` seria lido como "coluna id da fonte fonte_recurso".
 *
 * `arrays: false` (padrão do json2csv) é deliberado: com `arrays: true` um campo de lista viraria
 * N colunas, e o conjunto de colunas do arquivo deixaria de ser fixo. Nenhum DTO deste relatório
 * expõe array hoje, mas o schema declarado precisa continuar valendo se algum passar a expor.
 *
 * A normalização de datas roda **depois** do flatten, porque só aí as chaves aninhadas existem
 * com o nome que o schema declara.
 */
export function ppProjetosTransforms(schema: ReportFileSchema): CsvTransforms {
    return [PPProjetosFlatten, normalizarDatasDoSchema(schema)];
}
