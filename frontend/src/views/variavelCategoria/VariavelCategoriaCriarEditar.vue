<script setup>
import { variavelCategoriaSchema as schema } from '@/consts/formSchemas';
import variavelCategoria from '@/consts/variavelCategoria';
import { useAlertStore } from '@/stores/alert.store';
import { useVariavelCategoriaStore } from '@/stores/variavelCategoria.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  variavelCategoriaId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const variavelCategoriaStore = useVariavelCategoriaStore();
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(variavelCategoriaStore);

const {
  errors, isSubmitting,
} = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.variavelCategoriaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = await variavelCategoria.salvarItem(carga, props.variavelCategoriaId);

    if (resposta) {
      alertStore.success(msg);
      variavelCategoria.$reset();
      variavelCategoria.buscarTudo();
      router.push({ name: 'variavelCategoriaListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Nova variável de categoria' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <form
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="tipo"
          :schema="schema"
        />
        <Field
          name="tipo"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.tipo }"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in Object.values(variavelCategoria)"
            :key="item.valor"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.tipo }}
        </div>
      </div>

      <div class="f1">
        <LabelFromYup
          name="titulo"
          :schema="schema"
        />
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

    <div class="">
      <LabelFromYup
        name="descricao"
        :schema="schema"
      />
      <Field
        name="descricao"
        as="textarea"
        class="inputtext light mb1"
        rows="5"
        maxlength="2048"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="descricao"
      />
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="ordem"
          :schema="schema.fields.valores"
        />
        <Field
          name="ordem"
          type="number"
          class="inputtext light mb1"
          min="1"
          max="1000"
          step="1"
          @update:model-value="values.ordem = Number(values.ordem)"
        />
        <pre>{{ variavelCategoriaSchema }}</pre>
        <ErrorMessage
          class="error-msg mb1"
          name="ordem"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="valor_variavel"
          :schema="schema"
        />
        <Field
          name="valor_variavel"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="valor_variavel"
        />
      </div>
    </div>

    <div class="f1 mb2">
      <LabelFromYup
        name="titulo"
        :schema="schema"
      />
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

    <div>
      <LabelFromYup
        name="descricao"
        :schema="schema"
      />
      <Field
        name="descricao"
        as="textarea"
        class="inputtext light mb1"
        rows="5"
        maxlength="2048"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="descricao"
      />
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
