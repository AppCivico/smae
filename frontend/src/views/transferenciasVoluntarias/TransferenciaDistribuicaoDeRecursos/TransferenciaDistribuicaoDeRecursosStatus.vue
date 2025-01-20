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

    <table class="tablemain mb2">
      <thead>
        <tr>
          <th>Data</th>
          <th>Status</th>
          <th>Órgão</th>
          <th>Responsável</th>
          <th>Motivo</th>
          <th>Total de dias no status</th>
          <th />
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="item in historicoStatus"
          :key="item.id"
        >
          <td>
            {{ item.data_troca ? dateToDate(item.data_troca) : '' }}
          </td>
          <td>{{ item.status_base?.nome || item.status_customizado?.nome }}</td>
          <td>{{ item.orgao_responsavel?.sigla }}</td>
          <td>{{ item.nome_responsavel }}</td>
          <td>{{ item.motivo }}</td>
          <td>{{ item.dias_no_status }}</td>
          <td>
            <button
              v-if="
                item.id === historicoStatus[historicoStatus.length - 1].id
              "
              class="like-a__text"
              arial-label="editar"
              title="editar"
              type="button"
              @click="abrirModalStatus(item)"
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

        <tr v-if="historicoStatus.length === 0">
          <td
            class="text-center"
            colspan="6"
          >
            Sem histórico de status para exibir
          </td>
        </tr>
      </tbody>
    </table>

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
import dateToDate from '@/helpers/dateToDate';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { storeToRefs } from 'pinia';
import { useIsFormDirty } from 'vee-validate';
import {
  computed, onMounted, onUnmounted, ref,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TransferenciasDistribuicaoStatusCriarEditar from './TransferenciasDistribuicaoStatusCriarEditar.vue';

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

  return distribuiçãoEmFoco.value?.historico_status;
});

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

onMounted(async () => {
  await TransferenciasVoluntarias.buscarItem(params.transferenciaId);
});

onUnmounted(() => {
  distribuicaoRecursos.$reset();
});
</script>
