<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { Formulario } from '@/components/FiltroParaPagina.vue';
import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { FiltroConsultaGeralVinculacao } from '@/consts/formSchemas';
import dinheiro from '@/helpers/dinheiro';
import gerarListaAnos from '@/helpers/gerarListaAnos';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';

const route = useRoute();

interface Transferencia {
  id: number;
  identificador: string;
  gestor_municipal: string;
  nome: string;
  valor_total: number;
}

const entidadesProximasStore = useEntidadesProximasStore();
const distribuicaoRecursosStore = useDistribuicaoRecursosStore();

const { distribuicaoSelecionadaId } = storeToRefs(entidadesProximasStore);

const {
  lista: transferencias,
  chamadasPendentes,
  paginacao,
} = storeToRefs(distribuicaoRecursosStore);

const formulario = ref<Record<string, unknown>>({});

const carregando = computed(() => chamadasPendentes.value.lista);

const colunas = [
  { chave: 'transferencia.identificador', label: 'Identificador da transferência' },
  { chave: 'orgao_gestor.sigla', label: 'Gestor municipal' },
  { chave: 'objeto', label: 'Nome' },
  {
    chave: 'valor_total',
    label: 'Valor total',
    formatador: (valor: unknown) => dinheiro(valor as number, { style: 'currency' }),
  },
  {
    chave: 'acao',
    label: '',
    atributosDaColuna: { style: 'width: 100%' },
    atributosDaCelula: { class: 'tr' },
  },
];

const camposDeFiltro = computed<Formulario>(() => [
  {
    campos: {
      ano: {
        tipo: 'select' as const,
        opcoes: gerarListaAnos(),
      },
      esfera: {
        tipo: 'select' as const,
        opcoes: [
          { id: 'Estadual', label: 'Estadual' },
          { id: 'Federal', label: 'Federal' },
        ],
      },
      palavra_chave: {
        tipo: 'text' as const,
      },
    },
  },
]);

async function buscarDados(): Promise<void> {
  await distribuicaoRecursosStore.buscarTudo({
    ...formulario.value,
    ipp: 10,
    pagina: route.query.pagina,
    token_proxima_pagina: paginacao.value.token_paginacao,
  });
}

function selecionarTransferencia(item: Transferencia): void {
  distribuicaoSelecionadaId.value = item.id;
}

watch(
  () => route.query.pagina,
  () => {
    buscarDados();
  },
  { immediate: true },
);
</script>

<template>
  <FiltroParaPagina
    v-model="formulario"
    class="mb2"
    :schema="FiltroConsultaGeralVinculacao"
    :formulario="camposDeFiltro"
    :carregando="carregando"
    nao-emitir-query
    @filtro="buscarDados"
  />

  <SmaeTable
    :colunas="colunas"
    :dados="transferencias"
  >
    <template #celula:acao="{ linha }">
      <button
        class="btn outline bgnone tcprimary"
        type="button"
        @click="selecionarTransferencia(linha)"
      >
        Selecionar
      </button>
    </template>
  </SmaeTable>

  <MenuPaginacao
    class="mt2"
    v-bind="paginacao"
  />
</template>
