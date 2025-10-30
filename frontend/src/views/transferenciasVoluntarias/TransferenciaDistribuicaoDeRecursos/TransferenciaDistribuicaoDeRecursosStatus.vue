<template>
  <div>
    <div class="flex spacebetween center mb2 mt2">
      <TítuloDePágina />

      <hr class="ml2 f1">

      <CheckClose
        :formulario-sujo="formularioSujo"
        :apenas-emitir="true"
        @close="voltarTela"
      />
    </div>

    <SmaeTable
      class="mb2"
      :dados="historicoStatus"
      :colunas="[
        { chave: 'data_troca', label: 'Data', formatador: dateToDate },
        { chave: 'status', label: 'Status', },
        { chave: 'orgao_responsavel.sigla', label: 'Órgão', },
        { chave: 'nome_responsavel', label: 'Responsável', },
        { chave: 'motivo', label: 'Motivo', },
        { chave: 'dias_no_status', label: 'Total de dias no status', },
        { chave: 'editar' },
      ]"
    >
      <template #celula:status="{ linha }">
        {{ (linha.status_base || linha.status_customizado).nome }}
      </template>

      <template #celula:editar="{ linha }">
        <button
          v-if="linha.id === registroMaisRecente?.id"
          class="like-a__text"
          aria-label="editar"
          title="editar"
          type="button"
          @click="abrirModalStatus(linha)"
        >
          <svg
            width="20"
            height="20"
          >
            <use xlink:href="#i_edit" />
          </svg>
        </button>

        <span v-else />
      </template>
    </SmaeTable>

    <button
      v-if="distribuiçãoEmFoco"
      class="like-a__text addlink"
      type="button"
      @click="abrirModalStatus(null)"
    >
      <svg
        width="20"
        height="20"
      >
        <use xlink:href="#i_+" />
      </svg>Adicionar status
    </button>

    <TransferenciasDistribuicaoStatusCriarEditar
      v-if="exibirModalStatus"
      :transferencia-workflow-id="transferenciasVoluntariaEmFoco?.workflow_id || 0"
      :distribuicao-id="distribuiçãoEmFoco?.id"
      :status-em-foco="statusEmFoco"
      @fechar-modal="fecharModalStatus"
      @salvou-status="fecharModalStatus(true)"
    />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useIsFormDirty } from 'vee-validate';
import {
  computed,
  ref,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import dateToDate from '@/helpers/dateToDate';
import TransferenciasDistribuicaoStatusCriarEditar from './TransferenciasDistribuicaoStatusCriarEditar.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';

const distribuicaoRecursos = useDistribuicaoRecursosStore();
const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();

const { emFoco: distribuiçãoEmFoco, chamadasPendentes } = storeToRefs(distribuicaoRecursos);
const { emFoco: transferenciasVoluntariaEmFoco } = storeToRefs(TransferenciasVoluntarias);

const router = useRouter();
const { params } = useRoute();
const formularioSujo = useIsFormDirty();

const statusEmFoco = ref(null);
const exibirModalStatus = ref(false);

const historicoStatus = computed(() => {
  if (!distribuiçãoEmFoco.value?.historico_status) {
    return [];
  }

  const status = [...distribuiçãoEmFoco.value.historico_status];

  return status.sort((a, b) => {
    const statusA = a.status_base || b.status_customizado;
    const statusB = a.status_base || b.status_customizado;

    return statusA?.nome.localeCompare(statusB?.nome);
  });
});

const registroMaisRecente = computed(() => historicoStatus.value
  .toSorted((a, b) => {
    const dataA = a.data_troca;
    const dataB = b.data_troca;
    if (dataA < dataB) {
      return 1;
    }
    if (dataA > dataB) {
      return -1;
    }
    return 0;
  })[0]);

function voltarTela() {
  router.push({
    name: 'TransferenciaDistribuicaoDeRecursos.Lista',
    params: {
      ...params,
    },
  });
}

function abrirModalStatus(statusItem = null) {
  statusEmFoco.value = statusItem;
  exibirModalStatus.value = true;
}

function fecharModalStatus(carregar = false) {
  statusEmFoco.value = null;
  exibirModalStatus.value = false;

  if (carregar) {
    distribuicaoRecursos.buscarItem(distribuiçãoEmFoco.value.id);
  }
}
</script>
