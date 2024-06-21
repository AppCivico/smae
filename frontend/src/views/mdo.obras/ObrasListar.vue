<template>
  <div>
    <div class="flex spacebetween center mb2">
      <h1>{{ route?.meta?.título || 'Painel de obras' }}</h1>
      <hr class="ml2 f1">
      <router-link
        :to="{name: 'obrasCriar'}"
        class="btn big ml1"
      >
        Novo
      </router-link>
    </div>
    <table class="tablemain">
      <col>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <thead>
        <tr>
          <th>
            Órgão origem
          </th>
          <th>
            portfólio
          </th>
          <th>
            nome da obra
          </th>
          <th>
            grupo temático
          </th>
          <th>
            tipo de intervenção
          </th>
          <th>
            Equipamento
          </th>
          <th>
            Subprefeitura
          </th>
          <th>
            status da obra
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in lista"
          :key="item.id"
        >
          <td> {{ item.orgao_origem.sigla }} </td>
          <td> {{ item.portfolio.titulo }} </td>
          <td> {{ item.nome }} </td>
          <td>{{ item.grupo_tematico.nome }}</td>
          <td class="tc">
            {{ item.tipo_intervencao ? item.tipo_intervencao : ' - ' }}
          </td>
          <td class="tc">
            {{ item.equipamento ? item.equipamento.nome : ' - ' }}
          </td>
          <td class="tc">
            {{ item.equipamento ? item.equipamento.nome : ' - ' }}
          </td>
          <td class="tc">
            {{ item.regioes ? item.regioes : ' - ' }}
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
  </div>
</template>
<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useObrasStore } from '@/stores/obras.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const obrasStore = useObrasStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(obrasStore);
const route = useRoute();
const alertStore = useAlertStore();

async function excluirObra(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await obrasStore.excluirItem(id)) {
      // obrasStore.$reset();
      obrasStore.buscarTudo();
      alertStore.success('Partido removido.');
    }
  }, 'Remover');
}

// obrasStore.$reset();
obrasStore.buscarTudo();

</script>
