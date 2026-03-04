<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm,
} from 'vee-validate';
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';
import UploadDeArquivosEmLista from '@/components/UploadDeArquivosEmLista/UploadDeArquivosEmLista.vue';
import { valoresLimites as schema } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal';
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
  values, errors, handleSubmit, resetForm, setFieldValue,
} = useForm({
  validationSchema: schema,
});

function removerArquivo(itemId: number) {
  if (!itemId || !values?.anexos) {
    return;
  }

  const arquivosRestanes = values?.anexos.filter((anexo) => anexo.id !== itemId);
  setFieldValue('anexos', arquivosRestanes);
}

onMounted(() => {
  if (props.valorLimiteId) {
    valoresLimitesStore.buscarItem(props.valorLimiteId);
  }
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const msg = props.valorLimiteId
    ? 'Dados salvos com sucesso!'
    : 'Item adicionado com sucesso!';

  const carga = nulificadorTotal(valoresControlados);

  const resposta = props.valorLimiteId
    ? await valoresLimitesStore.salvarItem(carga, props.valorLimiteId)
    : await valoresLimitesStore.salvarItem(carga);

  if (resposta) {
    alertStore.success(msg);
    router.push({ name: 'valoresLimites.listar' });
  }
});

watch(emFoco, (val) => {
  if (val) {
    resetForm({ values: val });
  }
});
</script>

<template>
  <CabecalhoDePagina />

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
          v-slot="{ field, handleChange, value }"
          name="valor_minimo"
        >
          <MaskedFloatInput
            class="inputtext light"
            :class="{ error: errors.valor_minimo }"
            :value="value"
            :name="field.name"
            converter-para="string"
            @update:model-value="handleChange"
          />
        </Field>

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
          v-slot="{ field, handleChange, value }"
          name="valor_maximo"
        >
          <MaskedFloatInput
            class="inputtext light"
            :class="{ error: errors.valor_maximo }"
            :value="value"
            :name="field.name"
            converter-para="string"
            @update:model-value="handleChange"
          />
        </Field>

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
          :class="{ error: errors.observacao }"
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

    <div>
      <SmaeLabel
        name="anexos"
        :schema="schema"
      />

      <Field
        v-slot="{value}"
        name="anexos"
      >
        <UploadDeArquivosEmLista
          tipo="DOCUMENTO"
          :arquivos-existentes="value"
          @update:model-value="ev => setFieldValue('upload_tokens', ev)"
          @arquivo-existente-removido="removerArquivo"
        />
      </Field>

      <Field
        name="upload_tokens"
        type="hidden"
      />
    </div>

    <SmaeFieldsetSubmit />
  </form>
</template>
