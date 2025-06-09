<script lang="ts" setup>
import { ref, watch } from 'vue';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import SmallModal from '@/components/SmallModal.vue';
import { EdicaoTarefaComCronograma as schema } from '@/consts/formSchemas';

import { useTarefasStore } from '@/stores/tarefas.store';
import { VaralDeItemProps } from './VaralDeFaseItem.vue';

const { tarefaStore } = useTarefasStore();

const props = defineProps<VaralDeItemProps>();
export type EdicaoTarefaComCronogramaModalExposed = {
  abrirModalFase(): void
};

const modalEdicaoFase = ref<boolean>(false);

function abrirModalFase() {
  modalEdicaoFase.value = true;
}

defineExpose<EdicaoTarefaComCronogramaModalExposed>({
  abrirModalFase,
});

const {
  handleSubmit, resetForm,
} = useForm({

  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled((valoresControlados) => {
  console.log('submit', valoresControlados);

  // tarefaStore.salvarItem()
});

watch(modalEdicaoFase, () => {
  if (!modalEdicaoFase.value) {
    return;
  }

  console.log(props);

  resetForm({
    values: {
      orgao_responsavel_id: '1234',
    },
  });
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
            name="orgao_id"
            as="select"
            class="inputtext"
            disabled
            aria-disabled="true"
          >
            <option :value="0">
              Selecionar
            </option>

            <!-- <option
              v-for="item in órgãosDisponíveis"
              :key="item"
              :value="item.id"
            >
              {{ item.sigla }} - {{ item.descricao }}
            </option> -->
          </Field>

          <ErrorMessage
            name="orgao_id"
            class="error-msg"
          />
        </div>

        <div class="f1 mb1">
          <SmaeLabel
            :schema="schema"
            name="recursos"
          />

          <Field
            name="recursos"
            type="select"
            class="inputtext"
          />

          <ErrorMessage
            name="recursos"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2 mb1">
        <div class="f1 mb1">
          <SmaeLabel
            :schema="schema"
            name="inicio_real"
          />

          <Field
            name="inicio_real"
            type="select"
            class="inputtext"
          />

          <ErrorMessage
            name="inicio_real"
            class="error-msg"
          />
        </div>

        <div class="f1 mb1">
          <SmaeLabel
            :schema="schema"
            name="termino_real"
          />

          <Field
            name="termino_real"
            type="select"
            class="inputtext"
          />

          <ErrorMessage
            name="termino_real"
            class="error-msg"
          />
        </div>

        <div class="f1 mb1">
          <SmaeLabel
            :schema="schema"
            name="percentual_concluido"
          />

          <Field
            name="percentual_concluido"
            type="select"
            class="inputtext"
          />

          <ErrorMessage
            name="percentual_concluido"
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
