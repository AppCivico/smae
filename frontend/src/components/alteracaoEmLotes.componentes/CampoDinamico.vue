<script setup>
import { Field, ErrorMessage } from 'vee-validate';
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

function updateValue(value) {
  emit('update:modelValue', value);
}

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

const getGrupoParaAutocomplete = (config) => {
  const meta = config?.meta;
  if (!meta) return [];

  if (meta.storeKey) {
    const store = props.storeInstances[meta.storeKey];
    const lista = meta.getterKey ? store[meta.getterKey] : store[meta.listState];
    return Array.isArray(lista) ? lista : [];
  }

  return [];
};
</script>

<template>
  <SmaeNumberInput
    v-if="config?.tipo === 'number'"
    :name="`edicoes[${idx}].valor`"
    :model-value="modelValue"
    class="inputtext light"
    :aria-readonly="readonly"
    :readonly="readonly"
    @update:modelValue="updateValue"
  />

  <Field
    v-if="config?.tipo === 'text'"
    :name="`edicoes[${idx}].valor`"
    type="text"
    class="inputtext light"
    :aria-readonly="readonly"
    :readonly="readonly"
    :model-value="modelValue"
    @update:modelValue="updateValue"
  />

  <SmaeDateInput
    v-if="config?.tipo === 'date'"
    :name="`edicoes[${idx}].valor`"
    :model-value="modelValue"
    class="inputtext light"
    :aria-readonly="readonly"
    :readonly="readonly"
    @update:modelValue="updateValue"
  />

  <AutocompleteField2
    v-if="config?.tipo === 'autocomplete'"
    :name="`edicoes[${idx}].valor`"
    :model-value="modelValue"
    :grupo="getGrupoParaAutocomplete(config)"
    :controlador="{ busca: '', participantes: modelValue || [] }"
    :aria-busy="loadingOptions?.[`${idx}-${config?.meta?.storeKey}`]"
    :aria-readonly="readonly"
    :readonly="readonly"
    :label="config.meta.optionLabel || 'value'"
    @change="updateValue"
  />

  <CampoDePessoasComBuscaPorOrgao
    v-if="config?.tipo === 'campo-de-pessoas-orgao'"
    :name="`edicoes[${idx}].valor`"
    :model-value="modelValue || []"
    :valores-iniciais="[]"
    :readonly="readonly"
    :limitar-para-um-orgao="true"
    @update:modelValue="updateValue"
  />

  <Field
    v-if="config?.tipo === 'select-estatico'"
    :name="`edicoes[${idx}].valor`"
    as="select"
    class="inputtext light"
    :model-value="modelValue"
    :aria-readonly="readonly"
    @mousedown="readonly && $event.preventDefault()"
    @keydown="readonly && $event.preventDefault()"
    @focus="readonly && $event.target.blur()"
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

  <div v-if="config?.tipo === 'select-dinamico'">
    <div
      v-if="loadingOptions?.[`${idx}-${config?.meta?.storeKey}`]"
      class="inputtext light mb1 disabled-placeholder"
    >
      Carregando opções...
    </div>
    <Field
      v-else
      :name="`edicoes[${idx}].valor`"
      as="select"
      class="inputtext light"
      :model-value="modelValue"
      :aria-readonly="readonly"
      @mousedown="readonly && $event.preventDefault()"
      @keydown="readonly && $event.preventDefault()"
      @focus="readonly && $event.target.blur()"
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
