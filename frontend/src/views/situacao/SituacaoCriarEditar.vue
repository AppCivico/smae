<script setup>
import { situacao as schema } from "@/consts/formSchemas";
import tiposSituacao from "@/consts/tiposSituacao";
import { useAlertStore } from "@/stores/alert.store";
import { useSituacaoStore } from "@/stores/situacao.store.js";
import { storeToRefs } from "pinia";
import { ErrorMessage, Field, Form } from "vee-validate";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const alertStore = useAlertStore();
const situacaoStore = useSituacaoStore();
const router = useRouter();
const route = useRoute();
const { chamadasPendentes, erro, tiposPorId } = storeToRefs(situacaoStore);

const props = defineProps({
  situacaoId: {
    type: Number,
    default: 0,
  },
});

const itemParaEdicao = computed(
  () => tiposPorId.value[props.situacaoId] || null
);
async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.situacaoId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";

    const resposta = await situacaoStore.salvarItem(carga, props.situacaoId);

    if (resposta) {
      alertStore.success(msg);
      situacaoStore.$reset();
      situacaoStore.buscarTudo();
      router.push({ name: "situacaoListar" });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || "Nova situação" }}</h1>
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
        <LabelFromYup name="situacao" :schema="schema" />
        <Field
          id="situacao"
          name="situacao"
          type="text"
          maxlength="250"
          class="inputtext light mb1"
        />
        <ErrorMessage name="situacao" class="error-msg" />
      </div>
      <div class="f1">
        <LabelFromYup name="tipo_situacao" :schema="schema" />
        <Field
          name="tipo_situacao"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.tipo, loading: chamadasPendentes.emFoco }"
        >
          <option value="">Selecionar</option>
          <option v-for="tipo, key in tiposSituacao" :key="key" :value="tipo.value">
            {{ tipo.label }}
          </option>
        </Field>
        <ErrorMessage class="error-msg" name="tipo_situacao" />
      </div>
    </div>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1" />
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
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
