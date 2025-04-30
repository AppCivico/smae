<template>
  <component
    :is="elementoEnvelope"
    class="table-header-cell"
    :class="classe"
  >
    <slot
      :name="normalizadorDeSlots(`cabecalho:${chave}`)"
      v-bind="$props"
    >
      {{ label }}
    </slot>
  </component>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import type { Coluna } from '../tipagem';
import normalizadorDeSlots from '../utils/normalizadorDeSlots';

type Props = Coluna;

const props = withDefaults(defineProps<Props>(), {
  cabecalho: true,
});

const elementoEnvelope = computed<'td' | 'th'>(() => (props.cabecalho ? 'th' : 'td'));
</script>
