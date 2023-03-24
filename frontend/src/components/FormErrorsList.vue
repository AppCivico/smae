<script setup>
defineProps({
  errors: {
    type: Object,
    default: () => null,
  },
});
</script>
<template>
  <div
    v-if="Object.keys(errors)?.length"
    class="form-errors-report"
  >
    <p class="form-errors-report__message">
      Please correct the following errors:
    </p>
    <ul class="form-errors-report__list">
      <li
        v-for="(message, field) in errors"
        :key="field"
        class="form-errors-report__item"
        :class="`form-errors-report__item--${field}`"
      >
        {{ message }}
      </li>
    </ul>
  </div>
</template>
<style lang="less">
@import "@/_less/variables.less";

.form-errors-report {
  font-style: italic;
  line-height: 1.5;
}

.form-errors-report__message {}

.form-errors-report__item {
  list-style-type: disc;

  &::marker {
    color: @vermelho;
  }

  &::after {
    content: ';';
  }

  &:last-child::after {
    content: '.';
  }
}
</style>
