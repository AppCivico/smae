<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || "Equipamentos" }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'equipamentosCriar' }"
      class="btn big ml1"
    >
      Novo equipamento
    </router-link>
  </div>
  <table class="tablemain">
    <colgroup>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </colgroup>
    <thead>
      <tr>
        <th>Equipamento</th>
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
          <router-link
            :to="{ name: 'equipamentoEditar', params: { equipamentoId: item.id } }"
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
            aria-label="excluir"
            title="excluir"
            @click="excluirEquipamento(item.id, item.nome)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="3">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro.lista">
        <td colspan="3">
          Erro: {{ erro.lista }}
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

<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useAlertStore } from '@/stores/alert.store';
import { useEquipamentosStore } from '@/stores/equipamentos.store';

const route = useRoute();
const alertStore = useAlertStore();
const equipamentosStore = useEquipamentosStore();
const { lista, chamadasPendentes, erro } = storeToRefs(equipamentosStore);

async function excluirEquipamento(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await equipamentosStore.excluirItem(id)) {
        alertStore.success(`"${descricao}" removido.`);
        equipamentosStore.buscarTudo();
      }
    },
    'Remover',
  );
}

equipamentosStore.$reset();
equipamentosStore.buscarTudo();
</script>

<style></style>
