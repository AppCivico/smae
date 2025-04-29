<script setup>
import { computed } from 'vue';
import { Field, ErrorMessage } from 'vee-validate';
import SmaeNumberInput from '@/components/camposDeFormulario/SmaeNumberInput.vue';
import SmaeDateInput from '@/components/camposDeFormulario/SmaeDateInput.vue';
import AutocompleteField2 from '@/components/AutocompleteField2.vue';

const props = defineProps({
  config: Object,
  modelValue: null,
  path: { type: String, required: true },
  errors: Object,
  loadingOptions: Object,
  storeInstances: Object,
  fontesEstaticas: Object,
  readonly: Boolean,
});

const emit = defineEmits(['update:modelValue']);

function updateValue(val, key = null) {
  if (key) {
    emit('update:modelValue', { ...props.modelValue, [key]: val });
  } else {
    emit('update:modelValue', val);
  }
}

const fieldName = computed(() => props.path);

function getOptionsForField(config) {
  if (!config.meta) return [];
  if (config.tipo === 'select-estatico') {
    return props.fontesEstaticas?.[config.meta.optionSource] || [];
  }
  if (config.tipo === 'select-dinamico') {
    const store = props.storeInstances[config.meta.storeKey];
    const list = config.meta.getterKey ? store[config.meta.getterKey] : store[config.meta.listState];
    return list?.map(item => ({
      value: item[config.meta.optionValue],
      label: item[config.meta.optionLabel],
    })) || [];
  }
  return [];
}

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

function campoConfig(campoSchema) {
  const meta = campoSchema.meta?.() || {};
  const tipo = detectarTipoCampo(campoSchema, meta);

  // debugger;
  return {
    schema: campoSchema,
    tipo,
    label: campoSchema.spec?.label || 'valor',
    meta,
  };
}
</script>

<template>
  <div v-if="config?.tipo === 'campos-compostos'" class="campo-composto">
    <div
      v-for="(subConfig, key) in config.meta.campos"
      :key="key"
      class="mb-2"
    >
      <LabelFromYup
        :name="`edicoes[${key}].valor`"
        class="tc300"
      >
        {{ campoConfig(subConfig).label || 'Valor' }}
      </LabelFromYup>
      <CampoDinamico
        :config="campoConfig(subConfig)"
        :model-value="modelValue?.[key] ?? null"
        :path="`${fieldName}.${key}`"
        :errors="errors"
        :loading-options="loadingOptions"
        :store-instances="storeInstances"
        :fontes-estaticas="fontesEstaticas"
        :readonly="readonly"
        @update:modelValue="val => updateValue(val, key)"
      />
    </div>
  </div>

  <template v-else>
    <SmaeNumberInput
      v-if="config.tipo === 'number'"
      :name="fieldName"
      :model-value="modelValue"
      class="inputtext light"
      @update:modelValue="updateValue"
    />

    <SmaeDateInput
      v-else-if="config.tipo === 'date'"
      :name="fieldName"
      :model-value="modelValue"
      class="inputtext light"
      @update:modelValue="updateValue"
    />

    <AutocompleteField2
      v-else-if="config.tipo === 'autocomplete'"
      :name="fieldName"
      :model-value="modelValue"
      :grupo="getOptionsForField(config)"
      @change="updateValue"
    />

    <Field
      v-else-if="config.tipo === 'text'"
      :name="fieldName"
      type="text"
      class="inputtext light"
      :model-value="modelValue"
      @update:modelValue="updateValue"
    />

    <Field
      v-else-if="config.tipo === 'select-estatico' || config.tipo === 'select-dinamico'"
      :name="fieldName"
      as="select"
      class="inputtext light"
      :model-value="modelValue"
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
  </template>

  <ErrorMessage :name="fieldName" class="error-msg" />
</template>

<style scoped>
.campo-composto {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid #eee;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}
</style>
