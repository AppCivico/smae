<template>
  <div class="flex spacebetween center mb2">
    <TituloDaPagina />
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'tiposDeIntervencaoCriar' }"
      class="btn big ml1"
    >
      Novo tipo
    </router-link>
  </div>
  <table class="tablemain">
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>Tipo</th>
        <th>Conceito</th>
        <th />
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.nome }}</td>
        <td>{{ item.conceito }}</td>
        <td>
          <router-link
            :to="{ name: 'tiposDeIntervencaoEditar', params: { intervencaoId: item.id } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
        <td>
          <button
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirTipo(item.id, item.nome)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_waste" /></svg>
          </button>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="4">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro?.lista">
        <td colspan="4">
          Erro: {{ erro.lista }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="4">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useAlertStore } from '@/stores/alert.store';
import { useTiposDeIntervencaoStore } from '@/stores/tiposDeIntervencao.store';
import TituloDaPagina from '@/components/TituloDaPagina.vue';

const route = useRoute();
const alertStore = useAlertStore();
const tiposDeIntervencaoStore = useTiposDeIntervencaoStore();
const { lista, chamadasPendentes, erro } = storeToRefs(tiposDeIntervencaoStore);

async function excluirTipo(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await tiposDeIntervencaoStore.excluirItem(id)) {
        alertStore.success(`"${descricao}" removido.`);
        tiposDeIntervencaoStore.buscarTudo();
      }
    },
    'Remover',
  );
}

tiposDeIntervencaoStore.$reset();
tiposDeIntervencaoStore.buscarTudo();
</script>

<style></style>
