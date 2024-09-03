<script setup>
import { fasesProjeto as schema } from "@/consts/formSchemas";
import { useAlertStore } from "@/stores/alert.store";
import { useFasesProjetosStore } from '@/stores/fasesProjeto.store.js';
import { storeToRefs } from "pinia";
import { ErrorMessage, Field, Form } from "vee-validate";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const alertStore = useAlertStore();
const fasesProjetosStore = useFasesProjetosStore();
const router = useRouter();
const route = useRoute();
const { chamadasPendentes, erro, lista } = storeToRefs(fasesProjetosStore);

const props = defineProps({
  fasesId: {
    type: Number,
    default: 0,
  },
});

const itemParaEdicao = computed(() => lista.value.find((x) => {
   return x.id === Number(route.params.fasesId);
 }) || {
   id: 0, fase: '',
});


async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.fasesId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";

    const resposta =  await fasesProjetosStore.salvarItem(carga, props.fasesId)

    if (resposta) {
      alertStore.success(msg);
      fasesProjetosStore.$reset();
      fasesProjetosStore.buscarTudo();
      router.push({ name: "fasesListar" });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Nova fase' }}</h1>
    <hr class="ml2 f1" />
    <CheckClose />
  </div>

  <Form
    v-slot="{ errors, isSubmitting }"
    :initial-values="itemParaEdicao"
    :disabled="chamadasPendentes.emFoco"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <LabelFromYup name="fase" :schema="schema" />
        <Field
          id="fase"
          name="fase"
          type="text"
          maxlength="250"
          class="inputtext light mb1"
        />
        <ErrorMessage name="fase" class="error-msg" />
      </div>
    </div>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1" />
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="
          Object.keys(errors)?.length
            ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
            : null
        "
      >
        Salvar
      </button>
      <hr class="ml2 f1" />
    </div>
  </Form>

  <div v-if="chamadasPendentes?.emFoco" class="spinner">Carregando</div>

  <div v-if="erro" class="error p1">
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
