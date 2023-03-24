<script setup>
defineProps({
  as: {
    type: String,
    default: 'label',
    validator(value) {
      return ['label', 'legend'].includes(value);
    },
  },
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
  <component
    :is="as"
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
  </component>
</template>
