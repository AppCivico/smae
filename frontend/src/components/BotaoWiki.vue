<script lang="ts" setup>
import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useWikiStore } from '@/stores/wiki.store';
import useRotaAtual from '@/composables/useRotaAtual';

const wikiStore = useWikiStore();
const { rotaAtual } = useRotaAtual();

const { wikiAtual } = storeToRefs(wikiStore);

watch(rotaAtual, () => {
  wikiStore.selecionarPaginaAtual(rotaAtual.value?.path);
}, { immediate: true });
</script>

<template>
  <a
    v-if="wikiAtual"
    class="botao-wiki"
    target="_blank"
    :href="wikiAtual"
  >
    <svg>
      <use xlink:href="#wiki_?" />
    </svg>
  </a>
</template>

<style lang="less" scoped>
.botao-wiki {
  position: fixed;
  right: 0;
  top: 0;
  z-index: 1005;
  color: #fff;
  background-color: #20A0B7;
  border: none;
  border-radius: 0 0 0 999px;
  padding: 5px 3px 25px;
  font-size: 32px;
  transition: padding 0.2s ease-in;

  &:hover {
    padding: 15px 25px 40px 40px;
  }
}

.botao-wiki svg {
  width: 15px;
  height: 20px;
}
</style>
