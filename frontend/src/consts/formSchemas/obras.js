import statusObras from '@/consts/statusObras';
import tiposDeOrigens from '@/consts/tiposDeOrigens';

import {
  dataMax,
  dataMin,
} from './config/datas';
import {
  array, date, mixed, number, object, string,
} from './initSchema';

export default object({
  atividade_id: number()
    .nullable(),
  colaboradores_no_orgao: array()
    .label('Órgãos Colaboradores')
    .of(
      number()
        .min(1),
    )
    .nullable()
    .meta({
      balaoInformativo: 'É a pessoa responsável por apoiar o Ponto Focal Responsável na atualização das informações da obra no SMAE.',
    }),
  empreendimento_id: number()
    .label('Identificador do empreendimento')
    .min(1, 'Empreendimento inválido')
    .nullable(),
  equipamento_id: number()
    .label('Equipamento/Estrutura pública')
    .min(1, 'Equipamento/Estrutura pública inválida')
    .nullable(),
  fonte_recursos: array()
    .label('Fontes de recursos')
    .nullable()
    .of(
      object()
        .shape({
          fonte_recurso_cod_sof: string()
            .label('Código SOF')
            .matches(/\d\d/)
            .required('A fonte é obrigatória'),
          fonte_recurso_ano: number()
            .label('Ano')
            .min(2003, 'A partir de 2003')
            .max(3000, 'Até o ano 3000')
            .required('Escolha um ano válido'),
          fonte_recurso_detalhamento_cod: string()
            .label('Código detalhamento')
            .nullable(),
          fonte_recurso_detalhamento_descricao: string()
            .label('Descrição detalhamento')
            .nullable(),
          id: number()
            .nullable(),
          observacao: string()
            .label('Observações')
            .max(2048)
            .nullable(),
          valor_nominal: number()
            .label('Previsão de custo')
            .required('Informe a previsão de custo'),
          valor_percentual: number()
            .label('Valor percentual')
            .nullable(),
        }),
    ),
  geolocalizacao: array()
    .label('Endereços')
    .of(
      string()
        .min(10, 'Endereço inválido')
        .required(),
    )
    .nullable(),
  grupo_tematico_id: number()
    .label('Grupo temático')
    .min(1, 'Grupo temático inválido')
    .required(),
  iniciativa_id: number()
    .when(['origem_tipo', 'atividade_id'], {
      is: (origemTipo, atividadeId) => origemTipo === 'PdmSistema' && atividadeId,
      then: (field) => field.required(),
      otherwise: (field) => field.nullable(),
    }),
  mdo_detalhamento: string()
    .label('Detalhamento/Escopo da obra')
    .max(2048)
    .nullable(),
  mdo_n_familias_beneficiadas: number()
    .label('Número de famílias beneficiadas')
    .nullableOuVazio()
    .min(0)
    .meta({
      serialize: (valor) => (valor ? Number(valor) : null),
    }),
  mdo_n_unidades_habitacionais: number()
    .label('Número de unidades')
    .min(0)
    .nullableOuVazio(),
  mdo_n_unidades_atendidas: number()
    .label('Número de unidades atendidas até o momento')
    .min(0)
    .nullableOuVazio()
    .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
  mdo_observacoes: string()
    .label('Observações')
    .max(2048)
    .nullable(),
  mdo_previsao_inauguracao: date()
    .label('Data de inauguração planejada')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .typeError('Informe uma data válida (AAAA-MM-DD)'),
  meta_codigo: string()
    .label('Código da Meta')
    .when(['origem_tipo'], {
      is: (origemTipo) => origemTipo === 'PdmAntigo',
      then: (field) => field.required(),
      otherwise: (field) => field.nullable(),
    }),
  meta_id: number()
    .when(['origem_tipo', 'iniciativa_id'], {
      is: (origemTipo, iniciativaId) => origemTipo === 'PdmSistema' || iniciativaId,
      then: (field) => field.required(),
      otherwise: (field) => field.nullable(),
    }),
  nome: string()
    .label('Nome da obra/intervenção')
    .min(0)
    .max(500)
    .required(),
  orgao_colaborador_id: number()
    .label('Órgão colaborador')
    .min(1, 'Órgão colaborador inválidos')
    .nullable(),
  orgao_executor_id: number()
    .label('Secretaria/órgão executor')
    .min(1, 'Secretaria/órgão executor inválidos')
    .nullable(),
  orgao_gestor_id: number()
    .label('Órgão gestor do portfólio')
    .min(1, 'Órgão inválido')
    .required(),
  orgao_origem_id: number()
    .label('Secretaria/órgão de origem')
    .min(1, 'Secretaria/órgão de origem inválidos')
    .required(),
  orgao_responsavel_id: number()
    .label('Órgão responsável pela obra')
    .min(1, 'Órgão responsável pela obra inválidos')
    .nullable(),
  orgaos_colaboradores: string()
    .label('Órgãos colaboradores da obra')
    .nullable(),
  origem_outro: string()
    .max(2048)
    .when('origem_tipo', (origemTipo, field) => (origemTipo && origemTipo !== 'PdmSistema'
      ? field.required('Descrição de origem é obrigatório caso não se escolha um Programa de Metas corrente')
      : field.nullable())),
  origem_tipo: mixed()
    .label('Origem')
    .oneOf(Object.keys(tiposDeOrigens))
    .required(),
  origens_extra: array()
    .label('Outras associações com PdM/Plano Setorial')
    .of(
      object()
        .shape({
          atividade_id: number()
            .label('Atividade')
            .integer()
            .nullable()
            .positive(),
          iniciativa_id: number()
            .label('Iniciativa')
            .integer()
            .nullable()
            .positive(),
          meta_id: number()
            .label('Meta')
            .integer()
            .positive(),
          origem_tipo: mixed()
            .label('Origem')
            .required('Esse origem precisa de um Plano.')
            .oneOf(Object.keys(tiposDeOrigens), 'A origem escolhida é inválida'),
        }),
    ),
  ponto_focal_colaborador: string()
    .label('Ponto focal colaborador')
    .nullable(),
  ponto_focal_responsavel: string()
    .label('Ponto focal responsável')
    .nullableOuVazio(),
  portfolios_compartilhados: array()
    .label('Compartilhar com portfólios')
    .nullable()
    .meta({
      balaoInformativo: 'Na criação, vem preenchido com o compartilhamento padrão do portfólio escolhido. Remova os que não se aplicarem à obra.',
    }),
  portfolio_id: number()
    .label('Portfólio')
    .min(1, 'Portfólio inválido')
    .required(),
  previsao_custo: number()
    .label('Custo previsto inicial')
    .min(0)
    .nullable(),
  previsao_inicio: date()
    .label('Previsão de início')
    .max(dataMax)
    .min(dataMin)
    .nullable(),
  previsao_termino: date()
    .label('Previsão de término')
    .max(dataMax)
    .when('previsao_inicio', (inicio, schema) => {
      if (inicio) {
        return schema.min(inicio, 'Precisa ser posterior à data de início');
      }
      return schema;
    })
    .nullable(),
  programa_id: number()
    .label('Programa Habitacional')
    .positive()
    .integer()
    .nullableOuVazio(),
  projeto_etapa_id: number()
    .label('Etapa')
    .nullable(),
  regiao_ids: array()
    .label('Subprefeitura')
    .of(
      number()
        .min(1),
    )
    .nullable(),
  remover_colaboradores_do_orgao: number()
    .label('Órgão colaborador')
    .min(1, 'Órgão colaborador inválido')
    .nullable(),
  responsavel_id: number()
    .label('Ponto focal responsável')
    .min(1, 'Responsável inválido')
    .nullable()
    .meta({
      balaoInformativo: 'É a pessoa responsável pela evolução da obra em todas as suas fases. Suas principais funções incluem acompanhar o andamento da obra e do(s) respectivo(s) contrato(s), mantendo as informações atualizadas no SMAE.',
    }),
  responsaveis_no_orgao_gestor: array()
    .label('Assessor do Portfólio')
    .of(
      number()
        .min(1),
    )
    .nullable()
    .meta({
      balaoInformativo: 'É a pessoa que atua como facilitador e apoiador na aplicação das metodologias definidas. Suas principais responsabilidades incluem fornecer suporte técnico e metodológico ao Ponto Focal Responsável, durante todas as fases.',
    }),
  secretario_colaborador: string()
    .label('Secretário colaborador da obra')
    .max(250)
    .nullable(),
  secretario_executivo: string()
    .label('Secretário gestor do portfólio')
    .max(250)
    .nullable(),
  secretario_responsavel: string()
    .label('Secretário responsável pela obra')
    .max(250)
    .nullable(),
  secretario: string()
    .label('Secretário gestor do portfólio')
    .nullable(),
  status: mixed()
    .label('Status')
    .oneOf(Object.keys(statusObras))
    .required(),
  tags: array()
    .label('Etiquetas')
    .of(
      number()
        .min(1),
    )
    .nullable(),
  tarefas: array()
    .label('Tarefas')
    .nullable(),
  tipo_intervencao_id: number()
    .label('Tipo de obra/intervenção')
    .min(1, 'Tipo de obra/intervenção inválido')
    .required(),
  tolerancia_atraso: number()
    .label('Percentual de tolerância com atraso')
    .min(0)
    .max(100)
    .nullable(),
  grupo_portfolio: array()
    .label('Grupos de observadores')
    .of(
      number()
        .min(1),
    )
    .nullable(),
});
