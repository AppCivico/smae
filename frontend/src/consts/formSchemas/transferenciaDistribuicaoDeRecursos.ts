import {
  array,
  boolean,
  date,
  number,
  object,
  string,
} from './initSchema';
import {
  dataMax,
  dataMin,
} from './config/datas';

export default object({
  assinatura_estado: date()
    .label('Data de assinatura do representante do estado')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .transform((v) => (!v ? null : v)),
  assinatura_municipio: date()
    .label('Data de assinatura do representante do município')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .transform((v) => (!v ? null : v)),
  assinatura_termo_aceite: date()
    .label('Data de assinatura do termo de aceite')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .transform((v) => (!v ? null : v)),
  conclusao_suspensiva: date()
    .label('Data de conclusão da suspensiva')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .transform((v) => (!v ? null : v)),
  contrato: string()
    .label('Número do instrumento')
    .nullable(),
  convenio: string()
    .label('Número convênio/pré-convênio')
    .nullable(),
  custeio: number()
    .label('Custeio (R$)')
    .min(0)
    .required()
    .meta({
      balaoInformativo: 'Indica o valor financeiro para despesas de custeio da Transferência Voluntária. O valor do custeio é sobre o valor do repasse.',
    }),
  investimento: number()
    .label('Investimento (R$)')
    .min(0)
    .required()
    .meta({
      balaoInformativo: 'Indica o valor financeiro para despesas de investimento da Transferência Voluntária. O valor do investimento é sobre o valor do repasse.',
    }),
  data_empenho: date()
    .label('Data do empenho')
    .max(dataMax)
    .min(dataMin)
    .nullableOuVazio(),
  distribuicao_agencia: string()
    .label('Agência Bancária')
    .nullable(),
  distribuicao_banco: string()
    .label('Banco')
    .nullable(),
  distribuicao_conta: string()
    .label('Conta Corrente')
    .nullable(),
  dotacoes: array()
    .label('Dotações')
    .of(string()
      .label('Dotação')
      .trim()
      .max(255)
      .min(1))
    .semDuplicatas('Dotações não podem ter valores repetidos')
    .meta({
      balaoInformativo: 'Indica o código numérico da alocação dos recursos financeiros previstos no orçamento municipal para execução da Transferência Voluntária.',
    }),
  empenho: boolean()
    .label('Empenho')
    .nullable(),
  finalidade: string()
    .label('Finalidade')
    .nullable(),
  gestor_contrato: string()
    .label('Gestor do contrato')
    .nullable(),
  justificativa_aditamento: string()
    .label('Justificativa para aditamento')
    .max(250)
    .min(1, 'Justificativa para aditamento é obrigatório após editar a data de vigência')
    .nullable()
    .meta({
      balaoInformativo: 'Indica os motivos que justificam aditamento do contrato relacionado à Transferência Voluntária.',
    }),
  valor_liquidado: string()
    .label('Liquidação/Pagamento')
    .nullable()
    .meta({
      balaoInformativo: 'Indica o valor financeiro liquidado ou pago na Transferência Voluntária.',
    }),
  nome: string()
    .label('Nome')
    .min(1)
    .max(1024)
    .required()
    .meta({
      balaoInformativo: 'Indica o apelido da Transferência Voluntária.',
    }),
  objeto: string()
    .label('Objeto/Empreendimento')
    .max(1000)
    .required(),
  orgao_gestor_id: number()
    .label('Gestor Municipal')
    .min(1, 'Selecione um gestor municipal')
    .required()
    .meta({
      balaoInformativo: 'Indica o nome do ponto focal responsável por acompanhar a execução da Transferência Voluntária e reportar para a Secretaria-Executiva de Relações Institucionais (SERI).',
    }),
  programa_orcamentario_estadual: string()
    .label('Programa orçamentário estadual')
    .nullable()
    .meta({
      balaoInformativo: 'Indica o Programa Orçamentário do Concedente vinculado à Transferência Voluntária, de acordo com distribuição dos recursos da Transferência Especial.',
    }),
  programa_orcamentario_municipal: string()
    .label('Programa orçamentário municipal')
    .nullable()
    .meta({
      balaoInformativo: 'Indica o Programa Orçamentário Municipal vinculado à Transferência Voluntária, de acordo com distribuição dos recursos da Transferência Especial.',
    }),
  proposta: string()
    .label('Proposta')
    .nullable(),
  registros_sei: array()
    .label('Número SEI')
    .meta({
      balaoInformativo: 'Indica o código numérico referente ao processo administrativo instruído no Sistema Eletrônico de Informações - SEI! relacionado à Transferência Voluntária.',
    })
    .of(object({
      id: number()
        .nullable(),
      nome: string()
        .label('Número SEI - Nome')
        .max(1024)
        .min(1)
        .required()
        .transform((v) => (!v ? null : v)),
      processo_sei: string()
        .label('Número SEI - Processo')
        .max(40)
        .required(),
    }))
    .strict(),
  rubrica_de_receita: string()
    .label('Rubrica de receita')
    .nullable()
    .meta({
      balaoInformativo: 'Indica o código numérico do detalhamento da espécie de receita. Informação deve ser solicitada pela Secretaria Municipal da Fazenda.',
    }),
  valor: number()
    .label('Valor do Repasse')
    .required()
    .nullable()
    .meta({
      balaoInformativo: 'Indica o valor financeiro da Transferência Voluntária.',
    }),
  valor_contrapartida: number()
    .label('Valor contrapartida')
    .required()
    .nullable()
    .meta({
      balaoInformativo: 'Indica o valor financeiro disponibilizado pela Prefeitura como contrapartida da Transferência Voluntária.',
    }),
  valor_empenho: number()
    .label('Valor empenho')
    .nullable(),
  valor_total: number()
    .label('Valor total')
    .required()
    .nullable()
    .meta({
      balaoInformativo: 'Indica o valor financeiro global (soma do repasse e contrapartida) para execução da Transferência Voluntária.',
    }),
  vigencia: date()
    .label('Data de vigência')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .transform((v) => (!v ? null : v)),
  parlamentares: array()
    .label('Parlamentares')
    .nullable()
    .of(object({
      id: number()
        .nullable(),
      nome: string()
        .label('Parlamentar')
        .nullable()
        .meta({
          balaoInformativo: 'Indica o nome do parlamentar. Advém das informações cadastradas sobre Parlamentares na aba Configurações.',
        }),
      valor: number()
        .label('Valor do repasse do parlamentar')
        .nullable(),
    })),
});
