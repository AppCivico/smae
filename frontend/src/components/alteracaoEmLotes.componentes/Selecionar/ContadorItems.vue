<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useObrasStore } from '@/stores/obras.store';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';

const route = useRoute();

const obrasStore = useObrasStore();
const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote as string);

const { idsSelecionados } = storeToRefs(edicoesEmLoteStore);
const { lista: listaDeObras, paginacao } = storeToRefs(obrasStore);
</script>

<template>
  <article>
    <p class="mb05">
      Exibindo <strong>{{ listaDeObras.length }}</strong>
      de
      <strong>{{ paginacao.totalRegistros }} </strong>
      resultados
    </p>

    <p class="mb0">
      <strong>{{ idsSelecionados.length }}</strong>
      obras selecionadas.
    </p>
  </article>
</template>
