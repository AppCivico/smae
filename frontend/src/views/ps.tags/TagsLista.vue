<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || "Tags" }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'planosSetoriaisNovaTag' }"
      class="btn big ml1"
    >
      Nova tag
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
        <th>Tags</th>
        <th>Categoria</th>
        <th>Ícone</th>
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
        <td>{{ item.ods.titulo }}</td>
        <td>
          <a
            v-if="item.icone"
            :href="baseUrl + '/download/' + item?.icone"
            download
          >
            <img
              :src="`${baseUrl}/download/${item.icone}?inline=true`"
              width="15"
              class="ib mr1"
            >
          </a>
          <span v-else>-</span>
        </td>
        <td>
          <router-link
            :to="{ name: 'planosSetoriaisEditarTag', params: { tagId: item.id } }"
            class="tprimary"
          >
            <svg
              width="18"
              height="18"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
        <td>
          <button
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            @click="excluirTag(item.id, item.descricao)"
          >
            <svg
              width="18"
              height="18"
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
import { useTagsPsStore } from '@/stores/tagsPs.store';
import { storeToRefs } from 'pinia';
import { defineOptions } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({
  inheritAttrs: false,
});

const route = useRoute();
const alertStore = useAlertStore();
const tagsStore = useTagsPsStore();
const baseUrl = `${import.meta.env.VITE_API_URL}`;

const { lista, chamadasPendentes, erro } = storeToRefs(tagsStore);

async function excluirTag(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await tagsStore.excluirItem(id)) {
        tagsStore.$reset();
        tagsStore.buscarTudo({ pdm_id: route.params.planoSetorialId });
        alertStore.success(`Tag "${descricao}" removida.`);
      }
    },
    'Remover',
  );
}

tagsStore.$reset();
tagsStore.buscarTudo({ pdm_id: route.params.planoSetorialId });

</script>

<style></style>
