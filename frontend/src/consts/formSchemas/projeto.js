import statusDeProjetos from '@/consts/projectStatuses';
import tiposDeOrigens from '@/consts/tiposDeOrigens';

import {
  dataMax,
  dataMin,
} from './config/datas';
import {
  array, date, mixed, number, object, ref, string,
} from './initSchema';

export default object()
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
      .min(dataMin),
    data_revisao: date()
      .label('Data de revisão')
      .nullable()
      .max(dataMax)
      .min(dataMin),
    equipe: array()
      .label('Equipe do Projeto')
      .nullable()
      .of(
        number()
          .label('Equipe do projeto')
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
      .label('Fontes de Recursos')
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
      .nullable()
      .meta({
        balaoInformativo: 'Na criação, vem preenchido com o compartilhamento padrão do portfólio escolhido. Remova os que não se aplicarem ao projeto.',
      }),
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
              .max(2048, 'Premissa muito longa. Use 2048 caracteres ou menos.'),
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
              .max(2048, 'Restrição muito longa. Use 2048 caracteres ou menos.'),
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
    tags_portfolio: array()
      .label('Etiquetas')
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
