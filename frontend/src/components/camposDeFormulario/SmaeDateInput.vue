<script setup>
import { useField } from 'vee-validate';
import {
  computed,
  toRef,
} from 'vue';
import { parseISO, isValid, format } from 'date-fns';

const props = defineProps({
  modelValue: {
    type: [Date, String, null],
    default: null,
  },
  name: {
    type: String,
    default: '',
  },
  converterPara: {
    default: 'date',
    type: String,
    validator(valor) {
      return ['date', 'string', 'text'].includes(valor);
    },
  },
});

const emit = defineEmits(['update:modelValue']);
const nome = toRef(props, 'name');

const { handleChange } = useField(nome, undefined, {
  // eslint-disable-next-line no-nested-ternary
  initialValue: props.modelValue
    ? (
      ['string', 'text'].includes(props.converterPara.toLowerCase())
        ? String(props.modelValue)
        : new Date(props.modelValue)
    )
    : null,
});

const valorDigitado = computed({
  get() {
    if (!props.modelValue || props.modelValue === '') return null;

    const data = props.modelValue instanceof Date
      ? props.modelValue
      : parseISO(props.modelValue);

    return isValid(data) ? format(data, 'yyyy-MM-dd') : null;
  },

  set(novoValor) {
    const estaVazio = novoValor === '' || novoValor === null;

    let valorFinal = null;

    if (!estaVazio) {
      const data = parseISO(novoValor);
      if (isValid(data)) {
        valorFinal = ['string', 'text'].includes(props.converterPara.toLowerCase())
          ? format(data, 'yyyy-MM-dd')
          : data;
      }
    }

    handleChange(valorFinal);
    emit('update:modelValue', valorFinal);
  },
});
</script>

<template>
  <input
    v-model="valorDigitado"
    type="date"
    :name="nome"
  >
</template>
