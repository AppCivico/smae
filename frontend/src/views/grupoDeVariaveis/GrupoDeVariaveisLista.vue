<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'grupoDeVariaveisCriar' }"
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
        <th> Nome </th>
        <th> Órgão</th>
        <th> Tipo de grupo </th>
        <th> Participantes </th>
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
        <td>{{ item.orgao.sigla }}</td>
        <td>{{ item.perfil }}</td>
        <td
          v-if="item.participantes.length"
        >
          <span
            v-for="(participante, index) in item.participantes"
            :key="index"
          >
            {{ participante?.nome_exibicao }}
          </span>
        </td>
        <td
          v-else
          class="tc"
        >
          -
        </td>
        <td>
          <router-link
            :to="{ name: 'grupoDeVariaveisEditar', params: { grupoDeVariaveisId: item.id } }"
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
            @click="excluirGrupo(item.id, item.titulo)"
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
import { computed } from 'vue';
import { useAlertStore } from '@/stores/alert.store';

import { useGrupoDeVariaveisStore } from '@/stores/grupoDeVariaveis.store';

const route = useRoute();
const titulo = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : route?.meta?.título;
const alertStore = useAlertStore();
const grupoDeVariaveisStore = useGrupoDeVariaveisStore();

const { lista, chamadasPendentes, erro } = storeToRefs(grupoDeVariaveisStore);

async function excluirGrupo(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await grupoDeVariaveisStore.excluirItem(id)) {
        grupoDeVariaveisStore.$reset();
        grupoDeVariaveisStore.buscarTudo({});
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

grupoDeVariaveisStore.$reset();
grupoDeVariaveisStore.buscarTudo({ });
</script>

<style></style>
