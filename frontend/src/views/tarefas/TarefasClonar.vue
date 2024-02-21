<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { useAlertStore } from '@/stores/alert.store';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import { number, object } from 'yup';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useTarefasStore } from '@/stores/tarefas.store.ts';

const alertStore = useAlertStore();

const projetosStore = useProjetosStore();
const {
  emFoco: projetoEmFoco,
  chamadasPendentes,
  erro,
  projetosPorPortfolio,
  projetosPortfolioModeloClonagem
} = storeToRefs(projetosStore);

const tarefasStore = useTarefasStore();

const route = useRoute();
const router = useRouter();

const valoresIniciais = computed(() => ({
  projeto_fonte_id: 0,
}));

const schema = object({
  projeto_fonte_id: number('Precisa-se escolher um projeto para copiar.')
    .label('Projeto')
    .min(1, 'Selecione um projeto')
    .required('Precisa-se escolher um projeto para copiar.'),
});

const {
  errors, handleSubmit, isSubmitting, resetForm, values,
} = useForm({
  initialValues: valoresIniciais.value,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    if (await tarefasStore.clonarTarefas(values.projeto_fonte_id)) {
      tarefasStore.$reset();
      tarefasStore.buscarTudo();

      alertStore.success('Tarefas clonadas!');
      if (route.meta.rotaDeEscape) {
        router.push({
          name: route.meta.rotaDeEscape,
          params: route.params,
          query: route.query,
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const formulárioSujo = useIsFormDirty();

if (!projetosPorPortfolio.value.length) {
  projetosStore.buscarTudo();
}

const combinedArray = computed(() => {
  const projetosDoMesmoPort = projetosPorPortfolio.value[projetoEmFoco.value?.portfolio_id] || [];
  console.log(projetosDoMesmoPort);
  const projetosPortsModeloClonagem = projetosPortfolioModeloClonagem
    .value[projetoEmFoco.value?.portfolio_id] || [];
  console.log('projetosPortsModeloClonagem');
  console.log(projetosPortsModeloClonagem);
  return [...projetosDoMesmoPort, ...projetosPortsModeloClonagem];
});

watch(valoresIniciais, (novoValor) => {
  resetForm({ values: novoValor });
});
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <SmallModal class="small">
    <div class="flex spacebetween center mb2">
      <h2>
        {{ typeof $route?.meta?.título === 'function'
          ? $route.meta.título()
          : $route?.meta?.título || 'Portfolio' }}
      </h2>
      <hr class="ml2 f1">

      <CheckClose
        :formulário-sujo="formulárioSujo"
      />
    </div>
    <form
      :disabled="isSubmitting"
      @submit="onSubmit"
    >
      <div class="flex g2 mb1">
        <div class="f1 mb1">
          <LabelFromYup
            name="projeto_fonte_id"
            :schema="schema"
          />
          <Field
            name="projeto_fonte_id"
            as="select"
            class="inputtext light mb1"
            :class="{
              error: errors.projeto_fonte_id,
              loading: projetosStore.chamadasPendentes.lista
            }"
            :disabled="!projetoEmFoco
              || !projetosPorPortfolio?.[projetoEmFoco?.portfolio_id]?.length"
          >
            <option :value="0">
              Selecionar
            </option>
            <option
              v-for="item in combinedArray"
              :key="item.id"
              :value="item.id"
              :hidden="item.id === projetoEmFoco?.id"
            >
              {{ item.nome }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg mb1"
            name="portfolio_id"
          />
        </div>
      </div>

      <FormErrorsList :errors="errors" />

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting
            || Object.keys(errors)?.length"
          :title="Object.keys(errors)?.length
            ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
            : null"
        >
          Clonar
        </button>
        <hr class="ml2 f1">
      </div>
    </form>

    <LoadingComponent v-if="chamadasPendentes.transferirDePortfolio">
      processando
    </LoadingComponent>

    <div
      v-if="erro"
      class="error p1"
    >
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>
  </SmallModal>
</template>
