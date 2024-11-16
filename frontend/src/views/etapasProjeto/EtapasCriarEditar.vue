<script setup>
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { computed, defineOptions } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { etapasProjeto as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';

const alertStore = useAlertStore();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);
const etapasProjetosStore = useEtapasProjetosStore(route.meta.entidadeMãe);
const { chamadasPendentes, erro, etapasPorId } = storeToRefs(etapasProjetosStore);

defineOptions({ inheritAttrs: false });

const props = defineProps({
  etapaId: {
    type: Number,
    default: 0,
  },
});

const emFoco = computed(() => etapasPorId.value[props.etapaId] || null);

async function onSubmit(_, { controlledValues }) {
  const carga = controlledValues;
  let redirect;
  if (route.meta.prefixoParaFilhas === 'TransferenciasVoluntarias') {
    redirect = 'TransferenciasVoluntarias.etapasListar';
  } else if (route.meta.entidadeMãe === 'mdo') {
    redirect = 'mdo.etapasListar';
  } else if (route.meta.entidadeMãe === 'projeto') {
    redirect = 'projeto.etapasListar';
  }
  try {
    const msg = props.etapaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.etapaId
      ? await etapasProjetosStore.salvarItem(carga, props.etapaId)
      : await etapasProjetosStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      etapasProjetosStore.$reset();
      etapasProjetosStore.buscarTudo();
      router.push({ name: redirect });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function excluirEtapaDoProjeto(id) {
  alertStore.confirmAction(
    'Deseja mesmo remover esse item?',
    async () => {
      if (await etapasProjetosStore.excluirItem(id)) {
        etapasProjetosStore.$reset();
        etapasProjetosStore.buscarTudo();
        alertStore.success('Etapa removida.');

        const rotaDeEscape = route.meta?.rotaDeEscape;

        if (rotaDeEscape) {
          router.push(
            typeof rotaDeEscape === 'string'
              ? { name: rotaDeEscape }
              : rotaDeEscape,
          );
        }
      }
    },
    'Remover',
  );
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="etapaId"
        class="t12 uc w700 tamarelo"
      >
        {{ "Editar etapa" }}
      </div>
      {{ emFoco?.descricao
        ? emFoco?.descricao
        : etapaId
          ? "Etapa"
          : "Nova etapa" }}
    </h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <Form
    v-if="!etapaId || emFoco"
    v-slot="{ errors, isSubmitting }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="emFoco"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <LabelFromYup
          name="descricao"
          :schema="schema"
        />
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
        <ErrorMessage
          name="descricao"
          class="error-msg"
        />
      </div>
    </div>

    <FormErrorsList :errors="errors" />

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
  </Form>

  <div
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </div>

  <button
    v-else-if="emFoco?.id && (
      temPermissãoPara('CadastroProjetoEtapa.remover'
        || route.meta.prefixoParaFilhas === 'TransferenciasVoluntarias'
      )
    )"
    class="btn amarelo big"
    @click="excluirEtapaDoProjeto(emFoco.id)"
  >
    Remover item
  </button>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
