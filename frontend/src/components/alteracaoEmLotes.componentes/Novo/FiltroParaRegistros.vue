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

const camposFiltro = computed<Formulario>(() => [
  {
    campos: {
      portfolio_id: { tipo: 'select', opcoes: [] },
      orgao_origem_id: { tipo: 'select', opcoes: [] },
      subprefeitura_id: { tipo: 'select', opcoes: [] },
      status_obra: { tipo: 'select', opcoes: [] },
    },
  },
  {
    campos: {
      grupo_tematico_id: { tipo: 'select', opcoes: [] },
      tipo_obra_id: { tipo: 'select', opcoes: [] },
      equipamento_id: { tipo: 'select', opcoes: [] },
      processo_sei: { tipo: 'text' },
    },
  },
  {
    class: 'fb50',
    campos: {
      palavra_chave: { tipo: 'search' },
    },
  },
]);

const camposOrdenacao = computed<Formulario>(() => [
  {
    campos: {
      ordenar_por: { tipo: 'select', opcoes: [] },
      direcao: { tipo: 'select', opcoes: ['asc', 'desc'] },
      ipp: { tipo: 'select', opcoes: [10, 30, 50, 100] },
    },
  },
]);

const valoresIniciais = computed(() => ({
  ipp: 30,
}));

</script>

<template>
  <section>
    <FiltroParaPagina
      :formulario="camposFiltro"
      :schema="alteracaoEmLoteNovoFiltro"
      :valores-iniciais="valoresIniciais"
    />

    <aside class="flex g3 center mt3">
      <hr class="fb50">

      <FiltroParaPagina
        class="fg999"
        :formulario="camposOrdenacao"
        :schema="alteracaoEmLoteNovoOrdenacao"
        :valores-iniciais="valoresIniciais"
        auto-submit
      />
    </aside>
  </section>
</template>
