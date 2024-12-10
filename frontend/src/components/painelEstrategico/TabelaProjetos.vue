<script setup>
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import statuses from '@/consts/projectStatuses';
import dateToDate from '@/helpers/dateToDate';
import truncate from '@/helpers/truncate';
import { defineProps } from 'vue';
import RolagemHorizontal from '../rolagem/RolagemHorizontal.vue';

defineProps({
  projetos: {
    type: Array,
    default: () => [],
  },
  paginacao: {
    type: Object,
    default: () => ({}),
  },
  chamadasPendentes: {
    type: Boolean,
    default: false,
  },
  erro: {
    type: [String, Object],
    default: null,
  },
});
</script>
<template>
  <RolagemHorizontal
    aria-label="Tabela de projetos"
  >
    <table class="tabela-projetos mt1 tablemain">
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
          <th class="tl">
            Nome do Projeto
          </th>
          <th class="tl">
            Secretaria
          </th>
          <th class="tl">
            Meta
          </th>
          <th class="tl">
            Status
          </th>
          <th class="tl">
            Etapa Atual
          </th>
          <th class="tl">
            Término Projetado
          </th>
          <th class="tr">
            Riscos em Aberto
          </th>
          <th class="tr">
            % de Atraso
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="chamadasPendentes">
          <td
            colspan="8"
            aria-busy="true"
          >
            <LoadingComponent />
          </td>
        </tr>
        <template v-else-if="projetos.length">
          <tr
            v-for="(projeto, index) in projetos"
            :key="index"
          >
            <td class="tl">
              <router-link
                :to="{
                  name: 'projetosResumo',
                  params: {
                    projetoId: projeto.id
                  }
                }"
              >
                {{ truncate(projeto.nome_projeto, 40) }}
              </router-link>
            </td>
            <td class="tl">
              {{ projeto.secretaria?.codigo || ' - ' }}
            </td>
            <td class="tl">
              {{ projeto.meta?.codigo || ' - ' }}
            </td>
            <td class="tl">
              {{ statuses[projeto.status] || projeto.status }}
            </td>
            <td class="tl">
              {{ projeto.etapa_atual || ' - ' }}
            </td>
            <td class="tl">
              {{ dateToDate(projeto.termino_projetado) || ' - ' }}
            </td>
            <td class="tr">
              {{ projeto.riscos_abertos || ' - ' }}
            </td>
            <td class="tr">
              {{ projeto.percentual_atraso ? `${projeto.percentual_atraso}%` : ' - ' }}
            </td>
          </tr>
        </template>
        <tr v-else>
          <td colspan="8">
            Nenhum resultado encontrado.
          </td>
        </tr>

        <tr v-if="erro">
          <td colspan="8">
            Erro: {{ erro }}
          </td>
        </tr>
      </tbody>
    </table>
    <div>
      <MenuPaginacao
        class="mt2 bgt"
        v-bind="paginacao"
        prefixo="projetos_"
      />
      <p class="w700 t12 tc tprimary">
        Total de projetos: {{ paginacao.totalRegistros }}
      </p>
    </div>
  </RolagemHorizontal>
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
