<template>
  <div
    role="region"
    :aria-label="ariaLabel"
    :aria-labelledby="ariaLabelledby"
    tabindex="0"
  >
    <slot />
  </div>
</template>
<script setup>
defineProps({
  ariaLabelledby: {
    type: String,
    default: null,
    validator(value, props) {
      return !!value || !!props.ariaLabel;
    },
  },
  ariaLabel: {
    type: String,
    default: null,
    validator(value, props) {
      return !!value || !!props.ariaLabelledby;
    },
  },
});
</script>
