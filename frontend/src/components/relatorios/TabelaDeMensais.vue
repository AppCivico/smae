<script setup>
import dateToDate from '@/helpers/dateToDate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { usePaineisStore } from '@/stores/paineis.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const { painéisPorId } = storeToRefs(usePaineisStore());

const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const localizeDate = (d) => dateToDate(d, { timeStyle: 'short' });

function excluirRelatório(id) {
  alertStore.confirmAction('Deseja remover o relatório?', () => {
    relatoriosStore.delete(id);
  }, 'Remover');
}

</script>
<template>
  <table class="tablemain">
    <colgroup>
      <col>
      <col>
      <!--col /-->
      <col class="col--dataHora">

      <col
        v-if="temPermissãoPara(['Reports.remover.'])"
        class="col--botão-de-ação"
      >
      <!--col v-if="temPermissãoPara('Reports.executar.')" class="col--botão-de-ação" /-->
      <col class="col--botão-de-ação">
    </colgroup>
    <thead>
      <tr>
        <th>mês/ano</th>
        <th>painéis</th>
        <!--th>tags</th-->
        <th>gerado em</th>
        <th v-if="temPermissãoPara(['Reports.remover.'])" />
        <!--th v-if="temPermissãoPara('Reports.executar.')"></th-->
        <th />
      </tr>
    </thead>
    <tbody>
      <template v-if="relatoriosStore.lista.length">
        <tr
          v-for="item in relatoriosStore.lista"
          :key="item.id"
        >
          <td>{{ item.parametros.mes }}/{{ item.parametros.ano }}</td>
          <td>
            {{ item.parametros.paineis?.map(x => painéisPorId[x]?.nome
              || 'painel removido').join(', ') }}
          </td>
          <!--td>{{ item.parametros.tags }}</td-->
          <td>{{ localizeDate(item.criado_em) }}</td>
          <td v-if="temPermissãoPara(['Reports.remover.'])">
            <button
              class="like-a__text addlink"
              aria-label="excluir"
              title="excluir"
              @click="excluirRelatório(item.id)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </td>
          <!--td v-if="temPermissãoPara('Reports.executar.')">
                    <button class="like-a__text" aria-label="duplicar" title="duplicar"><img
                    src="../../assets/icons/duplicar.svg" /></button>
                  </td-->
          <td>
            <a
              :href="`${baseUrl}/download/${item.arquivo}`"
              download
              title="baixar"
            ><img
              src="../../assets/icons/baixar.svg"
            ></a>
          </td>
        </tr>
      </template>
      <tr v-else-if="relatoriosStore.loading">
        <td
          colspan="6"
          aria-busy="true"
        >
          Carregando
        </td>
      </tr>
      <tr v-else-if="relatoriosStore.error">
        <td colspan="6">
          erro: {{ relatoriosStore.error }}
        </td>
      </tr>
      <tr v-else>
        <td colspan="6">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
