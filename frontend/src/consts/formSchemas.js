/* eslint-disable no-template-curly-in-string */
import { isAfter, isBefore } from 'date-fns';
import {
  addMethod,
  array,
  boolean,
  date,
  lazy,
  mixed,
  number,
  object,
  ref,
  setLocale,
  string,
} from 'yup';
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import categoriaDeTransferencia from '@/consts/categoriaDeTransferencia';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import estadosDoBrasil from '@/consts/estadosDoBrasil';
import interfacesDeTransferências from '@/consts/interfacesDeTransferências';
import niveisDeOrcamento from '@/consts/niveisDeOrcamento';
import níveisDeRepresentatividade from '@/consts/niveisDeRepresentatividade';
import níveisDeSuplência from '@/consts/niveisDeSuplencia';
import regEx from '@/consts/patterns';
import periodicidades from '@/consts/periodicidades';
import polaridadeDeVariaveis from '@/consts/polaridadeDeVariaveis';
import statusDeProjetos from '@/consts/projectStatuses';
import responsabilidadeEtapaFluxo from '@/consts/responsabilidadeEtapaFluxo';
import statusObras from '@/consts/statusObras';
import tipoDePerfil from '@/consts/tipoDePerfil';
import tipoDeVariaveisCategoricas from '@/consts/tipoDeVariaveisCategoricas';
import tiposDeLogradouro from '@/consts/tiposDeLogradouro';
import tiposDeMunicípio from '@/consts/tiposDeMunicipio';
import tiposDeOrigens from '@/consts/tiposDeOrigens';
import tiposNaEquipeDeParlamentar from '@/consts/tiposNaEquipeDeParlamentar';
import tiposSituacaoSchema from '@/consts/tiposSituacaoSchema';
import fieldToDate from '@/helpers/fieldToDate';
import haDuplicatasNaLista from '@/helpers/haDuplicatasNaLista';
import tiposStatusDistribuicao from './tiposStatusDistribuicao';

const dataMin = import.meta.env.VITE_DATA_MIN ? new Date(`${import.meta.env.VITE_DATA_MIN}`) : new Date('1900-01-01T00:00:00Z');
const dataMax = import.meta.env.VITE_DATA_MAX ? new Date(`${import.meta.env.VITE_DATA_MAX}`) : new Date('2100-12-31T23:59:59Z');

// Carrega os anos possíveis - começa em 2003 e termina no corrente mais cinco
const endYear = new Date().getFullYear() + 5;
const startYear = 2003;

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(string, 'fieldUntilToday', function _(errorMessage = 'Valor de ${path} futuro') {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  return this.test('teste', errorMessage, function __(value) {
    const { path, createError } = this;

    if (!value) return true;

    try {
      const cleanDate = fieldToDate(value).replace(/-/g, '');
      const cleanNow = new Date()
        .toISOString()
        .substring(0, 10)
        .replace(/-/g, '');

      return Number(cleanDate) <= Number(cleanNow)
        || createError({ path });
    } catch (error) {
      return createError({ path, message: 'Valor de ${path} inválido' });
    }
  });
});

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(string, 'nullableOuVazio', function _() {
  return this
    .nullable()
    .transform((v) => (v === '' ? null : v));
});

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(date, 'nullableOuVazio', function _() {
  return this
    .nullable()
    .transform((v) => {
      try {
        v.toISOString();
        return v;
      } catch (e) {
        return null;
      }
    });
});

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(mixed, 'nullableOuVazio', function _() {
  return this
    .nullable()
    .transform((v) => (v === '' || v === false ? null : v));
});

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(number, 'nullableOuVazio', function _() {
  return this
    .nullable()
    .transform((v) => (v === '' || Number.isNaN(v) ? null : v));
});

/**
 * @link https://github.com/jquense/yup/issues/384#issuecomment-442958997
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(mixed, 'inArray', function _(arrayToCompare, message = '${path} não encontrado em ${arrayToCompare}') {
  return this.test({
    message,
    name: 'inArray',
    exclusive: true,
    params: { arrayToCompare },
    test(value) {
      return (this.resolve(arrayToCompare) || []).includes(value);
    },
  });
});

addMethod(mixed, 'semDuplicatas', function semDuplicatas(message = '${path} não pode ter valores repetidos', params = {}) {
  return this.test('semDuplicatas', message, function semDuplicatasTeste(value) {
    const { path, createError } = this;

    return haDuplicatasNaLista(value, params)
      ? createError({ path, message })
      : true;
  });
});

setLocale({
  array: {
    min: ({ label, min }) => (label
      ? `${label}: escolha ao menos ${min}`
      : 'Escolha ao menos ${min}'
    ),
    max: ({ label, max }) => (label
      ? `${label}: escolha no máximo ${max}`
      : 'Escolha no máximo ${max}'
    ),
  },
  date: {
    max: ({ label }) => (label ? `${label} está muito no futuro` : 'Essa data é muito no futuro'),
    min: ({ label }) => (label ? `${label} está muito no passado` : 'Essa data é muito no passado'),
    required: ({ label }) => (label ? `${label} não é opcional` : 'Data obrigatória'),
  },
  mixed: {
    default: 'Valor de ${label} não é válido',
    oneOf: 'Opção inválida para ${label}',
    notType: ({ label }) => (label ? `Valor de ${label} inválido` : 'Valor inválido'),
    required: ({ label }) => (label ? `${label} não é opcional` : 'Campo obrigatório'),
  },
  number: {
    integer: ({ label }) => (label ? `${label} deve ser um número inteiro` : 'Deve ser um número inteiro'),
    max: ({ label, max }) => (label ? `${label} deve ser no máximo ${max}` : 'Deve ser no máximo ${max}'),
    min: ({ label, min }) => (label ? `${label} deve ser no mínimo ${min}` : 'Deve ser no mínimo ${min}'),
    positive: ({ label }) => (label ? `${label} deve ser maior do que zero` : 'Deve ser maior do que zero'),
  },
  string: {
    email: ({ label }) => (label ? `${label} não é e-mail válido` : 'E-mail inválido'),
    min: ({ label, min }) => (label
      ? `${label} está menor que ${min} caracteres`
      : 'Esse texto é menor que ${min} caracteres'),
    matches: ({ label }) => (label ? `${label} está fora do formato` : 'Formato inválido'),
    max: ({ label, max }) => (label
      ? `${label} está maior que ${max} caracteres`
      : 'Esse texto é maior que ${max} caracteres'),
    required: ({ label }) => (label ? `${label} não é opcional` : 'Campo obrigatório'),
  },
});

// https://github.com/jquense/yup/issues/384#issuecomment-442958997

const direcaoOpcoes = ['asc', 'desc', null];

export const acompanhamento = object()
  .shape({
    acompanhamento_tipo_id: string()
      .label('Tipo de acompanhamento')
      .nullable(),
    acompanhamentos: array()
      .label('Encaminhamentos')
      .nullable()
      .of(
        object()
          .shape({
            encaminhamento: string()
              .label('Encaminhamento')
              .max(2048)
              .min(1)
              .required(),
            responsavel: string()
              .label('Responsável')
              .nullable(),
            prazo_encaminhamento: date()
              .label('Prazo para encaminhamento')
              .max(dataMax)
              .min(dataMin)
              .nullable(),
            prazo_realizado: date()
              .label('Data de realização')
              .max(dataMax)
              .min(dataMin)
              .nullable(),
          }),
      ),
    apresentar_no_relatorio: boolean()
      .label('Apresentar em relatório')
      .nullable(),
    cronograma_paralisado: boolean()
      .label('Cronograma paralisado')
      .nullable(),
    data_registro: date()
      .label('Data do registro')
      .max(dataMax)
      .min(dataMin)
      .required(),
    detalhamento: string()
      .label('Detalhamento')
      .max(2048)
      .nullable(),
    observacao: string()
      .label('Observação')
      .max(2048)
      .nullable(),
    participantes: string()
      .label('Participantes')
      .max(2048)
      .required(),
    pauta: string()
      .label('Pauta')
      .max(2048)
      .nullable(),
    pontos_atencao: string()
      .label('Pontos de atenção')
      .max(2048)
      .nullable(),
    // campo não utilizado em Obras
    risco: array()
      .label('Riscos associados')
      .nullable()
      .of(
        number()
          .label('Risco')
          .nullable()
          .required(),
      ),
  });

export const aditivoDeContrato = object({
  contrato_id: number()
    .label('Contrato')
    .integer()
    .positive()
    .required(),
  data: date()
    .label('Data')
    .required(),
  numero: string()
    .label('Número do aditivo')
    .min(1)
    .max(500)
    .required(),
  tipo_aditivo_id: number()
    .label('Tipo')
    .integer()
    .positive()
    .required(),
  valor: number()
    .label('Valor')
    .nullableOuVazio(),
  percentual_medido: number()
    .label('Percentual medido')
    .min(0)
    .max(100)
    .nullableOuVazio(),
  data_termino_atualizada: date()
    .label('Data de término atualizada')
    .nullableOuVazio(),
});

export const andamentoDaFase = (órgãoRequerido = false, pessoaRequerida = false) => object({
  fase_id: number()
    .label('Fase')
    .min(1, '${label} inválido')
    .required(),
  orgao_responsavel_id: (() => {
    const validação = number()
      .label('Órgão responsável')
      .min(1, '${label} inválido')
      .transform((v) => (!v ? null : v))
      .when('pessoa_responsavel_id', (pessoaResponsavelId, field) => (pessoaResponsavelId
        ? field.required()
        : field.nullable()));

    return órgãoRequerido
      ? validação.required()
      : validação.nullable();
  })(),
  pessoa_responsavel_id: (() => {
    const validação = number()
      .label('Pessoa responsável')
      .min(1, '${label} inválido')
      .nullable()
      .transform((v) => (!v ? null : v));

    return pessoaRequerida
      ? validação.required()
      : validação.nullable();
  })(),
  situacao_id: number()
    .label('Situação')
    .min(1, '${label} inválida')
    .nullable()
    .transform((v) => (!v ? null : v)),
  tarefas: array()
    .label('Tarefas')
    .of(
      object({
        id: number()
          .label('Tarefa')
          .min(1, '${label} inválido')
          .required(),
        orgao_responsavel_id: number()
          .label('Órgão responsável pela tarefa')
          .min(1, '${label} inválido')
          .nullable(),
        concluida: boolean()
          .label('Concluída?')
          .required(),
      }),
    )
    .nullable(),
  transferencia_id: number()
    .label('Transferência')
    .min(1, '${label} inválido')
    .required(),
});

export const arquivo = (semEnvio) => object()
  .shape({
    arquivo: string()
      .label('Arquivo')
      .when('semEnvioDeArquivo', ((_, field) => ((semEnvio)
        ? field.notRequired()
        : field.required('Selecione um arquivo')))),
    data: date()
      .label('Data')
      .max(dataMax)
      .min(dataMin)
      .nullable(),
    descricao: string()
      .label('Descrição')
      .required(),
    diretorio_caminho: string()
      .label('Pasta ou caminho'),
    tipo_documento_id: string()
      .label('Tipo de Documento')
      .when('semEnvioDeArquivo', ((_, field) => ((semEnvio)
        ? field.notRequired()
        : field.required()))),
  });

export const arquivoSimples = object()
  .shape({
    arquivo: string()
      .label('Arquivo')
      .required(),
    descricao: string()
      .label('Descrição')
      .required(),
    tipo_documento_id: string()
      .label('Tipo de Documento')
      .nullable(),
  });

export const categoriaAssunto = object()
  .shape({
    nome: string()
      .max(250)
      .min(3)
      .label('Nome')
      .required(),
  });

export const assunto = object()
  .shape({
    nome: string()
      .max(250)
      .min(3)
      .label('Nome')
      .required(),
    categoria_assunto_variavel_id: number()
      .label('Categorias de assunto')
      .required(),
  });

export const autenticação = object()
  .shape({
    email: string()
      .email('E-mail inválido')
      .required('Preencha seu e-mail'),
    senha: string()
      .required('Preencha sua senha'),
  });

export const auxiliarDePreenchimentoDeEvoluçãoDeMeta = object()
  .shape({
    meta_id: number()
      .label('Meta')
      .required(),
    valor_realizado: string()
      .label('Realizado mensal'),
    valor_realizado_acumulado: string()
      .label('Realizado acumulado'),
    enviar_cp: boolean()
      .label('Envio ao CP'),
  });

// PRÁ-FAZER: Provavelmente não é necessário. Deve ter sido criado por engano
export const contrato = object()
  .shape({
    comentarios: string()
      .label('Comentários')
      .max(1024)
      .nullable(),
    descricao: string()
      .label('Descrição')
      .max(2000)
      .nullable(),
    link: string()
      .label('Link')
      .nullable()
      .max(2000)
      .url(),
    observacoes: string()
      .label('Observações')
      .max(1024)
      .nullable(),
    numero: string()
      .label('Número do Contrato')
      .max(19)
      .min(19, '${label} está fora do formato')
      .matches(regEx.sei)
      .required(),
    processos_sei: array()
      .label('Processos SEI')
      .required(),
    status: string()
      .label('Status')
      .required(),
    valor: string()
      .label('Valor')
      .required(),
    quantidade_aditivos: number()
      .label('Quantidade de Aditivos')
      .required(),
  });

export const contratoDeObras = (tela = 'projeto') => object()
  .shape({
    numero: string()
      .label('Número do contrato')
      .max(1024)
      .required(),
    contrato_exclusivo: boolean()
      .nullable()
      .label(`Contrato exclusivo ${tela === 'projeto' ? 'desse Projeto' : 'dessa Obra'}`),
    status: string()
      .label('Status')
      .required(),
    processos_sei: array()
      .label('Processos SEI')
      .nullable(),
    modalidade_contratacao_id: number()
      .integer()
      .label('Modalidade da Contratação')
      .nullable()
      .positive()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    fontes_recurso: array()
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
            id: number()
              .nullable(),
            valor_percentual: mixed()
              .label('Valor percentual')
              .when('valor_nominal', {
                is: (valorNominal) => !valorNominal,
                then: number()
                  .nullable(),
                otherwise: mixed()
                  .nullable(),
              }),
          }, [['valor_percentual', 'valor_nominal']]),
      ),
    orgao_id: number()
      .nullable()
      .label('Área gestora'),
    objeto_resumo: string()
      .max(2048)
      .min(1)
      .nullable()
      .label('Objeto do contrato - resumido'),
    objeto_detalhado: string()
      .max(2048)
      .min(1)
      .nullable()
      .label('Objeto do contrato - detalhado'),
    contratante: string()
      .nullable()
      .label('Contratante'),
    empresa_contratada: string()
      .nullable()
      .label('Empresa contratada'),
    cnpj_contratada: string()
      .nullable()
      .label('CNPJ contratada'),
    data_assinatura: date()
      .nullable()
      .label('Data de assinatura')
      .transform((v) => (v === '' ? null : v)),
    prazo_numero: number()
      .nullable()
      .label('Prazo'),
    prazo_unidade: string()
      .nullable()
      .label(),
    data_base_mes: number()
      .nullable()
      .label('Data base'),
    data_base_ano: number()
      .nullable()
      .label(),
    data_inicio: date()
      .nullable()
      .label('Data de início')
      .transform((v) => (v === '' ? null : v)),
    data_termino: date()
      .nullable()
      .min(ref('data_inicio'), 'Data de término deve ser posterior à data de início')
      .label('Data de término previsto')
      .transform((v) => (v === '' ? null : v)),
    valor: string()
      .nullable()
      .label('Valor do contrato'),
    observacoes: string()
      .max(2048)
      .min(1)
      .nullable()
      .label('Observações'),
  });

export const custeio = object()
  .shape({
    custo_previsto: string()
      .required('Preencha o investimento.'),
    parte_dotacao: string()
      .required('Preencha a dotação.')
      .matches(regEx.dotaçãoComCuringas, 'Formato inválido'),
  });

export const dotação = string()
  .label('Dotação')
  .matches(regEx.dotaçãoComComplemento, 'regex em dotação');

export const equipamento = object({
  nome: string()
    .label('Equipamento')
    .min(3)
    .max(250)
    .required(),
});

export const etapa = object()
  .shape({
    descricao: string()
      .nullable(),
    endereco_obrigatorio: boolean()
      .nullable(),
    geolocalizacao: array()
      .label('Endereços')
      .of(
        string()
          .min(10, 'Endereço inválido'),
      )
      .when(['endereco_obrigatorio', 'termino_real'], {
        is: (enderecoObrigatorio, terminoReal) => enderecoObrigatorio && terminoReal,
        then: array().min(1),
        otherwise: array().min(0),
      }),
    inicio_previsto: string()
      .required('Preencha a data')
      .matches(regEx['day/month/year'], 'Formato inválido'),
    inicio_real: string()
      .nullable()
      .matches(regEx['day/month/year'], 'Formato inválido'),
    ordem: string()
      .nullable(),
    percentual_execucao: number()
      .integer()
      .label('Execução')
      .max(100)
      .min(0)
      .nullable(),
    peso: number()
      .integer()
      .label('Ponderador')
      .min(0)
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    regiao_id: string()
      .nullable(),
    termino_previsto: string()
      .required('Preencha a data')
      .matches(regEx['day/month/year'], 'Formato inválido'),
    termino_real: string()
      .label('Término real')
      .nullable()
      .fieldUntilToday()
      .matches(regEx['day/month/year'], 'Formato inválido'),
    titulo: string()
      .required('Preencha o título'),
    variavel: object()
      .label('Variável associada')
      .shape({
        codigo: string()
          .label('Código')
          .when(['titulo'], {
            is: (titulo) => titulo !== undefined && titulo !== null,
            then: (field) => field.required(),
            otherwise: (field) => field.nullable(),
          }),
        titulo: string()
          .label('Título')
          .when(['codigo'], {
            is: (codigo) => codigo !== undefined && codigo !== null,
            then: (field) => field.required(),
            otherwise: (field) => field.nullable(),
          }),
      }, [['codigo', 'titulo']])
      .nullable(),
  });

export const etapaDeMonitoramento = object()
  .shape({
    endereco_obrigatorio: boolean()
      .nullable(),
    geolocalizacao: array()
      .label('Endereços')
      .of(
        string()
          .min(10, 'Endereço inválido'),
      )
      .when(['endereco_obrigatorio', 'termino_real'], {
        is: (enderecoObrigatorio, terminoReal) => enderecoObrigatorio && terminoReal,
        then: array().min(1),
        otherwise: array().min(0),
      }),
    inicio_real: string()
      .nullable()
      .required('Preencha a data')
      .matches(regEx['day/month/year'], 'Formato inválido'),
    termino_real: string()
      .label('Término real')
      .nullable()
      .fieldUntilToday()
      .matches(regEx['day/month/year'], 'Formato inválido'),
  });

export const etiqueta = object({
  descricao: string()
    .label('Descrição')
    .min(3)
    .max(250)
    .required(),
});

export const execuçãoOrçamentária = object()
  .shape({
    itens: array()
      .label('Execução orçamentária')
      .min(1)
      .of(
        object({
          mes: number()
            .label('Mês Ref.')
            .max(12)
            .min(1)
            .required(),
          percentual_empenho: number()
            .label('Percentual empenho')
            .max(100)
            .min(0)
            .nullable(),
          percentual_liquidado: number()
            .label('Percentual liquidado')
            .max(100)
            .min(0)
            .nullable(),
          valor_empenho: number()
            .label('Valor empenho')
            .min(0)
            .required(),
          valor_liquidado: number()
            .label('Valor liquidado')
            .min(0)
            .required(),
        }),
      ),
  });

export const fase = object()
  .shape({
    descricao: string()
      .nullable()
      .label('Descrição'),
    equipes: array()
      .nullable()
      .label('Equipe Responsável'),
    endereco_obrigatorio: boolean()
      .nullable()
      .label('Endereço obrigatório'),
    geolocalizacao: array()
      .label('Endereços ou Localização?')
      .of(
        string()
          .min(10, 'Endereço inválido'),
      )
      .when(['endereco_obrigatorio', 'termino_real'], {
        is: (enderecoObrigatorio, terminoReal) => enderecoObrigatorio && terminoReal,
        then: array().min(1),
        otherwise: array().min(0),
      }),
    inicio_previsto: string()
      .required('Preencha a data')
      .matches(regEx['day/month/year'], 'Formato inválido')
      .label('Início previsto'),
    inicio_real: string()
      .nullable()
      .matches(regEx['day/month/year'], 'Formato inválido')
      .label('Início real'),
    ordem: string()
      .nullable()
      .label('Ordem'),
    percentual_execucao: number()
      .integer()
      .label('Execução')
      .max(100)
      .min(0)
      .nullable(),
    peso: number()
      .integer()
      .label('Ponderador')
      .min(0)
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    regiao_id: string()
      .nullable(),
    responsaveis: array().label('Responsável'),
    termino_previsto: string()
      .required('Preencha a data')
      .matches(regEx['day/month/year'], 'Formato inválido')
      .label('Término previsto'),
    termino_real: string()
      .nullable()
      .fieldUntilToday()
      .matches(regEx['day/month/year'], 'Formato inválido')
      .label('Término real'),
    titulo: string()
      .required('Preencha o título')
      .label('Nome'),
    variavel: object()
      .label('Variável Associada')
      .shape({
        codigo: string()
          .label('Código')
          .when(['titulo'], {
            is: (titulo) => titulo !== undefined && titulo !== null,
            then: (field) => field.required(),
            otherwise: (field) => field.nullable(),
          }),
        titulo: string()
          .label('Título')
          .when(['codigo'], {
            is: (codigo) => codigo !== undefined && codigo !== null,
            then: (field) => field.required(),
            otherwise: (field) => field.nullable(),
          }),
      }, [['codigo', 'titulo']])
      .nullable(),
  });

export const fonte = object()
  .shape({
    nome: string()
      .max(250)
      .min(3)
      .label('Nome')
      .required(),
  });

export const geoLocalização = object()
// shape() necessário para não cair num ciclo infinito na validação de coordenadas
  .shape({
    cep: string()
      .label('CEP')
      .max(1024)
      .nullable(),
    latitude_de_busca: number()
      .label('Latitude')
      .max(+90)
      .min(-90)
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .when('longitude_de_busca', {
        is: (longitudeDeBusca) => ![null, undefined].includes(longitudeDeBusca),
        then: (field) => field.required(),
        otherwise: (field) => field.nullable(),
      }),
    longitude_de_busca: number()
      .label('Longitude')
      .max(+180)
      .min(-180)
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .when('latitude_de_busca', {
        is: (latitudeDeBusca) => ![null, undefined].includes(latitudeDeBusca),
        then: (field) => field.required(),
        otherwise: (field) => field.nullable(),
      }),
    rotulo: string()
      .label('Rótulo para marcador')
      .max(1024)
      .nullable(),
    rua: string()
      .label('Logradouro')
      .max(1024)
      .required()
      .nullable(),
    numero: string()
      .label('Número')
      .max(1024)
      .nullable(),
    tipo: mixed()
      .label('Tipo')
      .oneOf(tiposDeLogradouro)
      .required(),
    termo_de_busca: string()
      .label('Termo de busca')
      .nullable(),
  // necessário para não cair num ciclo infinito na validação de coordenadas
  }, [
    ['longitude_de_busca', 'latitude_de_busca'],
  ]);

export const geraçãoDeVariávelComposta = (tiposDeOperações = []) => object()
  .shape({
    codigo: string()
      .label('Código prefixo')
      .required(),
    janela: number()
      .integer()
      .label('Meses')
      .when('tipo_de_janela', ((tipoDeJanela, field) => {
        switch (tipoDeJanela) {
          case 'meses_anteriores':
            return field
              .negative('${label} não pode ser zero nem vazio');
          case 'media':
            return field
              .min(1);
          case 'mes_corrente':
            return field
              .max(1)
              .min(1);
          default:
            return field;
        }
      })),
    mostrar_monitoramento: boolean()
      .nullable(),
    nivel_regionalizacao: number()
      .label('Nível de regionalização')
      .min(1, 'Selecione Nível de regionalização'),
    operacao: mixed()
      .label('Operação')
      .oneOf(tiposDeOperações, 'A operação escolhida é inválida')
      .required(),
    regioes: array()
      .label('Regiões')
      .min(1, 'Selecione ao menos uma região'),
    usar_serie_acumulada: boolean()
      .label('Utilizar valores acumulados'),
    tipo_de_janela: mixed()
      .label('Padrão de uso')
      .oneOf([
        'meses_anteriores',
        'media',
        'mes_corrente',
      ], 'O tipo escolhido é inválido')
      .required(),
    titulo: string()
      .label('Título')
      .required(),
  });

export const indicador = object()
  .shape({
    acumulado_valor_base: number()
      .label('Valor base do indicador')
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .nullable(),
    meta_valor_nominal: number()
      .label('Valor alvo')
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .nullable(),
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

export const grupoDeObservadores = object({
  participantes: array()
    .label('Participantes')
    .nullable(),
  orgao_id: number()
    .label('Órgão responsável')
    .min(1, 'Selecione um órgão responsável')
    .required(),
  titulo: string()
    .label('Nome')
    .required(),
});

export const gruposTematicos = object({
  nome: string()
    .label('Grupo temático')
    .min(3)
    .max(250)
    .required(),
  programa_habitacional: boolean()
    .label('Nome do programa habitacional')
    .nullable(),
  unidades_habitacionais: boolean()
    .label('Número de unidades habitacionais')
    .nullable(),
  familias_beneficiadas: boolean()
    .label('Número de famílias beneficiadas')
    .nullable(),
  unidades_atendidas: boolean()
    .label('Número de unidades atendidas')
    .nullable(),
});

export const equipes = object({
  colaboradores: array()
    .label('Responsáveis pela equipe')
    .nullable('Responsáveis inválidos'),
  orgao_id: number()
    .label('Órgão responsável')
    .nullable(),
  participantes: array()
    .label('Participantes alocados à equipe')
    .nullable('Participantes inválidos'),
  perfil: mixed()
    .label('Tipo de equipe')
    .oneOf(Object.keys(tipoDePerfil))
    .required('Tipo de equipe inválido'),
  titulo: string()
    .label('Nome')
    .min(3)
    .max(120)
    .required('Nome inválido'),
});

export const liçãoAprendida = object()
  .shape({
    contexto: string()
      .label('Contexto')
      .max(2048)
      .required(),
    data_registro: date()
      .label('Data do registro')
      .max(dataMax)
      .min(dataMin)
      .required(),
    descricao: string()
      .label('O que foi feito')
      .required()
      .max(2048)
      .nullable(),
    observacao: string()
      .label('Observação')
      .max(2048)
      .nullable(),
    resultado: string()
      .label('Resultado')
      .max(2048)
      .nullable(),
    responsavel: string()
      .label('Responsável')
      .required(),
  });

export const macrotema = object({
  descricao: string()
    .label('Nome')
    .max(500)
    .required(),
});

export const mandato = object({
  atuacao: string()
    .label('Atuação')
    .nullable(),
  biografia: string()
    .label('Biografia')
    .nullable(),
  cargo: mixed()
    .label('Cargo')
    .oneOf(Object.keys(cargosDeParlamentar))
    .required(),
  eleicao_id: number()
    .label('Eleição')
    .min(1, 'Eleição inválida')
    .required(),
  eleito: boolean()
    .label('Eleito')
    .required(),
  endereco: string()
    .label('Endereco')
    .nullable(),
  email: string()
    .email()
    .label('Email')
    .nullable(),
  telefone: string()
    .label('Telefone')
    .nullable(),
  gabinete: string()
    .label('Gabinete')
    .nullable(),
  suplencia: mixed()
    .label('Suplência')
    // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
    .oneOf([...Object.keys(níveisDeSuplência), null])
    .nullable(),
  partido_atual_id: number()
    .label('Partido atual')
    .min(1, 'Partido atual inválido')
    .required(),
  partido_candidatura_id: number()
    .label('Partido da candidatura')
    .min(1, 'Partido da candidatura inválido')
    .required(),
  uf: mixed()
    .label('Estado')
    .oneOf(estadosDoBrasil.map((x) => x.sigla)).required(),
  votos_capital: number()
    .label('Total de votos na capital')
    .nullable(),
  votos_estado: number()
    .label('Total de votos no estado')
    .nullable(),
  votos_interior: number()
    .label('Total de votos no interior')
    .nullable(),
});

export const meta = (activePdm) => object().shape({
  codigo: string()
    .label('Código'),
  complemento: string()
    .label('Complemento')
    .nullable(),
  contexto: lazy(() => (activePdm?.possui_contexto_meta
    ? string()
      .label(activePdm?.rotulo_contexto_meta || 'Contexto')
      .required()
    : mixed()
      .nullable())),
  macro_tema_id: lazy(() => (activePdm?.possui_macro_tema
    ? string()
      .label(activePdm?.rotulo_macro_tema || 'Macro tema')
      .required()
    : mixed()
      .nullable())),
  origens_extra: array()
    .label('Relacionamentos com outros compromissos')
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

  pdm_id: string()
    .label('PdM')
    .nullable(),
  sub_tema_id: lazy(() => (activePdm?.possui_sub_tema
    ? string()
      .label(activePdm?.rotulo_sub_tema || 'Sub_tema')
      .required()
    : mixed()
      .nullable())),
  tema_id: lazy(() => (activePdm?.possui_tema
    ? string()
      .label(activePdm?.rotulo_tema || 'Tema')
      .required()
    : mixed()
      .nullable())),
  titulo: string()
    .label('Título'),
});

export const modalidadeContratacao = object({
  nome: string()
    .label('Nome')
    .min(3)
    .max(250)
    .required(),
});

const monitoramentoDeMetasBase = object()
  .shape({
    ciclo_fisico_id: number()
      .label('Ciclo físico')
      .required(),
    meta_id: number()
      .label('Meta')
      .required(),
  });

export const monitoramentoDeMetasAnalise = monitoramentoDeMetasBase.concat(
  object({
    informacoes_complementares: string()
      .label('Informações complementares')
      .max(10240)
      .required(),
  }),
);

export const monitoramentoDeMetasFechamento = monitoramentoDeMetasBase.concat(
  object({
    comentario: string()
      .label('Comentário')
      .max(10240)
      .required(),
  }),
);

export const monitoramentoDeMetasRisco = monitoramentoDeMetasBase.concat(
  object({
    detalhamento: string()
      .label('Detalhamento')
      .max(10240)
      .required(),
    ponto_de_atencao: string()
      .label('Ponto de atenção')
      .max(10240)
      .nullable(),
  }),
);

export const monitoramentoDePlanoDeAção = object()
  .shape({
    descricao: string()
      .required(),
    data_afericao: date()
      .max(dataMax)
      .min(dataMin)
      .required(),
  });

export const novaSenha = object()
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

export const obras = object({
  atividade_id: number()
    .nullable(),
  colaboradores_no_orgao: array()
    .label('Órgãos Colaboradores')
    .of(
      number()
        .min(1),
    )
    .nullable(),
  empreendimento_id: number()
    .label('Identificador do empreendimento')
    .min(1, 'Empreendimento inválido')
    .nullable(),
  equipamento_id: number()
    .label('Equipamento/Estrutura pública')
    .min(1, 'Equipamento/Estrutura pública inválida')
    .nullable()
    .meta({
      permite_edicao_em_massa: true,
      storeKey: 'equipamentos',
      fetchAction: 'buscarTudo',
      listState: 'lista',
      optionValue: 'id',
      optionLabel: 'nome',
    }),
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
          id: number()
            .nullable(),
          valor_nominal: mixed()
            .label('Previsão de custo')
            .when('valor_percentual', {
              is: (valorPercentual) => !valorPercentual,
              then: number()
                .required('Ao menos um tipo de valor é necessário.'),
              otherwise: mixed()
                .nullable(),
            }),
          valor_percentual: mixed()
            .label('Valor percentual')
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
    .required()
    .meta({
      permite_edicao_em_massa: true,
      storeKey: 'grupos_tematicos',
      fetchAction: 'buscarTudo',
      listState: 'lista',
      optionValue: 'id',
      optionLabel: 'nome',
    }),
  iniciativa_id: number()
    .when(['origem_tipo', 'atividade_id'], {
      is: (origemTipo, atividadeId) => origemTipo === 'PdmSistema' && atividadeId,
      then: (field) => field.required(),
      otherwise: (field) => field.nullable(),
    }),
  mdo_detalhamento: string()
    .label('Detalhamento/Escopo da obra')
    .max(2048)
    .nullable()
    .meta({ permite_edicao_em_massa: true }),
  mdo_n_familias_beneficiadas: number()
    .label('Número de famílias beneficiadas')
    .nullable()
    .min(0),
  mdo_n_unidades_habitacionais: number()
    .label('Número de unidades')
    .min(0)
    .nullable(),
  mdo_n_unidades_atendidas: number()
    .label('Número de unidades atendidas até o momento')
    .min(0)
    .nullable()
    .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
  mdo_observacoes: string()
    .label('Observações')
    .max(2048)
    .nullable()
    .meta({ permite_edicao_em_massa: true }),
  mdo_previsao_inauguracao: date()
    .label('Data de inauguração planejada')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .typeError('Informe uma data válida (AAAA-MM-DD)')
    .meta({ permite_edicao_em_massa: true }),
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
    .nullable()
    .meta({
      permite_edicao_em_massa: true,
      storeKey: 'órgãos',
      fetchAction: 'getAll',
      listState: 'organs',
      optionValue: 'id',
      optionLabel: (item) => `${item.sigla} - ${item.descricao}`,
    }),
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
    .nullable(),
  portfolios_compartilhados: array()
    .label('Compartilhar com portfólios')
    .nullable(),
  portfolio_id: number()
    .label('Nome do portfólio')
    .min(1, 'Portfólio inválido')
    .required()
    .meta({
      permite_edicao_em_massa: true,
      storeKey: 'portfolios_obra',
      fetchAction: 'buscarTudo',
      listState: 'lista',
      optionValue: 'id',
      optionLabel: 'titulo',
    }),
  previsao_custo: number()
    .label('Custo previsto inicial')
    .min(0)
    .nullable(),
  previsao_inicio: date()
    .label('Previsão de início')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .meta({ permite_edicao_em_massa: true }),
  previsao_termino: date()
    .label('Previsão de término')
    .max(dataMax)
    .when('previsao_inicio', (inicio, schema) => {
      if (inicio) {
        return schema.min(inicio, 'Precisa ser posterior à data de início');
      }
      return schema;
    })
    .nullable()
    .meta({ permite_edicao_em_massa: true }),
  programa_id: number()
    .label('Programa Habitacional')
    .positive()
    .integer()
    .nullable(),
  projeto_etapa_id: number()
    .label('Etapa')
    .nullable()
    .meta({
      permite_edicao_em_massa: true,
      storeKey: 'etapas_projetos',
      fetchAction: 'buscarTudo',
      listState: 'lista',
      optionValue: 'id',
      optionLabel: 'descricao',
    }),
  regiao_ids: array()
    .label('Subprefeitura')
    .of(
      number()
        .min(1),
    )
    .nullable(),
  responsavel_id: number()
    .label('Ponto focal responsável')
    .min(1, 'Responsável inválido')
    .nullable(),
  responsaveis_no_orgao_gestor: array()
    .label('Ponto Focal de Monitoramento')
    .of(
      number()
        .min(1),
    )
    .nullable(),
  secretario_colaborador: string()
    .label('Secretário colaborador da obra')
    .max(250)
    .nullable(),
  secretario_executivo: string()
    .label('Secretário gestor do portfólio')
    .max(250)
    .nullable()
    .meta({ permite_edicao_em_massa: true }),
  secretario_responsavel: string()
    .label('Secretário responsável pela obra')
    .max(250)
    .nullable()
    .meta({ permite_edicao_em_massa: true }),
  secretario: string()
    .label('Secretário gestor do portfólio')
    .nullable(),
  status: mixed()
    .label('Status')
    .oneOf(Object.keys(statusObras))
    .required()
    .meta({
      permite_edicao_em_massa: true,
      optionSource: 'statusObras',
      optionValue: 'value',
      optionLabel: 'label',
    }),
  tags: array()
    .label('Etiquetas')
    .of(
      number()
        .min(1),
    )
    .nullable(),
  tipo_intervencao_id: number()
    .label('Tipo de obra/intervenção')
    .min(1, 'Tipo de obra/intervenção inválido')
    .required()
    .meta({
      permite_edicao_em_massa: true,
      storeKey: 'tipos_de_intervencao',
      fetchAction: 'buscarTudo',
      listState: 'lista',
      optionValue: 'id',
      optionLabel: 'nome',
    }),
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

export const oportunidadeFiltros = object({
  tipo: string(),
  avaliacao: string(),
  ano: number(),
  palavras_chave: string(),
});

export const orçamentoRealizado = object({
  dotacao: string()
    .label('Dotação')
    .matches(regEx.dotação, { excludeEmptyString: true })
    .required(),
  dotacao_complemento: string()
    .label('Complemento')
    .matches(regEx.complementoDeDotação, { excludeEmptyString: true })
    .required('Necessário complementar a dotação com o detalhamento da fonte orçamentária'),
  itens: array()
    .label('Execução orçamentária')
    .min(1)
    .of(
      object({
        mes: number()
          .label('Mês Ref.')
          .max(12, 'Mês inválido')
          .min(1, 'Mês inválido')
          .required(),
        valor_empenho: number()
          .label('Valor empenho')
          .min(0)
          .required(),
        valor_liquidado: number()
          .label('Valor liquidado')
          .min(0)
          .required(),
      }),
    ),
});

export const órgão = object()
  .shape({
    cnpj: string()
      .label('CNPJ')
      .matches(regEx.cnpj)
      .nullableOuVazio(),
    descricao: string()
      .label('Descrição')
      .nullable(),
    email: string()
      .email()
      .label('Email')
      .nullable(),
    nivel: number()
      .required(),
    parente_id: number()
      .when('nivel', (nivel, field) => (nivel > 1
        ? field.required('Esse campo é obrigatório para o nível maior do que 1')
        : field.nullable())),
    secretario_responsavel: string()
      .label('Secretário')
      .nullable(),
    sigla: string()
      .label('Sigla')
      .required(),
  });

export const perdidoDeComplementação = object()
  .shape({
    pedido: string()
      .label('Pedido de complementação')
      .required(),
    linhas: array()
      .label('Variáveis compostas')
      .min(1)
      .of(
        object()
          .shape({
            data_valor: date()
              .label('Data do registro do valor da variável')
              .max(dataMax)
              .min(dataMin)
              .required(),
            variavel_id: number()
              .min(1)
              .required(),
          }),
      ),
  });

export const planoDeAção = object()
  .shape({
    contato_do_responsavel: string()
      .label('Contato do responsável')
      .nullable(),
    contramedida: string()
      .label('Contramedida')
      .max(50000)
      .required(),
    custo: number()
      .label('Custo da contramedida')
      .min(0)
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    custo_percentual: number()
      .label('% do custo do projeto')
      .max(100)
      .min(0)
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    data_termino: date()
      .label('Data de término efetivo')
      .max(dataMax)
      .min(dataMin)
      .nullable(),
    medidas_de_contingencia: string()
      .label('Medidas de contingência')
      .max(50000),
    orgao_id: number()
      .label('Órgão')
      .min(1, 'Selecione um órgão responsável')
      .required(),
    prazo_contramedida: date()
      .label('Data de término previsto')
      .max(dataMax)
      .min(dataMin)
      .required(),
    responsavel: string()
      .label('Responsável')
      .required()
      .max(60),
  }, [['orgao_id', 'responsavel']]);

export const planoSetorial = object({
  ativo: boolean()
    .label('Ativo')
    .nullable(),
  data_fim: date()
    .label('Data de fim')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .required()
    .transform((v) => (!v ? null : v)),
  data_inicio: date()
    .label('Data de início')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .required()
    .transform((v) => (!v ? null : v)),
  data_publicacao: date()
    .label('Data de publicação')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .transform((v) => (!v ? null : v)),
  descricao: string()
    .label('Descrição')
    .max(2500)
    .nullable()
    .required(),
  equipe_tecnica: string()
    .label('Equipe técnica')
    .max(2500)
    .nullable()
    .required(),
  legislacao_de_instituicao: string()
    .label('Legislação de instituição')
    .nullable()
    .max(50000),
  meses: array()
    .label('Meses monitorados - ciclo físico'),
  monitoramento_orcamento: boolean()
    .label('Monitoramento de orçamento')
    .nullable(),
  nivel_orcamento: mixed()
    .label('Nível de controle orçamentário')
    // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
    .oneOf([...niveisDeOrcamento, null])
    .transform((v) => (!v ? null : v))
    .when('monitoramento_orcamento', (monitoramentoOrcamento, field) => (monitoramentoOrcamento
      ? field.required()
      : field.nullable())),
  nome: string()
    .label('Nome')
    .min(1)
    .max(250)
    .required(),
  orgao_admin_id: number()
    .label('Órgão administrador')
    .min(1, 'Órgão inválido')
    .nullable()
    .transform((v) => (!v ? null : v)),
  pdm_anteriores: number()
    .label('Planos antecessores')
    .min(1, 'Plano inválido')
    .nullable()
    .transform((v) => (!v ? null : v)),
  periodo_do_ciclo_participativo_fim: date()
    .label('Fim do ciclo participativo')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .transform((v) => (!v ? null : v)),
  periodo_do_ciclo_participativo_inicio: date()
    .label('Início do ciclo participativo')
    .max(dataMax)
    .min(dataMin)
    .nullable()
    .transform((v) => (!v ? null : v)),
  possui_atividade: boolean()
    .label('Habilitar atividades')
    .nullable(),
  possui_complementacao_meta: boolean()
    .label('Habilitar complementação')
    .nullable(),
  possui_contexto_meta: boolean()
    .label('Habilitar contexto')
    .nullable(),
  possui_iniciativa: boolean()
    .label('Habilitar iniciativas')
    .when('possui_atividade', (valor, campo) => (valor
      ? campo.required()
      : campo.nullable())),
  possui_macro_tema: boolean()
    .label('Habilitar macro-tema')
    .nullable(),
  possui_sub_tema: boolean()
    .label('Habilitar sub-tema')
    .nullable(),
  possui_tema: boolean()
    .label('Habilitar tema')
    .nullable(),
  prefeito: string()
    .label('Prefeito/Titular')
    .max(250)
    .required(),
  'ps_admin_cp.equipes': array()
    .label('Equipes de Administradores')
    .of(
      number()
        .positive()
        .required(),
    ),
  'ps_ponto_focal.equipes': array()
    .label('Equipes de Pontos focais')
    .of(
      number()
        .positive()
        .required(),
    ),
  'ps_tecnico_cp.equipes': array()
    .label('Equipes de Técnicos')
    .of(
      number()
        .positive()
        .required(),
    ),
  rotulo_atividade: string()
    .label('Rótulo de atividades')
    .max(30)
    .when('possui_atividade', (valor, campo) => (valor
      ? campo.required()
      : campo.nullable())),
  rotulo_complementacao_meta: string()
    .label('Rótulo de complementação')
    .max(30)
    .when('possui_complementacao_meta', (valor, campo) => (valor
      ? campo.required()
      : campo.nullable())),
  rotulo_contexto_meta: string()
    .label('Rótulo de contexto')
    .max(30)
    .when('possui_contexto_meta', (valor, campo) => (valor
      ? campo.required()
      : campo.nullable())),
  rotulo_iniciativa: string()
    .label('Rótulo de iniciativas')
    .max(30)
    .when('possui_iniciativa', (valor, campo) => (valor
      ? campo.required()
      : campo.nullable())),
  rotulo_macro_tema: string()
    .label('Rótulo de macro-temas')
    .max(30)
    .when('possui_macro_tema', (valor, campo) => (valor
      ? campo.required()
      : campo.nullable())),
  rotulo_sub_tema: string()
    .label('Rótulo de sub-temas')
    .max(30)
    .when('possui_sub_tema', (valor, campo) => (valor
      ? campo.required()
      : campo.nullable())),
  rotulo_tema: string()
    .label('Rótulo de temas')
    .max(30)
    .when('possui_tema', (valor, campo) => (valor
      ? campo.required()
      : campo.nullable())),
  upload_logo: string()
    .label('Logotipo')
    .nullable(),
});

export const portfolio = object({
  data_criacao: date()
    .label('Data de criação')
    .nullable()
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .transform((v) => (!v ? null : v)),
  descricao: string()
    .label('Descrição')
    .min(0)
    .max(2040)
    .required(),
  grupo_portfolio: array()
    .label('Grupos de observadores')
    .nullable()
    .of(
      number()
        .label('Pessoa')
        .required(),
    ),
  nivel_maximo_tarefa: number()
    .label('Nível máximo de aninhamento de tarefas')
    .min(1)
    .max(32)
    .required(),
  modelo_clonagem: boolean()
    .label('Modelo de clonagem')
    .nullable(),
  nivel_regionalizacao: number()
    .label('Nível de regionalização')
    .min(1)
    .max(4)
    .required(),
  orcamento_execucao_disponivel_meses: array()
    .label('Meses disponíveis para orçamento')
    .min(1, 'Selecione ao menos um mês')
    .required(),
  orgaos: array()
    .label('Órgãos')
    .min(1, 'Selecione ao menos um órgão')
    .required(),
  titulo: string()
    .label('Nome')
    .required('Um portfólio requer um título'),
});

export const painelExterno = object({
  descricao: string()
    .label('Descrição')
    .min(0)
    .max(2040)
    .nullable(),
  grupos: array()
    .label('Grupos de Painéis Externos')
    .nullable()
    .of(
      number()
        .label('Id')
        .required(),
    ),
  titulo: string()
    .label('Nome')
    .required(),
  link: string()
    .label('Link')
    .max(1024)
    .required()
    .url(),
});

export const partido = object({
  sigla: string()
    .label('Sigla')
    .max(20)
    .required(),
  nome: string()
    .label('Nome')
    .max(250)
    .required(),
  numero: number()
    .label('Número')
    .max(99)
    .required(),
  observacao: string()
    .label('Presidente nacional')
    .nullable(),
  fundacao: string()
    .label('Data de criação')
    .nullable(),
  encerramento: string()
    .label('Data de encerramento')
    .nullable(),
});

export const bancada = object({
  sigla: string()
    .label('Sigla')
    .max(20)
    .required(),
  nome: string()
    .label('Nome')
    .max(250)
    .required(),
  partido_ids: array()
    .label('Partidos')
    .nullable()
    .of(
      number()
        .min(1),
    ),
});

export const nota = object({
  data_nota: date()
    .label('Data da nota')
    .max(dataMax)
    .min(dataMin)
    .required(),
  dispara_email: boolean()
    .label('Disparo de e-mail')
    .required(),
  enderecamentos: array()
    .label('Endereçamento')
    .nullable()
    .of(
      object().shape({
        orgao_enderecado_id: number()
          .label('Órgão')
          .required(),
        pessoa_enderecado_id: number()
          .label('Pessoas')
          .transform((v) => (!v ? null : v))
          .nullable(),
      }),
    ),
  nota: string()
    .label('Nota')
    .required(),
  rever_em: date()
    .label('Rever em')
    .max(dataMax)
    .min(dataMin)
    .nullable(),
  status: string()
    .label('Status')
    .required(),
  tipo_nota_id: number()
    .label('Tipo de nota')
    .required(),
});

export const parlamentar = object({
  em_atividade: boolean()
    .label('Em exercício')
    .nullable(),
  nome_popular: string()
    .label('Nome de urna')
    .min(1)
    .max(250)
    .required(),
  nome: string()
    .label('Nome Civil')
    .min(1)
    .max(250)
    .required(),
  cpf: string()
    .label('CPF')
    .min(14)
    .max(14)
    .required(),
  nascimento: date()
    .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18)), 'Data inválida, o parlamentar precisa ter no mínimo 18 anos')
    .min(new Date(new Date().setFullYear(new Date().getFullYear() - 100)), 'Data inválida')
    .label('Nascimento')
    .required(),
  telefone: string()
    .label('Telefone Fixo')
    .nullable(),
  avatar: string(),
  assessores: array()
    .label('Assessores')
    .nullable()
    .of(
      object().shape({
        nome: string()
          .label('Nome')
          .required('O nome é obrigatório'),
        email: string()
          .label('Email')
          .email('Insira um email válido')
          .required('O email é obrigatório'),
        telefone: string()
          .label('Telefone')
          .required('O telefone é obrigatório'),
      }),
    ),
});

export const permissaoEdicaoOrcamento = object().shape({
  execucao_disponivel_meses: array().label('Meses disponíveis'),
  orcamento_config: array().of(object().shape({
    ano_referencia: number(),
    execucao_disponivel_meses: array().label('Meses disponíveis'),
    execucao_disponivel: boolean().label('Execução orçamentaria'),
    id: number(),
    pdm_id: number(),
    planejado_disponivel: boolean().label('Orçamento planejado'),
    previsao_custo_disponivel: boolean().label('Previsão de custo'),
  })),
});

export const pessoaNaEquipeDeParlamentar = object({
  email: string()
    .email()
    .label('Email')
    .required(),
  nome: string()
    .label('Nome')
    .required(),
  telefone: string()
    .label('Telefone')
    .required(),
  tipo: mixed()
    .label('Tipo')
    .oneOf(tiposNaEquipeDeParlamentar)
    .required(),
});

export const situacao = object({
  situacao: string()
    .label('Situação')
    .min(0)
    .max(250)
    .required(),
  tipo_situacao: mixed()
    .label('Tipo')
    .oneOf(tiposSituacaoSchema)
    .required(),
});

export const statusDistribuicao = object({
  status_id: object()
    .label('Status')
    .nullable(),
  data_troca: date()
    .label('Data')
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .required()
    .transform((v) => (!v ? null : v)),
  orgao_responsavel_id: number()
    .label('Órgão Responsável')
    .required(),
  nome_responsavel: string()
    .label('Responsável')
    .required(),
  motivo: string()
    .label('Motivo')
    .required(),
});

export const statusDistribuicaoWorkflow = object({
  nome: string()
    .label('Nome')
    .required(),
  tipo: mixed()
    .label('Tipo')
    .required()
    .oneOf(Object.keys(tiposStatusDistribuicao)),
});

export const subtema = object({
  descricao: string()
    .label('Nome')
    .max(500)
    .required(),
});

export const suplentes = object({
  nome: string()
    .label('Nome')
    .required(),
  ordem: mixed()
    .label('Ordem')
    .required(),
});

export const tema = object({
  descricao: string()
    .label('Nome')
    .max(500)
    .required(),
});

export const tipoDeAditivo = object({
  nome: string()
    .label('Nome')
    .max(250)
    .min(3)
    .required(),
  habilita_valor: boolean()
    .label('Habilita valor')
    .nullable(),
  habilita_valor_data_termino: boolean()
    .label('Habilita data de término')
    .nullable(),
});

export const tipoDeTransferencia = object({
  nome: string()
    .label('Nome')
    .required(),
  categoria: mixed()
    .label('Tipo')
    .required()
    .oneOf(Object.keys(categoriaDeTransferencia)),
  esfera: mixed()
    .label('Esfera')
    .required()
    .oneOf(Object.keys(esferasDeTransferencia)),
});

export const transferenciaDistribuicaoDeRecursos = object({
  assinatura_estado: date()
    .label('Data de assinatura do representante do estado')
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .nullable()
    .transform((v) => (!v ? null : v)),
  assinatura_municipio: date()
    .label('Data de assinatura do representante do município')
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .nullable()
    .transform((v) => (!v ? null : v)),
  assinatura_termo_aceite: date()
    .label('Data de assinatura do termo de aceite')
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .nullable()
    .transform((v) => (!v ? null : v)),
  conclusao_suspensiva: date()
    .label('Data de conclusão da suspensiva')
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .nullable()
    .transform((v) => (!v ? null : v)),
  contrato: string()
    .label('Número do contrato')
    .nullable(),
  convenio: string()
    .label('Número convênio/pré-convênio')
    .nullable(),
  custeio: number()
    .label('Custeio (R$)')
    .min(0)
    .required(),
  investimento: number()
    .label('Investimento (R$)')
    .min(0)
    .required(),
  data_empenho: date()
    .label('Data do empenho')
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .nullableOuVazio(),
  dotacao: string()
    .label('Dotacao')
    .nullable(),
  empenho: boolean()
    .label('Empenho')
    .nullable(),
  justificativa_aditamento: string()
    .label('Justificativa para aditamento')
    .max(250)
    .min(1, 'Justificativa para aditamento é obrigatório após editar a data de vigência')
    .nullable(),
  nome: string()
    .label('Nome')
    .min(1)
    .max(1024)
    .required(),
  objeto: string()
    .label('Objeto/Empreendimento')
    .max(1000)
    .required(),
  orgao_gestor_id: number()
    .label('Gestor Municipal')
    .min(1, 'Selecione um gestor municipal')
    .required(),
  programa_orcamentario_estadual: string()
    .label('Programa orçamentário estadual')
    .nullable(),
  programa_orcamentario_municipal: string()
    .label('Programa orçamentário municipal')
    .nullable(),
  proposta: string()
    .label('Proposta')
    .nullable(),
  registros_sei: array()
    .label('Número SEI')
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
  valor: number()
    .label('Valor do Repasse')
    .required()
    .nullable(),
  valor_contrapartida: number()
    .label('Valor contrapartida')
    .required()
    .nullable(),
  valor_total: number()
    .label('Valor total')
    .required()
    .nullable(),
  vigencia: date()
    .label('Data de vigência')
    .max(dataMax)
    .min(new Date(2003, 0, 1))
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
        .nullable(),
      valor: number()
        .label('Valor do repasse do parlamentar')
        .nullable(),
    })),
});

export const registroDeTransferencia = object({
  agencia_aceite: string()
    .label('Agência da conta de aceite')
    .nullable(),
  agencia_fim: string()
    .label('Agência da conta da secretaria fim')
    .nullable(),
  banco_aceite: string()
    .label('Banco da conta de aceite')
    .nullable(),
  banco_fim: string()
    .label('Banco da conta secretaria fim')
    .nullable(),
  conta_fim: string()
    .label('Número conta-corrente da secretaria fim')
    .nullable(),
  conta_aceite: string()
    .label('Número conta-corrente de aceite')
    .nullable(),
  custeio: number()
    .label('Custeio')
    .min(0)
    .required(),
  percentagem_custeio: number()
    .min(0),
  dotacao: string()
    .label('Dotação')
    .nullable(),
  empenho: boolean()
    .label('Empenho')
    .nullable(),
  valor: number()
    .label('Valor do Repasse')
    .nullable()
    .required(),
  valor_contrapartida: number()
    .label('Valor contrapartida')
    .nullable()
    .required(),
  ordenador_despesa: string()
    .label('Ordenador de despesas')
    .nullable(),
  valor_total: number()
    .label('Valor total')
    .required()
    .nullable(),
  gestor_contrato: string()
    .label('Gestor do Contrato')
    .nullable(),
  investimento: number()
    .label('Valor')
    .min(0)
    .required(),
  percentagem_investimento: number()
    .label('Porcentagem')
    .min(0),
  parlamentares: array()
    .label('Parlamentar')
    .nullable()
    .of(object({
      id: number()
        .nullable(),
      parlamentar_id: number()
        .label('Parlamentar'),
      objeto: string()
        .label('Objeto/Empreendimento')
        .max(1000)
        .nullable(),
      valor: number()
        .label('Valor do Repasse')
        .nullable(),
    })),
});

export const transferenciasVoluntarias = object({
  ano: number()
    .label('Ano')
    .nullable()
    .required(),
  clausula_suspensiva_vencimento: date()
    .label('data de vencimento da cláusula suspensiva')
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .transform((v) => (!v ? null : v))
    .when('clausula_suspensiva', (clausulaSuspensiva, field) => (clausulaSuspensiva
      ? field.required()
      : field.nullable())),
  tipo_id: number()
    .label('Tipo')
    .nullable()
    .required(),
  classificacao_id: string()
    .label('Classificação')
    .nullable(),
  clausula_suspensiva: boolean()
    .label('Cláusula suspensiva')
    .nullable(),
  detalhamento: string()
    .label('Detalhamento')
    .max(50000)
    .nullable(),
  emenda: string()
    .label('Emenda')
    .max(250)
    .min(1)
    .nullable(),
  emenda_unitaria: string()
    .label('Emenda unitária')
    .max(250)
    .min(1)
    .nullable(),
  esfera: mixed()
    .label('Esfera')
    .nullable()
    .required()
    .oneOf([...Object.keys(esferasDeTransferencia), null]),
  demanda: string()
    .label('Número da Demanda')
    .nullable(),
  interface: string()
    .label('Interface')
    .nullable(),
  nome_programa: string()
    .label('Nome do programa')
    .nullable(),
  normativa: string()
    .label('normativa')
    .nullable()
    .max(50000),
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
    .nullable(),
  parlamentares: array()
    .label('Parlamentar')
    .nullable()
    .of(object({
      id: number()
        .nullable(),
      parlamentar_id: number()
        .label('Parlamentar')
        .required(),
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
    .nullable(),
});

export const processo = object()
  .shape({
    comentarios: string()
      .label('Comentários')
      .max(1024)
      .nullable(),
    descricao: string()
      .label('Descrição')
      .max(2000)
      .nullable(),
    link: string()
      .label('Link')
      .nullable()
      .max(2000)
      .url(),
    observacoes: string()
      .label('Observações')
      .max(1024)
      .nullable(),
    processo_sei: string()
      .label('Processo SEI')
      .max(19)
      .min(19, '${label} está fora do formato')
      .matches(regEx.sei)
      .required(),
  });

export const processoDeObras = object()
  .shape({
    comentarios: string()
      .label('Comentários')
      .max(2048)
      .nullable(),
    descricao: string()
      .label('Descrição')
      .max(2048)
      .nullable(),
    link: string()
      .label('Link')
      .nullable()
      .max(2000)
      .url(),
    observacoes: string()
      .label('Observações')
      .max(2048)
      .nullable(),
    processo_sei: string()
      .label('Processo SEI')
      .max(19, '${label} está fora do formato')
      .min(16, '${label} está fora do formato')
      .matches(regEx.seiOuSinproc)
      .required(),
  });

export const programaHabitacional = object({
  nome: string()
    .label('Nome')
    .min(3)
    .max(250)
    .required(),
});

export const projeto = object()
  .shape({
    atividade_id: number()
      .nullable(),
    codigo: string()
      .label('Código')
      .nullable(),
    data_aprovacao: date()
      .label('Data de aprovação')
      .nullable()
      .max(dataMax)
      .min(new Date(2003, 0, 1)),
    data_revisao: date()
      .label('Data de revisão')
      .nullable()
      .max(dataMax)
      .min(new Date(2003, 0, 1)),
    equipe: array()
      .label('Equipe do Projeto')
      .nullable()
      .of(
        number()
          .label('Pessoa')
          .required(),
      )
      .meta({
        balaoInformativo: 'É composta por pessoas responsáveis por executar atividades planejadas e contribuir diretamente para o cumprimento dos objetivos do projeto, conforme escopo definido. Suas principais responsabilidades incluem colaborar com outros membros da equipe, atualizar as informações, reportar ao gerente de projeto e propor soluções para eventuais problemas.',
      }),
    grupo_portfolio: array()
      .label('Grupos de observadores')
      .nullable()
      .of(
        number()
          .label('Pessoa')
          .required(),
      ),
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
            id: number()
              .nullable(),
            valor_nominal: mixed()
              .label('Previsão de custo')
              .when('valor_percentual', {
                is: (valorPercentual) => !valorPercentual,
                then: number()
                  .required('Ao menos um tipo de valor é necessário.'),
                otherwise: mixed()
                  .nullable(),
              }),
            valor_percentual: mixed()
              .label('Valor percentual')
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
    logradouro_cep: string()
      .label('CEP')
      .max(1024)
      .nullable(),
    logradouro_nome: string()
      .label('Logradouro')
      .max(1024)
      .nullable(),
    logradouro_numero: string()
      .label('Número')
      .max(1024)
      .nullable(),
    logradouro_tipo: string()
      .label('Tipo')
      .max(1024)
      .nullable(),
    meta_codigo: string()
      .nullable(),
    meta_id: number()
      .nullable(),
    nao_escopo: string()
      .label('Não escopo')
      .nullable()
      .max(2048),
    nome: string()
      .label('Nome do projeto')
      .required('Um projeto requer um nome')
      .min(1, 'Esse nome é muito curto')
      .max(500, 'Esse nome é muito longo'),
    objetivo: string()
      .label('Objetivo')
      .max(2048)
      .nullable(),
    objeto: string()
      .label('Objeto')
      .max(2048)
      .nullable(),
    orgao_gestor_id: number()
      .label('Órgão Gestor do Portfólio - Escritório do Projeto')
      .min(1, 'Selecione um órgão gestor')
      .required('O projeto necessita de um órgão gestor')
      .meta({
        balaoInformativo: 'É o órgão que cumpre a função de Escritório de Projetos, sendo responsável pelo portfólio no qual o projeto está inserido.',
      }),
    orgao_responsavel_id: number()
      .label('Órgão responsável')
      .nullable()
      .meta({
        balaoInformativo: 'É o órgão responsável pela execução do projeto.',
      }),
    orgaos_participantes: array()
      .label('Órgãos participantes')
      .meta({
        balaoInformativo: 'São os órgãos nos quais estão alocadas as demais partes interessadas do projeto.',
      }),
    origem_outro: string()
      .label('Descrição de origem fora do PdM')
      .max(2048)
      .nullable()
      .when('origem_tipo', (origemTipo, field) => (origemTipo && origemTipo !== 'PdmSistema'
        ? field.required('Descrição de origem é obrigatório caso não se escolha um Programa de Metas corrente')
        : field)),
    origem_tipo: mixed()
      .label('Origem')
      .required('O projeto precisa de uma origem de recursos.')
      .oneOf(Object.keys(tiposDeOrigens), 'A origem escolhida é inválida'),
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

    portfolios_compartilhados: array()
      .label('Compartilhar com portfólios')
      .nullable(),
    publico_alvo: string()
      .label('Público alvo')
      .max(2048)
      .nullable(),
    portfolio_id: number('O projeto precisa pertencer a um portfólio')
      .label('Portfólio')
      .min(1, 'Selecione ao menos um portfólio')
      .required('O projeto precisa pertencer a um portfólio'),
    premissas: array()
      .label('Premissas')
      .of(
        object()
          .shape({
            id: number()
              .nullable(),
            premissa: string()
              .required('A premissa não pode estar em branco')
              .max(255, 'Premissa muito longa. Use 255 caracteres ou menos.'),
          }),
      )
      .strict(),
    previsao_custo: number()
      .label('Custo previsto inicial')
      .min(0)
      .required(),
    previsao_inicio: date()
      .label('Previsão de início')
      .max(dataMax)
      .min(dataMin)
      .nullable(),
    previsao_termino: date()
      .label('Previsão de término')
      .max(dataMax)
      .min(ref('previsao_inicio'), 'Precisa ser posterior à data de início')
      .nullable(),
    principais_etapas: string()
      .label('Principais etapas')
      .max(2048),
    regiao_id: number()
      .label('Região')
      .nullable(),
    responsaveis_no_orgao_gestor: array()
      .label('Assessor do Escritório de Projetos')
      .nullable()
      .meta({
        balaoInformativo: 'É a pessoa que atua como facilitador e apoiador na aplicação das metodologias definidas. Suas principais responsabilidades incluem fornecer suporte técnico e metodológico ao gerente do projeto, durante todas as fases, exercendo poder de influência para o alinhamento do projeto com os objetivos estratégicos definidos pela organização.',
      }),
    responsavel_id: number()
      .label('Gerente do projeto')
      .nullable()
      .meta({
        balaoInformativo: 'É a pessoa responsável pela evolução do projeto em todas as suas fases. Suas principais funções incluem definir o escopo, elaborar cronogramas, alocar recursos, gerenciar riscos, liderar a equipe e manter uma comunicação eficaz com todas as partes interessadas, garantindo que todos estejam alinhados e que as entregas ocorram conforme o planejado, promovendo ajustes sempre que necessário.',
      }),
    restricoes: array()
      .label('Restrições')
      .of(
        object()
          .shape({
            id: number()
              .nullable(),
            restricao: string()
              .required('A restrição não pode estar em branco')
              .max(255, 'Restrição muito longa. Use 255 caracteres ou menos.'),
          }),
      )
      .strict(),
    resumo: string()
      .label('Resumo')
      .max(2048),
    secretario_executivo: string()
      .label('Secretário Gestor do Portfólio')
      .nullable()
      .meta({
        balaoInformativo: 'É o(a) secretário(a) do Órgão Gestor do Portfólio.',
      }),
    secretario_responsavel: string()
      .label('Secretário responsável')
      .nullable()
      .meta({
        balaoInformativo: 'É o(a) secretário(a) do Órgão Responsável.',
      }),
    status: mixed()
      .label('Status')
      .oneOf(Object.keys(statusDeProjetos))
      .nullable(),
    tolerancia_atraso: number()
      .label('Percentual de tolerância com atraso')
      .min(0)
      .max(100)
      .nullable(),
    versao: string()
      .label('Versão')
      .nullable()
      .max(20),
  });

export const projetoFiltro = object().shape({
  ipp: number()
    .label('Itens por página')
    .nullableOuVazio(),
  nome: string()
    .label('Nome')
    .nullableOuVazio(),
  ordem_coluna: string()
    .label('Ordenar por')
    .nullableOuVazio(),
  ordem_direcao: string()
    .label('Direção')
    .oneOf(direcaoOpcoes)
    .nullableOuVazio(),
  orgao_responsavel_id: number()
    .label('Órgão responsável')
    .nullableOuVazio(),
  palavra_chave: string()
    .label('Palavra chave')
    .nullableOuVazio(),
  portfolio_id: number()
    .label('Portfólio')
    .nullableOuVazio(),
  previsao_custo: string()
    .label('Custo planejado'),
  previsao_termino: string()
    .label('Término planejado'),
  projeto_etapa_id: number()
    .label('Etapa')
    .nullableOuVazio(),
  registrado_em: date()
    .label('data de registro')
    .max(new Date())
    .nullableOuVazio(),
  revisado: boolean()
    .label('Revisado')
    .nullableOuVazio(),
  status: string()
    .label('Status')
    .nullableOuVazio(),
});

export const região = object()
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

export const relatorioPlanoSetorialBase = object()
  .shape({
    criado_em: string().label('Gerado em'),
    criador: string().label('Gerador'),
    parametros: string().label('Parâmetros principais'),
  });

export const relatorioMensalPlanoSetorial = relatorioPlanoSetorialBase.shape(
  {
    referencia: string().label('Referência'),
  },
);

export const relatorioSemestralAnualPlanoSetorial = relatorioPlanoSetorialBase.shape(
  {
    periodo: string().label('periodo'),
  },
);

export const relatorioOrcamentarioPlanoSetorial = relatorioPlanoSetorialBase.shape(
  {
    periodo_inicio: string().label('Período Início'),
    periodo_fim: string().label('Período Fim'),
  },
);

const relatorioValidacaoBase = object()
  .shape({
    eh_publico: boolean()
      .label('Relatório Público')
      .nullable()
      .required(),
    fonte: string()
      .required(),
  });

export const relatórioDeAtividadesPendentes = relatorioValidacaoBase.concat(object({
  parametros: object({
    partido_id: number()
      .label('Partido')
      .min(0, '${label} inválido')
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    cargo: mixed()
      .label('Cargo')
    // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
      .oneOf([...Object.keys(cargosDeParlamentar), null])
      .nullable()
      .transform((v) => (v === '' ? null : v)),
    eleicao_id: number()
      .label('Eleição')
      .min(1, 'Eleição inválida')
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
  }),
}));

export const relatórioDeParlamentares = relatorioValidacaoBase.concat(object({
  parametros: object({
    partido_id: number()
      .label('Partido')
      .min(0, '${label} inválido')
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    cargo: mixed()
      .label('Cargo')
      // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
      .oneOf([...Object.keys(cargosDeParlamentar), null])
      .nullable()
      .transform((v) => (v === '' ? null : v)),
    eleicao_id: number()
      .label('Eleição')
      .min(1, 'Eleição inválida')
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
  }),
}));

export const relatórioDePrevisãoDeCustoPdM = relatorioValidacaoBase.concat(
  object({
    parametros: object({
      atividade_id: string()
        .label('Atividade')
        .nullable(),
      iniciativa_id: string()
        .label('Iniciativa')
        .nullable(),
      meta_id: string()
        .label('Meta')
        .nullable(),
      ano: number()
        .label('Ano de referência')
        .min(startYear, `\${label} não pode ser menor do que ${startYear}`)
        .max(endYear, `\${label} não pode ser maior do que ${endYear}`)
        .required(),
      pdm_id: string()
        .label('PDM')
        .required(),
      tags: array()
        .label('Tags')
        .nullable(),
    }),
  }),
);

export const relatórioDePrevisãoDeCustoPlanosSetoriais = relatorioValidacaoBase.concat(object()
  .shape({
    fonte: string()
      .required(),
    parametros: object({
      atividade_id: string()
        .label('Atividade')
        .nullable(),
      iniciativa_id: string()
        .label('Iniciativa')
        .nullable(),
      meta_id: string()
        .label('Meta')
        .nullable(),
      ano: number()
        .label('Ano de referência')
        .min(startYear, `\${label} não pode ser menor do que ${startYear}`)
        .max(endYear, `\${label} não pode ser maior do que ${endYear}`)
        .required(),
      pdm_id: string()
        .label('Plano Setorial')
        .required(),
      tags: array()
        .label('Tags')
        .nullable(),
    }),
  }));

export const relatórioDePrevisãoDeCustoPortfolio = relatorioValidacaoBase.concat(
  object({
    parametros: object({
      portfolio_id: number()
        .label('Portfólio')
        .min(1, '${label} é obrigatório')
        .required()
        .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
      projeto_id: number()
        .label('Projeto')
        .min(1, '${label} é obrigatório')
        .nullable()
        .transform((v) => (v === null || Number.isNaN(v) ? null : v)),
      ano: number()
        .label('Ano de referência')
        .min(startYear, `\${label} não pode ser menor do que ${startYear}`)
        .max(endYear, `\${label} não pode ser maior do que ${endYear}`)
        .required(),
    }),
  }),
);

export const relatórioDeProjeto = relatorioValidacaoBase.concat(object({
  parametros: object({
    portfolio_id: number()
      .label('Portfólio')
      .min(1, '${label} é obrigatório')
      .required()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    projeto_id: number()
      .label('Projeto')
      .min(1, '${label} é obrigatório')
      .required()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
  }),
}));

export const relatórioDeStatus = relatorioValidacaoBase.concat(object({
  parametros: object({
    periodo_inicio: date()
      .label('Início do período')
      .max(dataMax)
      .min(new Date(2003, 0, 1))
      .nullable()
      .transform((v) => (!v ? null : v)),
    periodo_fim: date()
      .label('Final do período')
      .max(dataMax)
      .min(new Date(2003, 0, 1))
      .nullable()
      .transform((v) => (!v ? null : v)),
    portfolio_id: number()
      .label('Portfólio')
      .required()
      .min(1, '${label} é obrigatório'),
    projeto_id: number()
      .label('Projeto')
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
  }),
}));

export const relatórioDeStatusObra = relatorioValidacaoBase.concat(object({
  parametros: object({
    periodo_inicio: date()
      .label('Início do período')
      .max(dataMax)
      .min(new Date(2003, 0, 1))
      .nullable()
      .transform((v) => (!v ? null : v)),
    periodo_fim: date()
      .label('Final do período')
      .max(dataMax)
      .min(new Date(2003, 0, 1))
      .nullable()
      .transform((v) => (!v ? null : v)),
    portfolio_id: number()
      .label('Portfólio')
      .required()
      .min(1, '${label} é obrigatório'),
    projeto_id: number()
      .label('Obra')
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
  }),
}));

export const relatórioDePortfolio = relatorioValidacaoBase.concat(object({
  parametros: object({
    orgao_responsavel_id: number()
      .min(0)
      .label('Órgão responsável')
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .nullable(),
    portfolio_id: number()
      .label('Portfólio')
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .required(),
    status: mixed()
      .label('Status')
      .nullable()
      .oneOf([
        'EmAcompanhamento',
        'EmPlanejamento',
        'Fechado',
        'Planejado',
        'Registrado',
        'Selecionado',
        'Suspenso',
        'Validado',
        null,
      ]),
  }),
}));

export const relatórioDePortfolioObras = relatorioValidacaoBase.concat(object({
  parametros: object({
    orgao_responsavel_id: number()
      .min(0)
      .label('Órgão responsável')
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .nullable(),
    portfolio_id: number()
      .label('Portfólio')
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .required(),
    grupo_tematico_id: number()
      .label('Grupo temático')
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .nullable(),
    regiao_id: number()
      .label('Subprefeitura')
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .nullable(),
    periodo: date()
      .label('Obras que iniciam a partir de')
      .max(dataMax)
      .min(new Date(2003, 0, 1))
      .nullable()
      .transform((v) => (!v ? null : v)),
  }),
}));

export const relatórioDePrevisãoDeCustoPortfolioObras = relatorioValidacaoBase.concat(
  object({
    parametros: object({
      portfolio_id: number()
        .label('Portfólio')
        .min(1, '${label} é obrigatório')
        .required()
        .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
      projeto_id: number()
        .label('Obra')
        .min(1, '${label} é obrigatório')
        .nullable()
        .transform((v) => (v === null || Number.isNaN(v) ? null : v)),
      ano: number()
        .label('Ano de referência')
        .min(startYear, `\${label} não pode ser menor do que ${startYear}`)
        .max(endYear, `\${label} não pode ser maior do que ${endYear}`)
        .required(),
    }),
  }),
);

export const relatórioDeTransferênciasVoluntárias = relatorioValidacaoBase.concat(object({
  parametros: object({
    ano: number()
      .label('Ano')
      .min(2003, 'A partir de 2003')
      .nullable(),
    esfera: mixed()
      .label('Esfera')
      .nullable()
      // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
      .oneOf([...Object.keys(esferasDeTransferencia), null]),
    gestor_contrato: string()
      .label('Gestor do Contrato')
      .nullable(),
    interface: mixed()
      .label('Interface')
      .nullable()
    // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
      .oneOf([...Object.keys(interfacesDeTransferências), null])
      .transform((v) => (v === '' ? null : v)),
    objeto: string()
      .label('Objeto/Empreendimento')
      .max(50000)
      .nullable(),
    orgao_gestor_id: number()
      .label('Órgão gestor')
      .nullable(),
    parlamentar_id: number()
      .label('Parlamentar')
      .nullable(),
    orgao_concedente_id: number()
      .label('Órgão concedente')
      .min(1, 'Selecione um órgão responsável')
      .nullable(),
    partido_id: number()
      .label('Partido')
      .min(0, '${label} inválido')
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    secretaria_concedente: string()
      .label('Secretaria concedente')
      .max(250)
      .nullable(),
    tipo: mixed()
      .label('Tipo')
      .oneOf([
        'Geral',
        'Resumido',
      ])
      .required('Escolha o tipo'),
  }),
}));

export const relatórioDeTribunalDeContas = relatorioValidacaoBase.concat(object({
  parametros: object({
    ano_inicio: number()
      .label('Ano Início')
      .min(2003, 'A partir de 2003')
      .required(),
    ano_fim: number()
      .label('Ano Fim')
      .min(2003, 'A partir de 2003')
      .required(),
    esfera: mixed()
      .label('Esfera')
      .required()
      // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
      .oneOf([...Object.keys(esferasDeTransferencia), null]),
    tipo_id: mixed()
      .label('Tipo de Transferência')
      .required(),
    // .oneOf([...Object.keys(tiposTransferências), null]),
    tipo: mixed()
      .label('Tipo')
      .oneOf([
        'Geral',
        'Resumido',
      ])
      .required('Escolha o tipo'),
  }),
}));

export const relatórioAtividadesPendentes = relatorioValidacaoBase.concat(object({
  parametros: object({
    esfera: mixed()
      .label('Esfera')
      .oneOf(Object.keys(esferasDeTransferencia)),
    tipo_id: array()
      .label('Tipos')
      .nullable(),
    orgao_id: array()
      .label('Órgãos')
      .nullable(),
    data_inicio: date()
      .nullable()
      .label('Data de início')
      .transform((v) => (v === '' ? null : v)),
    data_termino: date()
      .nullable()
      .min(ref('data_inicio'), 'Data de término deve ser posterior à data de início')
      .label('Data de término previsto')
      .transform((v) => (v === '' ? null : v)),
  }),
}));

export const relatórioMensal = object({
  fonte: string()
    .required(),
  parametros: object({
    pdm_id: string()
      .label('PDM')
      .required('Escolha um PdM'),
    meta: array()
      .label('Metas')
      .nullable(),
    mes: number()
      .label('Mês')
      .min(1)
      .max(12)
      .required('Escolha um mês'),
    ano: number()
      .label('Ano')
      .min(2003, 'A partir de 2003')
      .required('Escolha um ano válido'),
    tags: array()
      .label('Tags')
      .nullable(),
    paineis: array()
      .label('Painéis')
      .nullable(),
  }),
  eh_publico: boolean()
    .label('Relatório Público')
    .required(),
});

export const relatórioMensalPS = relatorioValidacaoBase.concat(object({
  parametros: object({
    pdm_id: string()
      .label('PdM/Plano setorial')
      .nullable()
      .required(),
    meta: array()
      .label('Metas')
      .nullable(),
    mes: number()
      .label('Mês')
      .min(1)
      .max(12)
      .required('Escolha um mês'),
    ano: number()
      .label('Ano')
      .min(2003, 'A partir de 2003')
      .required(),
    tags: array()
      .label('Tags')
      .nullable(),
    listar_variaveis_regionalizadas: boolean()
      .label('Listar variáveis regionalizadas em todos os níveis'),
  }),
}));

export const relatórioOrçamentárioPdM = relatorioValidacaoBase.concat(object({
  parametros: object({
    pdm_id: string()
      .required('Escolha um PdM'),
    inicio: string()
      .required('Preencha a data')
      .matches(regEx['month/year'], 'Formato inválido'),
    fim: string()
      .required('Preencha a data')
      .matches(regEx['month/year'], 'Formato inválido'),
    tipo: mixed()
      .label('Tipo')
      .oneOf([
        'Analitico',
        'Consolidado',
      ])
      .required('Escolha o tipo'),
  }),
}));

export const relatórioOrçamentárioPlanosSetoriais = relatorioValidacaoBase.concat(object({
  parametros: object({
    pdm_id: string()
      .label('Plano Setorial')
      .required('Escolha um Plano Setorial'),
    inicio: string()
      .required('Preencha a data')
      .matches(regEx['month/year'], 'Formato inválido'),
    fim: string()
      .required('Preencha a data')
      .matches(regEx['month/year'], 'Formato inválido'),
    tipo: mixed()
      .label('Tipo')
      .oneOf([
        'Analitico',
        'Consolidado',
      ])
      .required('Escolha o tipo'),
  }),
}));

export const relatórioOrçamentárioPortfolio = relatorioValidacaoBase.concat(object({
  parametros: object({
    portfolio_id: number()
      .label('Portfólio')
      .min(1, '${label} é obrigatório')
      .required()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    inicio: string()
      .label('Início')
      .required()
      .matches(regEx['month/year'], 'Formato inválido'),
    fim: string()
      .label('Fim')
      .required()
      .matches(regEx['month/year'], 'Formato inválido'),
    tipo: mixed()
      .label('Tipo')
      .oneOf([
        'Analitico',
        'Consolidado',
      ])
      .required(),
  }),
}));

export const relatóriosOrçamentáriosPortfolioObras = relatorioValidacaoBase.concat(object({
  parametros: object({
    portfolio_id: number()
      .label('Portfólio')
      .min(1, '${label} é obrigatório')
      .required()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    inicio: string()
      .label('Início')
      .required()
      .matches(regEx['month/year'], 'Formato inválido'),
    fim: string()
      .label('Fim')
      .required()
      .matches(regEx['month/year'], 'Formato inválido'),
    tipo: mixed()
      .label('Tipo')
      .oneOf([
        'Analitico',
        'Consolidado',
      ])
      .required(),
  }),
}));

export const relatórioSemestralOuAnual = relatorioValidacaoBase.concat(object({
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
    tipo: mixed()
      .label('Tipo')
      .oneOf([
        'Analitico',
        'Consolidado',
      ])
      .required('Escolha o tipo'),
  }),
}));

export const representatividade = object()
  .shape({
    mandato_id: number()
      .label('Mandato')
      .required(),
    municipio_tipo: mixed()
      .label('Tipo de município')
      .oneOf(tiposDeMunicípio),
    nivel: mixed()
      .label('Nível')
      .oneOf(Object.keys(níveisDeRepresentatividade)),
    numero_comparecimento: number()
      .label('Comparecimento')
      .min(0)
      .max(2147483647)
      .nullable(),
    numero_votos: number()
      .label('Votos')
      .min(0)
      .max(2147483647)
      .required(),
    pct_participacao: number()
      .label('Percentual')
      .min(0)
      .max(100)
      .nullable(),
    ranking: number()
      .label('Ranking')
      .min(0)
      .max(1000)
      .required(),
    regiao_id: number()
      .required(),
  });

export const workflow = object({
  ativo: boolean()
    .label('Ativo'),
  esfera: mixed()
    .label('Esfera')
    .oneOf(Object.keys(esferasDeTransferencia)),
  inicio: date()
    .label('Início da vigência')
    .nullable()
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .transform((v) => (!v ? null : v))
    .required(),
  nome: string()
    .label('Nome do fluxo')
    .required(),
  termino: date()
    .label('fim da vigência')
    .nullable()
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .transform((v) => (!v ? null : v)),
  transferencia_tipo_id: number()
    .label('Tipo de transferência')
    .nullable()
    .required(),
  distribuicao_status: array()
    .label('Statuses de Distribuição'),
  distribuicao_statuses_base: array()
    .label('Statuses Base Atrelados ao Workflow')
    .nullable(),
  distribuicao_statuses_customizados: array()
    .label('Statuses Customizados Atrelados ao Workflow')
    .nullable(),
});

export const fasesFluxo = object({
  ordem: number()
    .label('Posição dentro do fluxo')
    .required(),
  workflow_etapa_de_id: number()
    .label('De etapa')
    .required(),
  workflow_etapa_para_id: number()
    .label('Para etapa')
    .required(),
});

export const tarefaFluxo = object({
  duracao: number()
    .label('Duração')
    .required(),
  responsabilidade: mixed()
    .label('Responsabilidade')
    .oneOf(Object.keys(responsabilidadeEtapaFluxo))
    .required(),
  ordem: number()
    .label('Posição dentro da fase')
    .required(),
  marco: boolean()
    .label('Marco?'),
  workflow_tarefa_id: number()
    .label('Tarefa')
    .required(),
});

export const etapasFluxo = object({
  duracao: number()
    .label('Duração')
    .required(),
  fase_id: number()
    .label('Tipo de fase')
    .required(),
  situacao: array()
    .label('Situação')
    .nullable(),
  ordem: number()
    .label('posição dentro da etapa')
    .required(),
  marco: boolean()
    .label('Marco?'),
});

export const etapasProjeto = object({
  descricao: string()
    .label('Etapa')
    .required(),
});

export const fasesProjeto = object({
  fase: string()
    .label('Fase')
    .min(0)
    .max(250)
    .required(),
});

export const tarefasProjeto = object({
  descricao: string()
    .label('Tarefa')
    .min(0)
    .max(250)
    .required(),
});

export const risco = object()
  .shape({
    causa: string()
      .label('Causa raiz')
      .max(2048)
      .nullable(),
    codigo: number()
      .label('Código')
      .default(1)
      .min(1)
      .nullable()
      .transform((v) => (v === undefined ? null : v))
      .required(),
    consequencia: string()
      .label('Consequências')
      .max(2048)
      .nullable(),
    descricao: string()
      .label('Descrição')
      .max(2048)
      .nullable(),
    impacto: number()
      .label('Impacto')
      .min(1)
      .max(5)
      .nullable(),
    probabilidade: number()
      .label('Probabilidade')
      .min(1)
      .max(5)
      .nullable(),
    registrado_em: date()
      .label('Data de registro')
      .max(dataMax)
      .min(dataMin)
      .required(),
    risco_tarefa_outros: string()
      .label('Outras tarefas afetadas')
      .nullable(),
    tarefa_id: array()
      .label('Tarefas afetadas no cronograma')
      .nullable(),
    titulo: string()
      .label('Nome')
      .required(),
  });

export const tarefa = object()
  .shape({
    atualizacao_do_realizado: boolean(),
    custo_estimado: number()
      .label('Previsão de custo')
      .min(0)
      .nullable(),
    custo_real: number()
      .label('Custo real')
      .min(0)
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    dependencias: array()
      .label('Dependências')
      .of(
        object()
          .shape({
            dependencia_tarefa_id: number()
              .label('Tarefa relacionada')
              .min(1, 'Campo obrigatório')
              .required(),
            latencia: number()
              .label('Dias de latência')
              .integer()
              .required()
              .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
            tipo: mixed()
              .label('Tipo de relação')
              .required()
              .oneOf(['termina_pro_inicio', 'inicia_pro_inicio', 'inicia_pro_termino', 'termina_pro_termino']),
          }),
      )
      .strict(),
    descricao: string()
      .label('Descrição')
      .min(0)
      .max(2048)
      .nullable(),
    duracao_planejado: number()
      .label('Duração prevista')
      .min(0)
      .nullable(),
    duracao_real: number()
      .label('Duração real')
      .min(0)
      .nullable(),
    eh_marco: boolean()
      .label('Marco do projeto?')
      .nullable(),
    inicio_planejado: date()
      .label('Previsão de início')
      .max(dataMax)
      .min(dataMin)
      .nullable(),
    inicio_real: date()
      .label('Data de início real')
      .max(dataMax)
      .min(dataMin)
      .nullable(),
    nivel: number()
      .min(1)
      .nullable(),
    numero: number()
      .label('Ordem')
      .min(1)
      .when('atualizacao_do_realizado', (atualizacaoDoRealizado, field) => (!atualizacaoDoRealizado
        ? field.required()
        : field.nullable())),
    orgao_id: number()
      .label('Órgão responsável')
      .min(1, 'Selecione um órgão responsável')
      .required('Escolha um órgão responsável pela tarefa'),
    percentual_concluido: number()
      .label('Percentual concluído')
      .min(0)
      .max(100)
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .when('atualizacao_do_realizado', (atualizacaoDoRealizado, field) => (atualizacaoDoRealizado
        ? field.required()
        : field.nullable())),
    recursos: string()
      .label('Responsável pela atividade')
      .min(0)
      .max(2048),
    tarefa: string()
      .label('Tarefa')
      .min(1)
      .max(60)
      .required(),
    tarefa_pai_id: number()
      .label('Tarefa-mãe')
      .min(0)
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    termino_planejado: date()
      .label('Previsão de término')
      .max(dataMax)
      .min(ref('inicio_planejado'), 'Precisa ser posterior à data de início')
      .nullable(),
    termino_real: date()
      .label('Data de término real')
      .max(dataMax)
      .min(ref('inicio_real'), 'Precisa ser posterior à data de início')
      .nullable(),
  });

export const emailTransferencia = object()
  .shape({
    ativo: boolean()
      .label('Disparo de e-mail?'),
    com_copia: array()
      .nullable()
      .label('CC (com cópia)'),
    recorrencia_dias: number()
      .label('Recorrência (dias)')
      .min(0)
      .integer()
      .required(),
    numero: number()
      .label('Dias antes da previsão de termino')
      .min(0)
      .integer()
      .required(),
    numero_periodo: string()
      .label('Periodicidade')
      .required(),
  });

export const empreendimento = object({
  identificador: string()
    .label('Identificador')
    .max(250)
    .min(1)
    .required(),
  nome: string()
    .label('Nome')
    .max(250)
    .min(3)
    .required(),
});

export const tag = object()
  .shape({
    descricao: string()
      .label('Descrição')
      .required('Preencha a descrição'),
    ods_id: string()
      .label('Categoria')
      .required('Categoria é obrigatória'),
    pdm_id: string(),
    upload_icone: string()
      .label('Ícone')
      .nullable(),
  });

export const tipoDeAcompanhamento = object()
  .shape({
    nome: string()
      .label('Nome')
      .required(),
  });

export const tipoDeIntervencao = object({
  nome: string()
    .label('Tipo de intervenção')
    .min(3)
    .max(250)
    .required(),
  conceito: string()
    .label('Conceito')
    .min(3)
    .max(250)
    .transform((v) => (v === '' ? null : v))
    .nullable(),
});

export const usuário = object()
  .shape({
    desativado: string()
      .nullable(),
    desativado_motivo: string()
      .label('Motivo para desativação')
      .nullable()
      .when('desativado', (desativado, field) => (desativado === '1'
        ? field.required('Escreva um motivo para a inativação')
        : field)),
    email: string()
      .label('E-mail')
      .required('Preencha o e-mail')
      .email('E-mail inválido'),
    grupos: array(),
    modulos_permitidos: array(),
    sobreescrever_modulos: boolean(),
    lotacao: string()
      .label('Lotação')
      .required('Preencha a lotação'),
    nome_completo: string()
      .label('Nome completo')
      .required('Preencha o nome'),
    nome_exibicao: string()
      .label('Nome para exibição')
      .required('Preencha o nome social'),
    orgao_id: string()
      .label('Órgão')
      .required('Selecione um órgão'),
    perfil_acesso_ids: array()
      .label('Perfil de acesso')
      .required('Selecione ao menos uma permissão'),
  });

export const variável = (singleIndicadores) => object()
  .shape({
    acumulativa: string()
      .nullable(),
    ano_base: string()
      .nullable(),
    atraso_meses: number()
      .min(0)
      .integer(),
    casas_decimais: string()
      .label('Casas decimais')
      .nullable(),
    codigo: string()
      .label('Código')
      .required('Preencha o código'),
    fim_medicao: string()
      .label('Fim da medição')
      .nullable()
      .matches(regEx['month/year'], 'Formato inválido')
      .when('periodicidade', (periodicidade, schema) => (singleIndicadores?.value?.periodicidade !== periodicidade
        ? schema.required('Selecione a data')
        : schema)),
    inicio_medicao: string()
      .label('Início da medição')
      .nullable()
      .matches(regEx['month/year'], 'Formato inválido')
      .when('periodicidade', (periodicidade, schema) => (singleIndicadores?.value?.periodicidade !== periodicidade
        ? schema.required('Selecione a data')
        : schema)),
    orgao_id: string()
      .label('Órgão responsável')
      .required('Selecione um orgão'),
    periodicidade: string()
      .label('Periodicidade')
      .required('Preencha a periodicidade'),
    regiao_id: string()
      .label('Região')
      .nullable(),
    regioes: array()
      .label('Regiões'),
    responsaveis: array()
      .label('Responsáveis')
      .nullable(),
    supraregional: boolean()
      .label('Incluir variável supra regional')
      .nullable(),
    suspendida: boolean()
      .label('Suspender variável e retirar do monitoramento físico')
      .nullable(),
    titulo: string()
      .label('Nome')
      .required('Preencha o título'),
    unidade_medida_id: string()
      .label('Unidade de medida')
      .required('Selecione uma unidade'),
    valor_base: string()
      .label('Valor base')
      .required('Preencha o valor base'),
  });

export const variávelCategórica = object({
  descricao: string()
    .label('Descrição')
    .nullable(),
  titulo: string()
    .label('Título')
    .required('Título inválido'),
  tipo: mixed()
    .label('Espécie')
    .required('Espécie inválida')
    .oneOf(Object.keys(tipoDeVariaveisCategoricas)),
  valores: array()
    .label('Valores')
    .of(
      object().shape({
        id: number()
          .nullable(),
        descricao: string()
          .label('Observações')
          .nullable(),
        ordem: number()
          .positive()
          .label('Ordem')
          .required('Ordem inválida'),
        titulo: string()
          .label('Título')
          .required('Título inválido'),
        valor_variavel: string()
          .label('Valor')
          .required('Valor inválido'),
      }),
    ),
});

export const variávelComposta = object()
  .shape({
    formula: string()
      .label('Fórmula')
      .required(),
    formula_variaveis: array()
      .label('Variáveis')
      .required(),
    mostrar_monitoramento: boolean()
      .label('Utilizar esta variável composta no ciclo de monitoramento')
      .required(),
    titulo: string()
      .label('Título')
      .required(),
  });

// criação ou geração
const variavelGlobalEhNumberica = (variavelCategoricaId, field) => {
  if (variavelCategoricaId === null || variavelCategoricaId === undefined) {
    return field.required();
  }

  return field.nullableOuVazio();
};
export const variavelGlobal = object({
  acumulativa: boolean()
    .label('Variável acumulativa')
    .when('variavel_categorica_id', variavelGlobalEhNumberica),
  ano_base: number()
    .label('Ano base')
    .positive()
    .integer()
    .nullableOuVazio(),
  assuntos: array()
    .label('Assuntos')
    .nullable()
    .of(
      number()
        .positive()
        .required(),
    ),
  atraso_meses: number()
    .label('Defasagem da medição')
    .min(0)
    .integer(),
  casas_decimais: number()
    .label('Casas decimais')
    .integer()
    .min(0)
    .max(12)
    .when('variavel_categorica_id', variavelGlobalEhNumberica),
  dado_aberto: boolean()
    .label('Disponível como dado aberto')
    .nullable(),
  descricao: string()
    .label('Descrição')
    .nullable(),
  fim_medicao: date()
    .label('Fim da medição')
    .nullable()
    .max(dataMax)
    .min(ref('inicio_medicao'), 'Precisa ser posterior à data de início'),
  fonte_id: number()
    .label('Fonte')
    .positive()
    .nullable(),
  inicio_medicao: date()
    .label('Início da medição')
    .required()
    .min(dataMin),
  liberacao_grupo_ids: array()
    .label('Equipes de liberação')
    .nullable()
    .of(
      number()
        .positive()
        .required(),
    ),
  medicao_grupo_ids: array()
    .label('Equipes de coleta')
    .nullable()
    .of(
      number()
        .positive()
        .required(),
    ),
  metodologia: string()
    .label('Metodologia')
    .nullable(),
  mostrar_monitoramento: boolean()
    .label('Utilizar esta variável composta no ciclo de monitoramento')
    .required(),
  medicao_orgao_id: number()
    .label('Órgão responsável pela coleta')
    .positive()
    .required(),
  validacao_orgao_id: number()
    .label('Órgão responsável pela conferência')
    .positive()
    .nullableOuVazio(),
  liberacao_orgao_id: number()
    .label('Órgão responsável pela liberação')
    .positive()
    .nullableOuVazio(),
  orgao_proprietario_id: number()
    .label('Órgão proprietário')
    .required()
    .positive(),
  periodicidade: mixed()
    .label('Periodicidade')
    .oneOf(Object.keys(periodicidades.variaveis))
    .required(),
  periodos: object({
    preenchimento_inicio: number()
      .label('Dia inicio da coleta')
      .min(1)
      .max(30)
      .positive()
      .required()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : Number(v))),
    preenchimento_duracao: number()
      .label('Duração da coleta')
      .positive()
      .required()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : Number(v))),
    validacao_duracao: number()
      .label('Duração da conferência')
      .positive()
      .required()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : Number(v))),
    liberacao_duracao: number()
      .label('Duração da liberação')
      .positive()
      .required()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : Number(v))),
  })
    .label('Intervalos de interação')
    .required(),
  polaridade: mixed()
    .label('Polaridade')
    .required()
    .oneOf([...Object.keys(polaridadeDeVariaveis), null])
    .when('variavel_categorica_id', variavelGlobalEhNumberica),
  titulo: string()
    .label('Nome')
    .max(256)
    .required(),
  unidade_medida_id: number()
    .label('Unidade de medida')
    .when('variavel_categorica_id', variavelGlobalEhNumberica),
  validacao_grupo_ids: array()
    .label('Equipes de conferência')
    .nullable()
    .of(
      number()
        .positive()
        .required(),
    ),
  valor_base: number() // como string
    .label('Valor base')
    .min(0)
    .when('variavel_categorica_id', variavelGlobalEhNumberica),
  variavel_categorica_id: number()
    .label('Tipo de variável')
    .nullableOuVazio(),
});

export const variavelGlobalParaGeracao = variavelGlobal.concat(
  object({
    criar_formula_composta: boolean()
      .label('Criar fórmulas compostas')
      .required(),
    nivel_regionalizacao: number()
      .label('Nível de regionalização')
      .min(1)
      .max(4)
      .required(),
    regioes: array()
      .label('Regiões abrangidas')
      .of(
        number()
          .integer()
          .positive()
          .required(),
      )
      .required(),
    supraregional: boolean()
      .label('Incluir variável supra regional')
      .required(),
  }),
);

export const valoresRealizadoEmLote = object()
  .shape({
    composta: object()
      .shape({
        analise_qualitativa: string(),
        data_ciclo: date()
          .label('Data do registro do valor da variável')
          .max(dataMax)
          .min(dataMin)
          .required(),
        enviar_para_cp: boolean()
          .label('Enviar composta para CP')
          .required(),
        formula_composta_id: number()
          .label('ID da fórmula composta')
          .min(1)
          .required(),
      }),
    linhas: array()
      .label('Variáveis compostas')
      .of(
        object()
          .shape({
            analise_qualitativa: string(),
            data_valor: date()
              .label('Data do registro do valor da variável')
              .max(dataMax)
              .min(dataMin)
              .required(),
            enviar_para_cp: boolean()
              .label('Enviar para CP')
              .required(),
            valor_realizado: number()
              .label('Valor realizado')
              .nullable()
              .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
            valor_realizado_acumulado: number()
              .label('Valor acumulado')
              .nullable()
              .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
            variavel_id: number()
              .min(1)
              .required(),
          }),
      ),
  });

export const obra = projeto.concat(obras).shape({
  grupo_tematico: object()
    .label('Grupo temático')
    .nullable()
    .shape({
      id: number()
        .required(),
      nome: string()
        .required(),
    }),
  tipo_intervencao: object()
    .label('Tipo de intervenção')
    .nullable()
    .shape({
      id: number()
        .required(),
      nome: string()
        .required(),
    }),
  equipamento: object()
    .label('Equipamento')
    .nullable()
    .shape({
      id: number()
        .required(),
      nome: string()
        .required(),
    }),
  projeto_etapa: object()
    .label('Etapa atual')
    .nullable()
    .shape({
      id: number()
        .required(),
      nome: string()
        .required(),
    }),
  regioes: array()
    .label('Subprefeituras')
    .nullable()
    .of(região),
  tags: array()
    .label('Etiquetas')
    .nullable()
    .of(
      object()
        .shape({
          id: number()
            .required(),
          descricao: string()
            .required(),
        }),
    ),
  empreendimento: object()
    .label('Empreendimento')
    .nullable()
    .shape({
      id: number()
        .required(),
      nome: string()
        .required(),
      identificador: string()
        .required(),
    }),
  responsaveis_no_orgao_gestor: array()
    .label('Ponto focal do monitoramento')
    .of(
      number()
        .min(1),
    )
    .nullable(),
});

export const comunicadosGeraisFiltrosSchemaTipoOpcoes = [
  '',
  'Geral',
  'Individual',
  'Especial',
  'Bancada',
];

export const comunicadosGeraisFiltrosSchema = object().shape({
  palavra_chave: string().label('palavra-chave'),
  data_inicio: date()
    .label('Início do período')
    .required()
    .transform((v) => {
      if (v.toString() === 'Invalid Date') {
        return null;
      }

      return v;
    })
    .test(
      'verificar-datas',
      (dataInicio, { resolve, createError, options }) => {
        if (!dataInicio) {
          return true;
        }

        const [{ schema }] = options.from;
        const { data_inicio: dataInicioSchema, data_fim: dataFimSchema } = schema.fields;

        const dataFim = resolve(ref('data_fim'));

        if (isAfter(dataInicio, new Date())) {
          return createError({
            message: `"${dataInicioSchema.spec.label}" não pode ser MAIOR que HOJE`,
          });
        }

        if (isAfter(dataInicio, dataFim)) {
          return createError({
            message: `"${dataInicioSchema.spec.label}" não pode ser MAIOR que "${dataFimSchema.spec.label}"`,
          });
        }

        return true;
      },
    ),
  data_fim: date()
    .label('Fim do período')
    .required()
    .transform((v) => {
      if (v.toString() === 'Invalid Date') {
        return null;
      }

      return v;
    })
    .test('verificar-datas', (dataFim, { resolve, createError, options }) => {
      if (!dataFim) {
        return true;
      }

      const [{ schema }] = options.from;
      const { data_inicio: dataInicioSchema, data_fim: dataFimSchema } = schema.fields;

      const dataInicio = resolve(ref('data_inicio'));

      if (isAfter(dataFim, new Date())) {
        return createError({
          message: `"${dataFimSchema.spec.label}" não pode ser MAIOR que HOJE`,
        });
      }

      if (isBefore(dataFim, dataInicio)) {
        return createError({
          message: `"${dataFimSchema.spec.label}" não pode ser MENOR que "${dataInicioSchema.spec.label}"`,
        });
      }

      return true;
    }),
  tipo: mixed().label('Tipo').oneOf(comunicadosGeraisFiltrosSchemaTipoOpcoes),
});

function obterCicloAtaulizacaoCamposCompartilhados(posicao) {
  const schemaCampos = {
    analise_qualitativa: string().label('análise qualitativa da coleta').required(),
  };

  if (posicao !== 1) {
    schemaCampos.solicitar_complementacao = boolean()
      .label(
        'Solicitar complementação',
      );
    schemaCampos.pedido_complementacao = string()
      .label('Pedido de complementação')
      .when('solicitar_complementacao', (solicitarComplementacao, field) => (solicitarComplementacao ? field.required() : field.nullable()));
  }

  if (posicao >= 2) {
    schemaCampos.analise_qualitativa_aprovador = string()
      .label('análise qualitativa da conferência')
      .when('solicitar_complementacao', (solicitarComplementacao, field) => (solicitarComplementacao ? field.nullable() : field.required()));
  }

  if (posicao >= 3) {
    schemaCampos.analise_qualitativa_liberador = string()
      .label('análise qualitativa do liberador')
      .when('solicitar_complementacao', (solicitarComplementacao, field) => (solicitarComplementacao ? field.nullable() : field.required()));
  }

  return schemaCampos;
}

export const cicloAtualizacaoModalAdicionarSchema = (posicao) => {
  const schemaCampos = {
    valor_realizado: string().label('valor realizado').required(),
    valor_realizado_acumulado: string().required()
      .label('valor realizado acumulado'),
  };

  const camposCompartilhados = obterCicloAtaulizacaoCamposCompartilhados(posicao);

  return object().shape({
    ...schemaCampos,
    ...camposCompartilhados,
  });
};

export const cicloAtualizacaoModalEditarSchema = (posicao) => {
  const schemaCampos = {
    variaveis_dados: array().of(
      object().shape({
        valor_realizado: string()
          .label('valor realizado')
          .required(),
        valor_realizado_acumulado: string()
          .label('valor realizado acumulado')
          .required(),
      }),
    ),
  };

  const camposCompartilhados = obterCicloAtaulizacaoCamposCompartilhados(posicao);

  return object().shape({
    ...schemaCampos,
    ...camposCompartilhados,
  });
};

export const classificacaoCriarEditarSchema = object().shape({
  nome: string().label('Nome').required(),
  esfera: string()
    .label('Esfera')
    .required()
    .oneOf(Object.keys(esferasDeTransferencia)),
  transferencia_tipo_id: string().label('Tipo').required(),
});

export const cicloAtualizacaoFiltrosSchema = object().shape({
  atividade_id: number()
    .label('atividade')
    .nullableOuVazio()
    .min(1),
  codigo: string()
    .label('Código'),
  equipe_id: number()
    .label('Equipe')
    .nullableOuVazio()
    .min(1),
  iniciativa_id: number()
    .label('iniciativa')
    .nullableOuVazio()
    .min(1),
  meta_id: number()
    .label('Meta')
    .nullableOuVazio()
    .min(1),
  palavra_chave: string()
    .label('Palavra chave'),
  pdm_id: number()
    .label('PdM/Plano Setorial')
    .nullableOuVazio()
    .min(1),
  referencia: string()
    .label('Referencia')
    .matches(regEx['month/year'], 'Formato inválido'),
});

export const alteracaoEmLoteNovoFiltro = object().shape({
  ordem_direcao: string().label('Direção').oneOf(direcaoOpcoes).nullableOuVazio(),
  equipamento_id: number().label('Equipamento/Estrutura pública').nullableOuVazio(),
  grupo_tematico_id: number().label('Grupo temático').nullableOuVazio(),
  ipp: number().label('Número de itens').nullableOuVazio(),
  ordem_coluna: string().label('Ordenar por').nullableOuVazio(),
  orgao_origem_id: number().label('Secretaria/órgão de origem').nullableOuVazio(),
  palavra_chave: string().label('Busca livre').nullableOuVazio(),
  portfolio_id: number().label('Portfólio').nullableOuVazio(),
  registros_sei: string().label('Processos SEI').nullableOuVazio(),
  status: number().label('Status da obra').nullableOuVazio(),
  regioes: number().label('Subprefeitura').nullableOuVazio(),
  tipo_intervencao_id: number().label('Tipo de obra').nullableOuVazio(),
});
