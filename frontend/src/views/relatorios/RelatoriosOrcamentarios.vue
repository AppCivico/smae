<script setup>
import dateToDate from '@/helpers/dateToDate';
import dateToTitle from '@/helpers/dateToTitle';
import { useAlertStore, useAuthStore, useRelatoriosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const route = useRoute();
const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();

const baseUrl = `${import.meta.env.VITE_API_URL}`;


const localizeDate = (d) => dateToDate(d, { timeStyle: 'short' });

function excluirRelatório(id) {
  alertStore.confirmAction('Deseja remover o relatório?', () => {
    relatoriosStore.delete(id);
  }, 'Remover');
}


function nomeDeArquivo(item) {
  const { fonte, criado_em, parametros: { tipo, inicio, fim } } = item;

  return `relatório__${fonte}--${tipo}--${inicio}-${fim}@${criado_em}`;
}

onMounted(() => {
  clear();
  getAll({ ipp: 50 });
});

</script>
<template>
  <div class="flex spacebetween center mb2">
      <h1>{{ route.meta.título }}</h1>
      <hr class="ml2 f1"/>
      <!--router-link :to="{ name: 'novoRelatórioOrçamentário' }" class="btn big ml2" v-if="temPermissãoPara('Reports.executar')">
        Novo relatório
      </router-link-->
  </div>
  <!--div class="flex center mb2">
      <div class="f2 search">
          <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
      </div>
  </div-->

  <table class="tablemain">
      <colgroup>
        <col />
        <col />
        <col />
        <!--col /-->
        <col class="col--dataHora" />

        <col v-if="temPermissãoPara(['Reports.remover'])" class="col--botão-de-ação" />
        <!--col v-if="temPermissãoPara('Reports.executar')" class="col--botão-de-ação" /-->
        <col class="col--botão-de-ação" />
      </colgroup>
      <thead>
          <tr>
              <th>mês/ano início</th>
              <th>mês/ano fim</th>
              <th>tipo</th>
              <!--th>órgãos</th-->
              <th>gerado em</th>
              <th v-if="temPermissãoPara(['Reports.remover'])"></th>
              <!--th v-if="temPermissãoPara('Reports.executar')"></th-->
              <th></th>
          </tr>
      </thead>
      <tbody>
          <template v-if="relatoriosStore.relatorios.length">
              <tr v-for="item in relatoriosStore.relatorios" :key="item.id">
                  <td>{{ dateToTitle(item.parametros.inicio) }}</td>
                  <td>{{ dateToTitle(item.parametros.fim) }}</td>
                  <td>{{ item.parametros.tipo }}</td>
                  <!--td>{{ item.parametros.orgaos }}</td-->
                  <td>{{ localizeDate(item.criado_em) }}</td>
                  <td v-if="temPermissãoPara(['Reports.remover'])">
                    <button @click="excluirRelatório(item.id)" class="like-a__text" arial-label="excluir" title="excluir"><img
                    src="../../assets/icons/excluir.svg" /></button>
                  </td>
                  <!--td v-if="temPermissãoPara('Reports.executar')">
                    <button class="like-a__text" arial-label="duplicar" title="duplicar"><img
                    src="../../assets/icons/duplicar.svg" /></button>
                  </td-->
                  <td>
                    <a :href="`${baseUrl}/download/${item.arquivo}`"
                    :download="nomeDeArquivo(item)" title="baixar"><img
                    src="../../assets/icons/baixar.svg" /></a>
                  </td>
              </tr>
          </template>
          <tr v-else-if="relatoriosStore.loading">
              <td colspan="8" aria-busy="true">
                  Carregando
              </td>
          </tr>
          <tr v-else-if="relatoriosStore.error">
              <td colspan="8">
                  erro: {{ relatoriosStore.error }}
              </td>
          </tr>
          <tr v-else>
              <td colspan="8">
                  Nenhum resultado encontrado.
              </td>
          </tr>
      </tbody>
  </table>
</template>
