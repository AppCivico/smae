<template>
  <table class="smae-table tablemain">
    <col
      v-for="coluna in colunas"
      :key="`colunas--${coluna.chave}`"
    >

    <thead>
      <tr>
        <TableHeaderCell
          v-for="coluna in colunas"
          :key="`header--${coluna.chave}`"
          v-bind="coluna"
        >
          <template
            v-for="nomeSlot in slotsDoCabecalho"
            :key="nomeSlot"
            #[nomeSlot]="slotProps"
          >
            <slot
              :name="nomeSlot"
              v-bind="slotProps"
            />
          </template>
        </TableHeaderCell>
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
          <TableCell
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
          </TableCell>
        </template>
      </tr>
    </tbody>

    <tfoot v-if="$slots.footer || replicarCabecalho">
      <slot
        v-if="!replicarCabecalho"
        name="footer"
      />

      <tr v-else>
        <TableHeaderCell
          v-for="coluna in colunas"
          :key="`header--${coluna.chave}`"
          v-bind="coluna"
        >
          <template
            v-for="nomeSlot in slotsDoCabecalho"
            :key="nomeSlot"
            #[nomeSlot]="slotProps"
          >
            <slot
              :name="nomeSlot"
              v-bind="slotProps"
            />
          </template>
        </TableHeaderCell>
      </tr>
    </tfoot>
  </table>
</template>

<script lang="ts" setup>
import { computed, useSlots } from 'vue';
import { RouteLocationRaw } from 'vue-router';

import TableCell, { type Linha } from '@/components/SmaeTable/partials/TableCell.vue';
import TableHeaderCell, { type Coluna } from '@/components/SmaeTable/partials/TableHeaderCell.vue';

type Props = {
  colunas: Coluna[],
  dados: Linha[]
  rotaEditar?: string | RouteLocationRaw
  esconderDeletar?: boolean
  replicarCabecalho?: boolean
};
defineProps<Props>();

const slots = useSlots();

const listaSlots = computed<string[]>(() => Object.keys(slots));
const slotsDaCelula = computed<string[]>(() => {
  const slotsCelula = listaSlots.value.filter((slot) => slot.includes('celula:'));

  return slotsCelula;
});

const slotsDoCabecalho = computed<string[]>(() => {
  const slotsCelula = listaSlots.value.filter((slot) => slot.includes('cabecalho:'));

  return slotsCelula;
});
</script>
