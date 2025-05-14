<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'tipoDeAditivosCriar' }"
      class="btn big ml1"
    >
      Novo aditivo
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
            :to="{ name: 'tipoDeAditivosEditar', params: { aditivoId: item.id } }"
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
            @click="excluirAditivo(item.id, item.nome)"
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
      <tr v-else-if="erros.lista">
        <td colspan="3">
          Erro: {{ erros.lista }}
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
import { useTipoDeAditivosStore } from '@/stores/tipoDeAditivos.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const route = useRoute();

const alertStore = useAlertStore();
const aditivosStore = useTipoDeAditivosStore();
const { lista, chamadasPendentes, erros } = storeToRefs(aditivosStore);

async function excluirAditivo(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await aditivosStore.excluirItem(id)) {
        aditivosStore.$reset();
        aditivosStore.buscarTudo({ pdm_id: route.params.planoSetorialId });
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

aditivosStore.$reset();
aditivosStore.buscarTudo();
</script>
