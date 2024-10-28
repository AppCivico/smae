<script setup>
defineProps({
  erro: {
    type: null,
    default: '',
  },
  as: {
    type: String,
    default: 'div',
  },
});
</script>
<template>
  <component
    :is="as"
    v-if="$slots?.default || erro"
    class="error p1"
    aria-live="assertive"
  >
    <div class="error-msg">
      <slot>
        {{ erro }}
      </slot>
    </div>
  </component>
</template>
