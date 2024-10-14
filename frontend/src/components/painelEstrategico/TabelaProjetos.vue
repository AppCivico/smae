<script setup>
import { defineProps } from 'vue';
import statuses from '@/consts/projectStatuses';

defineProps({
  projetos: {
    type: Array,
    default: () => [],
  },
});
</script>
<template>
  <div
    role="region"
    aria-label="Tabela de projetos"
    tabindex="0"
  >
    <table class="tabela-projetos mt1">
      <colgroup>
        <col>
        <col>
        <col class="col--number">
        <col>
        <col>
        <col class="col--data">
        <col class="col--number">
        <col class="col--percentagem">
      </colgroup>
      <thead>
        <tr>
          <th>Nome do Projeto</th>
          <th>Secretaria</th>
          <th>Meta</th>
          <th>Status</th>
          <th>Etapa Atual</th>
          <th>Término Projetado</th>
          <th>Riscos em Aberto</th>
          <th>% de Atraso</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(projeto, index) in projetos.linhas"
          :key="index"
        >
          <td>{{ projeto.nome_projeto || ' - ' }}</td>
          <td>{{ projeto.secretaria?.nome || ' - ' }}</td>
          <td>
            {{ projeto.meta?.nome || ' - ' }}
          </td>
          <td>{{ statuses[projeto.status] || projeto.status }}</td>
          <td>{{ projeto.etapa_atual || ' - ' }}</td>
          <td>{{ projeto.termino_projetado || ' - ' }}</td>
          <td class="tr">
            {{ projeto.riscos_abertos || ' - ' }}
          </td>
          <td class="tr">
            {{ projeto.percentual_atraso ? `${projeto.percentual_atraso}%` : ' - ' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
.tabela-projetos {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.tabela-projetos th,
.tabela-projetos td {
  border-bottom: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.tabela-projetos th {
  font-weight: bold;
}
</style>
