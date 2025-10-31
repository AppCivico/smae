<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { localizarDataHorario } from '@/helpers/dateToDate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { relatorioSemestralAnualPlanoSetorial as schema } from '@/consts/formSchemas';

const { temPermissãoPara } = storeToRefs(useAuthStore());

const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const campos = computed(() => schema.fields);

const lista = computed(() => relatoriosStore.lista.map((item) => ({
  id: item.id,
  criado_em: localizarDataHorario(item.criado_em, 'dd/MM/yyyy'),
  criador: item.criador.nome_exibicao,
  periodo: item.parametros.periodo,
  parametros: `Tipo: ${item.parametros.tipo}`,
  arquivo: item.arquivo,
})));

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
        <th
          v-for="(campo, campoIndex) in campos"
          :key="`relatorio-mensal__head--${campoIndex}`"
        >
          {{ campo.spec.label }}
        </th>
        <th />
      </tr>
    </thead>
    <tbody>
      <template v-if="relatoriosStore.lista.length">
        <tr
          v-for="item in lista"
          :key="item.id"
        >
          <td
            v-for="(_, campoIndex) in campos"
            :key="`relatorio-mensal__body--${campoIndex}`"
          >
            {{ item[campoIndex] }}
          </td>

          <td class="tr">
            <button
              v-if="temPermissãoPara(['Reports.remover.'])"
              class="like-a__text addlink"
              aria-label="excluir"
              title="excluir"
              @click="excluirRelatório(item.id)"
            >
              <svg
                width="20"
                height="20"
              >
                <use xlink:href="#i_waste" />
              </svg>
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
      <tr v-else-if="relatoriosStore.loading">
        <td
          :colspan="temPermissãoPara(['Reports.remover.']) ? 7 : 6"
          aria-busy="true"
        >
          Carregando
        </td>
      </tr>
      <tr v-else-if="relatoriosStore.error">
        <td :colspan="temPermissãoPara(['Reports.remover.']) ? 7 : 6">
          erro: {{ relatoriosStore.error }}
        </td>
      </tr>
      <tr v-else>
        <td :colspan="temPermissãoPara(['Reports.remover.']) ? 7 : 6">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
