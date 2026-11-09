<script lang="ts" setup>
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import SmaeDialog from '@/components/SmaeDialog.vue';
import schema from '@/consts/formSchemas/transferenciaEdicaoDeTarefa';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import { useAuthStore } from '@/stores/auth.store';
import { useTarefasStore } from '@/stores/tarefas.store';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store';

import {
  DIALOGO_EDICAO_TAREFA,
  montarPropsDaFase,
  montarPropsDaTarefa,
  obterFases,
  obterIdDaTarefa,
  obterTipoDaTarefa,
  podeEditarVaral,
} from '../varalDeFases.helpers';

const route = useRoute();

const authStore = useAuthStore();
const tarefaStore = useTarefasStore();
const workflowAndamentoStore = useWorkflowAndamentoStore();

const { temPermissãoPara } = storeToRefs(authStore);
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

const dataDeHoje = () => format(new Date(), 'yyyy-MM-dd');

const inicioReal = computed(() => dateTimeToDate(tarefa.value?.dadosTarefa?.inicioReal));

// A API recusa término anterior ao início, então não dá para concluir antes de começar
const inicioNoFuturo = computed(() => tarefa.value?.tipo === 'tarefa-cronograma'
  && !!inicioReal.value
  && inicioReal.value > dataDeHoje());

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

  // Sem `orgao_responsavel_id` da fase: a API mantém o órgão atual dela,
  // e salvar a tarefa não deve transferir a fase mãe para o órgão da tarefa
  return workflowAndamentoStore.editarFase({
    fase_id: dados.dadosTarefa?.faseMaeId,
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
  // A tarefa do cronograma não tem um campo "concluída": a API considera
  // concluída a que tem `termino_real`. Por isso só enviamos datas quando a
  // situação muda, para não sobrescrever o término de uma tarefa já concluída.
  // A API também exige que as três propriedades venham juntas.
  let datas = {};
  const inicio = dateTimeToDate(dados.dadosTarefa?.inicioReal) || null;

  if (valores.concluido && !dados.concluida) {
    // Datas sem horário (YYYY-MM-DD), e o dia de início conta na duração:
    // término = início + (duração - 1) dias
    const termino = dataDeHoje();
    const inicioOuHoje = inicio || termino;

    datas = {
      inicio_real: inicioOuHoje,
      termino_real: termino,
      duracao_real: differenceInCalendarDays(parseISO(termino), parseISO(inicioOuHoje)) + 1,
    };
  } else if (!valores.concluido && dados.concluida) {
    // Reabre a tarefa, mantendo a data de início
    datas = {
      inicio_real: inicio,
      termino_real: null,
      duracao_real: null,
    };
  }

  return tarefaStore.salvarItem({
    ...datas,
    recursos: valores.pessoa_responsavel,
  }, dados.id, {
    transferenciaId: Number(route.params.transferenciaId),
  });
}

const salvar = (fecharDialogoAposSalvar: () => void) => handleSubmit
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

    fecharDialogoAposSalvar();
    workflowAndamentoStore.buscar();
  });
</script>

<template>
  <SmaeDialog
    :id="DIALOGO_EDICAO_TAREFA"
    :titulo="tarefa?.titulo"
    :parametros-associados="['fase_id', 'tarefa_id', 'tarefa_tipo']"
    :permitido="podeEditarVaral(temPermissãoPara)"
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
              id="edicao-tarefa-orgao-rotulo"
              :schema="schema"
              name="orgao_id"
            />

            <input
              class="inputtext"
              aria-labelledby="edicao-tarefa-orgao-rotulo"
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
              :disabled="inicioNoFuturo"
              :aria-describedby="inicioNoFuturo ? 'aviso-inicio-no-futuro' : undefined"
            />

            <SmaeLabel
              class="mb0"
              as="div"
              :schema="schema"
              name="concluido"
            />
          </label>

          <p
            v-if="inicioNoFuturo && inicioReal"
            id="aviso-inicio-no-futuro"
            class="t12 mb0"
          >
            A tarefa só pode ser concluída a partir de
            {{ format(parseISO(inicioReal), 'dd/MM/yyyy') }}, data de início real.
          </p>

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
