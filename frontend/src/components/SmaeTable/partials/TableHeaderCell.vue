<template>
  <component
    :is="elementoEnvelope"
    class="table-header-cell"
  >
    <slot>
      {{ label }}
    </slot>
  </component>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import type { Coluna } from '../tipagem';

const props = withDefaults(defineProps<Coluna>(), {
  ehCabecalho: true,
});

const elementoEnvelope = computed<'td' | 'th'>(() => (props.ehCabecalho ? 'th' : 'td'));
</script>
