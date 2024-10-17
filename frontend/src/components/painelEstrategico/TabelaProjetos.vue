<script setup>
import { defineProps } from 'vue';
import statuses from '@/consts/projectStatuses';
import dateToDate from '@/helpers/dateToDate';
import truncate from '@/helpers/truncate';
import MenuPaginacao from '@/components/MenuPaginacao.vue';

defineProps({
  projetos: {
    type: Array,
    default: () => [],
  },
  paginacao: {
    type: Object,
    default: () => ({}),
  },
});

const projetoFormatado = (codigo, nome) => {
  if (codigo && nome) {
    return `${codigo} - ${truncate(nome, 40)}`;
  }
  return codigo || nome || ' - ';
};
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
        <col>
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
          <th class="tr">
            Riscos em Aberto
          </th>
          <th class="tr">
            % de Atraso
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(projeto, index) in projetos"
          :key="index"
        >
          <td class="tl">
            {{ projetoFormatado(projeto.projeto_codigo, projeto.nome_projeto) }}
          </td>
          <td>{{ projeto.secretaria?.codigo || ' - ' }}</td>
          <td>
            {{ projeto.meta?.codigo || ' - ' }}
          </td>
          <td>{{ statuses[projeto.status] || projeto.status }}</td>
          <td>{{ projeto.etapa_atual || ' - ' }}</td>
          <td>{{ dateToDate(projeto.termino_projetado) || ' - ' }}</td>
          <td class="tr">
            {{ projeto.riscos_abertos || ' - ' }}
          </td>
          <td class="tr">
            {{ projeto.percentual_atraso ? `${projeto.percentual_atraso}%` : ' - ' }}
          </td>
        </tr>
      </tbody>
    </table>
    <div>
      <MenuPaginacao
        class="mt2 bgb"
        v-bind="paginacao"
      />
      <p class="w700 t12 tc tprimary">
        Total de projetos: {{ paginacao.totalRegistros }}
      </p>
    </div>
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
