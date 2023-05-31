<script setup>
import filtrarObjetos from '@/helpers/filtrarObjetos';
import { debounce } from 'lodash';
import {
  ref, watch,
} from 'vue';

const props = defineProps({
  lista: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const termoDeBusca = ref('');
const emit = defineEmits(['update:modelValue']);

watch(() => termoDeBusca.value, debounce((newValue) => {
  emit('update:modelValue', filtrarObjetos(props.lista, newValue));
}, 400));

watch(() => props.lista, (newValue) => {
  emit('update:modelValue', newValue);
});

emit('update:modelValue', props.lista);
</script>

<template>
  <div class="f1 search">
    <label class="label tc300">Busca livre</label>
    <input
      v-model="termoDeBusca"
      type="search"
      class="inputtext"
    >
    <small class="tc200 t13">ocorre nos dados já baixados</small>
  </div>
</template>
