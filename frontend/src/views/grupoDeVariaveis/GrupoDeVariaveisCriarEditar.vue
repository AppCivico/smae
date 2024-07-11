<template>
  <MigalhasDePão class="mb1" />

  <div class="flex spacebetween center mb2">
    <h1> {{ titulo || "Grupo de variáveis" }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <!-- carga: <pre>{{ carga }}</pre> -->
  <Form
    v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="itemParaEdição"
    @submit="onSubmit"
  >
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
    <div class="flex g2 mb1">
      <div class="f1">
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
      <div class="f1">
        <LabelFromYup
          name="perfil"
          :schema="schema"
        />
        <Field
          name="perfil"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.status }"
        >
          <option
            :value="null"
          >
            Selecionar
          </option>
          <option
            v-for="item in tipoDePerfil"
            :key="item.valor"
            :value="item.valor"
            :disabled="emFoco?.permissoes.status_permitidos?.indexOf(item.valor) === -1"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb1"
          name="titulo"
        />
      </div>
    </div>
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="colaboradores"
          :schema="schema"
        />
        <AutocompleteField
          name="colaboradores"
          :controlador="{ busca: '', participantes: carga.colaboradores || [] }"
          :grupo="órgãosComoLista"
          label="sigla"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="titulo"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="participantes"
          :schema="schema"
        />
        <AutocompleteField
          name="participantes"
          :controlador="{ busca: '', participantes: carga.participantes || [] }"
          :grupo="órgãosComoLista"
          label="sigla"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="titulo"
        />
      </div>
    </div>
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
  ErrorMessage,
  Field,
  Form,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, ref } from 'vue';
import truncate from '@/helpers/truncate';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import CampoDePessoasComBuscaPorOrgao from '@/components/CampoDePessoasComBuscaPorOrgao.vue';
import { useOrgansStore } from '@/stores/organs.store';
import { useGrupoDeVariaveisStore } from '@/stores/grupoDeVariaveis.store';
import { useUsersStore } from '@/stores/users.store';
import { useAlertStore } from '@/stores/alert.store';
import tipoDePerfil from '@/consts/tipoDePerfil';
import { grupoDeVariaveis as schema } from '@/consts/formSchemas';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  grupoId: {
    type: Number,
    default: 0,
  },
});

const titulo = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : route?.meta?.título;

const alertStore = useAlertStore();
const usersStore = useUsersStore();
const ÓrgãosStore = useOrgansStore();
const grupoDeVariaveisStore = useGrupoDeVariaveisStore();
const { pessoasSimplificadasPorÓrgão } = storeToRefs(usersStore);
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(grupoDeVariaveisStore);

const {
  errors, handleSubmit, isSubmitting, resetForm, resetField, setFieldValue, values: carga,
} = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});
async function onSubmit(values) {
  try {
    let response;
    const msg = props.grupoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values, pdm_id: Number(route.params.planoSetorialId) };

    if (route.params?.grupoId) {
      response = await grupoDeVariaveisStore.salvarItem(
        dataToSend,
        route.params.grupoId,
      );
    } else {
      response = await grupoDeVariaveisStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      grupoDeVariaveisStore.$reset();
      router.push({ name: 'planosSetoriaisMacrotemas' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function iniciar() {
  usersStore.buscarPessoasSimplificadas();

  ÓrgãosStore.getAll().finally(() => {
    chamadasPendentes.value.emFoco = false;
  });

  resetForm();
}

iniciar();

grupoDeVariaveisStore.$reset();
// não foi usada a prop.grupoId pois estava vazando do edit na hora de criar uma nova
if (route.params?.grupoId) {
  grupoDeVariaveisStore.buscarItem(route.params?.grupoId);
}
</script>

<style></style>
