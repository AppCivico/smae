<script setup>
import { defineProps, computed } from 'vue';
import * as CardEnvelope from '@/components/cardEnvelope';

const props = defineProps({
  projetos: {
    type: Array,
    required: true,
  },
});

const projetosOrganizados = computed(() => props.projetos);
</script>
<template>
  <CardEnvelope.Conteudo>
    <CardEnvelope.Titulo
      titulo="Lista de Projetos"
    />
    <table class="tabela-projetos mt1">
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
          v-for="(projeto, index) in projetosOrganizados"
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
  </CardEnvelope.Conteudo>
</template>

<style scoped>
.tabela-projetos {
  width: 100%;
  border-collapse: collapse;
}

.tabela-projetos th, .tabela-projetos td {
  border-bottom: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.tabela-projetos th {
  font-weight: bold;
}
</style>
