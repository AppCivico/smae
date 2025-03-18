<script setup lang="ts">
import CicloListaItem, { type CicloVigenteItemParams } from './partials/CicloListaItem.vue';
import CicloVigenteFiltro from './partials/CicloVigenteFiltro.vue';
import ListaLegendas from './partials/ListaLegendas.vue';

const items: CicloVigenteItemParams[] = [
  {
    id: 11,
    metaId: 117,
    titulo: '001 - Atender 1.900.000 pessoas em programas de transferência de renda e/ou apoio nutricional',
    variaveis: [
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
    ],
    situacoes: [
      { item: 'analise_risco', status: 'atualizado' },
      { item: 'cronograma', status: 'atualizado' },
      { item: 'fechamento', status: 'pendente' },
      { item: 'qualificacao', status: 'atualizado' },
    ],
  },
  {
    id: 11,
    metaId: 117,
    titulo: '002 - Implantar o prontuário eletrônico em 100% das UBS do município',
    variaveis: [
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
    ],
    situacoes: [
      { item: 'analise_risco', status: 'pendente' },
      { item: 'cronograma', status: 'pendente' },
      { item: 'fechamento', status: 'pendente' },
      { item: 'qualificacao', status: 'pendente' },
      { item: 'orcamento', status: 'pendente' },
    ],
  },
];
</script>

<template>
  <header>
    <TituloDePagina>
      Metas
    </TituloDePagina>
  </header>

  <CicloVigenteFiltro />

  <ul class="ciclo-vigente-lista mt2">
    <CicloListaItem
      v-for="(item, itemIndex) in items"
      :id="item.id"
      :key="itemIndex"
      :meta-id="item.metaId"
      :titulo="item.titulo"
      :variaveis="item.variaveis"
      :situacoes="item.situacoes"
    />
  </ul>

  <section style="display: flex; margin-top: 20px; justify-content: flex-end;">
    <ListaLegendas />
  </section>
</template>

<style lang="less" scoped>
.ciclo-vigente-lista {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
</style>
