<script setup>
defineProps({
  name: {
    type: String,
    default: '',
  },
  schema: {
    type: Object,
    default: () => null,
  },
});
</script>
<template>
  <label
    class="label"
    :for="name || $attrs.for || null"
  >
    <slot>
      <template v-if="schema">
        {{ schema.fields[name].spec.label }}
      </template>&nbsp;<span
        v-if="schema.fields[name].spec.presence === 'required'"
        class="tvermelho"
      >*</span>
    </slot>
  </label>
</template>
