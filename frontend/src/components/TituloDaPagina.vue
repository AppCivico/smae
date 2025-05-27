<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

defineProps({
  as: {
    type: String,
    default: 'h1',
  },
  ícone: {
    type: String,
    default: '',
  },
  prefixo: {
    type: String,
    default: '',
  },
  sufixo: {
    type: String,
    default: '',
  },
  titulo: {
    type: String,
    default: '',
  },
});

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const route = useRoute();

const título = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : computed(() => route.meta.título);

</script>
<template>
  <component
    :is="as"
    class="título-da-página"
  >
    <img
      v-if="ícone"
      class="título-da-página__ícone mr1"
      :src="`${baseUrl}/download/${ícone}?inline=true`"
      width="100"
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
<style lang="less">
.título-da-página {
  display: flex;
  align-items: center;
}

.título-da-página__ícone {
  border-radius: 999em;
  object-fit: cover;
  display: inline;
  max-width: 98px;
  max-height: 98px;
}
</style>
