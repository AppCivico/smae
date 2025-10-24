<script setup lang="ts">
import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import EtapasEmBarras from '@/components/EtapasEmBarras.vue';

import ConsultaGeralVinculacaoRegistro from './partials/ConsultaGeralVinculacaoRegistro.vue';
import ConsultaGeralVinculacaoSelecao from './partials/ConsultaGeralVinculacaoSelecao.vue';

interface Etapa {
  id: string;
  label: string;
  concluido: boolean;
  atual: boolean;
}

const etapas: Etapa[] = [
  {
    id: 'selecao', label: 'Seleção', concluido: false, atual: true,
  },
  {
    id: 'vincular', label: 'Vincular', concluido: false, atual: false,
  },
];
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

  <!-- <ConsultaGeralVinculacaoSelecao /> -->
  <ConsultaGeralVinculacaoRegistro />
</template>
