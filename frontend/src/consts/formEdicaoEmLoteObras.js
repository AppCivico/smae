import { object, number } from 'yup';
import { obras as schemaOriginal } from '@/consts/formSchemas';
import tarefa from '@/consts/formSchemas/tarefa';

const metasEdicaoEmLote = {
  equipamento_id: {
    permite_edicao_em_massa: true,
    storeKey: 'equipamentos',
    fetchAction: 'buscarTudo',
    listState: 'lista',
    optionValue: 'id',
    optionLabel: 'nome',
  },
  grupo_tematico_id: {
    permite_edicao_em_massa: true,
    storeKey: 'grupos_tematicos',
    fetchAction: 'buscarTudo',
    listState: 'lista',
    optionValue: 'id',
    optionLabel: 'nome',
  },
  mdo_detalhamento: {
    permite_edicao_em_massa: true,
    operacoes_permitidas: ['Set', 'Add'],
    tipo: 'textarea',
    explicacoes: {
      operacao: {
        Set: 'Substitui o texto existente',
        Add: 'Adiciona o texto novo ao existente',
      },
    },
  },
  mdo_observacoes: {
    permite_edicao_em_massa: true,
    tipo: 'textarea',
    operacoes_permitidas: ['Set', 'Add'],
    explicacoes: {
      operacao: {
        Set: 'Substitui o texto existente',
        Add: 'Adiciona o texto novo ao existente',
      },
    },
  },
  mdo_previsao_inauguracao: {
    permite_edicao_em_massa: true,
  },
  orgao_executor_id: {
    permite_edicao_em_massa: true,
    storeKey: 'órgãos',
    fetchAction: 'getAll',
    listState: 'organs',
    optionValue: 'id',
    optionLabel: (item) => `${item.sigla} - ${item.descricao}`,
  },
  orgao_gestor_id: {
    permite_edicao_em_massa: true,
    storeKey: 'órgãos',
    fetchAction: 'getAll',
    listState: 'organs',
    optionValue: 'id',
    optionLabel: (item) => `${item.sigla} - ${item.descricao}`,
    operacoes_permitidas: ['Set'],
    explicacoes: {
      operacao: {
        Set: 'Substitui o item existente',
      },
      campo: 'A edição do órgão gestor implica na exclusão dos assessores do portfólio',
    },
  },
  orgao_responsavel_id: {
    permite_edicao_em_massa: true,
    storeKey: 'órgãos',
    fetchAction: 'getAll',
    listState: 'organs',
    optionValue: 'id',
    optionLabel: (item) => `${item.sigla} - ${item.descricao}`,
    operacoes_permitidas: ['Set'],
    explicacoes: {
      operacao: {
        Set: 'Substitui o item existente',
      },
      campo: 'A edição do órgão gestor implica na exclusão do ponto focal responsável',
    },
  },
  responsavel_id: number()
    .label('Ponto focal responsável')
    .nullable()
    .meta({
      serialize: (valor) => (Array.isArray(valor) ? valor[0] || null : valor),
      permite_edicao_em_massa: true,
      tipo: 'campo-de-pessoas-orgao',
      storeKey: 'órgãos',
      fetchAction: 'getAll',
      listState: 'organs',
      operacoes_permitidas: ['Set'],
      numeroMaximoDeParticipantes: 1,
      explicacoes: {
        operacao: {
          Set: 'Substitui o item existente.',
        },
      },
      balaoInformativo: 'É a pessoa responsável pela evolução da obra em todas as suas fases. Suas principais funções incluem acompanhar o andamento da obra e do(s) respectivo(s) contrato(s), mantendo as informações atualizadas no SMAE.',
    }),
  portfolios_compartilhados: {
    permite_edicao_em_massa: true,
    tipoComponente: 'autocomplete',
    storeKey: 'portfolios_obra',
    fetchAction: 'buscarTudo',
    listState: 'lista',
    optionValue: 'id',
    optionLabel: 'titulo',
    operacoes_permitidas: ['Add', 'Set', 'Remove'],
    explicacoes: {
      operacao: {
        Add: 'Inclui novo item em lista já existente',
        Set: 'Substitui o item existente',
        Remove: 'Remove o item selecionado da obra',
      },
    },
  },
  portfolio_id: {
    permite_edicao_em_massa: true,
    storeKey: 'portfolios_obra',
    fetchAction: 'buscarTudo',
    listState: 'lista',
    optionValue: 'id',
    optionLabel: 'titulo',
  },
  previsao_inicio: {
    permite_edicao_em_massa: true,
  },
  previsao_termino: {
    permite_edicao_em_massa: true,
  },
  projeto_etapa_id: {
    permite_edicao_em_massa: true,
    storeKey: 'etapas_projetos',
    fetchAction: 'buscarTudo',
    listState: 'lista',
    optionValue: 'id',
    optionLabel: 'descricao',
  },
  responsaveis_no_orgao_gestor: {
    permite_edicao_em_massa: true,
    tipo: 'campo-de-pessoas-orgao',
    storeKey: 'órgãos',
    fetchAction: 'getAll',
    listState: 'organs',
    operacoes_permitidas: ['Set', 'Add', 'Remove'],
    explicacoes: {
      operacao: {
        Set: 'Substitui o item existente',
        Add: 'Inclui novo item em lista já existente',
        Remove: 'Exclui o item selecionado da obra',
      },
    },
    balaoInformativo: 'É a pessoa que atua como facilitador e apoiador na aplicação das metodologias definidas. Suas principais responsabilidades incluem fornecer suporte técnico e metodológico ao Ponto Focal Responsável, durante todas as fases.',
  },
  secretario_executivo: {
    permite_edicao_em_massa: true,
  },
  secretario_responsavel: {
    permite_edicao_em_massa: true,
  },
  status: {
    permite_edicao_em_massa: true,
    optionSource: 'statusObras',
    optionValue: 'value',
    optionLabel: 'label',
  },
  tarefas: {
    permite_edicao_em_massa: true,
    tipo: 'campos-compostos',
    operacao: 'CreateTarefa',
    entidade_alvo: 'tarefa',
    operacoes_permitidas: ['Add'],
    explicacoes: {
      operacao: {
        Add: 'Inclui uma nova tarefa no final do cronograma',
      },
    },
    campos: {
      tarefa: tarefa.fields.tarefa,
      inicio_planejado: tarefa.fields.inicio_planejado,
      termino_planejado: tarefa.fields.termino_planejado,
      // duracao_planejado: tarefa.fields.duracao_planejado,
    },
  },
  tipo_intervencao_id: {
    permite_edicao_em_massa: true,
    storeKey: 'tipos_de_intervencao',
    fetchAction: 'buscarTudo',
    listState: 'lista',
    optionValue: 'id',
    optionLabel: 'nome',
  },
};

const finalFields = {};

Object.entries(schemaOriginal.fields).forEach(([campo, schemaCampo]) => {
  const metaOuCampoNovo = metasEdicaoEmLote?.[campo];

  let novoCampo = schemaCampo;

  if (metaOuCampoNovo) {
    if (
      typeof metaOuCampoNovo.describe === 'function' || Array.isArray(metaOuCampoNovo.tests)
    ) {
      novoCampo = metaOuCampoNovo;
    } else {
      novoCampo = schemaCampo.meta(metaOuCampoNovo);
    }
  }

  finalFields[campo] = novoCampo;
});

// talvez tenhamos mais exports aqui?
// eslint-disable-next-line import/prefer-default-export
export const obras = object(finalFields);
