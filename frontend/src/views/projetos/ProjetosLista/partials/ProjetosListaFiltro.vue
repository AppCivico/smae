<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import FiltroParaPagina, { type Formulario } from '@/components/FiltroParaPagina.vue';
import { projetoFiltro as schema } from '@/consts/formSchemas';
import projectStatuses from '@/consts/projectStatuses';
import { useOrgansStore, usePortfolioStore } from '@/stores';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';

const mapaStatus = Object.keys(projectStatuses)
  .map((item) => ({
    id: item,
    label: projectStatuses[item]?.nome
    || item,
  }));

const organsStore = useOrgansStore();
const portfolioStore = usePortfolioStore();
const etapasProjetosStore = useEtapasProjetosStore();

const formularioSujo = ref<boolean>(false);

const organResponsibles = computed(() => {
  if (!Array.isArray(organsStore.organResponsibles)) {
    return [];
  }

  return organsStore.organResponsibles;
});
const portfolioLista = computed(() => portfolioStore.lista || []);
const etapasLista = computed(() => etapasProjetosStore.lista || []);
const ordenador = computed(() => {
  const ordemIdMap = {
    portfolio_id: 'portfolio_titulo',
    orgao_responsavel_id: 'orgao_origem_nome',
    projeto_etapa_id: 'projeto_etapa',
  } as const;

  const itemsParaFiltro = [
    'nome',
    'portfolio_id',
    'orgao_responsavel_id',
    'status',
    'projeto_etapa_id',
    'previsao_custo',
    'previsao_termino',
  ] as const;

  return itemsParaFiltro.map((item) => {
    const id = ordemIdMap[item] || item;

    if (!schema.fields[item]) {
      console.error(`Item de ordenação ${item} não encontrado`);

      return {
        id,
        label: item,
      };
    }

    return {
      id,
      label: schema.fields[item].spec.label,
    };
  });
});

const opcoesFormulario = computed(() => ({
  orgaos: organResponsibles.value.map((item) => ({
    id: item.id,
    label: `${item.sigla} - ${item.descricao}`,
  })),
  portfolio: portfolioLista.value.map((item) => ({
    id: item.id,
    label: item.titulo,
  })),
  etapas: etapasLista.value.map((item) => ({
    id: item.id,
    label: item.descricao,
  })),
  revisado: [
    { id: true, label: 'Revisado' },
    { id: false, label: 'Não revisado' },
  ],
}));

const campos = computed<Formulario>(() => [
  {
    campos: {
      portfolio_id: { tipo: 'select', opcoes: opcoesFormulario.value.portfolio },
      orgao_responsavel_id: { tipo: 'select', opcoes: opcoesFormulario.value.orgaos },
      status: {
        tipo: 'select',
        opcoes: mapaStatus,
      },
      projeto_etapa_id: { tipo: 'select', opcoes: opcoesFormulario.value.etapas },
      registrado_em: { tipo: 'date' },
      revisado: { tipo: 'select', opcoes: opcoesFormulario.value.revisado },
    },
  },
  {
    campos: {
      palavra_chave: { tipo: 'search' },
    },
  },
  {
    class: 'maxw',
    campos: {
      ordem_coluna: { class: 'fb0', tipo: 'select', opcoes: ordenador.value },
      ordem_direcao: { class: 'fb0', tipo: 'select', opcoes: [{ id: 'asc', label: 'Crescente' }, { id: 'desc', label: 'Decrescente' }] },
      ipp: { class: 'fb0', tipo: 'select', opcoes: [10, 25, 50, 100] },
    },
  },
]);

const valoresIniciais = computed(() => ({
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
      v-model:formulario-sujo="formularioSujo"
      :formulario="campos"
      :schema="schema"
      :valores-iniciais="valoresIniciais"
    />

    <slot :formulario-sujo="formularioSujo" />
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
