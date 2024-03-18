<script setup>
import dinheiro from '@/helpers/dinheiro';
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
});

const emit = defineEmits(['update:modelValue']);
const name = toRef(props, 'name');
const { handleChange } = useField(name, undefined, {
  initialValue: props.value
    ? Number(props.value)
    : null,
});

const typedValue = computed({
  get() {
    return props.value === '' || props.value === null
      ? null
      : dinheiro(props.value);
  },
  set: (newValue) => {
    const cleanValue = newValue === '' || newValue === null
      ? null
      : Number(newValue.replace(/[\D]/g, '')) / 100;

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
  >
</template>
