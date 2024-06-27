<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useObrasStore } from '@/stores/obras.store';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { number, object } from 'yup';

const emit = defineEmits(['clonagemConcluída']);

const alertStore = useAlertStore();

const obrasStore = useObrasStore();
const {
  emFoco: obraEmFoco,
  chamadasPendentes,
  erro,
  obrasPorPortfolio,
  obrasPortfolioModeloClonagem,
} = storeToRefs(obrasStore);

const tarefasStore = useTarefasStore();

const route = useRoute();
const router = useRouter();

const valoresIniciais = computed(() => ({
  projeto_fonte_id: 0,
}));

const schema = object({
  projeto_fonte_id: number('Precisa-se escolher uma obra para copiar.')
    .label('Obra')
    .min(1, 'Selecione uma obra')
    .required('Precisa-se escolher uma obra para copiar.'),
});

const {
  errors, handleSubmit, isSubmitting, resetForm, values,
} = useForm({
  initialValues: valoresIniciais.value,
  validationSchema: schema,
});

async function clonarTarefas() {
  try {
    if (await tarefasStore.clonarTarefas(values.projeto_fonte_id)) {
      emit('clonagemConcluída');
      alertStore.success('Tarefas clonadas!');
      router.push({
        name: route.meta.rotaDeEscape,
        params: route.params,
        query: route.query,
      });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

const onSubmit = handleSubmit(() => {
  if (tarefasStore.lista.length) {
    useAlertStore().confirmAction(
      'O cronograma atual será substituído pelo cronograma que será clonado.',
      clonarTarefas,
    );
  } else {
    clonarTarefas();
  }
});

const formulárioSujo = useIsFormDirty();

watch(obraEmFoco, (novoValor) => {
  if (novoValor.portfolio_id) {
    obrasStore.buscarTudo({
      portfolio_id: novoValor.portfolio_id,
      ipp: Number.MAX_SAFE_INTEGER,
    });
  }
}, { immediate: true });

watch(valoresIniciais, (novoValor) => {
  resetForm({ values: novoValor });
});

onUnmounted(() => {
  obrasStore.$reset();
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

    <pre>obraEmFoco?.portfolio_id:{{ obraEmFoco?.portfolio_id }}</pre>

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
              loading: obrasStore.chamadasPendentes.lista
            }"
            :disabled="!obraEmFoco
              || !obrasPorPortfolio?.[obraEmFoco?.portfolio_id]?.length"
          >
            <option :value="0">
              Selecionar
            </option>
            <optgroup
              v-if="obrasPortfolioModeloClonagem?.length"
              label="Modelos"
            >
              <option
                v-for="item in obrasPortfolioModeloClonagem"
                :key="item.id"
                :value="item.id"
              >
                {{ item.nome }}
              </option>
            </optgroup>

            <optgroup
              v-if="obrasPorPortfolio[obraEmFoco?.portfolio_id]?.length"
              label="Obras"
            >
              <option
                v-for="item in obrasPorPortfolio[obraEmFoco?.portfolio_id]"
                :key="item.id"
                :value="item.id"
                :hidden="item.id === obraEmFoco?.id"
              >
                {{ item.nome }}
              </option>
            </optgroup>
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
