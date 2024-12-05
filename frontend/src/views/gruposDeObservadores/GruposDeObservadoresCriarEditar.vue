<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CampoDePessoasComBuscaPorOrgao from '@/components/CampoDePessoasComBuscaPorOrgao.vue';
import { grupoDeObservadores as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useObservadoresStore } from '@/stores/observadores.store.ts';
import { useOrgansStore } from '@/stores/organs.store';

const router = useRouter();
const { meta } = useRoute();
const props = defineProps({
  grupoDeObservadoresId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const ÓrgãosStore = useOrgansStore();
const observadoresStore = useObservadoresStore(meta.entidadeMãe);

const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
const {
  chamadasPendentes, emFoco, erro, itemParaEdicao,
} = storeToRefs(observadoresStore);

// necessário por causa de 🤬
const montarCampoEstático = ref(false);

const {
  errors, handleSubmit, isSubmitting, resetForm, values,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    let r;
    const msg = props.grupoDeObservadoresId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.grupoDeObservadoresId) {
      r = await observadoresStore.salvarItem(
        values,
        props.grupoDeObservadoresId,
      );
    } else {
      r = await observadoresStore.salvarItem(values);
    }
    if (r) {
      alertStore.success(msg);
      observadoresStore.$reset();
      router.push({ name: meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

async function iniciar() {
  observadoresStore.$reset();

  if (props.grupoDeObservadoresId) {
    await observadoresStore.buscarItem(props.grupoDeObservadoresId);
  }

  ÓrgãosStore.getAll().finally(() => {
    chamadasPendentes.value.emFoco = false;
  });

  resetForm();

  montarCampoEstático.value = true;
}

const formularioSujo = useIsFormDirty();
iniciar();

watch(itemParaEdicao, (novosValores) => {
  resetForm({ values: novosValores });
});
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ meta?.título || "Portfólios" }}</h1>
    <hr class="ml2 f1">
    <CheckClose
      :formulario-sujo="formularioSujo"
      :rota-de-escape="meta.rotaDeEscape"
    />
  </div>

  <form
    v-if="!grupoDeObservadoresId || emFoco"
    :disabled="chamadasPendentes.emFoco"
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
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="titulo"
        />
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="orgao_id"
          :schema="schema"
          class="tc300"
        />
        <Field
          name="orgao_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.orgao_id,
            loading: ÓrgãosStore.chamadasPendentes?.lista,
          }"
          :disabled="!órgãosComoLista?.length"
        >
          <option :value="0">
            Selecionar
          </option>

          <option
            v-for="item in órgãosComoLista"
            :key="item"
            :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null"
          >
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </Field>
        <ErrorMessage
          name="orgao_id"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="participantes"
          :schema="schema"
        />

        <CampoDePessoasComBuscaPorOrgao
          v-model="values.participantes"
          name="participantes"
          espectador-de-projeto
          :pronto-para-montagem="montarCampoEstático"
        />
        <ErrorMessage
          name="participantes"
          class="error-msg"
        />
      </div>
    </div>

    <pre v-ScrollLockDebug>values.participantes:{{ values.participantes }}</pre>

    <FormErrorsList :errors="errors" />

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
