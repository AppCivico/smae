<script setup>
import { debounce } from 'lodash';
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const value = computed({
  get() {
    return props.modelValue;
  },
  set: debounce((newValue) => {
    emit('update:modelValue', newValue);
  }, 400),
});
</script>

<template>
  <div class="f1 search">
    <label class="label tc300">Busca livre</label>
    <input
      :value="value"
      type="search"
      class="inputtext"
      @input="$emit('update:modelValue', $event.target.value)"
    >
    <small class="tc200 t13">ocorre nos dados já baixados</small>
  </div>
</template>
