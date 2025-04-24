import { DateTime } from 'luxon';
import { UpdateOperacaoDto } from '../../task/run_update/dto/create-run-update.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { OperacaoProcessadaDto, OperacaoProcessadaItemDto } from '../dto/atualizacao-em-lote.dto';
import { ProjetoStatus, TipoAtualizacaoEmLote } from '@prisma/client';
import { FormatCurrency } from '../../common/format-currency';

// Mapeia nomes de colunas para rótulos legíveis por humanos com cobertura abrangente de todos os campos
const COLUMN_LABELS: Record<string, string> = {
    // Campos comuns do Projeto
    titulo: 'Título',
    nome: 'Nome',
    descricao: 'Descrição',
    codigo: 'Código',
    resumo: 'Resumo',
    objeto: 'Objeto',
    objetivo: 'Objetivo',
    publico_alvo: 'Público Alvo',
    previsao_inicio: 'Data de Início',
    previsao_termino: 'Data de Fim',
    previsao_custo: 'Previsão de Custo',
    previsao_duracao: 'Previsão de Duração',
    principais_etapas: 'Principais Etapas',
    nao_escopo: 'Não Escopo',

    // Status e etapas
    status: 'Status',
    status_id: 'Status',
    projeto_etapa_id: 'Etapa',

    // Organização
    orgao_responsavel_id: 'Órgão Responsável',
    responsavel_id: 'Responsável',
    orgao_gestor_id: 'Órgão Gestor',
    orgao_origem_id: 'Órgão de Origem',
    orgao_executor_id: 'Órgão Executor',

    // Campos de gestão
    secretario_executivo: 'Secretário Executivo',
    secretario_responsavel: 'Secretário Responsável',
    secretario_colaborador: 'Secretário Colaborador',
    coordenador_ue: 'Coordenador UE',

    // Versão e datas
    versao: 'Versão',
    data_aprovacao: 'Data de Aprovação',
    data_revisao: 'Data de Revisão',

    // MDO específicos
    grupo_tematico_id: 'Grupo Temático',
    tipo_intervencao_id: 'Tipo de Intervenção',
    equipamento_id: 'Equipamento',
    empreendimento_id: 'Empreendimento',
    modalidade_contratacao_id: 'Modalidade de Contratação',
    programa_id: 'Programa',

    // MDO detalhes
    mdo_detalhamento: 'Detalhamento',
    mdo_programa_habitacional: 'Programa Habitacional',
    mdo_n_unidades_habitacionais: 'N° Unidades Habitacionais',
    mdo_n_familias_beneficiadas: 'N° Famílias Beneficiadas',
    mdo_n_unidades_atendidas: 'N° Unidades Atendidas',
    mdo_previsao_inauguracao: 'Previsão de Inauguração',
    mdo_observacoes: 'Observações',

    // Campos de localização
    regiao_id: 'Região',
    logradouro_tipo: 'Tipo de Logradouro',
    logradouro_nome: 'Nome do Logradouro',
    logradouro_numero: 'Número',
    logradouro_cep: 'CEP',

    // Arrays e referências
    tags: 'Tags',
    colaboradores_no_orgao: 'Colaboradores no Órgão',
    responsaveis_no_orgao_gestor: 'Responsáveis no Órgão Gestor',
    orgaos_participantes: 'Órgãos Participantes',

    // Atributos de controle
    eh_prioritario: 'É Prioritário',
    arquivado: 'Arquivado',
    tolerancia_atraso: 'Tolerância de Atraso',

    portfolios_compartilhados: 'Portfólios Compartilhados',
};

// Formata valores para exibição com tratamento avançado de tipos
async function formatValueForDisplay(
    prisma: PrismaService,
    colName: string,
    value: any,
    tipo: TipoAtualizacaoEmLote
): Promise<string> {
    if (value === null || value === undefined) return 'Não definido';

    // Formata datas
    if (colName.includes('data_') || (colName.includes('previsao_') && value instanceof Date)) {
        return DateTime.fromJSDate(value).toFormat('dd/MM/yyyy');
    }

    // Trata valores booleanos
    if (typeof value === 'boolean') {
        return value ? 'Sim' : 'Não';
    }

    // Formata valores monetários
    if (colName === 'previsao_custo' || colName === 'realizado_custo') {
        const fc = new FormatCurrency();
        return fc.toString(value);
    }

    // Trata arrays com formatação especial
    if (Array.isArray(value)) {
        if (colName === 'tags') {
            try {
                const tags = await prisma.projetoTag.findMany({
                    where: { id: { in: value }, tipo_projeto: tipo === 'ProjetoPP' ? 'PP' : 'MDO' },
                    select: { descricao: true },
                });
                return tags.map((t) => t.descricao).join(', ');
            } catch (error) {
                // Tratamento de fallback em caso de erro na consulta
                return value.join(', ');
            }
        } else if (colName === 'colaboradores_no_orgao' || colName === 'responsaveis_no_orgao_gestor') {
            try {
                const pessoas = await prisma.pessoa.findMany({
                    where: { id: { in: value } },
                    select: { nome_exibicao: true },
                });
                return pessoas.map((p) => p.nome_exibicao).join(', ');
            } catch (error) {
                // Fallback seguro para lidar com erros na consulta
                return value.join(', ');
            }
        } else if (colName === 'orgaos_participantes') {
            try {
                const orgaos = await prisma.orgao.findMany({
                    where: { id: { in: value } },
                    select: { sigla: true, descricao: true },
                });
                return orgaos.map((o) => `${o.sigla} - ${o.descricao}`).join(', ');
            } catch (error) {
                // Retorna os IDs originais se a busca falhar
                return value.join(', ');
            }
        } else if (colName === 'portfolios_compartilhados') {
            try {
                const portfolios = await prisma.portfolio.findMany({
                    where: { id: { in: value } },
                    select: { descricao: true },
                });
                return portfolios.map((p) => p.descricao).join(', ');
            } catch (error) {
                // Retorna os IDs originais se a busca falhar
                return value.join(', ');
            }
        }

        return value.join(', ');
    }

    // Busca valores de referência
    switch (colName) {
        case 'status': {
            const statusMap: Record<ProjetoStatus, string> = {
                'Registrado': 'Registrado',
                'Selecionado': 'Selecionado',
                'EmPlanejamento': 'Em Planejamento',
                'Planejado': 'Planejado',
                'Validado': 'Validado',
                'EmAcompanhamento': 'Em Acompanhamento',
                'Suspenso': 'Suspenso',
                'Fechado': 'Concluído',
                'MDO_Concluida': 'Concluída',
                'MDO_EmAndamento': 'Em Andamento',
                'MDO_NaoIniciada': 'Não Iniciada',
                'MDO_Paralisada': 'Paralisada',
            };

            return statusMap[value as ProjetoStatus] || `Status ${value}`;
        }
        case 'projeto_etapa_id':
            try {
                const etapa = await prisma.projetoEtapa.findUnique({
                    where: { id: value },
                    select: { descricao: true },
                });
                return etapa?.descricao || `Etapa ID ${value}`;
            } catch (error) {
                // Valor de fallback seguro
                return `Etapa ID ${value}`;
            }

        case 'orgao_responsavel_id':
        case 'orgao_gestor_id':
        case 'orgao_executor_id':
        case 'orgao_origem_id':
            try {
                const orgao = await prisma.orgao.findUnique({
                    where: { id: value },
                    select: { sigla: true, descricao: true },
                });
                return orgao ? `${orgao.sigla} - ${orgao.descricao}` : `Órgão ID ${value}`;
            } catch (error) {
                // Retorna identificador em caso de falha
                return `Órgão ID ${value}`;
            }

        case 'responsavel_id':
            try {
                const pessoa = await prisma.pessoa.findUnique({
                    where: { id: value },
                    select: { nome_exibicao: true },
                });
                return pessoa?.nome_exibicao || `Pessoa ID ${value}`;
            } catch (error) {
                // Identificador padrão em caso de erro
                return `Pessoa ID ${value}`;
            }

        case 'grupo_tematico_id':
            try {
                const grupo = await prisma.grupoTematico.findUnique({
                    where: { id: value },
                    select: { nome: true },
                });
                return grupo?.nome || `Grupo Temático ID ${value}`;
            } catch (error) {
                return `Grupo Temático ID ${value}`;
            }

        case 'tipo_intervencao_id':
            try {
                const tipo = await prisma.tipoIntervencao.findUnique({
                    where: { id: value },
                    select: { nome: true },
                });
                return tipo?.nome || `Tipo de Intervenção ID ${value}`;
            } catch (error) {
                return `Tipo de Intervenção ID ${value}`;
            }

        case 'equipamento_id':
            try {
                const equipamento = await prisma.equipamento.findUnique({
                    where: { id: value },
                    select: { nome: true },
                });
                return equipamento?.nome || `Equipamento ID ${value}`;
            } catch (error) {
                return `Equipamento ID ${value}`;
            }

        case 'modalidade_contratacao_id':
            try {
                const modalidade = await prisma.modalidadeContratacao.findUnique({
                    where: { id: value },
                    select: { nome: true },
                });
                return modalidade?.nome || `Modalidade ID ${value}`;
            } catch (error) {
                return `Modalidade ID ${value}`;
            }

        case 'programa_id':
            try {
                const programa = await prisma.projetoPrograma.findUnique({
                    where: { id: value },
                    select: { nome: true },
                });
                return programa?.nome || `Programa ID ${value}`;
            } catch (error) {
                return `Programa ID ${value}`;
            }

        case 'regiao_id':
            try {
                const regiao = await prisma.regiao.findUnique({
                    where: { id: value },
                    select: { descricao: true },
                });
                return regiao?.descricao || `Região ID ${value}`;
            } catch (error) {
                return `Região ID ${value}`;
            }

        default:
            // Padrão para representação de string para qualquer outro campo
            return String(value);
    }
}

/**
 * Constrói uma representação processada das operações de atualização para preservar o estado
 * @param prisma Instância do PrismaService para consultas ao banco de dados
 * @param tipo Tipo de operação de atualização em lote
 * @param operacao Array de operações de atualização
 * @returns Dados de operação processados com rótulos legíveis por humanos e valores formatados
 */
export async function BuildOperacaoProcessada(
    prisma: PrismaService,
    tipo: TipoAtualizacaoEmLote,
    operacao: UpdateOperacaoDto[]
): Promise<OperacaoProcessadaDto> {
    const processedItems: OperacaoProcessadaItemDto[] = [];

    for (const op of operacao) {
        const item: OperacaoProcessadaItemDto = {
            col: op.col,
            col_label: COLUMN_LABELS[op.col] || op.col,
            tipo_operacao: op.tipo_operacao,
            valor: op.valor,
            valor_formatado: await formatValueForDisplay(prisma, op.col, op.valor, tipo),
        };

        processedItems.push(item);
    }

    return {
        tipo,
        items: processedItems,
    };
}

export const helpers = {
    formatValueForDisplay,
    COLUMN_LABELS,
};
