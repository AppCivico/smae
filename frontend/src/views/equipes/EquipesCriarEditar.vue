<template>
  <MigalhasDePão class="mb1" />

  <div class="flex spacebetween center mb2">
    <h1>{{ titulo || "Equipes" }}</h1>
    <hr class="ml2 f1">

    <CheckClose :formulário-sujo="formulárioSujo" />
  </div>

  <form @submit.prevent="onSubmit">
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
          v-model="orgao"
          name="orgao_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.orgao_id,
            loading: ÓrgãosStore.chamadasPendentes?.lista,
          }"
          :disabled="
            !órgãosComoLista?.length ||
              !temPermissãoPara('CadastroGrupoVariavel.administrador')
          "
        >
          <option>Selecionar</option>

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
          :class="{ error: errors.perfil }"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in tipoDePerfil"
            :key="item.valor"
            :value="item.valor"
            :disabled="
              emFoco?.permissoes.status_permitidos?.indexOf(item.valor) === -1
            "
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb1"
          name="perfil"
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
          id="colaboradores"
          name="colaboradores"
          :controlador="{
            busca: '',
            participantes: carga?.colaboradores || [],
          }"
          :grupo="colaboradores[orgao] || []"
          label="nome_exibicao"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="colaboradores"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="participantes"
          :schema="schema"
        />
        <AutocompleteField
          name="participantes"
          :controlador="{
            busca: '',
            participantes: carga?.participantes || [],
          }"
          :grupo="participantes[orgao]"
          label="nome_exibicao"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="participantes"
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

<script setup>
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import requestS from '@/helpers/requestS.ts';
import truncate from '@/helpers/truncate';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { useOrgansStore } from '@/stores/organs.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { useUsersStore } from '@/stores/users.store';
import { useAlertStore } from '@/stores/alert.store';
import tipoDePerfil from '@/consts/tipoDePerfil';
import { equipes as schema } from '@/consts/formSchemas';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const router = useRouter();
const route = useRoute();
const props = defineProps({
  grupoId: {
    type: Number,
    default: 0,
  },
});

const colaboradores = ref({});
const participantes = ref({});

const orgao = ref(0);

const titulo = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : route?.meta?.título;

const alertStore = useAlertStore();
const usersStore = useUsersStore();
const ÓrgãosStore = useOrgansStore();
const equipesStore = useEquipesStore();
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(
  equipesStore,
);

const {
  errors,
  handleSubmit,
  isSubmitting,
  resetForm,
  resetField,
  setFieldValue,
  values: carga,
} = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});

const authStore = useAuthStore();
const { user, temPermissãoPara } = storeToRefs(authStore);
const formulárioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    let response;
    const msg = props.grupoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (route.params?.equipeId) {
      response = await equipesStore.salvarItem(
        carga,
        route.params.equipeId,
      );
    } else {
      response = await equipesStore.salvarItem(carga);
    }
    if (response) {
      alertStore.success(msg);
      equipesStore.$reset();
      router.push({ name: 'equipesListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

async function buscarPessoasSimplificadas() {
  if (!participantes.value[orgao.value]) {
    const { linhas: linhasParticipantes } = await requestS.get(
      `${baseUrl}/pessoa/reduzido`,
      {
        participante_grupo_variavel: true,
        orgao_id: orgao.value,
      },
    );

    if (Array.isArray(linhasParticipantes)) {
      participantes.value[orgao.value] = linhasParticipantes;
    } else {
      throw new Error('Erro ao buscar pessoas simplificadas');
    }
  }

  if (!colaboradores.value[orgao.value]) {
    const { linhas: linhasColaboradores } = await requestS.get(
      `${baseUrl}/pessoa/reduzido`,
      {
        colaborador_grupo_variavel: true,
        orgao_id: orgao.value,
      },
    );

    if (Array.isArray(linhasColaboradores)) {
      colaboradores.value[orgao.value] = linhasColaboradores;
    } else {
      throw new Error('Erro ao buscar pessoas simplificadas');
    }
  }
}

async function iniciar() {
  usersStore.buscarPessoasSimplificadas();
  orgao.value = user.value.orgao_id;
  ÓrgãosStore.getAll().finally(() => {
    chamadasPendentes.value.emFoco = false;
  });

  resetForm();
}

watch(orgao, () => {
  if (orgao.value) {
    buscarPessoasSimplificadas();
  }
});

iniciar();

equipesStore.$reset();
// não foi usada a prop.equipeId pois estava vazando do edit na hora de criar uma nova
if (route.params?.equipeId) {
  equipesStore.buscarItem({ id: route.params.equipeId });
}
</script>

<style></style>
