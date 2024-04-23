<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';
import { useTipoDeNotasStore } from '@/stores/tipoNotas.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

const status = {
  Programado: {
    value: 'Programado',
    text: 'Programado',
  },
  Em_Curso: {
    value: 'Em_Curso',
    text: 'Em curso',
  },
  Suspenso: {
    value: 'Suspenso',
    text: 'Suspenso',
  },
  Cancelado: {
    value: 'Cancelado',
    text: 'Cancelado',
  },
};

// TODO: pegar transferenciaId do $route
const props = defineProps({
  transferenciaId: {
    type: [String, Number],
    default: 0,
  },
});

const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();
const { emFoco: transferênciaEmFoco } = storeToRefs(TransferenciasVoluntarias);
const blocoStore = useBlocoDeNotasStore();
const { lista: listaNotas, erro, chamadasPendentes } = storeToRefs(blocoStore);
const tipoStore = useTipoDeNotasStore();
const { lista: listaTipo } = storeToRefs(tipoStore);

const statusSelecionado = ref('');

const blocosToken = computed(
  () => transferênciaEmFoco?.value?.bloco_nota_token,
);

async function iniciar() {
  if (props.transferenciaId !== transferênciaEmFoco.value.id) {
    await TransferenciasVoluntarias.buscarItem(props.transferenciaId);
  }
  blocoStore.buscarTudo(blocosToken.value);
}

async function excluirNota(id) {
  useAlertStore().confirmAction(
    'Deseja mesmo remover a nota?',
    async () => {
      if (await blocoStore.excluirItem(id)) {
        blocoStore.$reset();
        blocoStore.buscarTudo(blocosToken.value);
        useAlertStore().success('Nota removida.');
      }
    },
    'Remover',
  );
}

function editarNota(id) {
  blocoStore.buscarItem(id);
}

watch(statusSelecionado, (novoValor) => {
  blocoStore.buscarTudo(blocosToken.value, { status: novoValor });
});

iniciar();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h2>Notas</h2>
    <hr class="ml2 f1">
    <router-link
      :to="{ TransferenciasVoluntariasNotas }"
      class="btn ml2"
    >
      Nova nota
    </router-link>
  </div>
  <div class="mb1">
    <label class="label">Filtrar por status</label>
    <select
      v-model="statusSelecionado"
      class="inputtext light mb1"
    >
      <option value>
        Selecionar
      </option>
      <option
        v-for="(item, key) in Object.values(status)"
        :key="key"
        :value="item.value"
      >
        {{ item.text }}
      </option>
    </select>
  </div>
  <table class="tablemain mb1">
    <col>
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>Nota</th>
        <th>Status</th>
        <th>Tipo</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(item, key) in listaNotas"
        :key="key"
      >
        <td>
          {{ item.nota }}
        </td>
        <td class="cell--nowrap">
          {{ status[item.status]?.text || item.status }}
        </td>
        <td>
          {{ listaTipo.find((tipo) => tipo.id === item.tipo_nota_id)?.codigo }}
        </td>
        <td>
          <button
            class="like-a__text"
            arial-label="Excluir"
            title="Excluir"
            @click="excluirNota(item.id_jwt)"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_remove" />
            </svg>
          </button>
        </td>
        <td>
          <button
            arial-label="Editar"
            title="Editar"
            class="like-a__text"
            @click="editarNota(item.id_jwt)"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_edit" />
            </svg>
          </button>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.listaNotas">
        <td colspan="10">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="10">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!listaNotas.length">
        <td colspan="10">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
