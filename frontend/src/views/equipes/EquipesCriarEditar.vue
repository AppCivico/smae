<template>
  <header class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose :formulario-sujo="formularioSujo" />
  </header>

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
          name="orgao_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.orgao_id,
            loading: orgaosStore.chamadasPendentes?.lista,
          }"
          :disabled="
            !órgãosComoLista?.length
              || emFoco?.id
              || !temPermissãoPara('CadastroGrupoVariavel.administrador')
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
          :disabled="!!emFoco?.id"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in tipoDePerfil"
            :key="item.valor"
            :value="item.valor"
            :disabled="
              emFoco?.permissoes?.status_permitidos?.indexOf(item.valor) === -1
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
          :retornar-array-vazio="true"
          :controlador="{
            busca: '',
            participantes: values?.colaboradores || [],
          }"
          :grupo="colaboradores[values.orgao_id] || []"
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
          id="participantes"
          name="participantes"
          :retornar-array-vazio="true"
          :controlador="{
            busca: '',
            participantes: values?.participantes || [],
          }"
          :grupo="participantes[values.orgao_id] || []"
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
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { equipes as schema } from '@/consts/formSchemas';
import tipoDePerfil from '@/consts/tipoDePerfil';
import requestS from '@/helpers/requestS.ts';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useUsersStore } from '@/stores/users.store';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

defineOptions({
  inheritAttrs: false,
});

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

const alertStore = useAlertStore();
const usersStore = useUsersStore();
const orgaosStore = useOrgansStore();
const equipesStore = useEquipesStore();
const { órgãosComoLista } = storeToRefs(orgaosStore);
const {
  chamadasPendentes, emFoco, erro, itemParaEdicao,
} = storeToRefs(equipesStore);

const {
  errors,
  handleSubmit,
  isSubmitting,
  resetForm,
  setFieldValue,
  values,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const authStore = useAuthStore();
const { user, temPermissãoPara } = storeToRefs(authStore);
const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    let response;
    const msg = props.grupoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (route.params?.equipeId) {
      response = await equipesStore.salvarItem(
        valoresControlados,
        route.params.equipeId,
      );
    } else {
      response = await equipesStore.salvarItem(values);
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
  if (!participantes.value[values.orgao_id]) {
    const { linhas: linhasParticipantes } = await requestS.get(
      `${baseUrl}/pessoa/reduzido`,
      {
        orgao_id: values.orgao_id,
      },
    );

    if (Array.isArray(linhasParticipantes)) {
      participantes.value[values.orgao_id] = linhasParticipantes;
    } else {
      throw new Error('Erro ao buscar pessoas simplificadas');
    }
  }

  if (!colaboradores.value[values.orgao_id]) {
    const { linhas: linhasColaboradores } = await requestS.get(
      `${baseUrl}/pessoa/reduzido`,
      {
        colaborador_grupo_variavel: true,
        orgao_id: values.orgao_id,
      },
    );

    if (Array.isArray(linhasColaboradores)) {
      colaboradores.value[values.orgao_id] = linhasColaboradores;
    } else {
      throw new Error('Erro ao buscar pessoas simplificadas');
    }
  }
}

async function iniciar() {
  usersStore.buscarPessoasSimplificadas();

  if (emFoco.value?.id !== route.params?.equipeId) {
    equipesStore.$reset();

    if (route.params?.equipeId) {
      await equipesStore.buscarItem({ id: route.params.equipeId });

      resetForm({
        values: itemParaEdicao.value,
      });
    }
  }

  if (orgaosStore.órgãosComoLista.length === 0) {
    await orgaosStore.getAll().finally(() => {
      chamadasPendentes.value.emFoco = false;
    });
  }

  if (!route.params.equipeId) {
    setFieldValue('orgao_id', user.value.orgao_id);
  }
}

watch(() => values.orgao_id, () => {
  if (values.orgao_id) {
    buscarPessoasSimplificadas();
    setFieldValue('colaboradores', []);
    setFieldValue('participantes', []);
  }
});

onMounted(() => {
  iniciar();
});
</script>
