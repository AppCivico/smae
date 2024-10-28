<template>
  <h4>Tags</h4>
  <ul class="lista-de-tags flex g1 flexwrap">
    <li
      v-for="tag in listaDeTags"
      :key="tag.id"
      class="lista-de-tags__item flex"
      :class="{
        'lista-de-tags__item--apenas-titulo': !tag.download_token
      }"
    >
      <a
        v-if="tag.download_token"
        :href="baseUrl + '/download/' + tag.download_token"
        download
        class="lista-de-tags__icone block"
      >
        <img
          :src="`${baseUrl}/download/${tag.download_token}?inline=true`"
          width="250"
        >
      </a>
      <strong
        v-else
        class="lista-de-tags__nome flex p1 center justifycenter"
      >
        {{ tag.descricao }}
      </strong>
    </li>
  </ul>
</template>
<script lang="ts" setup>
const baseUrl = `${import.meta.env.VITE_API_URL}`;

defineProps({
  listaDeTags: {
    type: Array,
    default: () => [],
  },
});
</script>
<style lang="less" scoped>
.lista-de-tags {}

.lista-de-tags__item {
  width: 6.857143rem;
  height: 6.857143rem;
}

.lista-de-tags__nome {
  border: 1px solid @c400;
  width: 100%;
  text-overflow: ellipsis;
}
</style>
