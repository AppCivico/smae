<script setup>
import CheckClose from '@/components/CheckClose.vue';
import { portfolio as schema } from '@/consts/formSchemas';
import {
  useAlertStore, useOrgansStore, usePortfolioStore
} from '@/stores';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  portfolioId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();

const portfolioStore = usePortfolioStore();
const { chamadasPendentes, erro, portfoliosPorId } = storeToRefs(portfolioStore);

const ÓrgãosStore = useOrgansStore();

const órgãosOrdenados = computed(() => (Array.isArray(ÓrgãosStore?.organs)
  ? [...ÓrgãosStore.organs].sort((a, b) => a.sigla?.localeCompare(b.sigla))
  : []));

const itemParaEdição = computed(() => (props?.portfolioId
  && portfoliosPorId.value?.[props.portfolioId]
  ? {
    ...portfoliosPorId.value[props.portfolioId],
    id: undefined,
    orgaos: portfoliosPorId.value[props.portfolioId].orgaos.map((x) => x.id),
  }
  : null));

portfolioStore.$reset();

async function onSubmit(values) {
  try {
    const msg = props.portfolioId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.portfolioId) {
      await portfolioStore.salvarItem(values, props.portfolioId);
    } else {
      await portfolioStore.salvarItem(values);
    }

    alertStore.success(msg);
    await router.push({ name: 'portfoliosListar' });
    portfolioStore.$reset();
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.portfolioId && !itemParaEdição.value) {
  portfolioStore.buscarTudo();
}
ÓrgãosStore.getAll().finally(() => {
  chamadasPendentes.value.emFoco = false;
});
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Editar projeto' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <Form
    v-if="!erro && órgãosOrdenados?.length"
    v-slot="{ errors, isSubmitting, values }"
    :validation-schema="schema"
    :initial-values="itemParaEdição"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1">
        <label class="label">
          Título <span class="tvermelho">*</span>
        </label>
        <Field
          name="titulo"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="titulo"
        />
      </div>
    </div>
    <div class="mb2">
      <div class="label">
        Órgãos <span class="tvermelho">*</span>
      </div>

      <label
        v-for="item in órgãosOrdenados"
        :key="item.id"
        class="block mb1"
        :class="{ 'error': errors.orgaos }"
      >
        <Field
          name="orgaos"
          class="inputcheckbox"
          type="checkbox"
          :value="item.id"
          :checked="values.orgaos?.includes(item.id)"
        /><span>{{ item.sigla }}</span> <small>- {{ item.descricao }}</small>
      </label>

      <ErrorMessage
        name="orgaos"
        class="error-msg"
      />

      <div
        v-if="chamadasPendentes?.emFoco"
        class="spinner"
      >
        Carregando
      </div>
    </div>

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting"
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
