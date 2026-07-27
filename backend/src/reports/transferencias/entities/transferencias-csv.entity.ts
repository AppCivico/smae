import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';
import { TipoRelatorioTransferencia } from '../dto/create-transferencias.dto';

/**
 * Colunas do CSV **bruto** de `transferencias.csv`.
 *
 * A ordem de declaração é a ordem das colunas no arquivo bruto e também a ordem padrão
 * quando nenhum modelo é aplicado. Os nomes usam `__` no lugar de `.` para o aninhamento
 * (`distribuicao_recurso`, `orgao_concedente`) porque o builder DuckDB interpreta ponto
 * como referência qualificada por fonte.
 *
 * Regra geral: valores aqui são "compute store" — números como números, datas em ISO
 * (`YYYY-MM-DD`), sem máscara de moeda e sem o hack `="valor"`. Moeda, separador decimal,
 * `dd/mm/aaaa` e o guard de texto do Excel são aplicados na etapa de pós-processamento.
 *
 * Booleanos que o negócio exibe como `Sim`/`Não` continuam sendo traduzidos na extração:
 * é tradução de domínio (e não formatação de locale), então permanece `VARCHAR`.
 */
@ReportRows({
    arquivo: 'transferencias.csv',
    fontes: ['Transferencias'],
    descricao: 'Uma linha por distribuição de recurso da transferência (ou por transferência, sem distribuição).',
})
export class RelTransferenciasCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID', format: { raw: true }, customizavel: false })
    id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Identificador' })
    identificador: string;

    @ReportColumn({ type: 'INTEGER', label: 'Ano', format: { raw: true } })
    ano: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto', format: { excelTextGuard: true } })
    objeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento', format: { excelTextGuard: true } })
    detalhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Clausula Suspensiva' })
    clausula_suspensiva: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de vencimento da Suspensiva' })
    clausula_suspensiva_vencimento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Normativa', format: { excelTextGuard: true } })
    normativa: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Observações', format: { excelTextGuard: true } })
    observacoes: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome Programa / Portfólio', format: { excelTextGuard: true } })
    nome_programa: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Empenho' })
    empenho: string | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Valor do Repasse',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    valor: number | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor Total', format: { currency: 'R$', decimalPlaces: 2 } })
    valor_total: number | null;

    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Contrapartida', format: { currency: 'R$', decimalPlaces: 2 } })
    valor_contrapartida: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Emenda', format: { excelTextGuard: true } })
    emenda: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Dotação Orçamentária', format: { excelTextGuard: true } })
    dotacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Número da Demanda/Proposta', format: { excelTextGuard: true } })
    demanda: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Banco da Secretaria fim', format: { excelTextGuard: true } })
    banco_fim: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Número da Secretaria fim', format: { excelTextGuard: true } })
    conta_fim: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Agência da Secretaria fim', format: { excelTextGuard: true } })
    agencia_fim: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Banco do aceite', format: { excelTextGuard: true } })
    banco_aceite: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Agência do aceite', format: { excelTextGuard: true } })
    agencia_aceite: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Número do aceite', format: { excelTextGuard: true } })
    conta_aceite: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Emenda Unitária', format: { excelTextGuard: true } })
    emenda_unitaria: string | null;

    @ReportColumn({
        type: 'VARCHAR',
        label: 'Gestor Municipal do Contrato (secretaria)',
        format: { excelTextGuard: true },
    })
    distribuicao_recurso__orgao_gestor_descricao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Ordenador de despesas', format: { excelTextGuard: true } })
    ordenador_despesa: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Secretaria do órgão concedente', format: { excelTextGuard: true } })
    secretaria_concedente: string | null;

    @ReportColumn({
        type: 'VARCHAR',
        label: 'Plano de Ação',
        descricao: 'Código do detalhamento do uso dos repasses parlamentares nas transferências especiais.',
        format: { excelTextGuard: true },
    })
    plano_de_acao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Interface' })
    interface: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Esfera' })
    esfera: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Parlamentares', format: { excelTextGuard: true } })
    parlamentares_info: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Orgão Concedente' })
    orgao_concedente__descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID Distribuição de Recurso', format: { raw: true }, customizavel: false })
    distribuicao_recurso__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Gestor Municipal (servidor)', format: { excelTextGuard: true } })
    distribuicao_recurso__nome_responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto detalhado', format: { excelTextGuard: true } })
    distribuicao_recurso__objeto: string | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Distribuição - Valor do Repasse',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    distribuicao_recurso__valor: number | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Distribuição - Valor Total',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    distribuicao_recurso__valor_total: number | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Distribuição - Valor da Contrapartida',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    distribuicao_recurso__valor_contrapartida: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Distribuição - Empenho' })
    distribuicao_recurso__empenho: string | null;

    @ReportColumn({
        type: 'VARCHAR',
        label: 'Programa Orçamentário Estadual ou Federal',
        format: { excelTextGuard: true },
    })
    distribuicao_recurso__programa_orcamentario_estadual: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Programa Orçamentário Municipal', format: { excelTextGuard: true } })
    distribuicao_recurso__programa_orcamentario_municipal: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Dotação orçamentária', format: { excelTextGuard: true } })
    distribuicao_recurso__dotacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'N° Proposta', format: { excelTextGuard: true } })
    distribuicao_recurso__proposta: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nº do Contrato', format: { excelTextGuard: true } })
    distribuicao_recurso__contrato: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nº do Convênio/Pré Convênio', format: { excelTextGuard: true } })
    distribuicao_recurso__convenio: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de assinatura do termo de aceite' })
    distribuicao_recurso__assinatura_termo_aceite: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de assinatura do representante do Município' })
    distribuicao_recurso__assinatura_municipio: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de assinatura do representante do Estado' })
    distribuicao_recurso__assinatura_estado: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de início da vigência' })
    distribuicao_recurso__vigencia: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de conclusão da Suspensiva' })
    distribuicao_recurso__conclusao_suspensiva: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nº SEI' })
    distribuicao_recurso__registro_sei: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Status da Demanda' })
    distribuicao_recurso__status_nome_base: string | null;

    @ReportColumn({ type: 'DOUBLE', label: 'Custeio/Corrente (%)', format: { decimalPlaces: 2, unit: '%' } })
    distribuicao_recurso__pct_custeio: number | null;

    @ReportColumn({ type: 'DOUBLE', label: 'Investimento/Capital (%)', format: { decimalPlaces: 2, unit: '%' } })
    distribuicao_recurso__pct_investimento: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Distribuição - Banco', format: { excelTextGuard: true } })
    distribuicao_recurso__banco: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Distribuição - Agência', format: { excelTextGuard: true } })
    distribuicao_recurso__agencia: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Distribuição - Conta Corrente', format: { excelTextGuard: true } })
    distribuicao_recurso__conta: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Distribuição - Gestor da Conta', format: { excelTextGuard: true } })
    distribuicao_recurso__gestor_conta: string | null;

    // --- Colunas abaixo não estavam em nenhuma das saídas antigas, mas já eram extraídas.
    // Como o CSV bruto agora é o "compute store", elas ficam disponíveis para os modelos
    // (nenhum modelo padrão as seleciona, então nada muda para quem baixa o relatório).

    // Label idêntico ao de `orgao_concedente__descricao`: no relatório resumido esta era a
    // coluna rotulada 'Orgão Concedente'. Os dois nunca aparecem juntos nas seleções padrão.
    @ReportColumn({ type: 'VARCHAR', label: 'Orgão Concedente' })
    orgao_concedente__sigla: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Orgão Concedente', format: { raw: true } })
    orgao_concedente__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Programa', format: { excelTextGuard: true } })
    programa: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Pendente preenchimento de valores' })
    pendente_preenchimento_valores: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Gestor do Contrato', format: { excelTextGuard: true } })
    gestor_contrato: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Número de Identificação', format: { excelTextGuard: true } })
    numero_identificacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Tipo de Transferência', format: { excelTextGuard: true } })
    tipo_transferencia: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Classificação', format: { excelTextGuard: true } })
    classificacao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Transferência (Distribuição)', format: { raw: true } })
    distribuicao_recurso__transferencia_id: number | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Órgão Gestor (Distribuição)', format: { raw: true } })
    distribuicao_recurso__orgao_gestor_id: number | null;
}

/**
 * Colunas do CSV bruto de `cronograma.csv`.
 */
@ReportRows({
    arquivo: 'cronograma.csv',
    fontes: ['Transferencias'],
    descricao: 'Linhas do cronograma (tarefas) das transferências filtradas.',
})
export class RelTransferenciaCronogramaCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID da Transferência', format: { raw: true }, customizavel: false })
    transferencia_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Hierarquia', format: { excelTextGuard: true } })
    hierarquia: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Tarefa' })
    tarefa: string;

    @ReportColumn({ type: 'DATE', label: 'Início Planejado' })
    inicio_planejado: string | null;

    @ReportColumn({ type: 'DATE', label: 'Término Planejado' })
    termino_planejado: string | null;

    @ReportColumn({
        type: 'DECIMAL(18,2)',
        label: 'Custo Estimado',
        format: { currency: 'R$', decimalPlaces: 2 },
    })
    custo_estimado: number | null;

    @ReportColumn({ type: 'INTEGER', label: 'Duração Planejada', format: { raw: true } })
    duracao_planejado: number | null;
}

/**
 * Seleção padrão de colunas de `transferencias.csv` por tipo de relatório.
 *
 * Antes, `dados.tipo` decidia quais colunas eram *escritas* no CSV. Agora o CSV bruto
 * sempre carrega o conjunto completo (é o compute store do pós-processamento), então o
 * recorte histórico de cada tipo passa a ser apenas uma seleção/ordem padrão de colunas —
 * equivalente ao que um modelo faria via `arquivos[].colunas`.
 */
export const COLUNAS_PADRAO_TRANSFERENCIAS_POR_TIPO: Record<TipoRelatorioTransferencia, string[]> = {
    [TipoRelatorioTransferencia.Geral]: [
        'id',
        'identificador',
        'ano',
        'objeto',
        'detalhamento',
        'clausula_suspensiva',
        'clausula_suspensiva_vencimento',
        'normativa',
        'observacoes',
        'nome_programa',
        'empenho',
        'valor',
        'valor_total',
        'valor_contrapartida',
        'emenda',
        'dotacao',
        'demanda',
        'banco_fim',
        'conta_fim',
        'agencia_fim',
        'banco_aceite',
        'agencia_aceite',
        'conta_aceite',
        'emenda_unitaria',
        'distribuicao_recurso__orgao_gestor_descricao',
        'ordenador_despesa',
        'secretaria_concedente',
        'plano_de_acao',
        'interface',
        'esfera',
        'parlamentares_info',
        'orgao_concedente__descricao',
        'distribuicao_recurso__id',
        'distribuicao_recurso__nome_responsavel',
        'distribuicao_recurso__objeto',
        'distribuicao_recurso__valor',
        'distribuicao_recurso__valor_total',
        'distribuicao_recurso__valor_contrapartida',
        'distribuicao_recurso__empenho',
        'distribuicao_recurso__programa_orcamentario_estadual',
        'distribuicao_recurso__programa_orcamentario_municipal',
        'distribuicao_recurso__dotacao',
        'distribuicao_recurso__proposta',
        'distribuicao_recurso__contrato',
        'distribuicao_recurso__convenio',
        'distribuicao_recurso__assinatura_termo_aceite',
        'distribuicao_recurso__assinatura_municipio',
        'distribuicao_recurso__assinatura_estado',
        'distribuicao_recurso__vigencia',
        'distribuicao_recurso__conclusao_suspensiva',
        'distribuicao_recurso__registro_sei',
        'distribuicao_recurso__status_nome_base',
        'distribuicao_recurso__pct_custeio',
        'distribuicao_recurso__pct_investimento',
        'distribuicao_recurso__banco',
        'distribuicao_recurso__agencia',
        'distribuicao_recurso__conta',
        'distribuicao_recurso__gestor_conta',
    ],
    [TipoRelatorioTransferencia.Resumido]: [
        'identificador',
        'ano',
        'objeto',
        'parlamentares_info',
        'valor',
        'valor_total',
        // No relatório resumido o Orgão Concedente sempre foi exibido pela sigla.
        'orgao_concedente__sigla',
        'distribuicao_recurso__orgao_gestor_descricao',
        'distribuicao_recurso__status_nome_base',
        'id',
    ],
};

/** Colunas padrão (nome + ordem) de `transferencias.csv` para um tipo de relatório. */
export function colunasPadraoTransferencias(tipo: TipoRelatorioTransferencia): string[] {
    return COLUNAS_PADRAO_TRANSFERENCIAS_POR_TIPO[tipo] ?? COLUNAS_PADRAO_TRANSFERENCIAS_POR_TIPO.Geral;
}
