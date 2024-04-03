<script setup>
import { etapasProjeto as schema } from "@/consts/formSchemas";
import { useAlertStore } from "@/stores/alert.store";
import { useAuthStore } from "@/stores/auth.store";
import { useEtapasProjetosStore } from "@/stores/etapasProjeto.store.js";
import { storeToRefs } from "pinia";
import { ErrorMessage, Field, Form } from "vee-validate";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const alertStore = useAlertStore();
const etapasProjetosStore = useEtapasProjetosStore();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);
const { chamadasPendentes, erro, tiposPorId } =
  storeToRefs(etapasProjetosStore);

const props = defineProps({
  etapaDoProjetoId: {
    type: Number,
    default: 0,
  },
});

const emFoco = computed(
  () => tiposPorId.value[route.params.etapaDoProjetoId] || null //
);

async function onSubmit(_, { controlledValues }) {
  const carga = controlledValues;

  try {
    const msg = props.etapaDoProjetoId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";

    const resposta = props.etapaDoProjetoId
      ? await etapasProjetosStore.salvarItem(carga, props.etapaDoProjetoId)
      : await etapasProjetosStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      etapasProjetosStore.$reset();
      etapasProjetosStore.buscarTudo();
      router.push({ name: "etapasDoProjetoListar" });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function excluirEtapaDoProjeto(id) {
  alertStore.confirmAction(
    "Deseja mesmo remover esse item?",
    async () => {
      if (await etapasProjetosStore.excluirItem(id)) {
        etapasProjetosStore.$reset();
        etapasProjetosStore.buscarTudo();
        alertStore.success("Etapa removida.");

        const rotaDeEscape = route.meta?.rotaDeEscape;

        if (rotaDeEscape) {
          router.push(
            typeof rotaDeEscape === "string"
              ? { name: rotaDeEscape }
              : rotaDeEscape
          );
        }
      }
    },
    "Remover"
  );
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div v-if="etapaDoProjetoId" class="t12 uc w700 tamarelo">
        {{ "Editar etapa" }}
      </div>
      {{
        emFoco?.descricao
          ? emFoco?.descricao
          : etapaDoProjetoId
          ? "Etapa"
          : "Nova etapa"
      }}
    </h1>
    <hr class="ml2 f1" />
    <CheckClose />
  </div>

  <Form
    v-if="!etapaDoProjetoId || emFoco"
    v-slot="{ errors, isSubmitting }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="emFoco"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <LabelFromYup name="descricao" :schema="schema" />
        <Field
          id="descricao"
          name="descricao"
          required
          type="text"
          maxlength="2048"
          class="inputtext light mb1"
          :class="{
            error: errors.nome,
          }"
        />
        <ErrorMessage name="descricao" class="error-msg" />
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

  <button
    v-else-if="emFoco?.id && temPermissãoPara('CadastroProjetoEtapa.remover')"
    class="btn amarelo big"
    @click="excluirEtapaDoProjeto(emFoco.id)"
  >
    Remover item
  </button>

  <div v-if="erro" class="error p1">
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
