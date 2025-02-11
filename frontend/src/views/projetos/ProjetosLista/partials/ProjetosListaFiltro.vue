<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import projectStatuses from '@/consts/projectStatuses';
import { projetoFiltro as schema } from '@/consts/formSchemas';
import FiltroParaPagina, { type Formulario } from '@/components/FiltroParaPagina.vue';
import { useOrgansStore, usePortfolioStore } from '@/stores';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';

const ordenador = [
  'portfolio',
  'orgao_responsavel_id',
  'status',
  'etapa_id',
  'data_registro',
  'revisado',
].map((item) => ({
  id: item,
  label: schema.fields[item].spec.label,
}));

const mapaStatus = [
  'Registrado',
  'Selecionado',
  'EmPlanejamento',
  'Planejado',
  'Validado',
  'EmAcompanhamento',
  'Suspenso',
  'Fechado',
  'MDO_NaoIniciada',
  'MDO_EmAndamento',
  'MDO_Concluida',
  'MDO_Paralisada',
].map((item) => ({
  id: item,
  label: projectStatuses[item] || item,
}));

const organsStore = useOrgansStore();
const portfolioStore = usePortfolioStore();
const etapasProjetosStore = useEtapasProjetosStore();

const { organResponsibles } = storeToRefs(organsStore);
const { lista: portfolioLista } = storeToRefs(portfolioStore);
const { lista: etapasLista } = storeToRefs(etapasProjetosStore);

const opcoesFormulario = computed(() => ({
  orgaos: organResponsibles.value.map((item) => ({
    id: item.id,
    label: item.descricao,
  })),
  portfolio: portfolioLista.value.map((item) => ({
    id: item.id,
    label: item.titulo,
  })),
  etapas: etapasLista.value.map((item) => ({
    id: item.id,
    label: item.descricao,
  })),
}));

const campos = computed<Formulario>(() => [
  {
    campos: {
      portfolio: { tipo: 'select', opcoes: opcoesFormulario.value.portfolio },
      orgao_responsavel_id: { tipo: 'select', opcoes: opcoesFormulario.value.orgaos },
      status: {
        tipo: 'select',
        opcoes: mapaStatus,
      },
      etapa_id: { tipo: 'select', opcoes: opcoesFormulario.value.etapas },
      data_registro: { tipo: 'date' },
      revisado: { tipo: 'checkbox' },
    },
  },
  {
    class: 'maxw',
    campos: {
      ordem_coluna: { class: 'fb0', tipo: 'select', opcoes: ordenador },
      ordem_direcao: { class: 'fb0', tipo: 'select', opcoes: [{ id: 'asc', label: 'Crescente' }, { id: 'desc', label: 'Decrescente' }] },
      ipp: { class: 'fb0', tipo: 'select', opcoes: [10, 25, 50, 100] },
    },
  },
]);

const valoresIniciais = computed(() => ({
  ordem_direcao: 'desc',
  ipp: 100,
}));

onMounted(() => {
  organsStore.getAllOrganResponsibles();
  portfolioStore.buscarTudo();
  etapasProjetosStore.buscarTudo();
});
</script>

<template>
  <section class="comunicados-gerais-filtro">
    <FiltroParaPagina
      :formulario="campos"
      :schema="schema"
      :valores-iniciais="valoresIniciais"
    />
  </section>
</template>

<style lang="less" scoped>
.comunicados-gerais-filtro {
  :deep {
    .maxw {
        max-width: 60%;
      }
  }
}
</style>
