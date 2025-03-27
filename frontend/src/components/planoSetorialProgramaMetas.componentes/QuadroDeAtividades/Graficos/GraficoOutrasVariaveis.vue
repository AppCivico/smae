<script setup lang="ts">
import GraficoBarraEmLinha, { type ListaVariaveis } from '@/components/graficos/GraficoBarraEmLinha.vue';
import useGraficoEmBarra from './composable/useGraficoEmBarra';

const variaveisMetadado: Omit<ListaVariaveis, 'valor'> = {
  a_coletar_atrasadas: {
    legenda: 'A COLETAR ATRASADAS',
    posicao: 1,
    cor: '#292279',
  },
  a_coletar_prazo: {
    legenda: 'A COLETAR NO PRAZO',
    posicao: 2,
    cor: '#4539CA',
  },
  coletadas_a_conferir: {
    legenda: 'A CONFERIR',
    posicao: 3,
    cor: '#5345F3',
  },
  conferidas_a_liberar: {
    legenda: 'A LIBERAR',
    posicao: 3,
    cor: '#8C83F7',
  },
  liberadas: {
    legenda: 'LIBERADAS',
    posicao: 4,
    cor: '#C6C1FB',
  },
};

const { variaveisPreparadas } = useGraficoEmBarra('nao_associadas_plano_atual', variaveisMetadado);
</script>

<template>
  <aside class="grafico-outras-variaveis">
    <GraficoBarraEmLinha
      class="grafico-outras-variaveis__grafico"
      titulo="Variáveis associadas ao PdM/ Plano setorial"
      :variaveis="variaveisPreparadas"
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
