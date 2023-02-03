import regEx from '@/consts/patterns';
import {
  array, boolean, number, object, ref, string
} from 'yup';

const autenticação = object().shape({
  username: string().email('E-mail inválido').required('Preencha seu e-mail'),
  password: string().required('Preencha sua senha'),
});

const custeio = object().shape({
  custo_previsto: string().required('Preencha o investimento.'),
  parte_dotacao: string().required('Preencha a dotação.').matches(regEx.dotação, 'Formato inválido'),
});

const etapa = object().shape({
  regiao_id: string().nullable(),

  titulo: string().required('Preencha o título'),
  descricao: string().nullable(),
  ordem: string().nullable(),

  inicio_previsto: string().required('Preencha a data').matches(regEx['day/month/year'], 'Formato inválido'),
  termino_previsto: string().required('Preencha a data').matches(regEx['day/month/year'], 'Formato inválido'),
  inicio_real: string().nullable().matches(regEx['day/month/year'], 'Formato inválido'),
  termino_real: string().nullable().matches(regEx['day/month/year'], 'Formato inválido'),
});

const etapaDeMonitoramento = object().shape({
  inicio_real: string().nullable().required('Preencha a data').matches(regEx['day/month/year'], 'Formato inválido'),
  termino_real: string().nullable().matches(regEx['day/month/year'], 'Formato inválido'),
});

const fase = object().shape({
  regiao_id: string().nullable(),

  titulo: string().required('Preencha o título'),
  descricao: string().nullable(),
  ordem: string().nullable(),

  inicio_previsto: string().required('Preencha a data').matches(regEx['day/month/year'], 'Formato inválido'),
  termino_previsto: string().required('Preencha a data').matches(regEx['day/month/year'], 'Formato inválido'),
  inicio_real: string().nullable().matches(regEx['day/month/year'], 'Formato inválido'),
  termino_real: string().nullable().matches(regEx['day/month/year'], 'Formato inválido'),
});

const indicador = object().shape({
  codigo: string().required('Preencha o código'),
  titulo: string().required('Preencha o título'),
  polaridade: string().required('Selecione a polaridade'),
  periodicidade: string().required('Selecione a periodicidade'),
  casas_decimais: number().min(0).max(35).nullable(),

  inicio_medicao: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),
  fim_medicao: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),

  regionalizavel: string().nullable(),
  nivel_regionalizacao: string().nullable().when('regionalizavel', (regionalizavel, field) => (regionalizavel == '1' ? field.required('Selecione o nível') : field)),

  contexto: string().nullable(),
  complemento: string().nullable(),
});

const novaSenha = object().shape({
  password: string().required('Preencha sua nova senha')
    .matches(/[0-9]/, 'Deve conter pelo menos um número')
    .matches(/[A-Z]/, 'Deve conter pelo menos um caractere maiúsculo')
    .matches(/[!@#$%^&*]/, 'Deve conter pelo menos um dos caracteres: !@#$%^&*')
    .min(8, 'Deve conter pelo menos 8 caracteres'),
  passwordConfirmation: string().required('Repita sua senha')
    .oneOf([ref('password'), null], 'Senhas não coincidem'),
});

const portfolio = object({
  titulo: string().required('Um portfolio requer um título'),
  orgaos: array().min(1, 'Selecione ao menos um órgão').required(),
});

const região = object().shape({
  nivel: number().required(),
  parente_id: number().nullable().when('nivel', (nivel, field) => (nivel > 1 ? field.required('Esse campo é obrigatório para o nível maior do que 1') : field)),
  descricao: string().required('Preencha a descrição'),
  upload_shapefile: string().nullable(),
});

const relatórioMensal = object({
  fonte: string().required(),
  salvar_arquivo: boolean(),
  parametros: object({
    pdm_id: string().required('Escolha um PdM'),
    mes: number().min(1).max(12).required('Escolha um mês'),
    ano: number().min(2003, 'A partir de 2003').required('Escolha um ano válido'),
    tags: array().nullable(),
    paineis: array().nullable(),
  }),
});

const relatórioOrçamentário = object({
  fonte: string().required(),
  salvar_arquivo: boolean(),
  parametros: object({
    pdm_id: string().required('Escolha um PdM'),
    inicio: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),
    fim: string().required('Preencha a data').matches(regEx['month/year'], 'Formato inválido'),
    tipo: string().required('Escolha o tipo'),
  }),
});

const relatórioSemestralOuAnual = object({
  fonte: string().required(),
  salvar_arquivo: boolean(),
  parametros: object({
    pdm_id: string().required('Escolha um PdM'),
    ano: number().min(2003, 'A partir de 2003').required('Escolha um ano válido'),
    semestre: string()
      .when('periodo', {
        is: 'Semestral',
        then: (schema) => schema.required('Escolha o semestre'),
      })
      .matches(regEx['^(:?Primeiro|Segundo)$'], 'Valor inválido'),
    periodo: string().required('Escolha o período').matches(regEx['^(:?Anual|Semestral)$'], 'Valor inválido'),
    tipo: string().required('Escolha o tipo'),
  }),
});

const usuário = object().shape({
  email: string().required('Preencha o e-mail').email('E-mail inválido'),
  nome_completo: string().required('Preencha o nome'),
  nome_exibicao: string().required('Preencha o nome social').max(20, 'Máximo de 20 caracteres'),
  lotacao: string().required('Preencha a lotação'),
  orgao_id: string().required('Selecione um órgão'),
  perfil_acesso_ids: array().required('Selecione ao menos uma permissão'),
  desativado: string().nullable(),
  desativado_motivo: string().nullable()
    .when('desativado', (desativado, field) => (desativado === '1' ? field.required('Escreva um motivo para a inativação') : field)),
  grupos: array(),
});

const variável = (singleIndicadores) => object().shape({
  orgao_id: string().required('Selecione um orgão'),
  regiao_id: string().nullable().test('regiao_id', 'Selecione uma região', (value) => !singleIndicadores?.value?.regionalizavel || value),
  unidade_medida_id: string().required('Selecione uma unidade'),

  codigo: string().required('Preencha o código'),
  titulo: string().required('Preencha o título'),
  periodicidade: string().required('Preencha a periodicidade'),

  valor_base: string().required('Preencha o valor base'),
  ano_base: string().nullable(),
  casas_decimais: string().nullable(),
  atraso_meses: number().min(0).integer(),

  inicio_medicao: string().nullable()
    .when('periodicidade', (periodicidade, schema) => (singleIndicadores?.value?.periodicidade !== periodicidade ? schema.required('Selecione a data') : schema))
    .matches(regEx['month/year'], 'Formato inválido'),
  fim_medicao: string().nullable()
    .when('periodicidade', (periodicidade, schema) => (singleIndicadores?.value?.periodicidade !== periodicidade ? schema.required('Selecione a data') : schema))
    .matches(regEx['month/year'], 'Formato inválido'),

  acumulativa: string().nullable(),

  responsaveis: array().nullable(),
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
  região,
  relatórioMensal,
  relatórioOrçamentário,
  relatórioSemestralOuAnual,
  usuário,
  variável,
};
