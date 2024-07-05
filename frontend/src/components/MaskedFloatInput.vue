<script setup>
import dinheiro from '@/helpers/dinheiro';
import maskFloat from '@/helpers/maskFloat';
import { useField } from 'vee-validate';
import {
  computed, toRef,
} from 'vue';

const props = defineProps({
  value: {
    type: [
      Number,
      String,
      null,
    ],
    default: null,
  },
  // necessária para que o vee-validate não se perca
  name: {
    type: String,
    default: '',
  },
  converterPara: {
    default: 'number',
    type: String,
    validator(valor) {
      return [
        'number',
        'string',
        'text',
      ].indexOf(valor) > -1;
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
  initialValue: props.value
    ? (
      ['string', 'text'].indexOf(props.converterPara.toLowerCase()) !== -1
        ? String(props.value)
        : Number(props.value)
    )
    : null,
});

const typedValue = computed({
  get() {
    return props.value === '' || props.value === null
      ? null
      : dinheiro(props.value);
  },
  set: (newValue) => {
    let cleanValue;

    switch (newValue) {
      case '':
      case null:
        cleanValue = null;
        break;

      default:
        cleanValue = Number(newValue.replace(/[\D]/g, '')) / 100;
        cleanValue = validarValorMaximo(Number(props.max), cleanValue);

        if (['string', 'text'].indexOf(props.converterPara.toLowerCase()) !== -1) {
          cleanValue = String(cleanValue);
        }
        break;
    }

    handleChange(cleanValue);
    emit('update:modelValue', cleanValue);
  },
});
</script>
<template>
  <input
    v-model="typedValue"
    type="text"
    inputmode="numeric"
    :name="name"
    @keyup="maskFloat"
  >
</template>
