<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const partidoStore = usePartidosStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(partidoStore);
const route = useRoute();
const alertStore = useAlertStore();

async function excluirPainel(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await partidoStore.excluirItem(id)) {
      partidoStore.$reset();
      partidoStore.buscarTudo();
      alertStore.success('Partido removido.');
    }
  }, 'Remover');
}

partidoStore.$reset();
partidoStore.buscarTudo();

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Partidoss' }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{name: 'partidosCriar'}"
      class="btn big ml1"
    >
      Novo partido
    </router-link>
  </div>
  <table class="tablemain">
    <colgroup>
      <col>
      <col>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </colgroup>
    <thead>
      <tr>
        <th>
          Nome
        </th>
        <th>
          Sigla
        </th>
        <th>
          Número
        </th>
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
        <td>
          {{ item.sigla }}
        </td>
        <td>
          {{ item.numero }}
        </td>
        <td>
          <button
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirPainel(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
        <td>
          <router-link
            :to="{ name: 'partidosEditar', params: { partidoId: item.id } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="3">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="3">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="3">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
