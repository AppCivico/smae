/* eslint-disable no-template-curly-in-string */
import regEx from '@/consts/patterns';
import {
  addMethod,
  array,
  boolean,
  date,
  mixed,
  number,
  object,
  ref,
  setLocale,
  string
} from 'yup';

setLocale({
  date: {
    max: 'Essa data é muito no futuro',
    min: 'Essa data é muito no passado',
    required: 'Data obrigatória',
  },
  mixed: {
    default: 'Não é válido',
    required: 'Campo obrigatório',
  },
  number: {
    max: 'Deve ser menor que ${max}',
    min: 'Deve ser maior que ${min}',
  },
  string: {
    max: 'Esse texto é muito longo',
  },
});

// https://github.com/jquense/yup/issues/384#issuecomment-442958997
addMethod(mixed, 'inArray', function _(arrayValue, message = '${path} not found in ${arrayValue}') {
  return this.test({
    message,
    name: 'inArray',
    exclusive: true,
    params: { arrayValue },
    test(value) {
      return (this.resolve(arrayValue) || [])
        .includes(value);
    },
  });
});

const autenticação = object()
  .shape({
    username: string()
      .email('E-mail inválido')
      .required('Preencha seu e-mail'),
    password: string()
      .required('Preencha sua senha'),
  });

const custeio = object()
  .shape({
    custo_previsto: string()
      .required('Preencha o investimento.'),
    parte_dotacao: string()
      .required('Preencha a dotação.')
      .matches(regEx.dotação, 'Formato inválido'),
  });

const etapa = object()
  .shape({
    descricao: string()
      .nullable(),
    inicio_previsto: string()
      .required('Preencha a data')
      .matches(regEx['day/month/year'], 'Formato inválido'),
    inicio_real: string()
      .nullable()
      .matches(regEx['day/month/year'], 'Formato inválido'),
    ordem: string()
      .nullable(),
    regiao_id: string()
      .nullable(),
    termino_previsto: string()
      .required('Preencha a data')
      .matches(regEx['day/month/year'], 'Formato inválido'),
    termino_real: string()
      .nullable()
      .matches(regEx['day/month/year'], 'Formato inválido'),
    titulo: string()
      .required('Preencha o título'),
  });

const etapaDeMonitoramento = object()
  .shape({
    inicio_real: string()
      .nullable()
      .required('Preencha a data')
      .matches(regEx['day/month/year'], 'Formato inválido'),
    termino_real: string()
      .nullable()
      .matches(regEx['day/month/year'], 'Formato inválido'),
  });

const fase = object()
  .shape({
    descricao: string()
      .nullable(),
    inicio_previsto: string()
      .required('Preencha a data')
      .matches(regEx['day/month/year'], 'Formato inválido'),
    inicio_real: string()
      .nullable()
      .matches(regEx['day/month/year'], 'Formato inválido'),
    ordem: string()
      .nullable(),
    regiao_id: string()
      .nullable(),
    termino_previsto: string()
      .required('Preencha a data')
      .matches(regEx['day/month/year'], 'Formato inválido'),
    termino_real: string()
      .nullable()
      .matches(regEx['day/month/year'], 'Formato inválido'),
    titulo: string()
      .required('Preencha o título'),
  });

const indicador = object()
  .shape({
    casas_decimais: number()
      .min(0)
      .max(35)
      .nullable(),
    codigo: string()
      .required('Preencha o código'),
    complemento: string()
      .nullable(),
    contexto: string()
      .nullable(),
    fim_medicao: string()
      .required('Preencha a data')
      .matches(regEx['month/year'], 'Formato inválido'),
    inicio_medicao: string()
      .required('Preencha a data')
      .matches(regEx['month/year'], 'Formato inválido'),
    nivel_regionalizacao: string()
      .nullable()
      // eslint-disable-next-line eqeqeq
      .when('regionalizavel', (regionalizavel, field) => (regionalizavel == '1'
        ? field.required('Selecione o nível')
        : field)),
    periodicidade: string()
      .required('Selecione a periodicidade'),
    polaridade: string()
      .required('Selecione a polaridade'),
    regionalizavel: string()
      .nullable(),
    titulo: string()
      .required('Preencha o título'),
  });

const novaSenha = object()
  .shape({
    password: string()
      .required('Preencha sua nova senha')
      .matches(/[0-9]/, 'Deve conter pelo menos um número')
      .matches(/[A-Z]/, 'Deve conter pelo menos um caractere maiúsculo')
      .matches(/[!@#$%^&*]/, 'Deve conter pelo menos um dos caracteres: !@#$%^&*')
      .min(8, 'Deve conter pelo menos 8 caracteres'),
    passwordConfirmation: string()
      .required('Repita sua senha')
      .oneOf([ref('password'), null], 'Senhas não coincidem'),
  });

const portfolio = object({
  orgaos: array()
    .min(1, 'Selecione ao menos um órgão')
    .required(),
  titulo: string()
    .required('Um portfolio requer um título'),
});

const projeto = object()
  .shape({
    atividade_id: number()
      .nullable(),
    data_aprovacao: date()
      .nullable()
      .min(new Date(2003, 0, 1))
      .typeError('Data inválida'),
    data_revisao: date()
      .nullable()
      .min(new Date(2003, 0, 1))
      .typeError('Data inválida'),
    escopo: string()
      .max(50000)
      .required(),
    fonte_recursos: array()
      .nullable()
      .of(
        object()
          .shape({
            fonte_recurso_cod_sof: string()
              .matches(/\d\d/)
              .required('A fonte é obrigatória'),
            fonte_recurso_ano: number()
              .min(2003, 'A partir de 2003')
              .max(3000, 'Até o ano 3000')
              .required('Escolha um ano válido'),
            id: number()
              .nullable(),
            valor_nominal: mixed()
              .when('valor_percentual', {
                is: (valorPercentual) => !valorPercentual,
                then: number()
                  .required('Ao menos um tipo de valor é necessário.'),
                otherwise: mixed()
                  .nullable(),
              }),
            valor_percentual: mixed()
              .when('valor_nominal', {
                is: (valorNominal) => !valorNominal,
                then: number()
                  .required('Ao menos um tipo de valor é necessário.')
                  .min(0.01, 'Não se pode investir menos de 0.01%')
                  .max(100, 'Não se pode investir mais de 100%'),
                otherwise: mixed()
                  .nullable(),
              }),
          }, [['valor_percentual', 'valor_nominal']]),
      ),
    iniciativa_id: number()
      .nullable(),
    meta_codigo: string()
      .nullable(),
    meta_id: number()
      .nullable(),
    nome: string()
      .required('Um projeto requer um nome')
      .min(1, 'Esse nome é muito curto')
      .max(500, 'Esse nome é muito longo'),
    orgao_gestor_id: number()
      .min(1, 'Selecione um órgão gestor')
      .required('O projeto necessita de um órgão gestor'),
    orgao_responsavel_id: number()
      .min(1, 'Selecione um órgão responsável')
      .required('Escolha um órgão responsável pelo projeto'),
    orgaos_participantes: array()
      .min(1, 'Selecione ao menos um órgão')
      .required('Selecione órgãos participantes'),
    origem_outro: string()
      .nullable()
      .max(500)
      .when('origem_tipo', (origemTipo, field) => (origemTipo !== 'PdmSistema'
        ? field.required('Esse campo é obrigatório caso não se escolha um Programa de Metas corrente')
        : field)),
    origem_tipo: mixed()
      .required('O projeto precisa de uma origem de recursos.')
      .oneOf(['PdmSistema', 'PdmAntigo', 'Outro'], 'A origem escolhida é inválida'),
    portfolio_id: number('O projeto precisa pertencer a um portfolio')
      .min(1, 'Selecione ao menos um portfolio')
      .required('O projeto precisa pertencer a um portfolio'),
    premissas: array()
      .of(
        object()
          .shape({
            id: number()
              .nullable(),
            premissa: string()
              .required('A premissa não pode estar em branco')
              .max(2048, 'Premissa muito longa. use menos de 2048 caracteres'),
          }),
      )
      .strict(),
    previsao_custo: number()
      .nullable()
      .min(0)
      .required('Previsão de custo é obrigatória'),
    previsao_inicio: date()
      .required('Previsão de início é obrigatória')
      .typeError('Data inválida'),
    previsao_termino: date()
      .min(ref('previsao_inicio'), 'Precisa ser posterior à Previsão de início')
      .required('Previsão de término é obrigatória')
      .typeError('Data inválida'),
    principais_etapas: string()
      .max(50000)
      .required('Principais etapas são obrigatórias'),
    responsaveis_no_orgao_gestor: array()
      .min(1, 'É necessário ao menos um gestor')
      .required('Alguém do órgão precisa gerir o projeto'),
    responsavel_id: number()
      .required('O projeto necessita de um responsável'),
    restricoes: array()
      .of(
        object()
          .shape({
            id: number()
              .nullable(),
            restricao: string()
              .required('A restrição não pode estar em branco')
              .max(2048, 'Restrição muito longa. use menos de 2048 caracteres'),
          }),
      )
      .strict(),
    resumo: string()
      .max(500)
      .required('Resumo é obrigatório'),
    versao: string()
      .nullable()
      .max(20),
  });

const região = object()
  .shape({
    descricao: string()
      .required('Preencha a descrição'),
    nivel: number()
      .required(),
    parente_id: number()
      .nullable()
      .when('nivel', (nivel, field) => (nivel > 1
        ? field.required('Esse campo é obrigatório para o nível maior do que 1')
        : field)),
    upload_shapefile: string()
      .nullable(),
  });

const relatórioMensal = object({
  fonte: string()
    .required(),
  parametros: object({
    pdm_id: string()
      .required('Escolha um PdM'),
    mes: number()
      .min(1)
      .max(12)
      .required('Escolha um mês'),
    ano: number()
      .min(2003, 'A partir de 2003')
      .required('Escolha um ano válido'),
    tags: array()
      .nullable(),
    paineis: array()
      .nullable(),
  }),
  salvar_arquivo: boolean(),
});

const relatórioOrçamentário = object({
  fonte: string()
    .required(),
  salvar_arquivo: boolean(),
  parametros: object({
    pdm_id: string()
      .required('Escolha um PdM'),
    inicio: string()
      .required('Preencha a data')
      .matches(regEx['month/year'], 'Formato inválido'),
    fim: string()
      .required('Preencha a data')
      .matches(regEx['month/year'], 'Formato inválido'),
    tipo: string()
      .required('Escolha o tipo'),
  }),
});

const relatórioSemestralOuAnual = object({
  fonte: string()
    .required(),
  parametros: object({
    ano: number()
      .min(2003, 'A partir de 2003')
      .required('Escolha um ano válido'),
    pdm_id: string()
      .required('Escolha um PdM'),
    periodo: string()
      .required('Escolha o período')
      .matches(regEx['^(:?Anual|Semestral)$'], 'Valor inválido'),
    semestre: string()
      .when('periodo', {
        is: 'Semestral',
        then: (schema) => schema.required('Escolha o semestre'),
      })
      .matches(regEx['^(:?Primeiro|Segundo)$'], 'Valor inválido'),
    tipo: string()
      .required('Escolha o tipo'),
  }),
  salvar_arquivo: boolean(),
});

const tarefa = object()
  .shape({
    custo_estimado: number()
      .min(0)
      .nullable(),
    custo_real: number()
      .min(0)
      .nullable(),
    dependencias: array()
      .of(
        object()
          .shape({
            dependencia_tarefa_id: number()
              .min(0)
              .required(),
            latencia: number()
              .min(0),
            tipo: mixed()
              .required()
              .oneOf(['termina_pro_inicio', 'inicia_pro_inicio', 'inicia_pro_termino', 'termina_pro_termino']),
          }),
      )
      .strict(),
    descricao: string()
      .min(0)
      .max(2048)
      .required(),
    duracao_planejado: number()
      .min(0)
      .required(),
    duracao_real: number()
      .min(0)
      .nullable(),
    inicio_planejado: date()
      .required()
      .typeError('Data inválida'),
    inicio_real: date()
      .nullable()
      .typeError('Data inválida'),
    nivel: number()
      .min(1)
      .required(),
    numero: number()
      .min(1)
      .required(),
    orgao_id: number()
      .min(1, 'Selecione um órgão responsável')
      .required('Escolha um órgão responsável pela tarefa'),
    percentual_concluido: number()
      .min(0)
      .max(100)
      .nullable(),
    recursos: string()
      .min(0)
      .max(2048),
    tarefa: string()
      .min(1)
      .max(60)
      .required(),
    tarefa_pai_id: number()
      .min(0)
      .nullable(),
    termino_planejado: date()
      .required()
      .typeError('Data inválida'),
    termino_real: date()
      .nullable()
      .typeError('Data inválida'),
  });

const usuário = object()
  .shape({
    desativado: string()
      .nullable(),
    desativado_motivo: string()
      .nullable()
      .when('desativado', (desativado, field) => (desativado === '1'
        ? field.required('Escreva um motivo para a inativação')
        : field)),
    email: string()
      .required('Preencha o e-mail')
      .email('E-mail inválido'),
    grupos: array(),
    lotacao: string()
      .required('Preencha a lotação'),
    nome_completo: string()
      .required('Preencha o nome'),
    nome_exibicao: string()
      .required('Preencha o nome social')
      .max(20, 'Máximo de 20 caracteres'),
    orgao_id: string()
      .required('Selecione um órgão'),
    perfil_acesso_ids: array()
      .required('Selecione ao menos uma permissão'),
  });

const variável = (singleIndicadores) => object()
  .shape({
    acumulativa: string()
      .nullable(),
    ano_base: string()
      .nullable(),
    atraso_meses: number()
      .min(0)
      .integer(),
    casas_decimais: string()
      .nullable(),
    codigo: string()
      .required('Preencha o código'),
    fim_medicao: string()
      .nullable()
      .when('periodicidade', (periodicidade, schema) => (singleIndicadores?.value?.periodicidade !== periodicidade
        ? schema.required('Selecione a data')
        : schema))
      .matches(regEx['month/year'], 'Formato inválido'),
    inicio_medicao: string()
      .nullable()
      .when('periodicidade', (periodicidade, schema) => (singleIndicadores?.value?.periodicidade !== periodicidade
        ? schema.required('Selecione a data')
        : schema))
      .matches(regEx['month/year'], 'Formato inválido'),
    orgao_id: string()
      .required('Selecione um orgão'),
    periodicidade: string()
      .required('Preencha a periodicidade'),
    regiao_id: string()
      .nullable()
      .test('regiao_id', 'Selecione uma região', (value) => !singleIndicadores?.value?.regionalizavel
      || value),
    responsaveis: array()
      .nullable(),
    titulo: string()
      .required('Preencha o título'),
    unidade_medida_id: string()
      .required('Selecione uma unidade'),
    valor_base: string()
      .required('Preencha o valor base'),
  });

export {
  autenticação,
  custeio,
  etapa,
  etapaDeMonitoramento,
  fase,
  indicador,
  novaSenha,
  portfolio,
  projeto,
  região,
  relatórioMensal,
  relatórioOrçamentário,
  relatórioSemestralOuAnual,
  tarefa,
  usuário,
  variável,
};
