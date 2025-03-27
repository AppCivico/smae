<script setup lang="ts">
import GraficoBarraEmLinha, { type ListaVariaveis } from '@/components/graficos/GraficoBarraEmLinha.vue';
import useGraficoEmBarra from './composable/useGraficoEmBarra';

const variaveisMetadado: Omit<ListaVariaveis, 'valor'> = {
  a_coletar_atrasadas: {
    legenda: 'A COLETAR ATRASADAS',
    posicao: 1,
    cor: '#04233D',
  },
  a_coletar_prazo: {
    legenda: 'A COLETAR NO PRAZO',
    posicao: 2,
    cor: '#094376',
  },
  coletadas_a_conferir: {
    legenda: 'A CONFERIR',
    posicao: 3,
    cor: '#0E60A7',
  },
  conferidas_a_liberar: {
    legenda: 'A LIBERAR',
    posicao: 4,
    cor: '#7694BF',
  },
  liberadas: {
    legenda: 'LIBERADAS',
    posicao: 5,
    cor: '#A5C1E7',
  },
};

const { variaveisPreparadas } = useGraficoEmBarra('associadas_plano_atual', variaveisMetadado);

</script>

<template>
  <aside class="grafico-outras-variaveis__grafico">
    <GraficoBarraEmLinha
      class="grafico-outras-variaveis"
      titulo="Outras variáveis do órgão (não associadas a PS/PdM ativos)"
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
