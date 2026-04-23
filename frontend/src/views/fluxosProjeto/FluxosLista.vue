<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { filtroWorkflow } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useAlertStore } from '@/stores/alert.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';

const route = useRoute();

const tipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const fluxosProjetoStore = useFluxosProjetosStore();
const {
  lista, chamadasPendentes, erro, paginacao,
} = storeToRefs(fluxosProjetoStore);
const {
  lista: tipoTransferenciaComoLista,
  tiposDeTransferenciaPorId,
  tiposDeTransferenciaPorEsfera,
} = storeToRefs(tipoDeTransferenciaStore);

const alertStore = useAlertStore();

const parametrosTemporariosDeBusca = ref({});

const camposDeFiltro = computed(() => [
  {
    campos: {
      esfera: {
        tipo: 'select',
        opcoes: Object.values(esferasDeTransferencia).map((e) => ({ id: e.valor, label: e.nome })),
      },
      transferencia_tipo_id: {
        tipo: 'select',
        opcoes: (parametrosTemporariosDeBusca.value.esfera
          ? tiposDeTransferenciaPorEsfera
            .value[
              parametrosTemporariosDeBusca.value.esfera
            ]?.map((t) => ({ id: t.id, label: t.nome }))
          : tipoTransferenciaComoLista.value.map((t) => ({ id: t.id, label: t.nome }))) || []
        ,
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

const parametrosDeBusca = computed(() => ({
  esfera: route.query.esfera || undefined,
  transferencia_tipo_id: route.query.transferencia_tipo_id || undefined,
  ativo: route.query.ativo || undefined,
  pagina: route.query.pagina || undefined,
  ipp: route.query.ipp || 15,
  token_paginacao: route.query.token_paginacao || undefined,
}));

const parametrosSerializados = computed(() => JSON.stringify(parametrosDeBusca.value));

watch(parametrosSerializados, () => {
  fluxosProjetoStore.buscarTudo(parametrosDeBusca.value);
}, { immediate: true });

tipoDeTransferenciaStore.buscarTudo();
</script>

<template>
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink
        :to="{ name: 'fluxosCriar' }"
        class="btn big ml2"
      >
        Novo fluxo
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <FiltroParaPagina
    v-model="parametrosTemporariosDeBusca"
    class="mb2"
    :formulario="camposDeFiltro"
    :schema="filtroWorkflow"
    :carregando="chamadasPendentes.lista"
  />

  <p v-if="!chamadasPendentes.lista">
    Exibindo <strong>{{ lista.length }}</strong> resultados de {{ paginacao.totalRegistros }}.
  </p>

  <SmaeTable
    :dados="lista || []"
    :colunas="[
      { chave: 'nome', label: 'Nome' },
      { chave: 'esfera', label: 'Esfera' },
      { chave: 'transferencia_tipo.nome', label: 'Tipo de transferência' },
      { chave: 'termino', label: 'Fim da vigência' },
      { chave: 'ativo', label: 'Ativo' },
      { chave: 'inicio', label: 'Início da vigência' },
    ]"
    :carregando="chamadasPendentes.lista"
    :erro="erro"
    :rota-editar="({ id }) => ({
      name: 'fluxosEditar',
      params: { fluxoId: id }
    })"
    parametro-no-objeto-para-excluir="nome"
    @deletar="({ id }) => excluirFluxo(id)"
  >
    <template #celula:esfera="{ linha }">
      {{ tiposDeTransferenciaPorId[linha.transferencia_tipo.id]?.esfera || '-' }}
    </template>

    <template #celula:termino="{ linha }">
      {{ linha.termino ? dateToField(linha.termino) : '-' }}
    </template>

    <template #celula:ativo="{ linha }">
      {{ linha.ativo ? 'Sim' : 'Não' }}
    </template>

    <template #celula:inicio="{ linha }">
      {{ linha.inicio ? dateToField(linha.inicio) : '-' }}
    </template>
  </SmaeTable>

  <MenuPaginacao
    class="mt2"
    v-bind="paginacao"
  />

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
