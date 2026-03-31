<script setup>
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { filtroWorkflow } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useAlertStore } from '@/stores/alert.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';

const route = useRoute();

const tipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const fluxosProjetoStore = useFluxosProjetosStore();
const { lista, chamadasPendentes, erro } = storeToRefs(fluxosProjetoStore);
const { lista: tipoTransferenciaComoLista } = storeToRefs(tipoDeTransferenciaStore);

const alertStore = useAlertStore();

const getTipoTransferencia = (tipoTransferenciaId) => (
  tipoTransferenciaComoLista.value.find((t) => t.id === tipoTransferenciaId)
);

const getEsfera = (tipoTransferenciaId) => {
  const tipoTransferencia = getTipoTransferencia(tipoTransferenciaId);
  return tipoTransferencia ? tipoTransferencia.esfera : '-';
};

const camposDeFiltro = computed(() => [
  {
    campos: {
      esfera: {
        tipo: 'select',
        opcoes: Object.values(esferasDeTransferencia).map((e) => ({ id: e.valor, label: e.nome })),
      },
      transferencia_tipo_id: {
        tipo: 'select',
        opcoes: tipoTransferenciaComoLista.value.map((t) => ({ id: t.id, label: t.nome })),
      },
      ativo: {
        tipo: 'select',
        opcoes: [{ id: 'true', label: 'Sim' }, { id: 'false', label: 'Não' }],
      },
    },
  },
]);

async function excluirFluxo(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await fluxosProjetoStore.excluirItem(id)) {
      fluxosProjetoStore.buscarTudo();
      alertStore.success('Fluxo removido.');
    }
  }, 'Remover');
}

watch(
  () => [
    route.query.transferencia_tipo_id,
    route.query.ativo,
  ],
  () => {
    fluxosProjetoStore.buscarTudo({
      esfera: route.query?.esfera,
      transferencia_tipo_id: route.query?.transferencia_tipo_id,
      ativo: route.query?.ativo,
    });
  },
  { immediate: true },
);

tipoDeTransferenciaStore.buscarTudo();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'fluxosCriar' }"
      class="btn big ml2"
    >
      Novo fluxo
    </router-link>
  </div>

  <FiltroParaPagina
    class="mb2"
    :formulario="camposDeFiltro"
    :schema="filtroWorkflow"
    :carregando="chamadasPendentes.lista"
  />

  <table class="tablemain">
    <colgroup>
      <col>
      <col>
      <col>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </colgroup>
    <thead>
      <tr>
        <th>
          Nome
        </th>
        <th>
          Esfera
        </th>
        <th>
          Tipo de transferência
        </th>
        <th>
          Fim da vigência
        </th>
        <th>
          Ativo
        </th>
        <th>
          Início da vigência
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista || []"
        :key="item.id"
      >
        <td>{{ item.nome }}</td>
        <td>{{ getEsfera(item.transferencia_tipo.id) }}</td>
        <td>{{ item.transferencia_tipo.nome }}</td>
        <td>{{ item.termino? dateToField(item.termino) : '-' }}</td>
        <td>{{ item.ativo? 'Sim' : 'Não' }}</td>
        <td>{{ item.inicio? dateToField(item.inicio) : '-' }}</td>
        <td>
          <button
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            @click="excluirFluxo(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
        <td>
          <router-link
            :to="{
              name: 'fluxosEditar',
              params: { fluxoId: item.id }
            }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
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

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
