<script setup lang="ts">
import { computed } from 'vue';
import FiltroParaPagina, { Formulario } from '@/components/FiltroParaPagina.vue';

import { alteracaoEmLoteNovoFiltro, alteracaoEmLoteNovoOrdenacao } from '@/consts/formSchemas';

// const organsStore = useOrgansStore();
// const portfolioStore = usePortfolioStore();
// const etapasProjetosStore = useEtapasProjetosStore();

// const organResponsibles = computed(() => {
//   if (!Array.isArray(organsStore.organResponsibles)) {
//     return [];
//   }

//   return organsStore.organResponsibles;
// });
// const portfolioLista = computed(() => portfolioStore.lista || []);
// const etapasLista = computed(() => etapasProjetosStore.lista || []);
// const ordenador = computed(() => {
//   const ordemIdMap = {
//     portfolio_id: 'portfolio_titulo',
//     orgao_responsavel_id: 'orgao_origem_nome',
//     projeto_etapa_id: 'projeto_etapa',
//   } as const;

//   const itemsParaFiltro = [
//     'nome',
//     'portfolio_id',
//     'orgao_responsavel_id',
//     'status',
//     'projeto_etapa_id',
//     'previsao_custo',
//     'previsao_termino',
//   ] as const;

//   return itemsParaFiltro.map((item) => {
//     const id = ordemIdMap[item] || item;

//     if (!schema.fields[item]) {
//       console.error(`Item de ordenação ${item} não encontrado`);

//       return {
//         id,
//         label: item,
//       };
//     }

//     return {
//       id,
//       label: schema.fields[item].spec.label,
//     };
//   });
// });

// const opcoesFormulario = computed(() => ({
//   orgaos: organResponsibles.value.map((item) => ({
//     id: item.id,
//     label: `${item.sigla} - ${item.descricao}`,
//   })),
//   portfolio: portfolioLista.value.map((item) => ({
//     id: item.id,
//     label: item.titulo,
//   })),
//   etapas: etapasLista.value.map((item) => ({
//     id: item.id,
//     label: item.descricao,
//   })),
//   revisado: [
//     { id: true, label: 'Revisado' },
//     { id: false, label: 'Não revisado' },
//   ],
// }));

const campos = computed<Formulario>(() => [
  {
    campos: {
      portfolio_id: { tipo: 'select', opcoes: [] },
      orgao_responsavel_id: { tipo: 'select', opcoes: [] },
      status: { tipo: 'select', opcoes: [] },
      projeto_etapa_id: { tipo: 'select', opcoes: [] },
      registrado_em: { tipo: 'date' },
      revisado: { tipo: 'select', opcoes: [] },
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
      ordem_coluna: { class: 'fb0', tipo: 'select', opcoes: [] },
      ordem_direcao: { class: 'fb0', tipo: 'select', opcoes: [{ id: 'asc', label: 'Crescente' }, { id: 'desc', label: 'Decrescente' }] },
      ipp: { class: 'fb0', tipo: 'select', opcoes: [] },
    },
  },
]);

const valoresIniciais = computed(() => ({
  ipp: 100,
}));

</script>

<template>
  <FiltroParaPagina
    :formulario="campos"
    :schema="alteracaoEmLoteNovoFiltro"
    :valores-iniciais="valoresIniciais"
  />
</template>
