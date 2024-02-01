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
    <slot name="prepend" />
    <slot>
      <pre
        v-if="!schema.fields[name]"
        v-ScrollLockDebug
      >
      Etiqueta não encontrada para `{{ name }}`
    </pre>
      <template v-else>
        <template v-if="schema">
          {{ schema.fields[name]?.spec.label }}
        </template>&nbsp;<span
          v-if="schema.fields[name].spec.presence === 'required'"
          class="tvermelho"
        >*</span>
      </template>
    </slot>
    <slot name="append" />
  </component>
</template>
