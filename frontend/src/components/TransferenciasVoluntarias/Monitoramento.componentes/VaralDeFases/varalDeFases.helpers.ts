import type { LocationQueryRaw } from 'vue-router';

import type { FaseTipo, VaralDeItemProps } from './componentes/VaralDeFaseItem.vue';

export const DIALOGO_EDICAO_FASE = 'editar-fase';
export const DIALOGO_EDICAO_TAREFA = 'editar-tarefa';

type Responsavel = NonNullable<VaralDeItemProps['responsavel']>;

// Os DTOs do backend não descrevem todos os campos que a API devolve
// (`fase`, `responsabilidade`, `tarefa_cronograma_id`, `recursos`...),
// por isso tipamos aqui apenas o que o varal usa.
export type TarefaDoVaral = {
  // `null` enquanto a tarefa ainda não tem andamento registrado
  andamento: {
    concluida: boolean;
    inicio_real?: string;
    orgao_responsavel?: Responsavel | null;
  } | null;
  recursos?: string;
  tarefa_cronograma_id?: number | null;
  workflow_tarefa: {
    descricao: string;
    id: number;
  };
};

export type FaseDoVaral = {
  andamento: {
    atual: boolean;
    concluida: boolean;
    orgao_responsavel?: Responsavel | null;
    pessoa_responsavel?: VaralDeItemProps['pessoaResponsavel'] | null;
    pode_concluir: boolean;
    situacao?: VaralDeItemProps['situacao'] | null;
  } | null;
  duracao?: number;
  fase: {
    fase: string;
    id: number;
  };
  responsabilidade?: string;
  situacoes?: unknown[];
  tarefas: TarefaDoVaral[];
};

type VerificadorDePermissao = (permissao: string | string[]) => boolean;

// O perfil de gestor de distribuição de recurso pode ter `CadastroWorkflows.inserir`,
// mas não edita fases nem tarefas. A API também recusa a edição.
export function podeEditarVaral(temPermissaoPara: VerificadorDePermissao): boolean {
  return temPermissaoPara(['CadastroWorkflows.editar', 'CadastroWorkflows.inserir'])
    && !temPermissaoPara('SMAE.PerfilGestorDistribuicaoRecurso');
}

const traducaoDeResponsabilidade: Record<string, string> = {
  OutroOrgao: 'Outro Órgão',
};

export function obterFases(etapa: { fases?: unknown[] } | null | undefined): FaseDoVaral[] {
  return (etapa?.fases || []) as FaseDoVaral[];
}

function obterResponsavel(fase: FaseDoVaral): Responsavel | undefined {
  if (fase.andamento?.orgao_responsavel) {
    return fase.andamento.orgao_responsavel;
  }

  if (!fase.responsabilidade) {
    return undefined;
  }

  return {
    id: fase.responsabilidade,
    sigla: traducaoDeResponsabilidade[fase.responsabilidade] || fase.responsabilidade,
  };
}

export function obterIdDaTarefa(tarefa: TarefaDoVaral): number {
  return tarefa.tarefa_cronograma_id || tarefa.workflow_tarefa.id;
}

export function obterTipoDaTarefa(tarefa: TarefaDoVaral): FaseTipo {
  return tarefa.tarefa_cronograma_id ? 'tarefa-cronograma' : 'tarefa-workflow';
}

export function montarPropsDaFase(fase: FaseDoVaral): VaralDeItemProps {
  return {
    atual: fase.andamento?.atual,
    concluida: fase.andamento?.concluida,
    duracao: fase.duracao,
    id: fase.fase.id,
    pessoaResponsavel: fase.andamento?.pessoa_responsavel || undefined,
    podeConcluir: fase.andamento?.pode_concluir,
    responsavel: obterResponsavel(fase),
    situacao: fase.andamento?.situacao || undefined,
    situacoes: fase.situacoes,
    tarefas: fase.tarefas,
    tipo: 'fase',
    titulo: fase.fase.fase,
  };
}

export function montarPropsDaTarefa(
  tarefa: TarefaDoVaral,
  faseMae: VaralDeItemProps,
): VaralDeItemProps {
  const concluida = !!tarefa.andamento?.concluida;

  return {
    atual: faseMae.atual,
    concluida,
    dadosTarefa: {
      faseMaeId: faseMae.id,
      inicioReal: tarefa.andamento?.inicio_real,
    },
    id: obterIdDaTarefa(tarefa),
    recursos: tarefa.recursos,
    responsavel: tarefa.andamento?.orgao_responsavel || undefined,
    situacao: concluida
      ? { id: null, situacao: 'Concluída' }
      : undefined,
    tipo: obterTipoDaTarefa(tarefa),
    titulo: tarefa.workflow_tarefa?.descricao,
  };
}

export function montarQueryDeEdicao(item: VaralDeItemProps): LocationQueryRaw {
  if (item.tipo === 'fase') {
    return {
      dialogo: DIALOGO_EDICAO_FASE,
      fase_id: item.id,
    };
  }

  return {
    dialogo: DIALOGO_EDICAO_TAREFA,
    fase_id: item.dadosTarefa?.faseMaeId,
    tarefa_id: item.id,
    tarefa_tipo: item.tipo,
  };
}
