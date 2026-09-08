import { copiarColunas, ReportColumn, ReportRows } from '../../post-process/report-column.decorator';
import { TipoRelatorioTransferencia } from '../dto/create-transferencias.dto';

/**
 * Colunas do CSV **bruto** de `transferencias_e_distribuicao.csv` — o conjunto completo.
 *
 * Granularidade: **uma linha por distribuição de recurso**. Uma transferência com N
 * distribuições ocupa N linhas, e o que diferencia essas linhas são só as colunas
 * `distribuicao_recurso__*`. Quem não quer esse detalhamento tem `transferencias.csv`, com uma
 * linha por transferência — ver `RelTransferenciasCsvRow`, logo abaixo.
 *
 * O arquivo já se chamou `transferencias.csv`, o que fazia quem selecionava só colunas de
 * transferência ler as N linhas repetidas como duplicação do relatório. O nome composto é o
 * aviso: aqui é o produto das duas entidades.
 *
 * A ordem de declaração é a ordem das colunas no arquivo bruto e também a ordem padrão
 * quando nenhum modelo é aplicado. Os nomes usam `__` no lugar de `.` para o aninhamento
 * (`distribuicao_recurso`, `orgao_concedente`) porque o builder DuckDB interpreta ponto
 * como referência qualificada por fonte.
 *
 * Regra geral: valores aqui são "compute store" — números como números, datas em ISO
 * (`YYYY-MM-DD`), sem máscara de moeda e sem o hack `="valor"`. Moeda, separador decimal,
 * `dd/mm/aaaa` são aplicados na etapa de pós-processamento.
 *
 * Booleanos que o negócio exibe como `Sim`/`Não` continuam sendo traduzidos na extração:
 * é tradução de domínio (e não formatação de locale), então permanece `VARCHAR`.
 */
@ReportRows({
    arquivo: 'transferencias_e_distribuicao.csv',
    fontes: ['Transferencias'],
    descricao:
        'Uma linha por distribuição de recurso da transferência (ou por transferência, quando não há distribuição).',
})
export class RelTransferenciasEDistribuicaoCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID', format: { raw: true } })
    id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Identificador' })
    identificador: string;

    @ReportColumn({ type: 'INTEGER', label: 'Ano', format: { raw: true } })
    ano: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto' })
    objeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Detalhamento' })
    detalhamento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Clausula Suspensiva' })
    clausula_suspensiva: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de vencimento da Suspensiva' })
    clausula_suspensiva_vencimento: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Normativa' })
    normativa: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Observações' })
    observacoes: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome Programa / Portfólio' })
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

    @ReportColumn({ type: 'VARCHAR', label: 'Emenda' })
    emenda: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Dotação Orçamentária' })
    dotacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Número da Demanda/Proposta' })
    demanda: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Banco da Secretaria fim' })
    banco_fim: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Número da Secretaria fim' })
    conta_fim: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Agência da Secretaria fim' })
    agencia_fim: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Banco do aceite' })
    banco_aceite: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Agência do aceite' })
    agencia_aceite: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conta - Número do aceite' })
    conta_aceite: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Emenda Unitária' })
    emenda_unitaria: string | null;

    @ReportColumn({
        type: 'VARCHAR',
        label: 'Gestor Municipal do Contrato (secretaria)',
    })
    distribuicao_recurso__orgao_gestor_descricao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Ordenador de despesas' })
    ordenador_despesa: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Secretaria do órgão concedente' })
    secretaria_concedente: string | null;

    @ReportColumn({
        type: 'VARCHAR',
        label: 'Plano de Ação',
        descricao: 'Código do detalhamento do uso dos repasses parlamentares nas transferências especiais.',
    })
    plano_de_acao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Interface' })
    interface: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Esfera' })
    esfera: string;

    @ReportColumn({
        type: 'VARCHAR',
        label: 'Status',
        descricao: 'Situação da transferência: "Cancelada" quando cancelada, senão "Ativa".',
    })
    status: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Parlamentares' })
    parlamentares_info: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Orgão Concedente' })
    orgao_concedente__descricao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID Distribuição de Recurso', format: { raw: true } })
    distribuicao_recurso__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Gestor Municipal (servidor)' })
    distribuicao_recurso__nome_responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Objeto detalhado' })
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
    })
    distribuicao_recurso__programa_orcamentario_estadual: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Programa Orçamentário Municipal' })
    distribuicao_recurso__programa_orcamentario_municipal: string | null;

    // Colidia com `dotacao` ('Dotação Orçamentária') — só diferiam na caixa, e a saída vinha
    // como 'Dotação orçamentária_1'. Segue o prefixo 'Distribuição - ' já usado nas irmãs.
    @ReportColumn({ type: 'VARCHAR', label: 'Distribuição - Dotação Orçamentária' })
    distribuicao_recurso__dotacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'N° Proposta' })
    distribuicao_recurso__proposta: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Número do Instrumento' })
    distribuicao_recurso__contrato: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nº do Convênio/Pré Convênio' })
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

    @ReportColumn({ type: 'VARCHAR', label: 'Distribuição - Banco' })
    distribuicao_recurso__banco: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Distribuição - Agência' })
    distribuicao_recurso__agencia: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Distribuição - Conta Corrente' })
    distribuicao_recurso__conta: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Distribuição - Gestor da Conta' })
    distribuicao_recurso__gestor_conta: string | null;

    // --- Colunas abaixo não estavam em nenhuma das saídas antigas, mas já eram extraídas.
    // Como o CSV bruto agora é o "compute store", elas ficam disponíveis para os modelos
    // (nenhum modelo padrão as seleciona, então nada muda para quem baixa o relatório).

    // No relatório resumido esta era a coluna rotulada 'Orgão Concedente' — mesmo label de
    // `orgao_concedente__descricao`. A suposição de que "os dois nunca aparecem juntos" não se
    // sustenta: o modelo padrão seleciona TODAS as colunas do schema, então os dois saíam no
    // mesmo CSV e o DuckDB desambiguava sozinho, entregando 'Orgão Concedente_1' ao usuário.
    @ReportColumn({ type: 'VARCHAR', label: 'Sigla do Orgão Concedente' })
    orgao_concedente__sigla: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Orgão Concedente', format: { raw: true } })
    orgao_concedente__id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Programa' })
    programa: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Pendente preenchimento de valores' })
    pendente_preenchimento_valores: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Gestor do Contrato' })
    gestor_contrato: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Número de Identificação' })
    numero_identificacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Tipo de Transferência' })
    tipo_transferencia: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Classificação' })
    classificacao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Transferência (Distribuição)', format: { raw: true } })
    distribuicao_recurso__transferencia_id: number | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Órgão Gestor (Distribuição)', format: { raw: true } })
    distribuicao_recurso__orgao_gestor_id: number | null;
}

/**
 * Prefixo das colunas que vêm da **distribuição de recurso**, e não da transferência. É o que
 * separa as duas granularidades do relatório — ver `RelTransferenciasCsvRow`.
 */
export const PREFIXO_COLUNA_DISTRIBUICAO = 'distribuicao_recurso__';

/** A coluna pertence à transferência (e não à distribuição de recurso)? */
export function ehColunaDeTransferencia(nome: string): boolean {
    return !nome.startsWith(PREFIXO_COLUNA_DISTRIBUICAO);
}

/**
 * Colunas do CSV bruto de `transferencias.csv`: as mesmas de
 * `transferencias_e_distribuicao.csv`, menos tudo que vem da distribuição de recurso.
 *
 * É **uma linha por transferência**, e é o arquivo que responde à pergunta mais comum do
 * relatório ("quais transferências, com que valores"). O arquivo com as duas entidades continua
 * existindo ao lado, para quem precisa do detalhamento por distribuição.
 *
 * A separação existe porque uma transferência com N distribuições ocupa N linhas no arquivo
 * completo, e o que diferencia essas linhas são justamente as colunas `distribuicao_recurso__*`.
 * Quem montava um modelo só com colunas de transferência lia aquilo como se o relatório
 * estivesse duplicando registros.
 *
 * Deduplicar o arquivo completo com `DISTINCT` não era opção: destruiria o detalhamento por
 * distribuição, que é o motivo de ele existir. A resposta é entregar as duas granularidades
 * lado a lado e deixar a escolha para quem abre o zip.
 *
 * As colunas são copiadas de `RelTransferenciasEDistribuicaoCsvRow` (mesma ordem, rótulo, tipo
 * e formatação) em vez de redeclaradas: são o mesmo dado, e duas listas manuais divergiriam.
 */
@ReportRows({
    arquivo: 'transferencias.csv',
    fontes: ['Transferencias'],
    descricao:
        'Uma linha por transferência, sem as colunas de distribuição de recurso — ' +
        'o mesmo conteúdo de transferencias_e_distribuicao.csv sem as linhas repetidas por distribuição.',
})
export class RelTransferenciasCsvRow {}

copiarColunas(RelTransferenciasEDistribuicaoCsvRow, RelTransferenciasCsvRow, ehColunaDeTransferencia);

/**
 * As linhas de `transferencias.csv` a partir das de `transferencias_e_distribuicao.csv`:
 * uma por transferência.
 *
 * A consulta do relatório é `transferencia LEFT JOIN distribuicao_recurso`, então a mesma
 * transferência volta repetida quando tem mais de uma distribuição. As colunas de transferência
 * são iguais em todas essas repetições — vêm de `t.*`, dos agregados por `t.id` e do órgão
 * concedente —, então ficar com a primeira ocorrência não escolhe entre valores divergentes,
 * só descarta cópias.
 *
 * Deduplicar por `id` (e não pela tupla de colunas emitidas) é o que garante uma linha por
 * transferência mesmo que alguma coluna de transferência venha a divergir por distribuição
 * no futuro.
 *
 * Mora aqui, junto da classe de linha, por ser a outra metade da mesma decisão: qual recorte de
 * colunas e qual granularidade. Genérica em `T` para não arrastar o DTO da extração (e, com ele,
 * o módulo do Prisma) para dentro do arquivo de schema.
 */
export function linhasPorTransferencia<T extends { id: number }>(linhas: T[]): T[] {
    const vistas = new Set<number>();
    const out: T[] = [];

    for (const linha of linhas) {
        if (vistas.has(linha.id)) continue;
        vistas.add(linha.id);
        out.push(linha);
    }

    return out;
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
    @ReportColumn({ type: 'BIGINT', label: 'ID da Transferência', format: { raw: true } })
    transferencia_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Hierarquia' })
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
 * Seleção padrão de colunas de `transferencias_e_distribuicao.csv` por tipo de relatório.
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
        'status',
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
        'status',
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

/** Colunas padrão (nome + ordem) de `transferencias_e_distribuicao.csv` para um tipo de relatório. */
export function colunasPadraoTransferencias(tipo: TipoRelatorioTransferencia): string[] {
    return COLUNAS_PADRAO_TRANSFERENCIAS_POR_TIPO[tipo] ?? COLUNAS_PADRAO_TRANSFERENCIAS_POR_TIPO.Geral;
}
