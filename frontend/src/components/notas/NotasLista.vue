<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';
import { useTipoDeNotasStore } from '@/stores/tipoNotas.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { storeToRefs } from 'pinia';

import {
  computed, ref, watch, onMounted,
} from 'vue';

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
// eslint-disable-next-line prefer-const
let exibeForm = ref(false);

const blocosToken = ref([]);

onMounted(async () => {
  await TransferenciasVoluntarias.buscarItem(props.transferenciaId);
  if (props.transferenciaId && transferênciaEmFoco.value) {
    blocosToken.value = transferênciaEmFoco.value.bloco_nota_token;
    tipoStore.buscarTudo();
    blocoStore.buscarTudo(blocosToken?.value);
  }
});
const podeEditarDisponivel = computed(() => listaNotas.value.some((item) => item.pode_editar));

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
  exibeForm.value = true;
  blocoStore.buscarItem(id);
}
watch(statusSelecionado, (novoValor) => {
  blocoStore.buscarTudo(blocosToken.value, { status: novoValor });
});

</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route?.meta?.título || "Notas" }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'notasCriar' }"
      class="btn big ml1"
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
  <table class="tablemain mb1 tbody-zebra">
    <col>
    <col>
    <col>
    <col>
    <col
      v-if="podeEditarDisponivel"
      class="col--botão-de-ação"
    >
    <col
      v-if="podeEditarDisponivel"
      class="col--botão-de-ação"
    >
    <thead>
      <tr>
        <th>Status</th>
        <th>Tipo</th>
        <th>Data</th>
        <th>Rever Em</th>
        <th v-if="podeEditarDisponivel" />
        <th v-if="podeEditarDisponivel" />
      </tr>
    </thead>
    <tbody
      v-for="(item, key) in listaNotas"
      :key="key"
    >
      <tr>
        <td class="cell--nowrap">
          {{ status[item.status]?.text || item.status }}
        </td>
        <td>
          {{ listaTipo.find((tipo) => tipo.id === item.tipo_nota_id)?.codigo }}
        </td>
        <td>
          {{
            item.data_nota
              ? new Date(item.data_nota).toLocaleDateString("pt-BR")
              : " - "
          }}
        </td>
        <td>
          {{
            item.rever_em
              ? new Date(item.rever_em).toLocaleDateString("pt-BR")
              : " - "
          }}
        </td>
        <td v-if="item.pode_editar">
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
        <td v-if="item.pode_editar">
          <router-link
            :to="{ name: 'notasEditar', params: { notaId: item.id_jwt } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
      </tr>
      <tr>
        <td :colspan="item.pode_editar ? 6 : 4">
          {{ item.nota }}
        </td>
      </tr>
    </tbody>
    <tbody v-if="chamadasPendentes.lista || !listaNotas.length || erro">
      <tr v-if="chamadasPendentes.lista">
        <td :colspan="podeEditarDisponivel ? 6 : 4">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td :colspan="podeEditarDisponivel ? 6 : 4">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!listaNotas.length">
        <td :colspan="podeEditarDisponivel ? 6 : 4">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
