<template>
  <header class="flex spacebetween center mb2">
    <TítuloDePágina />

    <hr class="ml2 f1">

    <SmaeLink
      :to="{ name: 'equipesCriar' }"
      class="btn big ml1"
    >
      Nova Equipe
    </SmaeLink>
  </header>

  <div class="flex center mb2 spacebetween">
    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="lista"
      class="mr1"
    />
    <hr class="ml2 f1">
  </div>
  <table class="tablemain">
    <col>
    <col>
    <col>
    <col>
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th> Nome </th>
        <th> Órgão</th>
        <th> Tipo de grupo </th>
        <th> Participantes </th>
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in listaFiltradaPorTermoDeBusca"
        :key="item.id"
      >
        <td>{{ item.titulo }}</td>
        <td>{{ item.orgao.sigla }}</td>
        <td>{{ tipoDePerfil[item.perfil].nome || '' }}</td>
        <td v-if="item.participantes.length">
          <span>
            {{ item.participantes.map(item => item.nome_exibicao).join(', ') }}
          </span>
        </td>
        <td
          v-else
          class="tc"
        >
          -
        </td>
        <td class="tr nowrap">
          <SmaeLink
            :to="{ name: 'equipesEditar', params: { equipeId: item.id } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_edit" />
            </svg>
          </SmaeLink>

          <button
            class="like-a__text ml1"
            arial-label="excluir"
            title="excluir"
            @click="excluirGrupo(item.id, item.titulo)"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_waste" />
            </svg>
          </button>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="3">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="6">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="6">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import SmaeLink from '@/components/SmaeLink.vue';
import LocalFilter from '@/components/LocalFilter.vue';

import { useAlertStore } from '@/stores/alert.store';
import { useEquipesStore } from '@/stores/equipes.store';

import tipoDePerfil from '@/consts/tipoDePerfil';

const listaFiltradaPorTermoDeBusca = ref([]);

const alertStore = useAlertStore();
const equipesStore = useEquipesStore();

const { lista, chamadasPendentes, erro } = storeToRefs(equipesStore);

async function excluirGrupo(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await equipesStore.excluirItem(id)) {
        equipesStore.$reset();
        equipesStore.buscarTudo({});
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

equipesStore.$reset();
equipesStore.buscarTudo({ });
</script>

<style></style>
