<script lang="ts" setup>
import type { MetaIniAtvTag } from '@back/meta/entities/meta.entity.ts';

type Tag = Pick<MetaIniAtvTag, 'id' | 'descricao' | 'download_token'> & {
  // quando presente, é exibida no lugar do ícone original
  download_token_miniatura?: string | null;
};

const baseUrl = `${import.meta.env.VITE_API_URL}`;

defineProps<{
  listaDeTags: Tag[];
}>();
</script>
<template>
  <ul class="lista-de-tags flex g1 flexwrap">
    <li
      v-for="tag in listaDeTags"
      :key="tag.id"
      class="lista-de-tags__item flex center"
      :class="{
        'lista-de-tags__item--apenas-titulo': !tag.download_token,
      }"
    >
      <a
        v-if="tag.download_token"
        :href="baseUrl + '/download/' + tag.download_token"
        download
        class="lista-de-tags__link block"
        :title="tag.descricao"
      >
        <img
          class="lista-de-tags__icone"
          :src="`${baseUrl}/download/${
            tag.download_token_miniatura || tag.download_token
          }?inline=true`"
          :alt="tag.descricao"
          width="250"
        >
      </a>
      <strong
        v-else
        class="lista-de-tags__nome"
      >
        {{ tag.descricao }}
      </strong>
    </li>
  </ul>
</template>
<style lang="less" scoped>
.lista-de-tags {}

.lista-de-tags__item {
  width: 6.857143rem;
  height: 6.857143rem;
}

.lista-de-tags__icone {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: 50% 50%;
}

.lista-de-tags__item--apenas-titulo {
  padding: 1rem;
  border: 1px solid @c400;
  min-width: min-content;
}

.lista-de-tags__nome {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
