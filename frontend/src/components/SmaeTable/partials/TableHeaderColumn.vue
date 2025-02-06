<template>
  <th>
    {{ coluna.label }}
  </th>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

export type Coluna = { key: string, label: string };

// type ParametrosDaColuna = {
//   linha: ColunaValor
//   caminho: string
// };

type Props = {
  coluna: Coluna
};

const props = defineProps<Props>();
</script>
