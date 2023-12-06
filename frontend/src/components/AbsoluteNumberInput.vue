<script setup>
import { useField } from 'vee-validate';
import {
  computed, toRef, watch,
} from 'vue';

const props = defineProps({
  value: {
    type: Number || null,
    default: null,
  },
  // necessária para que o vee-validate não se perca
  name: {
    type: String,
    default: '',
  },
  negative: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);
const name = toRef(props, 'name');
const { handleChange } = useField(name, undefined, {
  initialValue: props.value,
});

const typedValue = computed({
  get() {
    return typeof (props.value) === 'number'
      ? Math.abs(props.value)
      : null;
  },
  set: (newValue) => {
    let realValue = typeof (newValue) !== 'number'
      ? null
      : newValue;

    if (props.negative) {
      realValue *= -1;
    }

    handleChange(realValue);
    emit('update:modelValue', realValue);
  },
});

watch(() => props.negative, (isNegative) => {
  const newValue = isNegative
    ? typedValue.value * -1
    : typedValue.value;

  handleChange(newValue);
  emit('update:modelValue', newValue);
});
</script>

<template>
  <input
    v-model="typedValue"
    type="number"
    :name="name"
    min="0"
  >
</template>
