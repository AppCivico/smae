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
  <!-- route.params.planoSetorialId: {{ route.params.planoSetorialId }} -->
  <table class="tablemain">
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>Tag</th>
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
            :to="{ name: 'planosSetoriaisEditarTag', params: { tagId: item.id } }"
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
            @click="excluirTag(item.id)"
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
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useTagsPsStore } from '@/stores/tagsPs.store';

const route = useRoute();
const alertStore = useAlertStore();
const tagsStore = useTagsPsStore();

const { lista, chamadasPendentes, erro } = storeToRefs(tagsStore);

async function excluirTag(id) {
  alertStore.confirmAction(
    'Deseja mesmo remover esse item?',
    async () => {
      if (await tagsStore.excluirItem(id)) {
        tagsStore.$reset();
        tagsStore.buscarTudo({ pdm_id: route.params.planoSetorialId });
        alertStore.success('Tag removia.');
      }
    },
    'Remover',
  );
}

tagsStore.$reset();
tagsStore.buscarTudo({ pdm_id: route.params.planoSetorialId });

</script>

<style></style>
