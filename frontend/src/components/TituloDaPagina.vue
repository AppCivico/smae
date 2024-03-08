<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

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
    <slot>
      <template v-if="título">
        {{ prefixo }} {{ título }} {{ sufixo }}
      </template>
      <span
        v-else
        v-ScrollLockDebug
      >
        Título ausente
      </span>
    </slot>
  </component>
</template>
