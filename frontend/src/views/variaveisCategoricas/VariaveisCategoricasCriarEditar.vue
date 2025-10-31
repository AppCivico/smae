<template>
  <MigalhasDePão class="mb1" />
  <div class="flex spacebetween center mb2">
    <h1 v-if="variavelId">
      Tipo de variável categórica
    </h1>
    <h1 v-else>
      Novo tipo de variável categórica
    </h1>
    <hr class="ml2 f1">
    <CheckClose :formulario-sujo="formularioSujo" />
  </div>
  <form
    @submit.prevent="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="titulo"
          :schema="schema"
        />
        <Field
          name="titulo"
          type="text"
          min="3"
          max="256"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="titulo"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="tipo"
          :schema="schema"
        />
        <Field
          name="tipo"
          as="select"
          min="3"
          max="250"
          class="inputtext light mb1"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item, index in tipoDeVariaveisCategoricas"
            :key="index"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>

        <ErrorMessage
          class="error-msg mb1"
          name="tipo"
        />
      </div>
    </div>
    <div>
      <LabelFromYup
        name="descricao"
        :schema="schema"
      />
      <Field
        name="descricao"
        as="textarea"
        rows="5"
        min="3"
        max="2048"
        class="inputtext light mb1"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="descricao"
      />
    </div>

    <FieldArray
      v-slot="{ fields, push, remove }"
      name="valores"
    >
      <h2 class="mb1 mt4">
        Valores
      </h2>
      <div
        v-for="(field, idx) in fields"
        :key="field.key"
        class="mb3"
      >
        <Field
          type="hidden"
          :name="`valores[${idx}].id`"
        />
        <div class="flex flexwrap g2 mb1 center">
          <div class="f1 fb25em">
            <LabelFromYup
              name="titulo"
              class="tc300"
              :schema="schema.fields.valores.innerType"
            />
            <Field
              :name="`valores[${idx}].titulo`"
              type="text"
              min="3"
              max="2048"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb2"
              :name="`valores[${idx}].titulo`"
            />
          </div>

          <div class="f1 fb5em">
            <LabelFromYup
              name="ordem"
              class="tc300"
              :schema="schema.fields.valores.innerType"
            />
            <Field
              :name="`valores[${idx}].ordem`"
              type="number"
              min="0"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb2"
              :name="`valores[${idx}].ordem`"
            />
          </div>
          <div class="f1 fb5em">
            <LabelFromYup
              name="valor_variavel"
              class="tc300"
              :schema="schema.fields.valores.innerType"
            />
            <Field
              :name="`valores[${idx}].valor_variavel`"
              type="number"
              min="0"
              max="2048"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb2"
              :name="`valores[${idx}].valor_variavel`"
            />
          </div>
          <button
            class="like-a__text addlink"
            aria-label="Remover valores"
            title="Remover valores"
            type="button"
            @click="remove(idx)"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_remove" />
            </svg>
          </button>
        </div>

        <div class="f1">
          <LabelFromYup
            name="descricao"
            class="tc300"
            :schema="schema.fields.valores.innerType"
          />
          <Field
            :name="`valores[${idx}].descricao`"
            as="textarea"
            rows="5"
            min="3"
            max="2048"
            class="inputtext light mb1"
          />
          <ErrorMessage
            class="error-msg mb2"
            :name="`valores[${idx}].descricao`"
          />
        </div>
      </div>

      <button
        class="like-a__text addlink"
        type="button"
        @click="push(null)"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_+" />
        </svg>
        Adicionar valor
      </button>
    </FieldArray>
    <FormErrorsList
      :errors="errors"
      class="mt1"
    />
    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
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

<script setup>
import { variávelCategórica as schema } from '@/consts/formSchemas';
import tipoDeVariaveisCategoricas from '@/consts/tipoDeVariaveisCategoricas';
import { useAlertStore } from '@/stores/alert.store';
import { useVariaveisCategoricasStore } from '@/stores/variaveisCategoricas.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, FieldArray, useForm, useIsFormDirty,
} from 'vee-validate';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  variavelId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const variaveisCategoricasStore = useVariaveisCategoricasStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(variaveisCategoricasStore);

const {
  errors, isSubmitting, resetForm, values,
} = useForm({
  initialValues: itemParaEdicao.value,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

async function onSubmit() {
  try {
    const msg = props.variavelId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = {
      ...values,
      valores: values.valores.map((item) => ({
        ...item,
        valor_variavel: Number(item.valor_variavel),
        ordem: Number(item.ordem),
      })),
    };

    const response = await variaveisCategoricasStore.salvarItem(
      dataToSend,
      route.params.variavelId,
    );

    if (response) {
      alertStore.success(msg);
      router.push({ name: 'variaveisCategoricasListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

// não foi usada a prop.variavelId pois estava vazando do edit na hora de criar uma nova
if (route.params?.variavelId) {
  variaveisCategoricasStore.buscarItem(route.params?.variavelId);
}

watch(itemParaEdicao, (novoValor) => {
  resetForm({ values: novoValor });
});

</script>

<style></style>
