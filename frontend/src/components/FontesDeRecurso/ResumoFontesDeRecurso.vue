<script setup lang="ts">
import { computed } from 'vue';

import SmaeDescriptionList from '@/components/SmaeDescriptionList.vue';
import type { ResumoFontesDeRecurso } from '@/helpers/calcularResumoFontesDeRecurso';
import dinheiro from '@/helpers/dinheiro';

const props = defineProps<{
  custoTotalPlanejado: number | null | undefined;
  resumo: ResumoFontesDeRecurso;
}>();

const atributosDoItem = { style: { flex: '0 1 auto' } };

const lista = computed(() => {
  const itens = [{
    chave: 'custoTotalPlanejado',
    titulo: 'Custo total planejado',
    valor: props.custoTotalPlanejado,
    atributosDoItem,
  }];

  if (props.resumo.semInformacao !== null) {
    itens.push({
      chave: 'semInformacao',
      titulo: 'Valores Sem informação',
      valor: props.resumo.semInformacao,
      atributosDoItem,
    });
  }

  return itens;
});
</script>

<template>
  <SmaeDescriptionList
    :lista="lista"
    class="flex g2 mb2"
  >
    <template #termo="{ item }">
      <span class="t14 tc300">{{ item.titulo }}</span>
    </template>

    <template #descricao--custoTotalPlanejado>
      <span class="t14 w700">
        <template v-if="resumo.semInformacao !== null">
          R$ {{ dinheiro(custoTotalPlanejado) }}
        </template>
        <template v-else>
          Cronograma sem custo planejado
        </template>
      </span>
    </template>

    <template #descricao--semInformacao>
      <span
        class="t14 w700"
        :class="{ tvermelho: resumo.excedente }"
        :role="resumo.excedente ? 'alert' : undefined"
      >
        R$ {{ dinheiro(resumo.semInformacao) }}
        <template v-if="resumo.excedente">
          (Recurso excede o total do cronograma)
        </template>
      </span>
    </template>
  </SmaeDescriptionList>
</template>
