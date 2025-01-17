<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { localizarData, localizarDataHorario } from '@/helpers/dateToDate';

const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const localizeDate = (d) => (d.includes('T')
  ? localizarDataHorario(d)
  : localizarData(d, { timeStyle: 'short' }));

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
            <template v-if="chave.startsWith('data_')">
              {{
                item.parametros[chave]
                  ? localizeDate(item.parametros[chave])
                  : ''
              }}
            </template>
            <template v-else>
              {{ Array.isArray(item.parametros[chave])
                ? item.parametros[chave]
                  .map((x) => props.etiquetasParaValoresDeParâmetros?.[chave]?.[x])
                  .join(', ')
                : props.etiquetasParaValoresDeParâmetros?.[chave]?.[item.parametros[chave]]
                  || item.parametros[chave] }}
            </template>
          </td>

          <td class="tr">
            <button
              v-if="temPermissãoPara(['Reports.remover.'])"
              class="like-a__text addlink"
              arial-label="excluir"
              title="excluir"
              @click="excluirRelatório(item.id)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_waste" /></svg>
            </button>

            <a
              class="ml1"
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
