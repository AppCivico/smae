<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { valoresLimitesFiltro as schema } from '@/consts/formSchemas';
import { dateToShortDate } from '@/helpers/dateToDate';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import truncate from '@/helpers/texto/truncate';
import { useValoresLimitesStore } from '@/stores/valoresLimites.store';

const route = useRoute();
const valoresLimitesStore = useValoresLimitesStore();
const { lista, chamadasPendentes } = storeToRefs(valoresLimitesStore);

const campos = [
  {
    campos: {
      data_inicio_vigencia: { tipo: 'date' },
      data_fim_vigencia: { tipo: 'date' },
      observacao: { tipo: 'text' },
    },
  },
];

const listaFiltrada = computed(() => {
  if (!lista.value) return [];

  const {
    data_inicio_vigencia: filtroInicio,
    data_fim_vigencia: filtroFim,
    observacao: filtroObservacao,
  } = route.query;

  return lista.value.filter((item) => {
    if (filtroInicio && item.data_inicio_vigencia < filtroInicio) {
      return false;
    }

    if (filtroFim) {
      if (!item.data_fim_vigencia) {
        return false;
      }

      if (item.data_fim_vigencia > filtroFim) {
        return false;
      }
    }

    if (filtroObservacao) {
      const textoObservacao = (item.observacao || '').toLowerCase();
      if (!textoObservacao.includes(filtroObservacao.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
});

const colunas = [
  {
    chave: 'data_inicio_vigencia',
    label: 'Inicio da Vigência',
    formatador: (valor) => dateToField(valor),
  },
  {
    chave: 'data_fim_vigencia',
    label: 'Fim da Vigência',
    formatador: (valor) => dateToField(valor) || '-',
  },
  {
    chave: 'valor_minimo',
    label: 'Valor Mínimo',
    formatador: (valor) => `R$ ${dinheiro(valor)}`,
  },
  {
    chave: 'valor_maximo',
    label: 'Valor Máximo',
    formatador: (valor) => `R$ ${dinheiro(valor)}`,
  },
  {
    chave: 'observacao',
    label: 'Observação',
    formatador: (valor) => {
      if (!valor) {
        return '-';
      }

      return truncate(valor, 30);
    },
  },
];

function buscarDados() {
  valoresLimitesStore.buscarTudo();
}

function montarMensagemExclusao(linha) {
  return `Deseja excluir o item do período que se inicia em ${dateToShortDate(linha.data_inicio_vigencia)}?`;
}

async function excluirItem({ id }) {
  try {
    await valoresLimitesStore.excluirItem(id);
    await buscarDados();
  } catch (e) {
    console.error('Falha ao tentar excluir valor limite', e);
  }
}

onMounted(() => {
  buscarDados();
});
</script>

<template>
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink
        :to="{ name: 'valoresLimites.criar' }"
        class="btn big ml1"
      >
        Novo Valor
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <FiltroParaPagina
    :formulario="campos"
    :schema="schema"
  />

  <div
    v-if="chamadasPendentes.lista"
    class="spinner"
  >
    Carregando
  </div>

  <SmaeTable
    v-else
    :colunas="colunas"
    parametro-no-objeto-para-excluir="observacao"
    :dados="listaFiltrada"
    :rota-editar="({ id }) => ({
      name: 'valoresLimites.editar',
      params: { valorLimiteId: id }
    })"
    :mensagem-exclusao="montarMensagemExclusao"
    @deletar="excluirItem"
  />
</template>
