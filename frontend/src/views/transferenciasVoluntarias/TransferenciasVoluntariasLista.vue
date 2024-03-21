<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

const tranferenciasVoluntarias = useTransferenciasVoluntariasStore();
const route = useRoute();
const alertStore = useAlertStore();

const {
  lista, chamadasPendentes, erro,
} = storeToRefs(tranferenciasVoluntarias);


async function excluirTransferencia(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await tranferenciasVoluntarias.excluirItem(id)) {
      tranferenciasVoluntarias.$reset();
      tranferenciasVoluntarias.buscarTudo();
      alertStore.success('Transferência removida.');
    }
  }, 'Remover');
}

tranferenciasVoluntarias.$reset();
tranferenciasVoluntarias.buscarTudo();

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Tipo de Transferência' }}</h1>
    <hr class="ml2 f1">
    <router-link :to="{ name: 'TransferenciasVoluntariaCriar' }" class="btn big ml1">
      Novo Formulário de registro
    </router-link>
  </div>

  <table class="tablemain">
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>
          Identificador
        </th>
        <th>
          Esfera
        </th>
        <th>
          Tipo de transferência
        </th>
        <th>
          Partido
        </th>
        <th>
          Ano
        </th>
        <th>
          Objeto/Empreendimento
        </th>
        <th>
          Valor
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in lista" :key="item.id">
        <td>
          {{ item.identificador }}
        </td>
        <td>
          {{ item.esfera }}
        </td>
        <td>
          {{ item.tipo.nome }}
        </td>
        <td>
          {{ item.partido?.sigla }}
        </td>
        <td>
          {{ item.ano }}
        </td>
        <td>
          {{ item.objeto }}
        </td>
        <td>
          {{ item.valor }}
        </td>
        <td>
          <button class="like-a__text" arial-label="excluir" title="excluir" @click="excluirTransferencia(item.id)">
            <svg width="20" height="20">
              <use xlink:href="#i_remove" />
            </svg>
          </button>
        </td>
        <td>
          <router-link :to="{ name: 'TransferenciasVoluntariaEditar', params: { transferenciaId: item.id } }"
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

