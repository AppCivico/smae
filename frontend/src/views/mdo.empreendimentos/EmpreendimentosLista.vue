<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || "Empreendimentos" }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'mdoEmpreendimentosCriar' }"
      class="btn big ml1"
    >
      Novo empreendimento
    </router-link>
  </div>
  <table class="tablemain">
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>identificador</th>
        <th>nome</th>
        <th />
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.identificador }}</td>
        <td>{{ item.nome }}</td>
        <td>
          <router-link
            :to="{ name: 'mdoEmpreendimentosEditar', params: { empreendimentoId: item.id } }"
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
            @click="excluirEmpreendimento(item.id, item.identificador)"
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
import { useRoute } from 'vue-router';

import { useAlertStore } from '@/stores/alert.store';
import { useEmpreendimentosStore } from '@/stores/empreendimentos.store';

const route = useRoute();
const alertStore = useAlertStore();
const empreendimentosStore = useEmpreendimentosStore();
const { lista, chamadasPendentes, erro } = storeToRefs(empreendimentosStore);

async function excluirEmpreendimento(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await empreendimentosStore.excluirItem(id)) {
        empreendimentosStore.$reset();
        empreendimentosStore.buscarTudo();
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

empreendimentosStore.$reset();
empreendimentosStore.buscarTudo();
</script>

<style></style>
