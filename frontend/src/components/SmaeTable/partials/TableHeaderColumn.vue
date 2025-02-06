<template>
  <th :class="coluna.classe">
    <slot
      :name="`cabecalho:${coluna.chave}`"
      :coluna="coluna"
    >
      {{ coluna.label }}
    </slot>
  </th>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

export type Coluna = { chave: string, label: string, classe?: any };

type Props = {
  coluna: Coluna
};

const props = defineProps<Props>();
</script>
