<script lang="ts" setup>
import { differenceInDays } from 'date-fns';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import SmaeDialog from '@/components/SmaeDialog.vue';
import schema from '@/consts/formSchemas/transferenciaEdicaoDeTarefa';
import { useTarefasStore } from '@/stores/tarefas.store';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store';

import {
  DIALOGO_EDICAO_TAREFA,
  montarPropsDaFase,
  montarPropsDaTarefa,
  obterFases,
  obterIdDaTarefa,
  obterTipoDaTarefa,
} from '../varalDeFases.helpers';

const route = useRoute();

const tarefaStore = useTarefasStore();
const workflowAndamentoStore = useWorkflowAndamentoStore();

const { etapaEmFoco } = storeToRefs(workflowAndamentoStore);

// Não usamos `tarefaStore.chamadasPendentes.emFoco` porque ele começa
// como `true` e só muda depois de uma busca, que esta tela não faz
const carregando = ref<boolean>(false);

const tarefa = computed(() => {
  if (route.query.dialogo !== DIALOGO_EDICAO_TAREFA) {
    return null;
  }

  const faseId = Number(route.query.fase_id);
  const tarefaId = Number(route.query.tarefa_id);

  const faseMae = obterFases(etapaEmFoco.value).find((x) => x.fase.id === faseId);
  const encontrada = faseMae?.tarefas.find((x) => obterIdDaTarefa(x) === tarefaId
    && obterTipoDaTarefa(x) === route.query.tarefa_tipo);

  return faseMae && encontrada
    ? montarPropsDaTarefa(encontrada, montarPropsDaFase(faseMae))
    : null;
});

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
});

// Também cobre a recarga da página com o diálogo aberto,
// quando os dados da etapa chegam depois da montagem
watch(tarefa, (dados) => {
  if (!dados) {
    return;
  }

  resetForm({
    values: {
      concluido: !!dados.concluida,
      pessoa_responsavel: dados.recursos,
    },
  });
}, { immediate: true });

function salvarTarefaWorkflow(
  dados: NonNullable<typeof tarefa.value>,
  valores: Record<string, unknown>,
) {
  const orgaoId = dados.responsavel?.id === 'OutroOrgao'
    ? null
    : dados.responsavel?.id;

  return workflowAndamentoStore.editarFase({
    fase_id: dados.dadosTarefa?.faseMaeId,
    orgao_responsavel_id: dados.faseResponsabilidade !== 'OutroOrgao'
      ? orgaoId
      : undefined,
    tarefas: [{
      id: dados.id,
      orgao_responsavel_id: orgaoId,
      concluida: valores.concluido,
    }],
  });
}

function salvarTarefaCronograma(
  dados: NonNullable<typeof tarefa.value>,
  valores: Record<string, unknown>,
) {
  let datas = {};

  if (valores.concluido) {
    const terminoReal = new Date();
    const inicioReal = dados.dadosTarefa?.inicioReal
      ? new Date(dados.dadosTarefa.inicioReal)
      : terminoReal;

    datas = {
      inicio_real: inicioReal.toISOString(),
      termino_real: terminoReal.toISOString(),
      duracao_real: Math.max(differenceInDays(terminoReal, inicioReal), 1),
    };
  }

  return tarefaStore.salvarItem({
    ...datas,
    recursos: valores.pessoa_responsavel,
  }, dados.id, {
    transferenciaId: Number(route.params.transferenciaId),
  });
}

const salvar = (fecharDialogo: () => void) => handleSubmit
  .withControlled(async (valores) => {
    if (!tarefa.value) {
      return;
    }

    carregando.value = true;

    let salvou;

    try {
      salvou = tarefa.value.tipo === 'tarefa-cronograma'
        ? await salvarTarefaCronograma(tarefa.value, valores)
        : await salvarTarefaWorkflow(tarefa.value, valores);
    } finally {
      carregando.value = false;
    }

    if (!salvou) {
      return;
    }

    fecharDialogo();
    workflowAndamentoStore.buscar();
  });
</script>

<template>
  <SmaeDialog
    :id="DIALOGO_EDICAO_TAREFA"
    :titulo="tarefa?.titulo"
    :parametros-associados="['fase_id', 'tarefa_id', 'tarefa_tipo']"
  >
    <template #default="{ fecharDialogo }">
      <p v-if="!tarefa">
        Tarefa não encontrada.
      </p>

      <form
        v-else
        :aria-busy="carregando"
        @submit.prevent="salvar(fecharDialogo)()"
      >
        <div class="flex g2 mb1">
          <div class="f1 mb1">
            <SmaeLabel
              :schema="schema"
              name="orgao_id"
            />

            <input
              class="inputtext"
              :value="tarefa.responsavel?.sigla"
              disabled
            >
          </div>
        </div>

        <div class="mb1">
          <label class="flex g1">
            <Field
              name="concluido"
              class="inputtext"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
            />

            <SmaeLabel
              class="mb0"
              as="div"
              :schema="schema"
              name="concluido"
            />
          </label>

          <ErrorMessage
            name="concluido"
            class="error-msg"
          />
        </div>

        <div
          v-if="tarefa.tipo === 'tarefa-cronograma'"
          class="mb1"
        >
          <SmaeLabel
            :schema="schema"
            name="pessoa_responsavel"
          />

          <Field
            name="pessoa_responsavel"
            class="inputtext"
          />

          <ErrorMessage
            name="pessoa_responsavel"
            class="error-msg"
          />
        </div>

        <div class="flex g1 justifycenter">
          <button
            class="btn"
            type="submit"
            :disabled="carregando"
            :aria-disabled="carregando"
          >
            Salvar
          </button>
        </div>
      </form>
    </template>
  </SmaeDialog>
</template>
