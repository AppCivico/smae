<script setup>
import dinheiro from '@/helpers/dinheiro';
import { useField } from 'vee-validate';
import {
  defineProps, ref, toRef, watch
} from 'vue';

const props = defineProps({
  value: {
    type: Number,
    required: true,
  },
  // necessária para que o vee-validate não se perca
  name: {
    type: String,
    default: '',
  },
});

const name = toRef(props, 'name');
const { handleChange } = useField(name, undefined, {
  initialValue: props.value,
});
const typedValue = ref(dinheiro(props.value));

watch(typedValue, (newValue) => {
  const cleanValue = Number(newValue.replace(/[\D]/g, '')) / 100;
  handleChange(cleanValue);
  typedValue.value = dinheiro(cleanValue);
});
</script>

<template>
  <input
    v-model="typedValue"
    type="text"
  >
</template>
