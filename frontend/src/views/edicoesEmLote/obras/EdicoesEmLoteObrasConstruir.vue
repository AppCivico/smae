<script setup>
import {
  object,
  array,
  string,
  mixed,
  lazy,
} from 'yup';
import { format } from 'date-fns';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import {
  Field, FieldArray, ErrorMessage, useForm,
} from 'vee-validate';
import { computed, ref } from 'vue';
import { useAlertStore } from '@/stores/alert.store';
import { useEquipamentosStore } from '@/stores/equipamentos.store';
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useTiposDeIntervencaoStore } from '@/stores/tiposDeIntervencao.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import rawStatusObras from '@/consts/statusObras';
import { obras as schemaObras } from '@/consts/formSchemas';
import LabelFromYup from '@/components/camposDeFormulario/LabelFromYup.vue';
import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import CampoDinamico from '@/components/alteracaoEmLotes.componentes/CampoDinamico.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const alertStore = useAlertStore();
const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote);

const modoRevisao = ref(false);

const storeInstances = {
  equipamentos: useEquipamentosStore(),
  grupos_tematicos: useGruposTematicosStore(),
  órgãos: useOrgansStore(),
  tipos_de_intervencao: useTiposDeIntervencaoStore(),
  portfolios_obra: usePortfolioObraStore(),
  etapas_projetos: useEtapasProjetosStore(),
};

const fontesEstaticas = {
  statusObras: Object.values(rawStatusObras).map((item) => ({
    value: item.valor,
    label: item.nome,
  })),
};

const loadingOptions = ref({});

const schema = object({
  edicoes: array().of(
    object({
      propriedade: string().required('Selecione o campo'),
      valor: lazy((value, { parent }) => {
        const { propriedade } = parent;
        if (!propriedade) {
          return mixed().nullable();
        }
        const campoSchemaOriginal = schemaObras.fields[propriedade];

        if (!campoSchemaOriginal) {
          return mixed().required('Configuração inválida.');
        }
        return campoSchemaOriginal.required('Informe o novo valor');
      }),
    }),
  ).min(1, 'Adicione pelo menos uma edição'),
});

const {
  values, errors, handleSubmit, setFieldValue,
} = useForm({
  validationSchema: schema,
  initialValues: {
    edicoes: [],
  },
});

const camposDisponiveisParaEdicao = computed(() => Object.entries(schemaObras.fields)
  .filter(([_, fieldSchema]) => fieldSchema.meta()?.permite_edicao_em_massa)
  .map(([fieldName, fieldSchema]) => ({
    value: fieldName,
    label: fieldSchema.spec.label || fieldName,
  })));

function getOpcoesDisponiveis(rowIndex) {
  const propriedadesSelecionadas = values.edicoes
    ?.map((edicao, index) => (index !== rowIndex ? edicao.propriedade : null))
    .filter((prop) => prop != null && prop !== '');

  return camposDisponiveisParaEdicao.value.filter(
    (opcao) => !propriedadesSelecionadas.includes(opcao.value),
  );
}

function detectarTipoCampo(campoSchema, meta) {
  if (meta.optionSource && fontesEstaticas[meta.optionSource]) {
    return 'select-estatico';
  }

  if (meta.storeKey) {
    return 'select-dinamico';
  }

  const tipoPorYupType = {
    number: 'number',
    string: 'text',
    array: 'array',
    date: 'date',
    object: 'object',
  };

  return tipoPorYupType[campoSchema.type] || 'text';
}

function obterConfiguracaoCampo(nomeCampo) {
  const campoSchema = schemaObras.fields[nomeCampo];
  if (!campoSchema) return null;

  const meta = campoSchema.meta?.() || {};
  const tipo = detectarTipoCampo(campoSchema, meta);

  return {
    schema: campoSchema,
    tipo,
    label: campoSchema.spec?.label || nomeCampo,
    meta,
  };
}

function campoConfig(idx) {
  const prop = values.edicoes?.[idx]?.propriedade;
  return prop ? obterConfiguracaoCampo(prop) : null;
}

function campoConfigPorNome(nomeCampo) {
  const campoSchema = schemaObras.fields[nomeCampo];
  if (!campoSchema) return null;
  const meta = campoSchema.meta?.() || {};
  const tipo = detectarTipoCampo(campoSchema, meta);
  return { tipo };
}

const onSubmit = handleSubmit(async (valores) => {
  if (!modoRevisao.value) {
    modoRevisao.value = true;
    return;
  }

  const payload = {
    tipo: route.meta.tipoDeAcoesEmLote,
    ids: edicoesEmLoteStore.idsSelecionados,
    ops: valores.edicoes.map((edicao) => {
      let { valor } = edicao;

      if (campoConfigPorNome(edicao.propriedade)?.tipo === 'date') {
        valor = String(format(new Date(valor), 'yyyy-MM-dd'));
      }

      return {
        col: edicao.propriedade,
        set: valor,
      };
    }),
  };

  try {
    if (await edicoesEmLoteStore.salvarItem(payload)) {
      alertStore.success('Edição realizada com sucesso.');

      const rotaDeEscape = route.meta?.rotaDeEscape;
      await edicoesEmLoteStore.limparIdsSelecionados();

      if (rotaDeEscape) {
        router.push(typeof rotaDeEscape === 'string' ? { name: rotaDeEscape } : rotaDeEscape);
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

async function fetchOptionsIfNeeded(rowIndex, fieldConfig) {
  const { meta } = fieldConfig;

  if (!meta?.storeKey || !meta.fetchAction || (!meta.listState && !meta.getterKey)) {
    console.warn('Configuração de metadados incompleta:', fieldConfig);
    return;
  }

  const store = storeInstances[meta.storeKey];
  if (!store) {
    console.error(`Store não encontrada para a chave: ${meta.storeKey}`);
    return;
  }

  const dataSourceKey = meta.getterKey || meta.listState;
  const jaTemDados = store[dataSourceKey]
    && Array.isArray(store[dataSourceKey])
    && store[dataSourceKey].length > 0;

  if (jaTemDados) {
    return;
  }

  const loadingKey = `${rowIndex}-${meta.storeKey}`;

  if (loadingOptions.value[loadingKey]) {
    return;
  }

  loadingOptions.value[loadingKey] = true;

  try {
    const fetchFunction = store[meta.fetchAction];
    if (typeof fetchFunction !== 'function') {
      throw new Error(`Ação '${meta.fetchAction}' não encontrada na store ${meta.storeKey}`);
    }

    await fetchFunction();
  } catch (error) {
    console.error(`Erro ao buscar dados para ${meta.storeKey}:`, error);
  } finally {
    loadingOptions.value[loadingKey] = false;
  }
}

function handlePropertyChange(event, idx) {
  const propriedadeSelecionada = event.target.value;
  setFieldValue(`edicoes[${idx}].valor`, null);

  if (propriedadeSelecionada) {
    const fieldConfig = obterConfiguracaoCampo(propriedadeSelecionada);
    if (fieldConfig?.tipo === 'select-dinamico' && fieldConfig.meta?.storeKey) {
      fetchOptionsIfNeeded(idx, fieldConfig);
    }
  }
}
</script>

<template>
  <CabecalhoDePagina />
  <p v-if="modoRevisao">
    Essa alteração será aplicada nas
    {{ edicoesEmLoteStore.idsSelecionados.length }} obras selecionadas. Confirma a edição?
  </p>
  <p v-else>
    Selecione o item que deseja editar nas
    {{ edicoesEmLoteStore.idsSelecionados.length }} obras selecionadas.
  </p>
  <form @submit.prevent="onSubmit">
    <div class="mb2">
      <FieldArray
        v-slot="{ fields, push, remove }"
        name="edicoes"
      >
        <div
          v-for="(field, idx) in fields"
          :key="field.key"
          class="flex g2 mb1 items-start"
        >
          <div class="f1">
            <LabelFromYup
              :name="`edicoes[${idx}].propriedade`"
              label="Editar"
              class="tc300"
            >
              Editar
            </LabelFromYup>
            <Field
              :name="`edicoes[${idx}].propriedade`"
              as="select"
              class="inputtext light mb1"
              :class="{ error: errors?.[`edicoes[${idx}].propriedade`] }"
              :aria-disabled="modoRevisao"
              @mousedown="modoRevisao && $event.preventDefault()"
              @keydown="modoRevisao && $event.preventDefault()"
              @focus="modoRevisao && $event.target.blur()"
              @change="(event) => handlePropertyChange(event, idx)"
            >
              <option
                value=""
                disabled
              >
                Selecione...
              </option>
              <option
                v-for="opcao in getOpcoesDisponiveis(idx)"
                :key="opcao.value"
                :value="opcao.value"
              >
                {{ opcao.label }}
              </option>
            </Field>
            <ErrorMessage
              class="error-msg"
              :name="`edicoes[${idx}].propriedade`"
            />
          </div>

          <div class="f1">
            <template v-if="values.edicoes?.[idx]?.propriedade">
              <LabelFromYup
                :name="`edicoes[${idx}].valor`"
                class="tc300"
              >
                {{ campoConfig(idx).label || 'Valor' }}
              </LabelFromYup>
              <CampoDinamico
                v-model="values.edicoes[idx].valor"
                :idx="idx"
                :config="campoConfig(idx)"
                :errors="errors"
                :loading-options="loadingOptions"
                :store-instances="storeInstances"
                :fontes-estaticas="fontesEstaticas"
                :readonly="modoRevisao"
              />
            </template>
            <template v-else>
              <div class="label tc300">
                Selecione
              </div>
              <div class="inputtext light mb1 disabled-placeholder">
                Selecione um campo à esquerda
              </div>
              <ErrorMessage
                class="error-msg"
                :name="`edicoes[${idx}].valor`"
              />
            </template>
          </div>

          <button
            v-if="!modoRevisao"
            type="button"
            class="like-a__text addlink self-end mb-1"
            aria-label="Remover Edição"
            title="Remover Edição"
            @click="remove(idx)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </div>

        <button
          v-if="!modoRevisao"
          class="like-a__text addlink"
          type="button"
          @click="push({ propriedade: '', valor: null })"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg>Adicionar Edição
        </button>
      </FieldArray>
      <ErrorMessage
        name="edicoes"
        class="error-msg mt1"
      />
    </div>

    <SmaeFieldsetSubmit>
      <template v-if="!modoRevisao">
        <button
          type="submit"
          class="btn big"
          :disabled="Object.keys(errors).length > 0 || values.edicoes?.length === 0"
        >
          Aplicar Edição
        </button>
      </template>

      <template v-else>
        <button
          type="button"
          class="btn big outline bgnone tcprimary"
          @click="modoRevisao = false"
        >
          Retornar
        </button>
        <button
          type="submit"
          class="btn big"
          @click="confirmarEdicao"
        >
          Confirmar Edição
        </button>
      </template>
    </SmaeFieldsetSubmit>
  </form>
</template>

<style scoped>
.disabled-placeholder {
  color: #aaa;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  padding: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  border-radius: 4px;
  height: 38px;
  display: flex;
  align-items: center;
}
</style>
