<script setup lang="ts">
import GraficoBarraEmLinha, { type ListaVariaveis } from '@/components/graficos/GraficoBarraEmLinha.vue';

const variaveis: ListaVariaveis = {
  coletar_atrasadas: {
    legenda: 'A COLETAR ATRASADAS',
    valor: 20,
    posicao: 1,
    cor: '#04233D',
  },
  coletar_no_prazo: {
    legenda: 'A COLETAR NO PRAZO',
    valor: 53,
    posicao: 2,
    cor: '#094376',
  },
  conferir: {
    legenda: 'A CONFERIR',
    valor: 62,
    posicao: 3,
    cor: '#0E60A7',
  },
  liberar: {
    legenda: 'A LIBERAR',
    valor: 70,
    posicao: 4,
    cor: '#7694BF',
  },
  liberadas: {
    legenda: 'LIBERADAS',
    valor: 90,
    posicao: 5,
    cor: '#A5C1E7',
  },
};

</script>

<template>
  <aside class="grafico-outras-variaveis">
    <GraficoBarraEmLinha
      class="grafico-outras-variaveis"
      titulo="Outras variáveis do órgão (não associadas a PS/PdM ativos)"
      :variaveis="variaveis"
      style="height: 100%"
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
