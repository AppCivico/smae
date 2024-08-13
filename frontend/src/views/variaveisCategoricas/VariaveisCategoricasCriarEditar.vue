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
    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="itemParaEdição"
    @submit="onSubmit"
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
        type="text"
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
      <div
        v-for="(field, idx) in fields"
        :key="field.key"
      >
        <div class="flex g2 mb1">
          <div class="f1">
            <LabelFromYup
              name="descricao"
              class="tc300"
              :schema="schema.fields.valores.innerType"
            />
            <Field
              :name="`valores[${idx}].descricao`"
              type="text"
              min="3"
              max="2048"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb2"
              :name="`valores[${idx}].descricao`"
            />
          </div>

          <div class="f1">
            <LabelFromYup
              name="ordem"
              class="tc300"
              :schema="schema.fields.valores.innerType"
            />
            <Field
              :name="`valores[${idx}].ordem`"
              type="number"
              min="3"
              max="2048"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb2"
              :name="`valores[${idx}].ordem`"
            />
          </div>
        </div>

        <div class="flex g2 mb1">
          <div class="f1">
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

          <div class="f1">
            <LabelFromYup
              name="valor_variavel"
              class="tc300"
              :schema="schema.fields.valores.innerType"
            />
            <Field
              :name="`valores[${idx}].valor_variavel`"
              type="number"
              min="3"
              max="2048"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb2"
              :name="`valores[${idx}].valor_variavel`"
            />
          </div>
        </div>

        <button
          class="like-a__text addlink"
          arial-label="excluir"
          title="excluir"
          @click="remove(idx)"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_remove" /></svg>
        </button>
      </div>

      <button
        class="like-a__text addlink"
        type="button"
        @click="push(null)"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg>
        Adicionar valor
      </button>
    </FieldArray>

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
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import {
  ErrorMessage, Field, Form, FieldArray,
} from 'vee-validate';
import { useVariaveisCategoricasStore } from '@/stores/variaveisCategoricas.store';
import { useAlertStore } from '@/stores/alert.store';
import { variávelCategórica as schema } from '@/consts/formSchemas';
import tipoDeVariaveisCategoricas from '@/consts/tipoDeVariaveisCategoricas';

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
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(variaveisCategoricasStore);

async function onSubmit(values) {
  try {
    let response;
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

    if (route.params?.variavelId) {
      response = await variaveisCategoricasStore.salvarItem(
        dataToSend,
        route.params.variavelId,
      );
    } else {
      response = await variaveisCategoricasStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      variaveisCategoricasStore.$reset();
      router.push({ name: 'variaveisCategoricasListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

variaveisCategoricasStore.$reset();
// não foi usada a prop.variavelId pois estava vazando do edit na hora de criar uma nova
if (route.params?.variavelId) {
  variaveisCategoricasStore.buscarItem(route.params?.variavelId);
}
</script>

<style></style>
