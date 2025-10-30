<script setup>
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';
import { useAlertStore } from '@/stores/alert.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import { storeToRefs } from 'pinia';
import dateToField from '@/helpers/dateToField';

const tipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const fluxosProjetoStore = useFluxosProjetosStore();
const { lista, chamadasPendentes, erro} = storeToRefs(fluxosProjetoStore);
const { lista: tipoTransferenciaComoLista } = storeToRefs(tipoDeTransferenciaStore);

const alertStore = useAlertStore();

async function excluirFluxo(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await fluxosProjetoStore.excluirItem(id)) {
      fluxosProjetoStore.buscarTudo();
      alertStore.success('Fluxo removido.');
    }
  }, 'Remover');
}

function ordenarListaAlfabeticamente() {
   lista.value.sort((a, b) => a.nome.localeCompare(b.nome));
}

const getTipoTransferencia = (tipoTransferenciaId) => {
  return tipoTransferenciaComoLista.value.find(t => t.id === tipoTransferenciaId);
};

const getEsfera = (tipoTransferenciaId) => {
  const tipoTransferencia = getTipoTransferencia(tipoTransferenciaId);
  return tipoTransferencia ? tipoTransferencia.esfera : '-';
};

tipoDeTransferenciaStore.buscarTudo()
fluxosProjetoStore.buscarTudo().then(ordenarListaAlfabeticamente);
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
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.nome }}</td>
        <td>{{ getEsfera(item.transferencia_tipo.id) }}</td>
        <td>{{ item.transferencia_tipo.nome }}</td>
        <td>{{ item.termino? dateToField(item.termino) : '-'}}</td>
        <td>{{ item.ativo? 'Sim' : 'Não' }}</td>
        <td>{{ item.inicio? dateToField(item.inicio) : '-'}}</td>
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
