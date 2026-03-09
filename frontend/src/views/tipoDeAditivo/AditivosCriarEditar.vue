<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';
import { tipoDeAditivo as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useTipoDeAditivosStore } from '@/stores/tipoDeAditivos.store';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  aditivoId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const aditivosStore = useTipoDeAditivosStore();
const { chamadasPendentes, erros, itemParaEdicao } = storeToRefs(aditivosStore);

const { errors, resetForm, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: itemParaEdicao,
});

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (values) => {
  try {
    let response;
    const msg = props.aditivoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (route.params?.aditivoId) {
      response = await aditivosStore.salvarItem(
        values,
        route.params.aditivoId,
      );
    } else {
      response = await aditivosStore.salvarItem(values);
    }
    if (response) {
      alertStore.success(msg);
      aditivosStore.$reset();
      router.push({ name: 'tipoDeAditivos.listar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

aditivosStore.$reset();
// não foi usada a prop.aditivoId pois estava vazando do edit na hora de criar uma nova
if (route.params?.aditivoId) {
  aditivosStore.buscarItem(route.params?.aditivoId);
}

watch(itemParaEdicao, (val) => {
  if (val) {
    resetForm({ values: val });
  }
}, { immediate: true });
</script>

<template>
  <MigalhasDePão class="mb1" />

  <CabecalhoDePagina :formulario-sujo="formularioSujo" />

  <form @submit="onSubmit">
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="nome"
          :schema="schema"
          class="mb0"
        />
        <Field
          name="nome"
          type="text"
          min="3"
          max="250"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="nome"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="tipo"
          :schema="schema"
          class="mb0"
        />
        <Field
          name="tipo"
          as="select"
          class="inputtext light mb1"
        >
          <option value="Aditivo">
            Aditivo
          </option>

          <option value="Reajuste">
            Reajuste
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb1"
          name="tipo"
        />
      </div>
    </div>
    <div class="flex center mb1">
      <Field
        name="habilita_valor"
        type="checkbox"
        :value="true"
        :unchecked-value="false"
        class="inputcheckbox mr1"
      />

      <LabelFromYup
        name="habilita_valor"
        :schema="schema"
        class="mb0"
      />
    </div>

    <div class="f1 flex center mb1">
      <Field
        name="habilita_valor_data_termino"
        type="checkbox"
        :value="true"
        :unchecked-value="false"
        class="inputcheckbox mr1"
      />
      <LabelFromYup
        name="habilita_valor_data_termino"
        :schema="schema"
        class="mb0"
      />
    </div>

    <SmaeFieldsetSubmit
      :erros="errors"
    />
  </form>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erros?.emFoco"
    class="error p1"
  >
    <div class="error-msg">
      {{ erros.emFoco }}
    </div>
  </div>
</template>

<style></style>
