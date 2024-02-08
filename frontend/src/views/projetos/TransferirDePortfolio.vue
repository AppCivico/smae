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
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useOrgansStore } from '@/stores/organs.store';

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();

const ÓrgãosStore = useOrgansStore();
const {
  órgãosComoLista,
  órgãosQueTemResponsáveisEPorId,
} = storeToRefs(ÓrgãosStore);

const portfolioStore = usePortfolioStore();

const projetosStore = useProjetosStore();
const {
  emFoco,
  chamadasPendentes,
  erro,
} = storeToRefs(projetosStore);

const route = useRoute();
const router = useRouter();

const valoresIniciais = computed(() => ({
  portfolio_id: emFoco.value?.portfolio_id,
}));

const schema = object({
  portfolio_id: number('O projeto precisa pertencer a um portfolio')
    .label('Portfólio')
    .min(1, 'Selecione ao menos um portfolio')
    .required('O projeto precisa pertencer a um portfolio'),
});

const {
  errors, handleSubmit, isSubmitting, resetForm, values,
} = useForm({
  initialValues: valoresIniciais.value,
  validationSchema: schema,
});

const háÓrgãosDisponíveisNessePortfolio = (idDoPortfólio) => portfolioStore
  .portfoliosPorId?.[idDoPortfólio]?.orgaos
  .some((x) => órgãosQueTemResponsáveisEPorId.value?.[x.id]) || [];

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    if (await projetosStore.transferirDePortfolio(props.projetoId, values.portfolio_id)) {
      projetosStore.$reset();
      projetosStore.buscarItem(props.projetoId);

      alertStore.success('Dados salvos!');
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

if (!órgãosComoLista.value.length) {
  ÓrgãosStore.getAllOrganResponsibles();
}

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
            name="portfolio_id"
            :schema="schema"
          />
          <Field
            name="portfolio_id"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.portfolio_id, loading: portfolioStore.chamadasPendentes.lista }"
            :disabled="!emFoco"
          >
            <option :value="0">
              Selecionar
            </option>
            <option
              v-for="item in portfolioStore.lista"
              :key="item.id"
              :value="item.id"
              :disabled="!háÓrgãosDisponíveisNessePortfolio(item.id)
                || item.id === emFoco?.portfolio_id"
            >
              {{ item.titulo }}
              <template v-if="item.id === emFoco?.portfolio_id">
                (portfolio atual)
              </template>
              <template v-if="!háÓrgãosDisponíveisNessePortfolio(item.id)">
                (órgão sem responsáveis cadastrados)
              </template>
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
            || Object.keys(errors)?.length
            || values.portfolio_id === emFoco?.portfolio_id"
          :title="Object.keys(errors)?.length
            ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
            : null"
        >
          Transferir
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
