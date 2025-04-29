<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';
import removerHtml from '@/helpers/html/removerHtmlrHtml';
import { useAlertStore } from '@/stores/alert.store';
import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';
import { useTipoDeNotasStore } from '@/stores/tipoNotas.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import SmaeLink from '../SmaeLink.vue';

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
  Encerrado: {
    value: 'Encerrado',
    text: 'Encerrado',
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
const {
  lista: listaNotas, erro, chamadasPendentes,
} = storeToRefs(blocoStore);

const tipoStore = useTipoDeNotasStore();
const { lista: listaTipo } = storeToRefs(tipoStore);

const statusSelecionado = ref('');

const blocosToken = ref([]);

onMounted(async () => {
  await TransferenciasVoluntarias.buscarItem(props.transferenciaId);
  if (props.transferenciaId && transferênciaEmFoco.value) {
    blocosToken.value = transferênciaEmFoco.value.bloco_nota_token;
    tipoStore.buscarTudo();
    blocoStore.buscarTudo(blocosToken?.value);
  }
});

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

watch(statusSelecionado, (novoValor) => {
  blocoStore.buscarTudo(blocosToken.value, { status: novoValor });
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route?.meta?.título || "Notas" }}</h1>
    <hr class="ml2 f1">
    <SmaeLink
      :to="{ name: 'notasCriar' }"
      class="btn big ml1"
    >
      Nova nota
    </SmaeLink>
  </div>

  <div class="mb1">
    <label class="label">Filtrar por status</label>
    <select
      v-model="statusSelecionado"
      class="inputtext light mb1"
    >
      <option value>
        Programadas e Em curso
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
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>Status</th>
        <th>Tipo</th>
        <th>Data</th>
        <th>Rever Em</th>
        <th />
        <th />
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
        <td>
          <SmaeLink
            v-if="item?.pode_editar && item?.id_jwt"
            :to="{ name: 'notasEditar', params: { notaId: item.id_jwt } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </SmaeLink>
        </td>
        <td>
          <button
            v-if="item.pode_editar"
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
      </tr>
      <tr>
        <td colspan="6">
          <SmaeLink
            v-if="item?.id_jwt"
            :to="{
              name: 'notaDetalhe',
              params: { notaId: item?.id_jwt },
            }"
            class="tprimary"
          >
            {{ removerHtml(item?.nota) }}
          </SmaeLink>
        </td>
      </tr>
    </tbody>
    <tbody v-if="chamadasPendentes.lista || !listaNotas.length || erro">
      <tr v-if="chamadasPendentes.lista">
        <td colspan="6">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="6">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!listaNotas.length">
        <td colspan="6">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
