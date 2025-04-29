<script setup>
import { ref, watch, toRaw } from 'vue';
import { Field, ErrorMessage } from 'vee-validate';
import isEqual from 'lodash/isEqual';
import SmaeNumberInput from '@/components/camposDeFormulario/SmaeNumberInput.vue';
import SmaeDateInput from '@/components/camposDeFormulario/SmaeDateInput.vue';
import AutocompleteField2 from '@/components/AutocompleteField2.vue';
import CampoDePessoasComBuscaPorOrgao from '@/components/CampoDePessoasComBuscaPorOrgao.vue';

const props = defineProps({
  idx: Number,
  config: Object,
  modelValue: null,
  errors: Object,
  loadingOptions: Object,
  storeInstances: Object,
  fontesEstaticas: Object,
  readonly: Boolean,
});

const emit = defineEmits(['update:modelValue']);

const localModelValue = ref(toRaw(props.modelValue));

let internalChange = false;

watch(
  () => props.modelValue,
  (novoValor) => {
    if (!internalChange) {
      if (!isEqual(novoValor, localModelValue.value)) {
        localModelValue.value = toRaw(novoValor);
      }
    }
    internalChange = false;
  }
);

function updateValue(value) {
  if (!isEqual(value, localModelValue.value)) {
    internalChange = true;
    localModelValue.value = value;
    emit('update:modelValue', value);
  }
}

function atualizarSubCampo(campo, valorCampo, configMeta) {
  console.log('atualizarSubCampo', campo, valorCampo, props.key);

  let valorFinal = valorCampo;
  if (
    valorCampo &&
    typeof valorCampo === 'object' &&
    campo in valorCampo
  ) {
    valorFinal = valorCampo[campo];
  }

  const novoValor = { ...(localModelValue.value || {}) };
  novoValor[campo] = valorFinal;

  if (!isEqual(novoValor, localModelValue.value)) {
    internalChange = true;
    localModelValue.value = novoValor;
    emit('update:modelValue', novoValor);
  }
}

// Helper para detectar tipo de campo simples
function detectarTipoCampoSimples(subCampo) {
  const tipoPorYupType = {
    number: 'number',
    string: 'text',
    date: 'date',
    array: 'autocomplete',
    object: 'object',
  };
  return tipoPorYupType[subCampo.type] || 'text';
}

// Helper para carregar opções para selects
function getOptionsForField(config) {
  const meta = config?.meta;
  if (!meta) return [];

  if (config.tipo === 'select-estatico') {
    return props.fontesEstaticas?.[meta.optionSource] || [];
  }

  if (config.tipo === 'select-dinamico') {
    const store = props.storeInstances[meta.storeKey];
    const list = meta.getterKey ? store[meta.getterKey] : store[meta.listState];
    if (!list || !Array.isArray(list)) return [];

    const getLabel = typeof meta.optionLabel === 'function'
      ? meta.optionLabel
      : (item) => item[meta.optionLabel];

    return list.map((item) => ({
      value: item[meta.optionValue],
      label: getLabel(item),
    }));
  }

  return [];
}

// Helper para autocomplete
function getGrupoParaAutocomplete(config) {
  const meta = config?.meta;
  if (!meta) return [];

  if (meta.storeKey) {
    const store = props.storeInstances[meta.storeKey];
    const lista = meta.getterKey ? store[meta.getterKey] : store[meta.listState];
    return Array.isArray(lista) ? lista : [];
  }

  return [];
}
</script>

<template>
  <div
    class="campos-compostos"
    v-if="config?.tipo === 'campos-compostos'"
  >
    <div
      v-for="(subCampo, keyCampo) in config.meta.campos"
      :key="keyCampo"
      class="f1"
    >
      <LabelFromYup
        :name="`${keyCampo}`"
        class="tc300"
      >
        {{ subCampo.spec.label || 'Valor' }}
      </LabelFromYup>
      <Field
        v-if="subCampo.type === 'string'"
        class="inputtext light"
        :name="`${keyCampo}`"
        :model-value="modelValue?.[keyCampo]"
        @update:modelValue="(val) => atualizarSubCampo(keyCampo, val)"
      />
      <SmaeDateInput
        v-else-if="subCampo.type === 'date'"
        :model-value="modelValue?.[keyCampo]"
        :aria-readonly="readonly"
        :readonly="readonly"
        class="inputtext light"
        @update:modelValue="(val) => atualizarSubCampo(keyCampo, val)"
      />
      <SmaeNumberInput
        v-else-if="subCampo.type === 'number'"
        :model-value="modelValue?.[keyCampo]"
        @update:modelValue="(val) => atualizarSubCampo(keyCampo, val)"
      />
    </div>
  </div>

  <SmaeNumberInput
    v-else-if="config?.tipo === 'number'"
    :model-value="localModelValue"
    class="inputtext light"
    :aria-readonly="readonly"
    :readonly="readonly"
    @update:modelValue="updateValue"
  />

  <Field
    v-else-if="config?.tipo === 'text'"
    type="text"
    class="inputtext light"
    :model-value="localModelValue"
    :name="`edicoes[${idx}].valor`"
    :aria-readonly="readonly"
    :readonly="readonly"
    @update:modelValue="updateValue"
  />

  <SmaeDateInput
    v-else-if="config?.tipo === 'date'"
    :model-value="localModelValue"
    class="inputtext light"
    :aria-readonly="readonly"
    :readonly="readonly"
    @update:modelValue="updateValue"
  />

  <AutocompleteField2
    v-else-if="config?.tipo === 'autocomplete'"
    :model-value="localModelValue"
    :grupo="getGrupoParaAutocomplete(config)"
    :controlador="{ busca: '', participantes: localModelValue || [] }"
    :aria-busy="loadingOptions?.[`${idx}-${config?.meta?.storeKey}`]"
    :aria-readonly="readonly"
    :readonly="readonly"
    @change="updateValue"
  />

  <CampoDePessoasComBuscaPorOrgao
    v-else-if="config?.tipo === 'campo-de-pessoas-orgao'"
    :model-value="localModelValue || []"
    :valores-iniciais="[]"
    :readonly="readonly"
    :limitar-para-um-orgao="true"
    @update:modelValue="updateValue"
  />

  <Field
    v-else-if="config?.tipo === 'select-estatico'"
    as="select"
    class="inputtext light"
    :model-value="localModelValue"
    :aria-readonly="readonly"
    :readonly="readonly"
    @update:modelValue="updateValue"
  >
    <option value="" disabled>Selecione...</option>
    <option
      v-for="opcao in getOptionsForField(config)"
      :key="opcao.value"
      :value="opcao.value"
    >
      {{ opcao.label }}
    </option>
  </Field>

  <div v-else-if="config?.tipo === 'select-dinamico'">
    <div
      v-if="loadingOptions?.[`${idx}-${config?.meta?.storeKey}`]"
      class="inputtext light mb1 disabled-placeholder"
    >
      Carregando opções...
    </div>
    <Field
      v-else
      as="select"
      class="inputtext light"
      :model-value="localModelValue"
      :aria-readonly="readonly"
      @update:modelValue="updateValue"
    >
      <option value="" disabled>Selecione...</option>
      <option
        v-for="opcao in getOptionsForField(config)"
        :key="opcao.value"
        :value="opcao.value"
      >
        {{ opcao.label }}
      </option>
    </Field>
  </div>

  <ErrorMessage
    class="error-msg"
    :name="`edicoes[${idx}].valor`"
  />
</template>

<style scoped>
.campos-compostos {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1rem;
}
</style>
