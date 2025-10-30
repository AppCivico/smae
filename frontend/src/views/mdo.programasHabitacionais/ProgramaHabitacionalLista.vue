<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'mdoProgramaHabitacionalCriar' }"
      class="btn big ml1"
    >
      Novo programa habitacional
    </router-link>
  </div>

  <table class="tablemain">
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th> Nome </th>
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
            :to="{ name: 'mdoProgramaHabitacionalEditar', params: { programaHabitacionalId: item.id } }"
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
            @click="excluirProgramaHabitacional(item.id, item.nome)"
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
import { useAlertStore } from '@/stores/alert.store';
import { useProgramaHabitacionalStore } from '@/stores/programaHabitacional.store';

const alertStore = useAlertStore();
const programaHabitacionalStore = useProgramaHabitacionalStore();
const { lista, chamadasPendentes, erro } = storeToRefs(programaHabitacionalStore);

async function excluirProgramaHabitacional(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await programaHabitacionalStore.excluirItem(id)) {
        programaHabitacionalStore.$reset();
        programaHabitacionalStore.buscarTudo();
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

programaHabitacionalStore.$reset();
programaHabitacionalStore.buscarTudo();
</script>

<style></style>
