<script setup lang="ts">
import GraficoBarraEmLinha, { type ListaVariaveis } from '@/components/graficos/GraficoBarraEmLinha.vue';
import useGraficoEmBarra from './composable/useGraficoEmBarra';

const variaveisMetadado: Omit<ListaVariaveis, 'valor'> = {
  a_coletar_atrasadas: {
    legenda: 'a coletar atrasadas',
    posicao: 1,
    cor: '#04233D',
  },
  a_coletar_prazo: {
    legenda: 'a coletar no prazo',
    posicao: 2,
    cor: '#094376',
  },
  coletadas_a_conferir: {
    legenda: 'a conferir',
    posicao: 3,
    cor: '#0E60A7',
  },
  conferidas_a_liberar: {
    legenda: 'a liberar',
    posicao: 4,
    cor: '#7694BF',
  },
  liberadas: {
    legenda: 'liberadas',
    posicao: 5,
    cor: '#A5C1E7',
  },
};

const { variaveisPreparadas } = useGraficoEmBarra('total_por_situacao', variaveisMetadado);

</script>

<template>
  <aside class="grafico-outras-variaveis">
    <GraficoBarraEmLinha
      titulo="Variáveis associadas ao PdM/ Plano setorial"
      :variaveis="variaveisPreparadas"
      class="grafico-outras-variaveis__grafico"
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
