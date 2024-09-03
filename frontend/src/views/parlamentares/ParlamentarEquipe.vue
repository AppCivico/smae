<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { pessoaNaEquipeDeParlamentar as schema } from '@/consts/formSchemas';
import tiposNaEquipe from '@/consts/tiposNaEquipeDeParlamentar';
import { useAlertStore } from '@/stores/alert.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { vMaska } from "maska";
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();
const parlamentaresStore = useParlamentaresStore();

const emit = defineEmits(['close']);
const props = defineProps({
  apenasEmitir: {
    type: Boolean,
    default: false,
  },
  parlamentarId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
  pessoaId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
  tipo: {
    type: String,
    default: '',
  },
});

const tipoSugerido = props.tipo
  ? tiposNaEquipe
    .find((x) => x.toLowerCase() === props.tipo.toLocaleLowerCase())
  : '';

const {
  emFoco, chamadasPendentes, erro, pessoaParaEdição,
} = storeToRefs(parlamentaresStore);

const {
  errors, handleSubmit, isSubmitting, resetField, resetForm, values,
} = useForm({
  initialValues: pessoaParaEdição.value,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    if (await parlamentaresStore.salvarPessoaNaEquipe(
      valoresControlados,
      props.pessoaId,
      props.parlamentarId,
    )) {
      parlamentaresStore.buscarItem(props.parlamentarId);

      alertStore.success('Equipe atualizada!');
      if (props.apenasEmitir) {
        emit('close');
      } else if (route.meta.rotaDeEscape) {
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

const formularioSujo = useIsFormDirty();

function iniciar() {
  if (!parlamentaresStore.emFoco?.id !== Number(props.parlamentarId)) {
    if (props.parlamentarId) {
      parlamentaresStore.buscarItem(props.parlamentarId);
    } else {
      alertStore.error('Você não está editando uma parlamentar');
    }
  }
}

iniciar();

watch(pessoaParaEdição, (novoValor) => {
  resetForm({ values: novoValor });

  if (!values.tipo && tipoSugerido) {
    resetField('tipo', { value: tipoSugerido });
  }

  // rodar imediatamente apenas por causa do tipo sugerido
}, { immediate: true });
</script>

<template>
  <SmallModal @close="emit('close')">
    <div class="flex spacebetween center mb2">
      <TítuloDePágina>
        Integrante de equipe
      </TítuloDePágina>

      <hr class="ml2 f1">

      <CheckClose
        :apenas-emitir="props.apenasEmitir"
        :formulario-sujo="formularioSujo"
        @close="emit('close')"
      />
    </div>

    <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit"
    >
      <div class="flex flexwrap g2 mb1">
        <div
          class="f1">
          <LabelFromYup
            name="tipo"
            :schema="schema"
          />
          <Field
            name="tipo"
            as="select"
            class="inputtext light mb1"
            :class="{ error: errors.tipo, loading: chamadasPendentes.emFoco }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in tiposNaEquipe"
              :key="item"
              :value="item"
            >
              {{ item }}
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
            type="text"
            class="inputtext light mb1"
            :class="{
              error: errors.nome,
              loading: chamadasPendentes.emFoco,
            }"
          />
          <ErrorMessage
            class="error-msg"
            name="nome"
          />
        </div>
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="telefone"
            :schema="schema"
          />
          <Field
            name="telefone"
            type="text"
            class="inputtext light mb1"
            :class="{
              error: errors.telefone,
              loading: chamadasPendentes.emFoco,
            }"
            maxlength="15"
            v-maska
            data-maska="(##) #####-####'"
          />
          <ErrorMessage
            class="error-msg"
            name="telefone"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="email"
            :schema="schema"
          />
          <Field
            name="email"
            type="email"
            class="inputtext light mb1"
            :class="{
              error: errors.email,
              loading: chamadasPendentes.emFoco,
            }"
          />
          <ErrorMessage
            class="error-msg"
            name="email"
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
