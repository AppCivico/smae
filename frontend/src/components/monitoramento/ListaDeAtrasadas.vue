<script setup>
import dateToTitle from '@/helpers/dateToTitle';
import { ref } from 'vue';
import { usePanoramaStore } from '@/stores/panorama.store.ts';

import { storeToRefs } from 'pinia';

const panoramaStore = usePanoramaStore();
const {
  listaDeAtrasadasComDetalhes,
} = storeToRefs(panoramaStore);

const idsDosItensAbertos = ref([]);
</script>
<template>
  <ul
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
        :arial-label="idsDosItensAbertos.includes(meta.id)
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
        class="block mb1 bgc50 br6 p1 flex start"
      >
        {{ meta.codigo }} - {{ meta.titulo }}
        <small v-ScrollLockDebug>
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
            <router-link
              class="bgc50 br6 p1 block"
              :to="{
                name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
                params: {
                  meta_id: meta.id
                }
              }"
            >
              {{ variável.codigo || variável.id }} - {{ variável.titulo }}
            </router-link>
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
</template>
<style lang="less" scoped>
.lista__mês {
  background-color: @cinza-claro-azulado;
}
</style>
