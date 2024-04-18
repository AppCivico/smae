<script setup>
import { storeToRefs } from 'pinia';
import { useQuadroDeAtividadesStore } from '@/stores/quadroDeAtividades.store';
import { onUnmounted } from 'vue';

const quadroDeAtividadesStore = useQuadroDeAtividadesStore();
const { chamadasPendentes, erro, lista } = storeToRefs(quadroDeAtividadesStore);
quadroDeAtividadesStore.buscarTudo();

onUnmounted(() => {
  quadroDeAtividadesStore.$reset();
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>Quadro de atividades</h1>
    <hr class="ml2 f1">
  </div>
  <div>
    <table class="tablemain mb1">
      <col>
      <col>
      <col>
      <col>
      <thead>
        <tr>
          <th>Identificador</th>
          <th>Transferência</th>
          <th>Situação</th>
          <th>Prazo</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in lista"
          :key="item.id"
        >
          <th>
            <router-link
              :to="{
                name: 'TransferenciasVoluntariasDetalhes',
                params: { transferenciaId: item.identificador },
              }"
              class="tprimary"
            >
              {{ item.identificador }}
            </router-link>
          </th>
          <td>
            {{ item.transferencia_id }}
          </td>
          <td>
            {{ item.situacao }}
          </td>
          <td>
            {{
              item.data ? new Date(item.data).toLocaleDateString("pt-BR") : ""
            }}
          </td>
        </tr>
        <tr v-if="chamadasPendentes.lista">
          <td colspan="10">
            Carregando
          </td>
        </tr>
        <tr v-else-if="erro">
          <td colspan="10">
            Erro: {{ erro }}
          </td>
        </tr>
        <tr v-else-if="!lista.length">
          <td colspan="10">
            Nenhum resultado encontrado.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
