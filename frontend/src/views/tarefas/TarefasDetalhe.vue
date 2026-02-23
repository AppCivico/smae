<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import LoadingComponent from '@/components/LoadingComponent.vue';
import SmaeDescriptionList from '@/components/SmaeDescriptionList.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import dependencyTypes from '@/consts/dependencyTypes';
import dateToDate from '@/helpers/dateToDate';
import dinheiro from '@/helpers/dinheiro';
import { useTarefasStore } from '@/stores/tarefas.store.ts';

const tarefasStore = useTarefasStore();

const {
  chamadasPendentes,
  emFoco,
  erro,
  tarefasPorId,
} = storeToRefs(tarefasStore);

tarefasStore.buscarTudo();

const dadosBasicos = computed(() => [
  { chave: 'tarefa', titulo: 'Tarefa', valor: emFoco.value?.tarefa },
  { chave: 'eh_marco', titulo: 'Marco do projeto?', valor: emFoco.value?.eh_marco ? 'Sim' : 'Não' },
  { chave: 'tarefa_pai', titulo: 'Tarefa-mãe', valor: tarefasPorId.value[emFoco.value?.tarefa_pai_id]?.tarefa },
  { chave: 'numero', titulo: 'Ordem', valor: emFoco.value?.numero },
  { chave: 'orgao', titulo: 'Órgão responsável', valor: emFoco.value?.orgao?.descricao },
  { chave: 'responsavel', titulo: 'Responsável pela atividade', valor: emFoco.value?.projeto?.responsavel?.nome_exibicao },
  {
    chave: 'descricao', titulo: 'Descrição', valor: emFoco.value?.descricao, larguraBase: '100%',
  },
]);

const dadosPlanejamento = computed(() => [
  { chave: 'inicio_planejado', titulo: 'Previsão de início', valor: dateToDate(emFoco.value?.inicio_planejado) },
  { chave: 'duracao_planejado', titulo: 'Duração prevista', valor: emFoco.value?.duracao_planejado ? `${emFoco.value.duracao_planejado} dias` : null },
  { chave: 'termino_planejado', titulo: 'Previsão de término', valor: dateToDate(emFoco.value?.termino_planejado) },
  { chave: 'atraso', titulo: 'Atraso', valor: emFoco.value?.atraso ? `${emFoco.value.atraso} dias` : null },
  { chave: 'custo_estimado', titulo: 'Previsão de custo', valor: emFoco.value?.custo_estimado ? `R$${dinheiro(emFoco.value.custo_estimado)}` : null },
  {
    chave: 'custo_estimado_anualizado',
    titulo: 'Custo previsto por ano',
    valor: emFoco.value?.custo_estimado_anualizado?.length ? ' ' : null,
    metadados: { custos: emFoco.value?.custo_estimado_anualizado },
  },
  { chave: 'termino_projetado', titulo: 'Término projetado', valor: dateToDate(emFoco.value?.termino_projetado) },
].filter((item) => item.chave !== 'custo_estimado_anualizado' || item.metadados?.custos?.length));

const dadosExecucao = computed(() => [
  {
    chave: 'inicio_real',
    titulo: 'Data de início real',
    valor: dateToDate(emFoco.value?.inicio_real),
  },
  { chave: 'duracao_real', titulo: 'Duração real', valor: emFoco.value?.duracao_real ? `${emFoco.value.duracao_real} dias` : null },
  { chave: 'termino_real', titulo: 'Data de término real', valor: dateToDate(emFoco.value?.termino_real) },
  { chave: 'custo_real', titulo: 'Custo real', valor: emFoco.value?.custo_real ? `R$${dinheiro(emFoco.value.custo_real)}` : null },
  {
    chave: 'custo_real_anualizado',
    titulo: 'Custo real por ano',
    valor: emFoco.value?.custo_real_anualizado?.length ? ' ' : null,
    metadados: { custos: emFoco.value?.custo_real_anualizado },
  },
  { chave: 'percentual_concluido', titulo: 'Percentual concluído', valor: emFoco.value?.percentual_concluido != null ? `${emFoco.value.percentual_concluido}%` : null },
].filter((item) => item.chave !== 'custo_real_anualizado' || item.metadados?.custos?.length));

const dadosDependencias = computed(() => (emFoco.value?.dependencias || []).map((dep) => ({
  tarefa_relacionada: tarefasPorId.value[dep.dependencia_tarefa_id]?.tarefa || '—',
  tipo_relacao: dependencyTypes[dep.tipo] || dep.tipo,
  latencia: dep.latencia,
})));

const colunasDependencias = [
  { chave: 'tarefa_relacionada', label: 'Tarefa relacionada' },
  { chave: 'tipo_relacao', label: 'Tipo de relação' },
  { chave: 'latencia', label: 'Dias de latência' },
];
</script>

<template>
  <div class="flex column g2">
    <TítuloDePágina id="titulo-da-pagina">
      Resumo da Tarefa
    </TítuloDePágina>

    <LoadingComponent v-if="chamadasPendentes?.emFoco" />

    <template v-else>
      <SmaeDescriptionList
        :lista="dadosBasicos"
        layout="grid"
      />

      <SmaeTable
        v-if="dadosDependencias.length"
        :dados="dadosDependencias"
        :colunas="colunasDependencias"
        rolagem-horizontal
        titulo="Dependências"
      />

      <h2 class="mb0">
        Planejamento
      </h2>

      <SmaeDescriptionList
        :lista="dadosPlanejamento"
        layout="grid"
      >
        <template #descricao--custo_estimado_anualizado="{ item }">
          <ul>
            <li
              v-for="custo in item.metadados.custos"
              :key="custo.ano"
            >
              {{ custo.ano }}: R${{ dinheiro(custo.valor) }}
            </li>
          </ul>
        </template>
      </SmaeDescriptionList>

      <h2 class="mb0">
        Execução da tarefa
      </h2>

      <SmaeDescriptionList
        :lista="dadosExecucao"
        layout="grid"
      >
        <template #descricao--custo_real_anualizado="{ item }">
          <ul>
            <li
              v-for="custo in item.metadados.custos"
              :key="custo.ano"
            >
              {{ custo.ano }}: R${{ dinheiro(custo.valor) }}
            </li>
          </ul>
        </template>
      </SmaeDescriptionList>
    </template>

    <div
      v-if="erro"
      class="error p1"
    >
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>
  </div>
</template>
