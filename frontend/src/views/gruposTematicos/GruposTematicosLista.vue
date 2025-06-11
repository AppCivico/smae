<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || "Grupos temáticos" }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'grupoTematicoCriar' }"
      class="btn big ml1"
    >
      Novo grupo
    </router-link>
  </div>
  <table class="tablemain">
    <colgroup>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </colgroup>
    <thead>
      <tr>
        <th>Grupo</th>
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
            :to="{ name: 'grupoTematicoEditar', params: { grupoTematicoId: item.id } }"
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
            @click="excluirGrupoTematico(item.id, item.nome)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_waste" /></svg>
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
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';

const route = useRoute();
const alertStore = useAlertStore();
const gruposTematicosStore = useGruposTematicosStore();
const { lista, chamadasPendentes, erro } = storeToRefs(gruposTematicosStore);

async function excluirGrupoTematico(id, item) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${item}"?`,
    async () => {
      if (await gruposTematicosStore.excluirItem(id)) {
        gruposTematicosStore.$reset();
        gruposTematicosStore.buscarTudo();
        alertStore.success('Grupo temático removido.');
      }
    },
    'Remover',
  );
}

gruposTematicosStore.$reset();
gruposTematicosStore.buscarTudo();
</script>

<style></style>
