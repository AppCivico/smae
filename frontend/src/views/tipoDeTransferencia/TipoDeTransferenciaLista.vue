<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';

const tipoDeTransferencia = useTipoDeTransferenciaStore();
const route = useRoute();
const alertStore = useAlertStore();

const {
  lista, chamadasPendentes, erro,
} = storeToRefs(tipoDeTransferencia);


async function excluirTransferencia(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await tipoDeTransferencia.excluirItem(id)) {
      tipoDeTransferencia.$reset();
      tipoDeTransferencia.buscarTudo();
      alertStore.success('Transferência removida.');
    }
  }, 'Remover');
}

tipoDeTransferencia.$reset();
tipoDeTransferencia.buscarTudo();

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Tipo de Transferência' }}</h1>
    <hr class="ml2 f1">
    <router-link :to="{ name: 'tipoDeTransferenciaCriar' }" class="btn big ml1">
      Novo Tipo de Transferência
    </router-link>
  </div>

  <table class="tablemain">
    <col>
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>
          Nome
        </th>
        <th>
          Tipo
        </th>
        <th>
          Esfera
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in lista" :key="item.id">
        <td>
          {{ item.nome }}
        </td>
        <td>
          {{ item.categoria }}
        </td>
        <td>
          {{ item.esfera }}
        </td>
        <td>
          <button class="like-a__text" aria-label="excluir" title="excluir" @click="excluirTransferencia(item.id)">
            <svg width="20" height="20">
              <use xlink:href="#i_remove" />
            </svg>
          </button>
        </td>
        <td>
          <router-link :to="{ name: 'tipoDeTransferenciaEditar', params: { tipoId: item.id } }"
            class="tprimary">
            <svg width="20" height="20">
              <use xlink:href="#i_edit" />
            </svg>
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
