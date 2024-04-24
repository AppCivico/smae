<script setup>
import { onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { usePanoramaTransferenciasStore } from '@/stores/panoramaTransferencias.store';

const panoramaTransferenciasStore = usePanoramaTransferenciasStore();
const { chamadasPendentes, erro, lista } = storeToRefs(
  panoramaTransferenciasStore,
);
panoramaTransferenciasStore.buscarTudo();

onUnmounted(() => {
  panoramaTransferenciasStore.$reset();
});
</script>
<template>
  <Dashboard>
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
                  params: { transferenciaId: item.transferencia_id },
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
            <td colspan="4">
              Carregando
            </td>
          </tr>
          <tr v-else-if="erro">
            <td colspan="4">
              Erro: {{ erro }}
            </td>
          </tr>
          <tr v-else-if="!lista.length">
            <td colspan="4">
              Nenhum resultado encontrado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Dashboard>
</template>
@/stores/panoramaTransferencias.store
