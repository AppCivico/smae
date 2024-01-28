<script setup>
import dateToTitle from '@/helpers/dateToTitle';
import { ref } from 'vue';

const idDoItemAberto = ref(0);

defineProps({
  lista: {
    type: Array,
    default: () => [],
  },
});
</script>
<template>
  <ul
    class="lista uc w700"
  >
    <li
      v-for="meta in lista"
      :key="meta.id"
      class="lista_item"
    >
      <span class="block mb1 bgc50 br6 p1 flex start">
        <button
          class="like-a__text addlink ib f0"
          :arial-label="idDoItemAberto === meta.id
            ? `fechar variáveis da meta ${meta.codigo}`
            : `abrir variáveis da meta ${meta.codigo}`"
          :title="idDoItemAberto === meta.id
            ? `fechar variáveis da meta ${meta.codigo}`
            : `abrir variáveis da meta ${meta.codigo}`"
          type="button"
          :disabled="!meta.atrasos_variavel.length"
          @click="idDoItemAberto = idDoItemAberto !== meta.id
            ? meta.id
            : 0"
        >
          <svg
            width="13"
            height="13"
          ><use
            :xlink:href="idDoItemAberto === meta.id ? '#i_down' : '#i_right'"
          /></svg>
        </button>
        {{ meta.codigo }} - {{ meta.titulo }}
      </span>
      <Transition
        v-if="meta.atrasos_variavel.length"
        name="fade"
      >
        <ul
          v-if="idDoItemAberto === meta.id"
          class="pl2"
        >
          <li
            v-for="variável in meta.atrasos_variavel"
            :key="variável.id"
            class="mb1"
          >
            <span
              class="bgc50 br6 p1 block"
            >
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
</template>
<style lang="less" scoped>
.lista__mês {
  background-color: @cinza-claro-azulado;
}
</style>
