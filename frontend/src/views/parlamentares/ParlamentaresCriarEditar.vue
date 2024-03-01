<script setup>
import InputImageProfile from '@/components/InputImageProfile.vue';
import { parlamentar as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import { useParlamentaresStore } from '@/stores/parlamentares.store';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  parlamentarId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const parlamentaresStore = useParlamentaresStore();
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(parlamentaresStore);

async function onSubmit(values) {
  try {
    let r;
    const msg = props.parlamentarId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.parlamentarId) {
      r = await parlamentaresStore.salvarItem(values, props.parlamentarId);
    } else {
      r = await parlamentaresStore.salvarItem(values);
    }
    if (r) {
      alertStore.success(msg);
      parlamentaresStore.$reset();
      router.push({ name: 'parlamentaresListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.parlamentarId) {
  parlamentaresStore.buscarItem(props.parlamentarId);
}

</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Parlamentar' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting, }"
    :validation-schema="schema"
    :initial-values="itemParaEdição"
    @submit="onSubmit"
  >
    <Field
      v-slot="{ handleChange, value }"
      name="variavel_da_foto_aqui"
    >
      <InputImageProfile
        :model-value="value"
        @update:model-value="(e) => handleChange(e)"
      />
    </Field>
    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
