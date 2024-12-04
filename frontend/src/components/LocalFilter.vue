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
  emit('update:modelValue', filtrarObjetos(newValue, termoDeBusca.value));
});

emit('update:modelValue', props.lista);
</script>

<template>
  <form
    class="f1 search busca-livre"
    @submit.prevent
  >
    <label class="label tc300 nowrap">Busca livre</label>
    <input
      v-model="termoDeBusca"
      type="search"
      class="inputtext light"
      :disabled="!lista.length"
    >
    <button
      v-if="termoDeBusca"
      type="reset"
      class="busca-livre__botão-de-limpeza btn bgnone"
      @click="termoDeBusca = ''"
    >
      &times;
    </button>
  </form>
</template>
<style lang="less">
.busca-livre {
  position: relative;
}

.busca-livre__botão-de-limpeza {
  position: absolute;
  top: calc(1.5rem + 0.75em / 2);
  right: 0;
  color: @c400;
}
</style>
