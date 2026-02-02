<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm,
} from 'vee-validate';
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import { valoresLimites as schema } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useValoresLimitesStore } from '@/stores/valoresLimites.store';

const alertStore = useAlertStore();
const router = useRouter();
const valoresLimitesStore = useValoresLimitesStore();

const { emFoco } = storeToRefs(valoresLimitesStore);

const props = defineProps({
  valorLimiteId: {
    type: Number,
    default: 0,
  },
});

const {
  errors, handleSubmit, isSubmitting, resetForm,
} = useForm({
  validationSchema: schema,
});

onMounted(() => {
  if (props.valorLimiteId) {
    valoresLimitesStore.buscarItem(props.valorLimiteId);
  }
});

const onSubmit = handleSubmit(async (carga) => {
  const cargaManipulada = nulificadorTotal(carga);

  try {
    const msg = props.valorLimiteId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.valorLimiteId
      ? await valoresLimitesStore.salvarItem(cargaManipulada, props.valorLimiteId)
      : await valoresLimitesStore.salvarItem(cargaManipulada);

    if (resposta) {
      alertStore.success(msg);
      valoresLimitesStore.$reset();
      valoresLimitesStore.buscarTudo();
      router.push({ name: 'valoresLimites.listar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

watch(emFoco, (val) => {
  if (val) {
    resetForm({ values: val });
  }
});
</script>

<template>
  <div class="flex spacebetween center mb2">
    <CabecalhoDePagina />

    <hr class="ml2 f1">

    <CheckClose />
  </div>

  <form
    v-if="!valorLimiteId || emFoco"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <SmaeLabel
          name="data_inicio_vigencia"
          :schema="schema"
        />

        <Field
          id="data_inicio_vigencia"
          name="data_inicio_vigencia"
          required
          type="date"
          class="inputtext light mb1"
          :class="{ error: errors.data_inicio_vigencia }"
        />

        <ErrorMessage
          name="data_inicio_vigencia"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
        <SmaeLabel
          name="data_fim_vigencia"
          :schema="schema"
        />

        <Field
          id="data_fim_vigencia"
          name="data_fim_vigencia"
          type="date"
          class="inputtext light mb1"
          :class="{ error: errors.data_fim_vigencia }"
        />

        <ErrorMessage
          name="data_fim_vigencia"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <SmaeLabel
          name="valor_minimo"
          :schema="schema"
        />

        <Field
          id="valor_minimo"
          name="valor_minimo"
          required
          type="text"
          class="inputtext light mb1"
          placeholder="0,00"
          :class="{ error: errors.valor_minimo }"
        />

        <ErrorMessage
          name="valor_minimo"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
        <SmaeLabel
          name="valor_maximo"
          :schema="schema"
        />

        <Field
          id="valor_maximo"
          name="valor_maximo"
          required
          type="text"
          class="inputtext light mb1"
          placeholder="0,00"
          :class="{ error: errors.valor_maximo }"
        />

        <ErrorMessage
          name="valor_maximo"
          class="error-msg"
        />
      </div>
    </div>

    <div class="mb1">
      <SmaeLabel
        name="observacao"
        :schema="schema"
      />

      <Field
        v-slot="{ field, handleChange, value }"
        name="observacao"
      >
        <SmaeText
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          :schema="schema"
          :name="field.name"
          :model-value="value"
          anular-vazio
          @update:model-value="handleChange"
        />
      </Field>

      <ErrorMessage
        name="observacao"
        class="error-msg"
      />
    </div>

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null
        "
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>
</template>
