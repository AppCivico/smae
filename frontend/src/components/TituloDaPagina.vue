<script setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';

defineProps({
  as: {
    type: String,
    default: 'h1',
  },
  prefixo: {
    type: String,
    default: '',
  },
  sufixo: {
    type: String,
    default: '',
  },
});

const route = useRoute();

const título = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : route?.meta?.título;

</script>
<template>
  <component
    :is="as"
  >
    <template v-if="título">
      {{ prefixo }} {{ título }} {{ sufixo }}
    </template>
    <slot v-else />
  </component>
</template>
