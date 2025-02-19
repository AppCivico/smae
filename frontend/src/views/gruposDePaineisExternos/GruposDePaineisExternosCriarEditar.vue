<script setup>
import CampoDePessoasComBuscaPorOrgao from '@/components/CampoDePessoasComBuscaPorOrgao.vue';
import { grupoDeObservadores as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useGruposPaineisExternos } from '@/stores/grupospaineisExternos.store.ts';
import { useOrgansStore } from '@/stores/organs.store';
import { useUsersStore } from '@/stores/users.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty
} from 'vee-validate';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  gruposPaineisExternosId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const useGruposPaineisExternosStore = useGruposPaineisExternos();
const ÓrgãosStore = useOrgansStore();

const {
  chamadasPendentes, emFoco, erro, itemParaEdicao,
} = storeToRefs(useGruposPaineisExternosStore);
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);

// necessário por causa de 🤬
const montarCampoEstático = ref(false);

const UserStore = useUsersStore();
const { pessoasSimplificadas } = storeToRefs(UserStore);

const {
  errors, handleSubmit, isSubmitting, resetForm, values,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    let r;
    const msg = props.gruposPaineisExternosId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.gruposPaineisExternosId) {
      r = await useGruposPaineisExternosStore.salvarItem(values, props.gruposPaineisExternosId);
    } else {
      r = await useGruposPaineisExternosStore.salvarItem(values);
    }
    if (r) {
      alertStore.success(msg);
      useGruposPaineisExternosStore.$reset();
      router.push({ name: 'grupospaineisExternosListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

async function iniciar() {
  useGruposPaineisExternosStore.$reset();
  UserStore.buscarPessoasSimplificadas({ espectador_de_painel_externo: true });

  if (props.gruposPaineisExternosId) {
    await useGruposPaineisExternosStore.buscarItem(props.gruposPaineisExternosId);
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
    <h1>{{ route?.meta?.título || 'Grupo de Painéis Externos' }}</h1>
    <hr class="ml2 f1">
    <CheckClose :formulario-sujo="formularioSujo" />
  </div>
  <form
    v-if="!gruposPaineisExternosId || emFoco"
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

    <div
      class="flex g2"
    >
      <div class="f1 mb1">
        <LabelFromYup
          name="participantes"
          :schema="schema"
        />

        <CampoDePessoasComBuscaPorOrgao
          v-model="values.participantes"
          name="participantes"
          :pessoas="Array.isArray(pessoasSimplificadas) ? pessoasSimplificadas : []"
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
