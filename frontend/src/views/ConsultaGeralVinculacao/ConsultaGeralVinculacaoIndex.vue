<script setup lang="ts">
import { useRoute } from 'vue-router';
import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import EtapasEmBarras from '@/components/EtapasEmBarras.vue';
import ConsultaGeralVinculacaoSelecao from './partials/ConsultaGeralVinculacaoSelecao.vue';

interface Etapa {
  id: string;
  label: string;
  concluido: boolean;
  atual: boolean;
}

const route = useRoute();
const { vinculacaoId } = route.params;

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

  <EtapasEmBarras
    :etapas="etapas"
    class="mb2"
  />

  <ConsultaGeralVinculacaoSelecao />
</template>
