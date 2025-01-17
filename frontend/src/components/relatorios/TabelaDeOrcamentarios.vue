<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import dateToTitle from '@/helpers/dateToTitle';
import { localizarDataHorario } from '@/helpers/dateToDate';
import { relatorioOrcamentarioPlanoSetorial as schema } from '@/consts/formSchemas';

const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const campos = computed(() => schema.fields);

const lista = computed(() => relatoriosStore.lista.map((item) => ({
  id: item.id,
  criado_em: localizarDataHorario(item.criado_em, 'dd/MM/yyyy'),
  criador: item.criador.nome_exibicao,
  parametros: `Tipo: ${item.parametros.tipo}`,
  periodo_inicio: dateToTitle(item.parametros.inicio),
  periodo_fim: dateToTitle(item.parametros.fim),
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
      <template v-if="lista.length">
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
              arial-label="excluir"
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
            >
              <svg
                width="20"
                height="20"
              >
                <use xlink:href="#i_baixar" />
              </svg>
            </a>
          </td>
        </tr>
      </template>
      <tr v-else-if="relatoriosStore.loading">
        <td
          colspan="8"
          aria-busy="true"
        >
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
