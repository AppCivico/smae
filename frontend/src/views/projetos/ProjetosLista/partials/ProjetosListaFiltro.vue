<script setup lang="ts">
import { computed } from 'vue';
import { format, subDays } from 'date-fns';
import { projetoFiltro as schema } from '@/consts/formSchemas';
import FiltroParaPagina, { type Formulario } from '@/components/FiltroParaPagina.vue';

const ordenador = [
  'portfolio',
  'orgao_responsavel_id',
  'status_id',
  'etapa_id',
  'data_registro',
  'revisado',
  'ordenar_por',
  'direcao',
].map((item) => ({
  id: item,
  label: schema.fields[item].spec.label,
}));

const campos = computed<Formulario>(() => [
  {
    campos: {
      portfolio: { tipo: 'select', opcoes: ['1', '2'] },
      orgao_responsavel_id: { tipo: 'select', opcoes: ['1', '2'] },
      status_id: { tipo: 'select', opcoes: ['1', '2'] },
      status_id1: { tipo: 'select', opcoes: ['1', '2'] },
    },
  },
  {
    campos: {
      etapa_id: { tipo: 'select', opcoes: ['1', '2'] },
      data_registro: { tipo: 'select', opcoes: ['1', '2'] },
      revisado: { tipo: 'select', opcoes: ['1', '2'] },
    },
  },
  {
    class: 'maxw',
    campos: {
      ordenar_por: { class: 'fb0', tipo: 'select', opcoes: ordenador },
      direcao: { class: 'fb0', tipo: 'select', opcoes: [{ id: 'asc', label: 'Crescente' }, { id: 'desc', label: 'Decrescente' }] },
      itens_por_pagina: { class: 'fb0', tipo: 'select', opcoes: [10, 25, 50, 100] },
    },
  },
]);

const valoresIniciais = computed(() => ({
  direcao: 'desc',
  itens_por_pagina: 100,
}));
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
