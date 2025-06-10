<script lang="ts" setup>
import { computed, ref } from 'vue';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import dateToDate from '@/helpers/dateToDate';
import {
  EdicaoTransferenciaFase,
  EdicaoTransferenciaFaseTarefa,
} from '@/consts/formSchemas';

import { useTarefasStore } from '@/stores/tarefas.store';
import SmallModal from '@/components/SmallModal.vue';

const tarefaStore = useTarefasStore();

const modalEdicaoFase = ref<boolean>(false);
const tipoFase = ref<'tarefa' | 'fase' | undefined>(undefined);

const schema = computed(() => {
  if (!tipoFase.value) {
    return undefined;
  }

  if (tipoFase.value === 'fase') {
    return EdicaoTransferenciaFase;
  }

  return EdicaoTransferenciaFaseTarefa;
});

const {
  handleSubmit, resetForm, values,
} = useForm({
  validationSchema: schema.value,
});

type EdicaoDados = {
  id: number,
  faseMaeId?: number,
  secundario: boolean,
  orgao_responsavel?: {
    id: string,
    sigla: string,
    descricao: string,
  }
  situacao?: string
};
function abrirModalFase(dadosEdicao: EdicaoDados) {
  modalEdicaoFase.value = true;

  tipoFase.value = !dadosEdicao.secundario ? 'fase' : 'tarefa';

  console.log(dadosEdicao);

  resetForm({
    values: {
      id: dadosEdicao.id,
      orgao_id: dadosEdicao.orgao_responsavel?.id,
      orgao_responsavel_nome: dadosEdicao.orgao_responsavel?.sigla,
      situacao: dadosEdicao.situacao,
    },
  });
}

export type EdicaoTarefaComCronogramaModalExposed = {
  abrirModalFase: typeof abrirModalFase
};

defineExpose<EdicaoTarefaComCronogramaModalExposed>({
  abrirModalFase,
});

const onSubmit = handleSubmit((valoresControlados) => {
  let dadosControlados = { ...valoresControlados };

  if (valoresControlados.concluido) {
    dadosControlados = {
      ...dadosControlados,
      data_conclusao: dateToDate(new Date()),
    };
  }

  console.log(dadosControlados);

  // tarefaStore.salvarItem();
});
</script>

<template>
  <SmallModal
    :active="modalEdicaoFase"
    has-close-button
    @close="modalEdicaoFase = false"
  >
    <h2>
      Disponibilização do Recurso
    </h2>

    <form @submit="onSubmit">
      <div class="flex g2 mb1">
        <div class="f1 mb1">
          <SmaeLabel
            :schema="schema"
            name="orgao_id"
          />

          <Field
            name="orgao_responsavel_nome"
            class="inputtext"
            :model-value="values.orgao_responsavel_nome"
            disabled
          />

          <Field
            name="orgao_id"
            class="inputtext"
            hidden
          />
        </div>

        <div
          v-if="tipoFase === 'fase'"
          class="f1 mb1"
        >
          <SmaeLabel
            :schema="schema"
            name="situacao"
          />

          <Field
            name="situacao"
            type="select"
            class="inputtext"
          />

          <ErrorMessage
            name="situacao"
            class="error-msg"
          />
        </div>
      </div>

      <div v-if="tipoFase === 'tarefa'">
        <Field
          name="fase_mae_id"
          hidden
        />

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

        <div class="mb1">
          <SmaeLabel
            :schema="schema"
            name="pessoa_responsavel"
          />

          <Field
            name="pessoa_responsavel"
            type="select"
            class="inputtext"
          />

          <ErrorMessage
            name="pessoa_responsavel"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex justifycenter">
        <button
          class="btn"
          type="submit"
        >
          Salvar
        </button>
      </div>
    </form>
  </SmallModal>
</template>
