<script setup>
import { useSlots } from 'vue';

const slots = useSlots();

defineProps({
  erro: {
    type: null,
    default: '',
  },
});
</script>
<template>
  <div
    v-if="slots.default || erro"
    class="error p1"
    aria-live="assertive"
  >
    <div class="error-msg">
      <slot>
        {{ erro }}
      </slot>
    </div>
  </div>
</template>
