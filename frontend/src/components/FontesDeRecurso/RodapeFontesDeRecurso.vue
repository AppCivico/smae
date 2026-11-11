<script setup lang="ts">
import type { ResumoFontesDeRecurso } from '@/helpers/calcularResumoFontesDeRecurso';
import dinheiro from '@/helpers/dinheiro';

withDefaults(defineProps<{
  resumo: ResumoFontesDeRecurso;
  colspanDoTitulo: number;
  colspanFinal?: number;
}>(), {
  colspanFinal: 0,
});

function valor(numero: number | null): string {
  return numero === null ? '—' : `R$ ${dinheiro(numero)}`;
}

function percentual(numero: number | null): string {
  return numero === null ? '—' : `${dinheiro(numero)}%`;
}
</script>

<template>
  <tr :class="{ tvermelho: resumo.excedente }">
    <th
      scope="row"
      :colspan="colspanDoTitulo"
    >
      Sem informação
      <template v-if="resumo.excedente">
        (Recurso excede o total do cronograma)
      </template>
    </th>
    <td>
      {{ valor(resumo.semInformacao) }}
    </td>
    <td>
      {{ percentual(resumo.percentualSemInformacao) }}
    </td>
    <td
      v-if="colspanFinal"
      :colspan="colspanFinal"
    />
  </tr>
  <tr>
    <th
      scope="row"
      :colspan="colspanDoTitulo"
    >
      Total
    </th>
    <td>
      {{ valor(resumo.total) }}
    </td>
    <td>
      {{ percentual(resumo.semInformacao === null ? null : 100) }}
    </td>
    <td
      v-if="colspanFinal"
      :colspan="colspanFinal"
    />
  </tr>
</template>
