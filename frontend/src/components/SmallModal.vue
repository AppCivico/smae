<script setup>
import { computed } from 'vue';

const props = defineProps(['active', 'classes']);
const active = computed(() => props.active);

defineEmits(['close']);
</script>

<template>
  <div
    v-if="active"
    class="editModal-wrap"
  >
    <div
      class="overlay"
      @click="$emit('close')"
    />
    <div
      class="editModal small"
      :class="props.classes"
    >
      <slot />
    </div>
  </div>
</template>
