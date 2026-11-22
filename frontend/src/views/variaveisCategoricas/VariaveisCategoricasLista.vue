<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

import { useAlertStore } from '@/stores/alert.store';
import { useVariaveisCategoricasStore } from '@/stores/variaveisCategoricas.store';

const route = useRoute();

const alertStore = useAlertStore();
const variaveisCategoricasStore = useVariaveisCategoricasStore();
const { lista, chamadasPendentes, erro } = storeToRefs(variaveisCategoricasStore);

function mensagemDeExclusao(descricao, totalVariaveis) {
  if (!totalVariaveis) {
    return `Deseja mesmo remover "${descricao}"?`;
  }

  return `"${descricao}" é utilizado em ${totalVariaveis} ${totalVariaveis === 1 ? 'variável' : 'variáveis'}. Deseja mesmo remover?`;
}

async function excluirAssunto(id, descricao, totalVariaveis) {
  alertStore.confirmAction(
    mensagemDeExclusao(descricao, totalVariaveis),
    async () => {
      if (await variaveisCategoricasStore.excluirItem(id)) {
        variaveisCategoricasStore.$reset();
        variaveisCategoricasStore.buscarTudo({ pdm_id: route.params.planoSetorialId });
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

variaveisCategoricasStore.$reset();
variaveisCategoricasStore.buscarTudo();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'variaveisCategoricas.criar' }"
      class="btn big ml1"
    >
      Novo tipo de variável categórica
    </router-link>
  </div>

  <table class="tablemain">
    <colgroup>
      <col>
      <col>
      <col>
      <col>
      <col class="col--number">
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </colgroup>
    <thead>
      <tr>
        <th> Titulo </th>
        <th> Espécie </th>
        <th> Descrição </th>
        <th> Valores </th>
        <th class="cell--number">
          Variáveis
        </th>
        <th />
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.titulo }}</td>
        <td>{{ item.tipo }}</td>
        <td>{{ item.descricao }}</td>
        <td>
          {{
            item.valores
              .map(valor => valor.titulo)
              .join(', ')
              || '-'
          }}
        </td>
        <td class="cell--number">
          <SmaeLink
            v-if="item.total_variaveis"
            :to="{
              name: 'variaveisListar',
              query: { variavel_categorica_id: item.id },
            }"
            class="tipinfo tprimary"
          >
            {{ item.total_variaveis }}
            <div>Ver variáveis</div>
          </SmaeLink>
          <template v-else>
            0
          </template>
        </td>
        <td>
          <router-link
            v-if="item.pode_editar"
            :to="{ name: 'variaveisCategoricas.editar', params: { variavelId: item.id } }"
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
            v-if="item.pode_editar"
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            @click="excluirAssunto(item.id, item.titulo, item.total_variaveis)"
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

<style></style>
