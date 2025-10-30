<script setup>
import dateToDate from '@/helpers/dateToDate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const localizeDate = (d) => dateToDate(d, { timeStyle: 'short' });

const props = defineProps({
  etiquetasParaParâmetros: {
    type: Object,
    default: () => ({}),
  },

  etiquetasParaValoresDeParâmetros: {
    type: Object,
    default: () => ({}),
  },
});

const colunas = computed(() => Object.fromEntries(
  Object.entries(props
    .etiquetasParaParâmetros).filter(([key, value]) => value !== undefined),
));

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
    <colgroup
      v-if="colunas &&
        Object.keys(colunas).length"
      :span="Object.keys(colunas).length"
    />
    <col
      v-if="temPermissãoPara(['Reports.remover.'])"
      class="col--botão-de-ação"
    >
    <col class="col--botão-de-ação">

    <thead>
      <tr>
        <th>criador</th>
        <th>gerado em</th>
        <th
          v-for="(valor, chave) in (colunas || [])"
          :key="`header__${chave}`"
        >
          {{ valor }}
        </th>
        <th v-if="temPermissãoPara(['Reports.remover.'])" />
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
          <td
            v-for="(_, chave) in colunas"
            :key="chave"
          >
            {{ Array.isArray(item.parametros[chave])
              ? item.parametros[chave]
                .map((x) => props.etiquetasParaValoresDeParâmetros?.[chave]?.[x])
                .join(', ')
              : props.etiquetasParaValoresDeParâmetros?.[chave]?.[item.parametros[chave]]
                || item.parametros[chave] }}
          </td>
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
          :colspan="4 + (Object.keys(colunas)?.length || 0)"
        >
          Nenhum resultado encontrado.
        </td>
      </tr>
      <tr v-else-if="relatoriosStore.loading">
        <td
          :colspan="4 + (Object.keys(colunas)?.length || 0)"
          aria-busy="true"
        >
          Carregando
        </td>
      </tr>
      <tr v-else-if="relatoriosStore.error">
        <td
          :colspan="4 + (Object.keys(colunas)?.length || 0)"
        >
          erro: {{ relatoriosStore.error }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
