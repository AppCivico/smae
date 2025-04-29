<script setup>
import {
  object,
  array,
  string,
  mixed,
  lazy,
} from 'yup';
import { format } from 'date-fns';
import {
  Field, FieldArray, ErrorMessage, useForm,
} from 'vee-validate';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import { useAlertStore } from '@/stores/alert.store';
import { useEquipamentosStore } from '@/stores/equipamentos.store';
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useTiposDeIntervencaoStore } from '@/stores/tiposDeIntervencao.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import rawStatusObras from '@/consts/statusObras';
import { obras as schemaObras } from '@/consts/formSchemas';
import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import CampoDinamico from '@/components/alteracaoEmLotes.componentes/CampoDinamico.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';

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

const camposDisponiveisParaEdicao = computed(() => Object.entries(schemaObras.fields)
  .filter(([_, fieldSchema]) => fieldSchema.meta()?.permite_edicao_em_massa)
  .map(([fieldName, fieldSchema]) => ({
    value: fieldName,
    label: fieldSchema.spec.label || fieldName,
  })));

function detectarTipoCampo(campoSchema, meta) {
  if (meta?.tipo) return meta.tipo;

  if (campoSchema.type === 'array') return 'autocomplete';

  if (meta?.optionSource && fontesEstaticas[meta.optionSource]) {
    return 'select-estatico';
  }

  if (meta?.storeKey) {
    return 'select-dinamico';
  }

  if (meta?.tipo) {
    return tipo;
  }

  const tipoPorYupType = {
    number: 'number',
    string: 'text',
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

function campoConfigPorNome(nomeCampo) {
  const campoSchema = schemaObras.fields[nomeCampo];
  if (!campoSchema) return null;
  const meta = campoSchema.meta?.() || {};
  const tipo = detectarTipoCampo(campoSchema, meta);
  return { tipo };
}

const schema = object({
  edicoes: array().of(
    object({
      propriedade: string().required('Selecione o campo'),
      valor: lazy((value, { parent }) => {
        const { propriedade } = parent;
        if (!propriedade) return mixed().nullable();

        const schemaOriginal = schemaObras.fields[propriedade];
        if (!schemaOriginal) return mixed().required('Configuração inválida.');

        const tipo = schemaOriginal.type;

        if (tipo === 'array') return schemaOriginal;

        return schemaOriginal.required('Informe o novo valor');
      }),
      operacao: string()
        .nullable()
        .transform((curr, orig) => (orig === undefined ? 'Set' : curr))
        .when('propriedade', (propriedade, campoSchema) => {
          const tipo = campoConfigPorNome(propriedade)?.tipo;
          if (tipo === 'array') {
            return campoSchema.required('Selecione a operação')
              .oneOf(['Set', 'Add', 'Remove']);
          }
          return schema.notRequired().strip();
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

function getOpcoesDisponiveis(rowIndex) {
  const propriedadesSelecionadas = values.edicoes
    ?.map((edicao, index) => (index !== rowIndex ? edicao.propriedade : null))
    .filter((prop) => prop != null && prop !== '');

  return camposDisponiveisParaEdicao.value.filter(
    (opcao) => !propriedadesSelecionadas.includes(opcao.value),
  );
}

function campoConfig(idx) {
  const prop = values.edicoes?.[idx]?.propriedade;
  return prop ? obterConfiguracaoCampo(prop) : null;
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
      const tipoCampo = campoConfigPorNome(edicao.propriedade)?.tipo;
      const entidadeAlvo = campo?.meta?.entidade_alvo || null;
      let { valor } = edicao;

      if (tipoCampo === 'date' && valor) {
        valor = String(format(new Date(valor), 'yyyy-MM-dd'));
      } else if (tipoCampo === 'number' && valor !== null) {
        valor = Number(valor);
      } else if (['text', 'string'].includes(tipoCampo) && valor !== null) {
        valor = String(valor);
      }

      const operacao = edicao.operacao || 'Set';

      if (campo?.meta?.campos && Array.isArray(campo.meta.campos)) {
        return campo.meta.campos.map((subcampo) => ({
          entidade_alvo: entidadeAlvo,
          col: subcampo.schema?.spec?.path || '',
          tipo_operacao: operacao,
          valor: edicao.valor?.[subcampo.schema?.spec?.path] ?? null,
        }));
      }

      return {
        entidade_alvo: entidadeAlvo,
        col: edicao.propriedade,
        tipo_operacao: operacao,
        valor,
      };
    }),
  };

  try {
    if (await edicoesEmLoteStore.salvarItem(payload)) {
      alertStore.success('Solicitação realizada com sucesso.');

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

  if (!meta?.storeKey || !meta.fetchAction || (!meta.listState && !meta.getterKey)) return;

  const store = storeInstances[meta.storeKey];
  if (!store) return;

  const dataSourceKey = meta.getterKey || meta.listState;
  const jaTemDados = store[dataSourceKey]
    && Array.isArray(store[dataSourceKey])
    && store[dataSourceKey].length > 0;

  if (jaTemDados || loadingOptions.value[`${rowIndex}-${meta.storeKey}`]) return;

  loadingOptions.value[`${rowIndex}-${meta.storeKey}`] = true;

  try {
    const fetchFn = store[meta.fetchAction];
    if (typeof fetchFn === 'function') {
      await fetchFn();
    }
  } finally {
    loadingOptions.value[`${rowIndex}-${meta.storeKey}`] = false;
  }
}

function handlePropertyChange(event, idx) {
  const propriedadeSelecionada = event.target.value;
  setFieldValue(`edicoes[${idx}].valor`, null);

  if (propriedadeSelecionada) {
    const fieldConfig = obterConfiguracaoCampo(propriedadeSelecionada);
    if (fieldConfig?.meta?.storeKey) {
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

          <div
            v-if="['autocomplete', 'campo-de-pessoas-orgao'].includes(campoConfig(idx)?.tipo)"
            class="f1"
          >
            <LabelFromYup
              :name="`edicoes[${idx}].operacao`"
              class="tc300"
            >
              Operação
            </LabelFromYup>
            <Field
              :name="`edicoes[${idx}].operacao`"
              as="select"
              class="inputtext light mb1"
              :aria-readonly="modoRevisao"
              :class="{ error: errors?.[`edicoes[${idx}].operacao`] }"
              @mousedown="modoRevisao && $event.preventDefault()"
              @keydown="modoRevisao && $event.preventDefault()"
              @focus="modoRevisao && $event.target.blur()"
            >
              <option value="Set">
                Substituir
              </option>
              <option value="Add">
                Adicionar
              </option>
              <option value="Remove">
                Remover
              </option>
            </Field>
            <ErrorMessage
              :name="`edicoes[${idx}].operacao`"
              class="error-msg"
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
          @click="push(
            {
              propriedade: '',
              valor: null,
              operacao: 'Set',
            })"
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
