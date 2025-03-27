<script setup lang="ts">
import GraficoBarraEmLinha, { type ListaVariaveis } from '@/components/graficos/GraficoBarraEmLinha.vue';

const variaveis: ListaVariaveis = {
  coletar_atrasadas: {
    legenda: 'A COLETAR ATRASADAS',
    valor: 20,
    posicao: 1,
    cor: '#292279',
  },
  coletar_no_prazo: {
    legenda: 'A COLETAR NO PRAZO',
    valor: 53,
    posicao: 2,
    cor: '#4539CA',
  },
  conferir: {
    legenda: 'A CONFERIR',
    valor: 62,
    posicao: 3,
    cor: '#5345F3',
  },
  liberar: {
    legenda: 'A LIBERAR',
    valor: 70,
    posicao: 4,
    cor: '#8C83F7',
  },
  liberadas: {
    legenda: 'LIBERADAS',
    valor: 90,
    posicao: 5,
    cor: '#C6C1FB',
  },
};

</script>

<template>
  <aside class="grafico-outras-variaveis">
    <GraficoBarraEmLinha
      class="grafico-outras-variaveis__grafico"
      titulo="Variáveis associadas ao PdM/ Plano setorial"
      :variaveis="variaveis"
    />
  </aside>
</template>

<style lang="less" scoped>
.grafico-outras-variaveis__grafico {
  height: 100%;

  :deep(.card-envelope-conteudo) {
    height: 100%;
  }
}
</style>
