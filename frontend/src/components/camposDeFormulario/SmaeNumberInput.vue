<script setup>
import { useField } from 'vee-validate';
import {
  computed,
  toRef,
} from 'vue';

const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null,
  },
  name: {
    type: String,
    default: '',
  },
  converterPara: {
    default: 'number',
    type: String,
    validator(valor) {
      return ['number', 'string', 'text'].includes(valor);
    },
  },
  max: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['update:modelValue']);
const name = toRef(props, 'name');

const validarValorMaximo = (max, value) => {
  if (max > 0) {
    return value >= max ? max : value;
  }
  return value;
};

const { handleChange } = useField(name, undefined, {
  // eslint-disable-next-line no-nested-ternary
  initialValue: props.modelValue
    ? (
      ['string', 'text'].includes(props.converterPara.toLowerCase())
        ? String(props.modelValue)
        : Number(props.modelValue)
    )
    : null,
});

const typedValue = computed({
  get() {
    return props.modelValue === '' || props.modelValue === null
      ? null
      : props.modelValue;
  },
  set(newValue) {
    const isEmpty = newValue === '' || newValue === null;

    const parseToNumber = (val) => {
      if (typeof val === 'string') {
        const numericString = val.replace(/[^\d,.-]/g, '').replace(',', '.');
        const parsed = parseFloat(numericString);
        return Number.isNaN(parsed) ? null : parsed;
      }

      return typeof val === 'number' ? val : null;
    };

    const convertIfNeeded = (val) => {
      if (val === null) return null;

      let result = validarValorMaximo(Number(props.max), val);
      if (['string', 'text'].includes(props.converterPara.toLowerCase())) {
        result = String(result);
      }
      return result;
    };

    const cleanValue = isEmpty
      ? null
      : convertIfNeeded(parseToNumber(newValue));

    handleChange(cleanValue);
    emit('update:modelValue', cleanValue);
  },
});
</script>

<template>
  <input
    v-model="typedValue"
    pattern="[0-9]*"
    type="text"
    inputmode="numeric"
    :name="name"
  >
</template>
