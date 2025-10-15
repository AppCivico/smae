<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import { onMounted, watch } from 'vue';
import { tipoDeVinculo as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useTipoDeVinculoStore } from '@/stores/tipoDeVinculo.store';
import TituloDaPagina from '@/components/TituloDaPagina.vue';

defineOptions({ inheritAttrs: false });

const tipoDeVinculoStore = useTipoDeVinculoStore();
const { emFoco } = storeToRefs(tipoDeVinculoStore);

const route = useRoute();
const router = useRouter();

const alertStore = useAlertStore();

const { handleSubmit, resetForm } = useForm({
  validationSchema: {},
  initialValues: {},
});

const onSubmit = handleSubmit.withControlled(async (values) => {
  try {
    let r;
    const msg = route.params.tipoVinculoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (route.params.tipoVinculoId) {
      await tipoDeVinculoStore.salvarItem(values, route.params.tipoVinculoId);
    } else {
      await tipoDeVinculoStore.salvarItem(values);
    }

    alertStore.success(msg);
    tipoDeVinculoStore.$reset();
    router.push({ name: route.meta.rotaDeEscape });
  } catch (error) {
    alertStore.error(error);
  }
});

watch(emFoco, () => {
  resetForm({ values: emFoco.value });
});

onMounted(() => {
  if (route.params.tipoVinculoId) {
    tipoDeVinculoStore.buscarItem(route.params.tipoVinculoId);
  }
});
</script>

<template>
  <div class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose />
  </div>

  <form @submit="onSubmit">
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="nome"
          :schema="schema"
        />

        <Field
          name="nome"
          type="text"
          class="inputtext light mb1"
        />

        <ErrorMessage
          class="error-msg mb1"
          name="nome"
        />
      </div>
    </div>

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">

      <button
        type="submit"
        class="btn big"
      >
        Salvar
      </button>

      <hr class="mr2 f1">
    </div>
  </form>
</template>
