<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />

    <hr class="ml2 f1">

    <router-link
      :to="{ name: 'classificacao.novo' }"
      class="btn big ml1"
    >
      Nova classificação
    </router-link>
  </div>

  <table class="tablemain">
    <colgroup>
      <col>
      <col>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </colgroup>

    <thead>
      <tr>
        <th> Nome </th>
        <th> Esfera </th>
        <th> Tipo </th>
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
        <td>{{ item.transferencia_tipo.esfera }}</td>
        <td>{{ item.transferencia_tipo.nome }}</td>
        <td>
          <button
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirClassificacao(item.id, item.nome)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
        <td>
          <router-link
            :to="{ name: 'classificacao.editar', params: { classificacaoId: item.id } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
      </tr>
      <tr v-if="erro">
        <td colspan="5">
          Erro: {{ erro }}
        </td>
      </tr>

      <tr v-else-if="!lista.length">
        <td colspan="5">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { storeToRefs } from 'pinia';

import { onMounted } from 'vue';
import { useAlertStore } from '@/stores/alert.store';
import { useClassificacaoStore } from '@/stores/classificacao.store';

const alertStore = useAlertStore();
const classificacaoStore = useClassificacaoStore();

const { lista, erro } = storeToRefs(classificacaoStore);

async function excluirClassificacao(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await classificacaoStore.deletarItem(id)) {
        classificacaoStore.$reset();
        classificacaoStore.buscarTudo();
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

onMounted(() => {
  classificacaoStore.buscarTudo();
});
</script>

<style></style>
