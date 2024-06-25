<script setup>
import { useSlots } from 'vue';

const slots = useSlots();
</script>
<template>
  <div
    v-if="slots.default"
    class="error p1"
    aria-live="assertive"
  >
    <div class="error-msg">
      <slot />
    </div>
  </div>
</template>
