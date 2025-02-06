<template>
  <table class="tablemain">
    <col
      v-for="coluna in colunas"
      :key="`colunas--${coluna.chave}`"
    >

    <thead>
      <tr>
        <TableHeaderColumn
          v-for="coluna in colunas"
          :key="`header--${coluna.chave}`"
          :coluna="coluna"
        />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(linha, linhaIndex) in dados"
        :key="`coluna--${linhaIndex}`"
      >
        <template
          v-for="coluna in colunas"
          :key="`linha--${linhaIndex}-${coluna.key}`"
        >
          <TableColumn
            :linha="linha"
            :caminho="coluna.chave"
          />
        </template>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import { RouteLocationRaw } from 'vue-router';

import TableColumn, { type Linha } from '@/components/SmaeTable/partials/TableColumn.vue';
import TableHeaderColumn, { type Coluna } from '@/components/SmaeTable/partials/TableHeaderColumn.vue';

type Props = {
  colunas: Coluna[],
  dados: Linha[]
  rotaEditar?: string | RouteLocationRaw
  esconderDeletar?: boolean
};
defineProps<Props>();
</script>
