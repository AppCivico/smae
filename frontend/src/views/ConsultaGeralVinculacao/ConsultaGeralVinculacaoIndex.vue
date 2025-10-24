<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import EtapasEmBarras from '@/components/EtapasEmBarras.vue';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';

import ConsultaGeralVinculacaoRegistro from './partials/ConsultaGeralVinculacaoRegistro.vue';
import ConsultaGeralVinculacaoSelecao from './partials/ConsultaGeralVinculacaoSelecao.vue';

interface Etapa {
  id: string;
  label: string;
  concluido: boolean;
}

type TipoEtapa = 'selecao' | 'registro';

const entidadesProximasStore = useEntidadesProximasStore();
const { distribuicaoSelecionadaId } = storeToRefs(entidadesProximasStore);

const etapaAtual = computed<TipoEtapa>(() => (distribuicaoSelecionadaId.value ? 'registro' : 'selecao'));

const componenteAtual = computed(() => {
  if (etapaAtual.value === 'selecao') {
    return ConsultaGeralVinculacaoSelecao;
  }

  return ConsultaGeralVinculacaoRegistro;
});

const etapas = computed<Etapa[]>(() => [
  {
    id: 'selecao', label: 'Seleção', concluido: true,
  },
  {
    id: 'vincular', label: 'Vincular', concluido: !!distribuicaoSelecionadaId.value,
  },
]);
</script>

<template>
  <CabecalhoDePagina />

  <div class="mb2">
    <p class="t16">
      Selecione à distribuição que deseja vincular a
      <span class="w700 uc">nome da meta/obra/plano/projeto</span>.
    </p>
  </div>

  <div class="flex mb2">
    <EtapasEmBarras
      :etapas="etapas"
      class="fb50"
    />
  </div>

  <component :is="componenteAtual" />
</template>
