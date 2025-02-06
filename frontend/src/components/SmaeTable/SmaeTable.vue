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
          >
            <template
              v-for="nomeSlot in slotsDaCelula"
              :key="nomeSlot"
              #[nomeSlot]="slotProps"
            >
              <slot
                :name="nomeSlot"
                v-bind="slotProps"
              />
            </template>
          </TableColumn>
        </template>
      </tr>
    </tbody>

    <tfoot v-if="$slots.footer">
      <slot name="footer" />
    </tfoot>
  </table>
</template>

<script lang="ts" setup>
import { computed, useSlots } from 'vue';
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

const slots = useSlots();

const listaSlots = computed<string[]>(() => Object.keys(slots));
const slotsDaCelula = computed<string[]>(() => {
  const slotsCelula = listaSlots.value.filter((slot) => slot.includes('celula:'));

  return slotsCelula;
});
</script>
