<script setup>
const props = defineProps({
  active: {
    type: Boolean,
    default: true,
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
        class="editModal"
        v-bind="$attrs"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
<style lang="less">
.editModal-wrap {
  .largura-total {
    width: 100% !important;
    max-width: none !important;
  }
}
</style>
