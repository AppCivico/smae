<script setup>
import dateToDate from '@/helpers/dateToDate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const localizeDate = (d) => dateToDate(d, { timeStyle: 'short' });

const props = defineProps({
  etiquetasParaParâmetros: {
    type: Object,
    default: () => { },
  },

  etiquetasParaValoresDeParâmetros: {
    type: Object,
    default: () => { },
  },
});

function excluirRelatório(id) {
  alertStore.confirmAction('Deseja remover o relatório?', () => {
    relatoriosStore.delete(id);
  }, 'Remover');
}

</script>
<template>
  <table class="tablemain">
    <col>
    <col class="col--dataHora">
    <col v-if="etiquetasParaParâmetros && Object.keys(etiquetasParaParâmetros).length">
    <col
      v-if="temPermissãoPara(['Reports.remover'])"
      class="col--botão-de-ação"
    >
    <col class="col--botão-de-ação">

    <thead>
      <tr>
        <th>criador</th>
        <th>gerado em</th>
        <th v-if="etiquetasParaParâmetros && Object.keys(etiquetasParaParâmetros).length">
          Parâmetros
        </th>
        <th v-if="temPermissãoPara(['Reports.remover'])" />
        <th />
      </tr>
    </thead>

    <tbody>
      <template v-if="relatoriosStore.lista.length">
        <tr
          v-for="item in relatoriosStore.lista"
          :key="item.id"
        >
          <td>{{ item.criador?.nome_exibicao }}</td>
          <td>{{ localizeDate(item.criado_em) }}</td>
          <td v-if="etiquetasParaParâmetros && Object.keys(etiquetasParaParâmetros).length">
            <ul
              v-if="Object.keys(item.parametros)?.length"
              class="t13"
            >
              <template v-for="(value, key) in item.parametros">
                <li
                  v-if="props.etiquetasParaParâmetros?.[key] && value"
                  :key="key"
                >
                  <span
                    style="display: inline; font-variant: small-caps; text-transform: lowercase;"
                  >{{ props.etiquetasParaParâmetros?.[key] || key }}</span>:
                  {{ Array.isArray(value)
                    ? value.map((x) => props.etiquetasParaValoresDeParâmetros?.[key]?.[x])
                      .join(', ')
                    : props.etiquetasParaValoresDeParâmetros?.[key]?.[value] || value }}
                </li>
              </template>
            </ul>
          </td>
          <td v-if="temPermissãoPara(['Reports.remover'])">
            <button
              class="like-a__text addlink"
              arial-label="excluir"
              title="excluir"
              @click="excluirRelatório(item.id)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </td>
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
      <tr v-else-if="!relatoriosStore.loading">
        <td
          :colspan="etiquetasParaParâmetros && Object.keys(etiquetasParaParâmetros).length
            ? 5
            : 4"
        >
          Nenhum resultado encontrado.
        </td>
      </tr>
      <tr v-else-if="relatoriosStore.loading">
        <td
          :colspan="etiquetasParaParâmetros && Object.keys(etiquetasParaParâmetros).length
            ? 5
            : 4"
          aria-busy="true"
        >
          Carregando
        </td>
      </tr>
      <tr v-else-if="relatoriosStore.error">
        <td
          :colspan="etiquetasParaParâmetros && Object.keys(etiquetasParaParâmetros).length
            ? 5
            : 4"
        >
          erro: {{ relatoriosStore.error }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
