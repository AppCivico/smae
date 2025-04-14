<script setup>
import SmaeDateInput from '@/components/camposDeFormulario/SmaeDateInput.vue';
import SmaeNumberInput from '@/components/camposDeFormulario/SmaeNumberInput.vue';
import { ErrorMessage, Field } from 'vee-validate';
import { onMounted, watch } from 'vue';

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

async function fetchOptionsIfNeeded() {
  const meta = props.config?.meta;
  if (
    props.config?.tipo !== 'select-dinamico'
    || !meta?.storeKey
    || !meta?.fetchAction
    || (!meta.listState && !meta.getterKey)
  ) return;

  const store = props.storeInstances[meta.storeKey];
  if (!store || typeof store[meta.fetchAction] !== 'function') return;

  const dataKey = meta.getterKey || meta.listState;
  if (Array.isArray(store[dataKey]) && store[dataKey].length > 0) return;

  await store[meta.fetchAction]();
}

watch(() => props.config?.tipo, async (tipo) => {
  if (tipo === 'select-dinamico') await fetchOptionsIfNeeded();
});

onMounted(() => {
  if (props.config?.tipo === 'select-dinamico') {
    fetchOptionsIfNeeded();
  }
});

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
</script>

<template>
  <pre v-ScrollLockDebug>config:{{ config }}</pre>

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
    <option
      value=""
      disabled
    >
      Selecione...
    </option>
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
      <option
        value=""
        disabled
      >
        Selecione...
      </option>
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
