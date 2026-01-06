<template>
  <div class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose :formulario-sujo="formularioSujo" />
  </div>

  <form @submit="onSubmit">
    <div class="flex g2 mb1">
      <div class="f1">
        <SmaeLabel
          name="descricao"
          :schema="schema"
        />

        <Field
          name="descricao"
          as="textarea"
          maxlength="1000"
          rows="4"
          class="inputtext light mb1"
        />

        <ErrorMessage
          class="error-msg mb1"
          name="descricao"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <label class="label flex center">
          <Field
            name="habilitar_info_adicional"
            type="checkbox"
            :value="true"
            :unchecked-value="false"
            class="inputcheckbox"
          />

          <SmaeLabel
            class="mb0"
            name="habilitar_info_adicional"
            :schema="schema"
            as="span"
          />
        </label>

        <ErrorMessage
          class="error-msg mb1"
          name="habilitar_info_adicional"
        />
      </div>
    </div>

    <div class="flex justifycenter center mb2">
      <button
        class="btn big"
        type="submit"
      >
        Salvar
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import CheckClose from '@/components/CheckClose.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import { tipoEncerramento as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useTipoEncerramentoStore } from '@/stores/tipoEncerramento.store';

defineOptions({ inheritAttrs: false });

const tipoEncerramentoStore = useTipoEncerramentoStore();
const { emFoco } = storeToRefs(tipoEncerramentoStore);

const route = useRoute();
const router = useRouter();

const alertStore = useAlertStore();
const formularioSujo = useIsFormDirty();

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async (values) => {
  try {
    const msg = route.params.tipoEncerramentoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (route.params.tipoEncerramentoId) {
      await tipoEncerramentoStore.salvarItem(values, Number(route.params.tipoEncerramentoId));
    } else {
      await tipoEncerramentoStore.salvarItem(values);
    }

    alertStore.success(msg);
    tipoEncerramentoStore.$reset();
    router.push({ name: route.meta.rotaDeEscape as string });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Erro ao tentar salvar item', e);
  }
});

watch(emFoco, (novo) => {
  if (!novo) {
    resetForm({ values: { descricao: '', habilitar_info_adicional: false } });
  } else {
    resetForm({ values: novo });
  }
}, { immediate: true });

onMounted(() => {
  if (route.params.tipoEncerramentoId) {
    tipoEncerramentoStore.buscarItem(Number(route.params.tipoEncerramentoId));
  }
});
</script>
