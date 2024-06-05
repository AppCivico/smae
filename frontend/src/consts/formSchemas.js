/* eslint-disable no-template-curly-in-string */
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import categoriaDeTransferencia from '@/consts/categoriaDeTransferencia';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import estadosDoBrasil from '@/consts/estadosDoBrasil';
import interfacesDeTransferências from '@/consts/interfacesDeTransferências';
import níveisDeRepresentatividade from '@/consts/niveisDeRepresentatividade';
import níveisDeSuplência from '@/consts/niveisDeSuplencia';
import regEx from '@/consts/patterns';
import responsabilidadeEtapaFluxo from '@/consts/responsabilidadeEtapaFluxo';
import tiposDeLogradouro from '@/consts/tiposDeLogradouro';
import tiposDeMunicípio from '@/consts/tiposDeMunicipio';
import tiposNaEquipeDeParlamentar from '@/consts/tiposNaEquipeDeParlamentar';
import tiposSituacaoSchema from '@/consts/tiposSituacaoSchema';
import fieldToDate from '@/helpers/fieldToDate';
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

const dataMin = import.meta.env.VITE_DATA_MIN ? new Date(`${import.meta.env.VITE_DATA_MIN}`) : new Date('1900-01-01T00:00:00Z');
const dataMax = import.meta.env.VITE_DATA_MAX ? new Date(`${import.meta.env.VITE_DATA_MAX}`) : new Date('2100-12-31T23:59:59Z');

addMethod(string, 'fieldUntilToday', function (errorMessage = 'Valor de ${path} futuro') {
  return this.test('teste', errorMessage, function (value) {
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
  },
  string: {
    email: ({ label }) => (label ? `${label} não é e-mail válido` : 'E-mail inválido'),
    min: ({ label, min }) => (label ? `${label} está menor que ${min}` : 'Esse texto é menor que ${min}'),
    matches: ({ label }) => (label ? `${label} está fora do formato` : 'Formato inválido'),
    max: ({ label, max }) => (label ? `${label} está maior que ${max}` : 'Esse texto é maior que ${max}'),
    required: ({ label }) => (label ? `${label} não é opcional` : 'Campo obrigatório'),
  },
});

// https://github.com/jquense/yup/issues/384#issuecomment-442958997

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
              .max(50000)
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
      .max(50000)
      .nullable(),
    participantes: string()
      .label('Participantes')
      .max(2048)
      .required(),
    pauta: string()
      .label('Pauta')
      .max(50000)
      .nullable(),
    pontos_atencao: string()
      .label('Pontos de atenção')
      .max(50000)
      .nullable(),
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
      .nullable(),
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
    .required(),
  orgao_id: number()
    .label('Órgão responsável')
    .min(1, 'Selecione um órgão responsável')
    .nullable(),
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
});

export const liçãoAprendida = object()
  .shape({
    contexto: string()
      .label('Contexto')
      .required(),
    data_registro: date()
      .label('Data do registro')
      .max(dataMax)
      .min(dataMin)
      .required(),
    descricao: string()
      .label('O que foi feito')
      .required()
      .nullable(),
    observacao: string()
      .label('Observação')
      .nullable(),
    resultado: string()
      .label('Resultado')
      .nullable(),
    responsavel: string()
      .label('Responsável')
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
  em_atividade: boolean()
    .label('Em exercício')
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
      .matches(regEx.cnpj),
    descricao: string()
      .label('Descrição')
      .required(),
    email: string()
      .email()
      .label('Email'),
    nivel: number()
      .required(),
    parente_id: number()
      .when('nivel', (nivel, field) => (nivel > 1
        ? field.required('Esse campo é obrigatório para o nível maior do que 1')
        : field.nullable())),
    secretario_responsavel: string()
      .label('Secretário'),
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
    .required(),
  orgaos: array()
    .label('Órgãos')
    .min(1, 'Selecione ao menos um órgão')
    .required(),
  titulo: string()
    .label('Nome')
    .required('Um portfolio requer um título'),
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
  nome_popular: string()
    .label('Nome')
    .min(1)
    .max(250)
    .required(),
  nome: string()
    .label('Nome Civil')
    .min(1)
    .max(250)
    .required(),
  nascimento: date()
    .max(dataMax)
    .min(new Date(1933, 0, 1))
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

export const suplentes = object({
  nome: string()
    .label('Nome')
    .required(),
  ordem: mixed()
    .label('Ordem')
    .required(),
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
  assinatura_municipio: date()
    .label('Data de assinatura do representante do município')
    .nullable()
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .transform((v) => (!v ? null : v)),
  assinatura_estado: date()
    .label('Data de assinatura do representante do estado')
    .nullable()
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .transform((v) => (!v ? null : v)),
  assinatura_termo_aceite: date()
    .label('Data de assinatura do termo de aceite')
    .nullable()
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .transform((v) => (!v ? null : v)),
  contrato: string()
    .label('Número do contrato')
    .nullable(),
  convenio: string()
    .label('Número convênio/pré-convênio')
    .nullable(),
  conclusao_suspensiva: date()
    .label('Data de conclusão da suspensiva')
    .nullable()
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .transform((v) => (!v ? null : v)),
  dotacao: string()
    .label('Dotacao')
    .nullable(),
  empenho: boolean()
    .label('Empenho')
    .required(),
  data_empenho: date()
    .label('Data do empenho')
    .nullable()
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .transform((v) => (!v ? null : v)),
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
    .nullable()
    .max(dataMax)
    .min(new Date(2003, 0, 1))
    .transform((v) => (!v ? null : v)),
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
    .of(
      object()
        .shape({
          id: number()
            .nullable(),
          processo_sei: string()
            .required()
            .max(40),
        }),
    )
    .strict(),
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
  dotacao: string()
    .label('Dotação')
    .nullable(),
  empenho: boolean()
    .label('Empenho')
    .required(),
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
  cargo: mixed()
    .label('Cargo')
    // feio, mas... Algo parece bugado no Yup e não posso atualizá-lo agora
    .oneOf([...Object.keys(cargosDeParlamentar), null])
    .nullable()
    .transform((v) => (v === '' ? null : v)),
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
  numero_identificacao: string()
    .label('Número de identificação')
    .max(250)
    .min(1)
    .nullable(),
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
  partido_id: number()
    .label('Partido')
    .nullable(),
  parlamentar_id: number()
    .label('Parlamentar')
    .nullable()
    .transform((v) => (!v ? null : v)),
  secretaria_concedente: string()
    .label('Secretaria do órgão concedente')
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
      .label('Equipe')
      .nullable()
      .of(
        number()
          .label('Pessoa')
          .required(),
      ),
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
      .max(50000),
    nome: string()
      .label('Nome do projeto')
      .required('Um projeto requer um nome')
      .min(1, 'Esse nome é muito curto')
      .max(500, 'Esse nome é muito longo'),
    objetivo: string()
      .label('Objetivo')
      .nullable(),
    objeto: string()
      .label('Objeto')
      .nullable(),
    orgao_gestor_id: number()
      .label('Órgão gestor')
      .min(1, 'Selecione um órgão gestor')
      .required('O projeto necessita de um órgão gestor'),
    orgao_responsavel_id: number()
      .label('Órgão responsável')
      .nullable(),
    orgaos_participantes: array()
      .label('Órgãos participantes'),
    origem_outro: string()
      .label('Descrição de origem fora do PdM')
      .max(500)
      .nullable()
      .when('origem_tipo', (origemTipo, field) => (origemTipo && origemTipo !== 'PdmSistema'
        ? field.required('Descrição de origem é obrigatório caso não se escolha um Programa de Metas corrente')
        : field)),
    origem_tipo: mixed()
      .label('Origem')
      .required('O projeto precisa de uma origem de recursos.')
      .oneOf(['PdmSistema', 'PdmAntigo', 'Outro'], 'A origem escolhida é inválida'),
    portfolios_compartilhados: array()
      .label('Compartilhar no portfólios')
      .nullable(),
    publico_alvo: string()
      .label('Público alvo')
      .nullable(),
    portfolio_id: number('O projeto precisa pertencer a um portfolio')
      .label('Portfólio')
      .min(1, 'Selecione ao menos um portfolio')
      .required('O projeto precisa pertencer a um portfolio'),
    premissas: array()
      .label('Premissas')
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
      .max(50000),
    regiao_id: number()
      .label('Região')
      .nullable(),
    responsaveis_no_orgao_gestor: array()
      .label('Responsável pelo acompanhamento')
      .nullable(),
    responsavel_id: number()
      .label('Gerente do projeto')
      .nullable(),
    restricoes: array()
      .label('Restrições')
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
      .label('Resumo')
      .max(500),
    secretario_executivo: string()
      .label('Secretário gestor')
      .nullable(),
    secretario_responsavel: string()
      .label('Secretário responsável')
      .nullable(),
    status: mixed()
      .label('Status')
      .oneOf([
        'Registrado',
        'Selecionado',
        'EmPlanejamento',
        'Planejado',
        'Validado',
        'EmAcompanhamento',
        'Suspenso',
        'Fechado',
      ])
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

export const relatórioDeParlamentares = object({
  fonte: string()
    .required(),
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
  salvar_arquivo: boolean(),
});

export const relatórioDePrevisãoDeCustoPdM = object()
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
      periodo_ano: mixed()
        .label('Período')
        .oneOf(['Corrente', 'Anterior'])
        .required(),
      pdm_id: string()
        .label('PDM')
        .required(),
      tags: array()
        .label('Tags')
        .nullable(),
    }),
    salvar_arquivo: boolean(),
  });

export const relatórioDePrevisãoDeCustoPortfolio = object()
  .shape({
    fonte: string()
      .required(),
    parametros: object({
      portfolio_id: number()
        .label('Portfolio')
        .min(1, '${label} é obrigatório')
        .required()
        .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
      projeto_id: number()
        .label('Projeto')
        .min(1, '${label} é obrigatório')
        .nullable()
        .transform((v) => (v === null || Number.isNaN(v) ? null : v)),
      periodo_ano: mixed()
        .label('Período')
        .oneOf(['Corrente', 'Anterior'])
        .required(),
    }),
    salvar_arquivo: boolean(),
  });

export const relatórioDeProjeto = object({
  fonte: string()
    .required(),
  parametros: object({
    portfolio_id: number()
      .label('Portfolio')
      .min(1, '${label} é obrigatório')
      .required()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
    projeto_id: number()
      .label('Projeto')
      .min(1, '${label} é obrigatório')
      .required()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
  }),
  salvar_arquivo: boolean(),
});

export const relatórioDeStatus = object({
  fonte: string()
    .required(),
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
      .label('Portfolio')
      .required()
      .min(1, '${label} é obrigatório'),
    projeto_id: number()
      .label('Projeto')
      .nullable()
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v)),
  }),
  salvar_arquivo: boolean(),
});

export const relatórioDePortfolio = object({
  fonte: string()
    .required(),
  parametros: object({
    orgao_responsavel_id: number()
      .min(0)
      .label('Órgão responsável')
      .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
      .nullable(),
    portfolio_id: number()
      .label('Portfolio')
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
  salvar_arquivo: boolean(),
});

export const relatórioDeTransferênciasVoluntárias = object({
  fonte: string()
    .required(),
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
  salvar_arquivo: boolean(),
});

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
  salvar_arquivo: boolean(),
});

export const relatórioOrçamentárioPdM = object({
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
    tipo: mixed()
      .label('Tipo')
      .oneOf([
        'Analitico',
        'Consolidado',
      ])
      .required('Escolha o tipo'),
  }),
});

export const relatórioOrçamentárioPortfolio = object({
  fonte: string()
    .required(),
  salvar_arquivo: boolean(),
  parametros: object({
    portfolio_id: number()
      .label('Portfolio')
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
});

export const relatórioSemestralOuAnual = object({
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
    tipo: mixed()
      .label('Tipo')
      .oneOf([
        'Analitico',
        'Consolidado',
      ])
      .required('Escolha o tipo'),
  }),
  salvar_arquivo: boolean(),
});

export const representatividade = object()
  .shape({
    mandato_id: number()
      .label('Mandato'),
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
      .label('Região'),
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
  responsabilidade: mixed()
    .label('Responsabilidade')
    .oneOf(Object.keys(responsabilidadeEtapaFluxo))
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
      .nullable(),
    descricao: string()
      .label('Descrição')
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
      .when('atualizacao_do_realizado', (atualizacaoDoRealizado, field) => (atualizacaoDoRealizado
        ? field.required()
        : field.nullable())),
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

export const tag = object()
  .shape({
    descricao: string().required('Preencha a descrição'),
    ods_id: string()
      .required(),
    pdm_id: string(),
    upload_icone: string().nullable(),
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
      .nullable(),
    codigo: string()
      .required('Preencha o código'),
    fim_medicao: string()
      .nullable()
      .matches(regEx['month/year'], 'Formato inválido')
      .when('periodicidade', (periodicidade, schema) => (singleIndicadores?.value?.periodicidade !== periodicidade
        ? schema.required('Selecione a data')
        : schema)),
    inicio_medicao: string()
      .nullable()
      .matches(regEx['month/year'], 'Formato inválido')
      .when('periodicidade', (periodicidade, schema) => (singleIndicadores?.value?.periodicidade !== periodicidade
        ? schema.required('Selecione a data')
        : schema)),
    orgao_id: string()
      .required('Selecione um orgão'),
    periodicidade: string()
      .required('Preencha a periodicidade'),
    regiao_id: string()
      .nullable(),
    regioes: array()
      .label('Regiões'),
    responsaveis: array()
      .nullable(),
    supraregional: boolean()
      .label('Incluir variável supra regional')
      .nullable(),
    suspendida: boolean()
      .label('Suspender variável e retirar do monitoramento físico')
      .nullable(),
    titulo: string()
      .required('Preencha o título'),
    unidade_medida_id: string()
      .required('Selecione uma unidade'),
    valor_base: string()
      .required('Preencha o valor base'),
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
