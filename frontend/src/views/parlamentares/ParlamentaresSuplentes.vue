<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { suplentes as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  parlamentarId: {
    type: [Number, String],
    default: 0,
  },
  mandatoId: {
    type: [Number, String],
    default: 0,
  },
});
const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();
const parlamentaresStore = useParlamentaresStore();
const ordens = [{ titulo: '1°', valor: 'PrimeiroSuplente' }, { titulo: '2°', valor: 'SegundoSuplente' }];

const {
  chamadasPendentes, erro, suplenteParaEdição, lista,
} = storeToRefs(parlamentaresStore);

parlamentaresStore.buscarTudo();

const {
  errors, handleSubmit, isSubmitting, resetForm, values,
} = useForm({
  initialValues: suplenteParaEdição.value,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    if (await parlamentaresStore.salvarSuplente(values, {
      parlamentarId: props.parlamentarId,
      mandatoId: props.mandatoId,
      suplencia: values.ordem,
      parlamentarSuplenteId: values.nome,
    })) {
      parlamentaresStore.buscarItem(route.params?.parlamentarId);
      alertStore.success('Suplente adicionado!');
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

watch(suplenteParaEdição, (novoValor) => {
  resetForm({ values: novoValor });
});
</script>

<template>
  <SmallModal>
    <div class="flex spacebetween center mb2">
      <TítuloDePágina> Suplentes </TítuloDePágina>
      <hr class="ml2 f1">

      <CheckClose
        :formulário-sujo="formulárioSujo"
      />
    </div>

    <LoadingComponent v-if="chamadasPendentes.emFoco" />

    <form
      :disabled="isSubmitting"
      @submit="onSubmit"
    >
      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="ordem"
            :schema="schema"
          />
          <Field
            name="ordem"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.tipo }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="ordem in ordens"
              :key="ordem.valor"
              :value="ordem.valor"
            >
              {{ ordem.titulo }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="tipo"
          />
        </div>
      </div>
      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="nome"
            :schema="schema"
          />

          <Field
            name="nome"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.tipo }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="parlamentar in lista"
              :key="parlamentar.id"
              :value="parlamentar.id"
            >
              {{ parlamentar.nome }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="nome"
          />
        </div>
      </div>

      <FormErrorsList :errors="errors" />

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting || Object.keys(errors)?.length"
          :title="Object.keys(errors)?.length ? `Erros de preenchimento:
        ${Object.keys(errors)?.length}`
            : null"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </form>

    <LoadingComponent v-if="chamadasPendentes.equipe" />

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
