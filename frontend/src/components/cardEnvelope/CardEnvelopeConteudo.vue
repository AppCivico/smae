<template>
  <article class="card-shadow card-envelope-conteudo">
    <slot :visivel="visivel" />
  </article>
</template>

<script lang="ts" setup>

defineProps<{
  visivel?: boolean
}>();
</script>

<style lang="less" scoped>
.card-envelope-conteudo {
  padding: 19px 25px;
  position: relative;
}
</style>
