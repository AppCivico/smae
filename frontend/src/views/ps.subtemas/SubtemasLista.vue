<template>
  <header class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <SmaeLink
      v-if="psEmFoco?.pode_editar"
      :to="{ name: `${route.meta.entidadeMãe}.planosSetoriaisNovoSubtema` }"
      class="btn big ml1"
    >
      Novo {{ titulo }}
    </SmaeLink>
  </header>

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
          <SmaeLink
            v-if="psEmFoco?.pode_editar"
            :to="{
              name: `${route.meta.entidadeMãe}.planosSetoriaisEditarSubtema`,
              params: { subtemaId: item.id }
            }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </SmaeLink>
        </td>
        <td>
          <button
            v-if="temPermissãoPara('CadastroSubTemaPS.remover') && psEmFoco?.pode_editar"
            class="like-a__text"
            arial-label="excluir"
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
import { storeToRefs } from 'pinia';
import { computed, defineOptions } from 'vue';
import { useRoute } from 'vue-router';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useSubtemasPsStore } from '@/stores/subtemasPs.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';

defineOptions({
  inheritAttrs: false,
});

const route = useRoute();
const titulo = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : route?.meta?.título;
const alertStore = useAlertStore();

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const subtemasStore = useSubtemasPsStore();
const { lista, chamadasPendentes, erro } = storeToRefs(subtemasStore);

const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe);
const { emFoco: psEmFoco } = storeToRefs(planosSetoriaisStore);

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
