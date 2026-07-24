import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import {
  array,
  boolean,
  date,
  mixed,
  number,
  object,
  string,
} from './initSchema';
import {
  dataMax,
  dataMin,
} from './config/datas';

export default object({
  ano: number()
    .label('Ano')
    .nullable()
    .required(),
  clausula_suspensiva_vencimento: date()
    .label('data de vencimento da cláusula suspensiva')
    .max(dataMax)
    .min(dataMin)
    .transform((v) => (!v ? null : v))
    .meta({
      balaoInformativo: 'Indica a data de vencimento para atendimento das pendências contratuais que permitem o início da Transferência Voluntária.',
    })
    .when('clausula_suspensiva', (clausulaSuspensiva, field) => (clausulaSuspensiva
      ? field.required()
      : field.nullable())),
  tipo_id: number()
    .label('Tipo')
    .nullable()
    .required()
    .meta({
      balaoInformativo: 'Indica a origem da Transferência Voluntária, determinando o fluxo correspondente para monitoramento.',
    }),
  classificacao_id: string()
    .label('Classificação')
    .nullable()
    .meta({
      balaoInformativo: 'Indica a obrigatoriedade ou discricionariedade da Transferência Voluntária. Está diretamente relacionada ao Tipo e à Esfera.',
    }),
  clausula_suspensiva: boolean()
    .label('Cláusula suspensiva')
    .nullable()
    .meta({
      balaoInformativo: 'Indica se a Transferência Voluntária possui pendências contratuais para iniciar sua execução.',
    }),
  detalhamento: string()
    .label('Detalhamento')
    .max(50000)
    .nullable(),
  emenda: string()
    .label('Emenda')
    .max(250)
    .min(1)
    .nullable()
    .meta({
      balaoInformativo: 'Indica o código numérico da emenda parlamentar, gerado nos respectivos sistemas do Governo Federal ou Estadual.',
    }),
  emenda_unitaria: string()
    .label('Emenda unitária')
    .max(250)
    .min(1)
    .nullable()
    .meta({
      balaoInformativo: 'Indica o código numérico da emenda parlamentar oriunda de Transferência Especial, em nos casos de distribuição de recursos. É gerado pelos respectivos sistemas do Governo Federal ou Estadual.',
    }),
  esfera: mixed()
    .label('Esfera')
    .nullable()
    .required()
    .oneOf([...Object.keys(esferasDeTransferencia), null]),
  demanda: string()
    .label('Número da Demanda')
    .nullable()
    .meta({
      balaoInformativo: 'Indica o código numérico da demanda de emenda parlamentar estadual, gerado no sistema do Governo do Estado.',
    }),
  interface: string()
    .label('Interface')
    .nullable(),
  nome_programa: string()
    .label('Nome do programa')
    .nullable()
    .meta({
      balaoInformativo: 'Indica o nome do Programa Orçamentário vinculado à Transferência Voluntária. Código gerado pelos respectivos sistemas do Governo Federal e Estadual.',
    }),
  normativa: string()
    .label('normativa')
    .nullable()
    .max(50000)
    .meta({
      balaoInformativo: 'Indica a(s) norma(s) que regulamentam a Transferência Voluntária.',
    }),
  observacoes: string()
    .label('Observação')
    .max(50000)
    .nullable(),
  objeto: string()
    .label('Objeto/Empreendimento')
    .max(1000)
    .nullable()
    .required(),
  orgao_concedente_id: number()
    .label('Órgão concedente')
    .min(1, 'Selecione um órgão responsável')
    .nullable()
    .required(),
  programa: string()
    .label('Código do programa')
    .nullable()
    .meta({
      balaoInformativo: 'Indica o código numérico do Programa Orçamentário vinculado à Transferência Voluntária. Código gerado pelos respectivos sistemas do Governo Federal e Estadual.',
    }),
  parlamentares: array()
    .label('Parlamentar')
    .nullable()
    .of(object({
      id: number()
        .nullable(),
      parlamentar_id: number()
        .label('Parlamentar')
        .required()
        .meta({
          balaoInformativo: 'Indica o nome do parlamentar. Advém das informações cadastradas sobre Parlamentares na aba Configurações.',
        }),
      cargo: mixed()
        .label('Cargo')
        // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
        .oneOf([...Object.keys(cargosDeParlamentar), null])
        .nullable()
        .required()
        .transform((v) => (v === '' ? null : v)),
      partido_id: number()
        .label('Partido')
        .nullable()
        .required(),
      objeto: string()
        .label('Objeto/Empreendimento')
        .max(1000)
        .nullable(),
      valor: number()
        .label('Valor do Repasse')
        .nullable(),
    })),
  secretaria_concedente: string()
    .label('Gestor do órgão concedente')
    .nullable()
    .meta({
      balaoInformativo: 'Indica o nome do órgão Federal ou Estadual ao qual a origem da Transferência Voluntária está atrelada.',
    }),
});
