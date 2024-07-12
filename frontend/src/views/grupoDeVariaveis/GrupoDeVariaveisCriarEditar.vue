<template>
  <MigalhasDePão class="mb1" />

  <div class="flex spacebetween center mb2">
    <h1> {{ titulo || "Grupo de variáveis" }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <!-- <pre>
    participantes: {{ participantes }}
  </pre>
  <pre>
    colaboradores: {{ colaboradores }}
  </pre> -->
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
          v-model="orgao"
          name="orgao_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.orgao_id,
            loading: ÓrgãosStore.chamadasPendentes?.lista,
          }"
          :disabled="!órgãosComoLista?.length || !temPermissãoPara('CadastroGrupoVariavel.administrador') "
        >
          <option>
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
          :class="{ error: errors.perfil }"
        >
          <option
            value=""
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
          name="colaboradores"
          :controlador="{ busca: '', participantes: carga.colaboradores || [] }"
          :grupo="colaboradores[orgao]"
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
          :controlador="{ busca: '', participantes: carga?.participantes || [] }"
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
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import requestS from '@/helpers/requestS.ts';
import truncate from '@/helpers/truncate';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import CampoDePessoasComBuscaPorOrgao from '@/components/CampoDePessoasComBuscaPorOrgao.vue';
import { useOrgansStore } from '@/stores/organs.store';
import { useGrupoDeVariaveisStore } from '@/stores/grupoDeVariaveis.store';
import { useUsersStore } from '@/stores/users.store';
import { useAlertStore } from '@/stores/alert.store';
import tipoDePerfil from '@/consts/tipoDePerfil';
import { grupoDeVariaveis as schema } from '@/consts/formSchemas';

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

const authStore = useAuthStore();
const { user, temPermissãoPara } = storeToRefs(authStore);

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

async function buscarPessoasSimplificadas() {
  if (!participantes.value[orgao.value]) {
    const { linhas: linhasParticipantes } = await requestS.get(`${baseUrl}/pessoa/reduzido`, {
      participante_grupo_variavel: true,
      orgao_id: orgao.value,
    });

    if (Array.isArray(linhasParticipantes)) {
      participantes.value[orgao.value] = linhasParticipantes;
    } else {
      throw new Error('Erro ao buscar pessoas simplificadas');
    }
  }

  if (!colaboradores.value[orgao.value]) {
    const { linhas: linhasColaboradores } = await requestS.get(`${baseUrl}/pessoa/reduzido`, {
      colaborador_grupo_variavel: true,
      orgao_id: orgao.value,
    });

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

grupoDeVariaveisStore.$reset();
// não foi usada a prop.grupoId pois estava vazando do edit na hora de criar uma nova
if (route.params?.grupoId) {
  grupoDeVariaveisStore.buscarItem(route.params?.grupoId);
}
</script>

<style></style>
