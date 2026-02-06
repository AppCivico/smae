<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
} from 'vee-validate';
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import AutocompleteField2 from '@/components/AutocompleteField2.vue';
import SmaeText from '@/components/camposDeFormulario/SmaeText/SmaeText.vue';
import MapaCampo from '@/components/geo/MapaCampo.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';
import UploadDeArquivosEmLista from '@/components/UploadDeArquivosEmLista/UploadDeArquivosEmLista.vue';
import { CadastroDemanda as schema } from '@/consts/formSchemas/demanda';
import { useAlertStore } from '@/stores/alert.store';
import { useAreasTematicasStore } from '@/stores/areasTematicas.store';
import { useDemandasStore } from '@/stores/demandas.store';
import { useOrgansStore } from '@/stores/organs.store';

const router = useRouter();
const alertStore = useAlertStore();
const organsStore = useOrgansStore();
const demandasStore = useDemandasStore();
const areasTematicasStore = useAreasTematicasStore();

const { organs: listaOrgaos } = storeToRefs(organsStore);
const { lista: listaAreasTematicas } = storeToRefs(areasTematicasStore);
const {
  emFoco, itemParaEdicao, geolocalizacaoPorToken, erro,
} = storeToRefs(demandasStore);

const props = defineProps({
  demandaId: {
    type: Number,
    default: 0,
  },
});

const {
  errors,
  handleSubmit,
  isSubmitting,
  resetForm,
  values,
  setFieldValue,
} = useForm({
  validationSchema: schema,
  initialValues: itemParaEdicao.value,
});

const areaTematicaSelecionada = computed(() => listaAreasTematicas.value
  ?.find((a) => a.id === values.area_tematica_id));

const acoesDaAreaTematica = computed(() => areaTematicaSelecionada.value?.acoes || []);

const onSubmit = handleSubmit(async (carga) => {
  try {
    const msg = props.demandaId
      ? 'Dados salvos com sucesso!'
      : 'Demanda adicionada com sucesso!';

    const r = await demandasStore.salvarItem(carga, props.demandaId);

    if (r) {
      alertStore.success(msg);
      demandasStore.$reset();
      router.push({ name: 'demandas.listar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function adicionarLocalizacao(endereco) {
  const localizacoes = [...(values.localizacoes || []), endereco];
  setFieldValue('localizacoes', localizacoes);
}

function removerLocalizacao(idx) {
  const localizacoes = [...(values.localizacoes || [])];
  localizacoes.splice(idx, 1);
  setFieldValue('localizacoes', localizacoes);
}

function adicionarArquivo() {
  const arquivos = [...(values.arquivos || []), { autoriza_divulgacao: false }];
  setFieldValue('arquivos', arquivos);
}

function removerArquivo(idx) {
  const arquivos = [...(values.arquivos || [])];
  arquivos.splice(idx, 1);
  setFieldValue('arquivos', arquivos);
}

function toggleAcao(acaoId) {
  const acaoIds = [...(values.acao_ids || [])];
  const index = acaoIds.indexOf(acaoId);
  if (index === -1) {
    acaoIds.push(acaoId);
  } else {
    acaoIds.splice(index, 1);
  }
  setFieldValue('acao_ids', acaoIds);
}

onMounted(() => {
  if (props.demandaId) {
    demandasStore.buscarItem(props.demandaId);
  }

  Promise.all([
    areasTematicasStore.buscarTudo(),
    organsStore.getAll(),
  ]).then();
});

watch(itemParaEdicao, (novosValores) => {
  resetForm({ values: novosValores });
});

watch(() => values.area_tematica_id, () => {
  setFieldValue('acao_ids', []);
});
</script>

<template>
  <CabecalhoDePagina />

  <form
    class="flex column g2"
    @submit.prevent="onSubmit"
  >
    <!-- Recurso Financeiro -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Recurso Financeiro
      </legend>

      <div class="flex g2 flexwrap">
        <div class="f1 fb30">
          <SmaeLabel
            name="valor"
            :schema="schema"
          />

          <Field
            v-slot="{ field, handleChange, value }"
            name="valor"
          >
            <MaskedFloatInput
              class="inputtext light"
              :class="{ error: errors.valor }"
              :value="value"
              :name="field.name"
              converter-para="string"
              @update:model-value="handleChange"
            />
          </Field>
          <ErrorMessage
            name="valor"
            class="error-msg"
          />
        </div>

        <div class="f1 fb30">
          <SmaeLabel
            name="finalidade"
            :schema="schema"
          />

          <Field
            name="finalidade"
            as="select"
            class="inputtext light"
            :class="{ error: errors.finalidade }"
          >
            <option :value="null">
              Selecionar
            </option>

            <option
              v-for="finalidade in ['Custeio', 'Investimento']"
              :key="`demanda-finalidade--${finalidade}`"
              :value="finalidade"
            >
              {{ finalidade }}
            </option>
          </Field>

          <ErrorMessage
            name="finalidade"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <!-- Contato do Proponente -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Contato do Proponente
      </legend>

      <div class="flex g2 flexwrap mb1">
        <div class="f1 fb40">
          <SmaeLabel
            name="orgao_id"
            :schema="schema"
          />

          <Field
            v-slot="{ handleChange, value }"
            name="orgao_id"
            :class="{ error: errors.orgao_id }"
          >
            <AutocompleteField2
              :model-value="value"
              :controlador="{
                busca: '',
                participantes: value || []
              }"
              label="sigla"
              :grupo="listaOrgaos || []"
              :numero-maximo-de-participantes="1"
              @change="handleChange"
            />
          </Field>

          <ErrorMessage
            name="orgao_id"
            class="error-msg"
          />
        </div>

        <div class="f1 fb40">
          <SmaeLabel
            name="unidade_responsavel"
            :schema="schema"
          />

          <Field
            name="unidade_responsavel"
            type="text"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.unidade_responsavel }"
          />

          <ErrorMessage
            name="unidade_responsavel"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2 flexwrap mb1">
        <div class="f1 fb40">
          <SmaeLabel
            name="nome_responsavel"
            :schema="schema"
          />

          <Field
            name="nome_responsavel"
            type="text"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.nome_responsavel }"
          />

          <ErrorMessage
            name="nome_responsavel"
            class="error-msg"
          />
        </div>

        <div class="f1 fb40">
          <SmaeLabel
            name="cargo_responsavel"
            :schema="schema"
          />

          <Field
            name="cargo_responsavel"
            type="text"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.cargo_responsavel }"
          />

          <ErrorMessage
            name="cargo_responsavel"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2 flexwrap">
        <div class="f1 fb40">
          <SmaeLabel
            name="email_responsavel"
            :schema="schema"
          />

          <Field
            name="email_responsavel"
            type="email"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.email_responsavel }"
          />

          <ErrorMessage
            name="email_responsavel"
            class="error-msg"
          />
        </div>

        <div class="f1 fb40">
          <SmaeLabel
            name="telefone_responsavel"
            :schema="schema"
          />

          <Field
            name="telefone_responsavel"
            type="tel"
            class="inputtext light"
            maxlength="20"
            :class="{ error: errors.telefone_responsavel }"
          />

          <ErrorMessage
            name="telefone_responsavel"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <!-- Demanda -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Demanda
      </legend>

      <div class="mb1">
        <SmaeLabel
          name="nome_projeto"
          :schema="schema"
        />

        <Field
          name="nome_projeto"
          type="text"
          class="inputtext light"
          maxlength="250"
          :class="{ error: errors.nome_projeto }"
        />

        <ErrorMessage
          name="nome_projeto"
          class="error-msg"
        />
      </div>

      <div class="mb1">
        <SmaeLabel
          name="descricao"
          :schema="schema"
        />

        <Field
          v-slot="{ handleChange, value, field}"
          name="descricao"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ error: errors[field.name] }"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          name="descricao"
          class="error-msg"
        />
      </div>

      <div class="mb1">
        <SmaeLabel
          name="justificativa"
          :schema="schema"
        />

        <Field
          v-slot="{ handleChange, value, field}"
          name="justificativa"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ error: errors[field.name] }"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          name="justificativa"
          class="error-msg"
        />
      </div>

      <div class="mb2">
        <SmaeLabel
          name="localizacoes"
          :schema="schema"
        />

        <Field
          v-slot="{ value, handleChange, field }"
          name="localizacoes"
        >
          <pre class="debug">value: {{ value }}</pre>
          <MapaCampo
            :name="field.name"
            :model-value="value"
            :geolocalização-por-token="geolocalizacaoPorToken"
            @update:model="handleChange"
          />
        </Field>
      </div>

      <div>
        <SmaeLabel
          name="arquivos"
          :schema="schema"
        />

        <Field
          v-slot="{value}"
          name="arquivos"
        >
          <UploadDeArquivosEmLista
            tipo="DOCUMENTO"
            :arquivos-existentes="value"
            @update:model-value="ev => setFieldValue('upload_tokens', ev)"
            @arquivo-existente-removido="removerArquivo"
          />
        </Field>

        <Field
          name="upload_tokens"
          type="hidden"
        />
      </div>
    </fieldset>

    <!-- Área Temática -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Área Temática
      </legend>

      <div class="mb1">
        <SmaeLabel
          name="area_tematica_id"
          :schema="schema"
        />

        <Field
          name="area_tematica_id"
          as="select"
          class="inputtext light"
          :class="{ error: errors.area_tematica_id }"
        >
          <option :value="null">
            Selecionar
          </option>

          <option
            v-for="area in listaAreasTematicas"
            :key="area.id"
            :value="area.id"
          >
            {{ area.nome }}
          </option>
        </Field>

        <ErrorMessage
          name="area_tematica_id"
          class="error-msg"
        />
      </div>

      <div
        v-if="acoesDaAreaTematica.length"
        class="mb1"
      >
        <SmaeLabel
          name="acao_ids"
          :schema="schema"
        />

        <div class="flex column g05 start">
          <label
            v-for="acao in acoesDaAreaTematica"
            :key="acao.id"
            class="flex g1 center"
          >
            <input
              type="checkbox"
              :checked="values.acao_ids?.includes(acao.id)"
              @change="toggleAcao(acao.id)"
            >
            <span>{{ acao.nome }}</span>
          </label>
        </div>

        <ErrorMessage
          name="acao_ids"
          class="error-msg"
        />
      </div>

      <div class="mb1">
        <SmaeLabel
          name="observacao"
          :schema="schema"
        />

        <Field
          v-slot="{ handleChange, value, field}"
          name="observacao"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ error: errors[field.name] }"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          name="observacao"
          class="error-msg"
        />
      </div>
    </fieldset>

    <SmaeFieldsetSubmit />
  </form>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>

<style scoped>
.modal-localizacao {
  width: 90vw;
  max-width: 1000px;
  padding: 2rem;
  border: 1px solid var(--c300);
  border-radius: 8px;
}

.modal-localizacao::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

.lista-de-localizacoes {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lista-de-localizacoes li {
  padding: 0.5rem;
  background: var(--c50);
  border-radius: 4px;
}
</style>
