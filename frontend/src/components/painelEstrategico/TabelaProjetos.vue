<script setup>
import * as CardEnvelope from '@/components/cardEnvelope';
import { defineProps } from 'vue';

defineProps({
  projetos: {
    type: Array,
    default: () => [],
  },
});
</script>
<template>
  <CardEnvelope.Conteudo>
    <CardEnvelope.Titulo>
      Projetos
    </CardEnvelope.Titulo>

    <div
      role="region"
      aria-label="Tabela de projetos"
      tabindex="0"
    >
      <table class="tabela-projetos mt1">
        <colgroup>
          <col>
          <col>
          <col>
          <col>
          <col>
          <col>
          <col>
          <col>
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
            v-for="(projeto, index) in projetos"
            :key="index"
          >
            <td>{{ projeto.nome }}</td>
            <td>{{ projeto.secretaria }}</td>
            <td>{{ projeto.meta }}</td>
            <td>{{ projeto.status }}</td>
            <td>{{ projeto.etapaAtual }}</td>
            <td>{{ projeto.terminoProjetado }}</td>
            <td>{{ projeto.riscosEmAberto }}</td>
            <td>{{ projeto.percentualAtraso }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </CardEnvelope.Conteudo>
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
