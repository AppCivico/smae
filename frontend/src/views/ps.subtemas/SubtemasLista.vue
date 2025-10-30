<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'planosSetoriaisNovoSubtema' }"
      class="btn big ml1"
    >
      Novo {{ titulo }}
    </router-link>
  </div>
  <table class="tablemain">
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th> {{ titulo }} </th>
        <th />
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.descricao }}</td>
        <td>
          <router-link
            :to="{ name: 'planosSetoriaisEditarSubtema', params: { subtemaId: item.id } }"
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
            @click="excluirSubtema(item.id, item.descricao)"
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

<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useSubtemasPsStore } from '@/stores/subtemasPs.store';
import { storeToRefs } from 'pinia';
import { computed, defineOptions } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({
  inheritAttrs: false,
});

const route = useRoute();
const titulo = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : route?.meta?.título;
const alertStore = useAlertStore();
const subtemasStore = useSubtemasPsStore();
const { lista, chamadasPendentes, erro } = storeToRefs(subtemasStore);

async function excluirSubtema(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await subtemasStore.excluirItem(id)) {
        subtemasStore.$reset();
        subtemasStore.buscarTudo({ pdm_id: route.params.planoSetorialId });
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

subtemasStore.$reset();
subtemasStore.buscarTudo({ pdm_id: route.params.planoSetorialId });
</script>

<style></style>
