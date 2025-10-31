<script setup>
import dateToTitle from '@/helpers/dateToTitle';
import FeedbackEmptyList from '@/components/FeedbackEmptyList.vue';
import { ref } from 'vue';
import { usePanoramaStore } from '@/stores/panorama.store.ts';

import { storeToRefs } from 'pinia';

const panoramaStore = usePanoramaStore();
const {
  listaDeAtrasadasComDetalhes,
  chamadasPendentes,
} = storeToRefs(panoramaStore);

const idsDosItensAbertos = ref([]);
</script>
<template>
  <Transition name="fade">
    <LoadingComponent v-if="chamadasPendentes.lista" />

    <FeedbackEmptyList
      v-else-if="!listaDeAtrasadasComDetalhes.length"
      título="Bom trabalho!"
      tipo="positivo"
      mensagem="Você não possui atrasos!"
    />

    <ul
      v-else
      class="lista uc w700"
    >
      <li
        v-for="meta in listaDeAtrasadasComDetalhes"
        :key="meta.id"
        class="lista_item"
      >
        <input
          :id="`atrasada--${meta.id}`"
          v-model="idsDosItensAbertos"
          type="checkbox"
          :value="meta.id"
          :aria-label="idsDosItensAbertos.includes(meta.id)
            ? `fechar variáveis da meta ${meta.codigo}`
            : `abrir variáveis da meta ${meta.codigo}`"
          :title="idsDosItensAbertos.includes(meta.id)
            ? `fechar variáveis da meta ${meta.codigo}`
            : `abrir variáveis da meta ${meta.codigo}`"
          :disabled="!meta.atrasos_variavel.length"
          class="accordion-opener"
        >
        <label
          :for="`atrasada--${meta.id}`"
          class="block mb1 bgc50 br6 p1 flex g1 start"
        >
          {{ meta.codigo }} - {{ meta.titulo }}
          <small
            v-if="meta.atualizado_em"
            v-ScrollLockDebug
          >
            (<code>meta.atualizado_em:&nbsp;{{ meta.atualizado_em }}</code>)
          </small>
        </label>
        <Transition
          v-if="meta.atrasos_variavel.length"
          name="fade"
        >
          <ul
            v-if="idsDosItensAbertos.includes(meta.id)"
            class="pl2"
          >
            <li
              v-for="variável in meta.atrasos_variavel"
              :key="variável.id"
              class="mb1"
            >
              <span class="bgc50 br6 p1 block">
                {{ variável.codigo || variável.id }} - {{ variável.titulo }}
              </span>
              <ul
                v-if="variável?.meses?.length"
                class="flex g025 mt05 mb1 flexwrap justifyleft"
              >
                <li
                  v-for="mês in variável.meses"
                  :key="mês"
                  class="lista__mês w400 lc br999 pl05 pr05 ib mr05 mt025 mb025 t11"
                >
                  {{ dateToTitle(mês) }}
                </li>
              </ul>
            </li>
          </ul>
        </Transition>
      </li>
    </ul>
  </Transition>
</template>
<style lang="less" scoped>
.lista__mês {
  background-color: @cinza-claro-azulado;
}
</style>
