<script setup lang="ts">
import { computed } from 'vue';

import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import type { Colunas } from '@/components/SmaeTable/tipagem';
import type { ResumoFontesDeRecurso } from '@/helpers/calcularResumoFontesDeRecurso';
import dinheiro from '@/helpers/dinheiro';

const props = defineProps<{
  resumo: ResumoFontesDeRecurso;
}>();

function valor(numero: unknown): string {
  return numero === null || numero === undefined ? '—' : `R$ ${dinheiro(numero)}`;
}

function percentual(numero: unknown): string {
  return numero === null || numero === undefined ? '—' : `${dinheiro(numero)}%`;
}

const colunas: Colunas = [
  { chave: 'descricao', label: '', ehCabecalho: true },
  {
    chave: 'valor',
    label: 'Valor',
    formatador: valor,
    atributosDaColuna: { class: 'col--number' },
    atributosDaCelula: { class: 'cell--number' },
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
  },
  {
    chave: 'percentual',
    label: 'Percentual',
    formatador: percentual,
    atributosDaColuna: { class: 'col--percentagem' },
    atributosDaCelula: { class: 'cell--number' },
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
  },
];

const linhas = computed(() => [
  {
    descricao: 'Fontes informadas',
    valor: props.resumo.totalInformado,
    percentual: props.resumo.percentualInformado,
    excedente: false,
  },
  {
    descricao: 'Sem informação',
    valor: props.resumo.semInformacao,
    percentual: props.resumo.percentualSemInformacao,
    excedente: props.resumo.excedente,
  },
]);
</script>

<template>
  <SmaeTable
    class="mb2"
    :colunas="colunas"
    :dados="linhas"
    :personalizar-linhas="{ parametro: 'excedente', alvo: true, classe: 'tvermelho' }"
  >
    <template #rodape>
      <tr>
        <th scope="row">
          Total
        </th>
        <td class="cell--number">
          {{ valor(resumo.total) }}
        </td>
        <td class="cell--number">
          {{ percentual(resumo.semInformacao === null ? null : 100) }}
        </td>
      </tr>
    </template>
  </SmaeTable>
</template>
