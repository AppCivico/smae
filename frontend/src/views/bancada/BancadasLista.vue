<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useBancadasStore } from '@/stores/bancadas.store';

const bancadaStore = useBancadasStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(bancadaStore);
const route = useRoute();
const alertStore = useAlertStore();

async function excluirBancada(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await bancadaStore.excluirItem(id)) {
      bancadaStore.$reset();
      bancadaStore.buscarTudo();
      alertStore.success('Bancada removida.');
    }
  }, 'Remover');
}

bancadaStore.$reset();
bancadaStore.buscarTudo();

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Bancadas' }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{name: 'bancadasCriar'}"
      class="btn big ml1"
    >
      Nova bancada
    </router-link>
  </div>

  <table class="tablemain">
    <colgroup>
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
          <button
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirBancada(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
        <td>
          <router-link
            :to="{ name: 'bancadasEditar', params: { bancadaId: item.id } }"
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
