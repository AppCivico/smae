<script setup>
const props = defineProps({
  active: {
    type: Boolean,
    required: true,
  },
});
defineEmits(['close']);
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <Teleport to="body">
    <div
      v-if="props.active"
      class="editModal-wrap"
    >
      <div
        class="overlay"
        @click="$emit('close')"
      />
      <div
        class="editModal small"
        v-bind="$attrs"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
