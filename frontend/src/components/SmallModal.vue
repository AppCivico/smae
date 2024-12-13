<script setup>
const props = defineProps({
  active: {
    type: Boolean,
    default: true,
  },
  hasCloseButton: {
    type: Boolean,
    default: false,
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
  <Teleport to="#modais">
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
        <button
          v-if="props.hasCloseButton"
          type="button"
          class="btn round edit-modal__close"
          @click="$emit('close')"
        >
          <svg
            width="12"
            height="12"
          >
            <use xlink:href="#i_x" />
          </svg>
        </button>
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
.edit-modal__close {
  position: absolute;
  right: -15px;
  top: -15px;
  aspect-ratio: 1;
}
</style>
