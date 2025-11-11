<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import LocalFilter from '@/components/LocalFilter.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import configEtapas from '@/consts/configEtapas';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';

const route = useRoute();
const authStore = useAuthStore();
const { temPermissãoPara } = authStore;
const etapasProjetosStore = useEtapasProjetosStore(route.meta.entidadeMãe);
const { lista, chamadasPendentes } = storeToRefs(etapasProjetosStore);

const alertStore = useAlertStore();
const listaFiltrada = ref([]);

const ehTransferencia = computed(() => route.meta.entidadeMãe === 'TransferenciasVoluntarias');

function obterConfiguracao() {
  const config = configEtapas[route.meta.entidadeMãe];
  if (!config) {
    throw new Error(`Configuração não encontrada para entidadeMãe: ${route.meta.entidadeMãe}`);
  }
  return config;
}

// Determina o contexto da rota (administracao ou configuracoes)
const contextoEtapa = computed(() => route.meta.contextoEtapa || obterConfiguracao().contextoEtapa);

// Filtra lista com base no contexto
const listaFiltradaPorContexto = computed(() => {
  if (!contextoEtapa.value) {
    return lista.value;
  }

  if (contextoEtapa.value === 'administracao') {
    return lista.value.filter((x) => x.eh_padrao === true);
  }

  if (contextoEtapa.value === 'configuracoes') {
    return lista.value.filter((x) => x.eh_padrao === false);
  }

  return lista.value;
});

const colunas = computed(() => {
  const colunasBase = [
    { chave: 'descricao', label: 'Nome' },
  ];

  if (!ehTransferencia.value && contextoEtapa.value === 'configuracoes') {
    colunasBase.push(
      { chave: 'portfolio_id', label: 'Portfólio' },
      { chave: 'etapa_padrao_associada', label: 'Etapa Padrão Associada' },
    );
  }

  return colunasBase;
});


function construirRota(acao, id = null) {
  const config = obterConfiguracao();

  // Se estamos no contexto de administração, usa rotas específicas
  let nomeDaRota;
  if (contextoEtapa.value === 'administracao' && config.rotasAdministracao) {
    nomeDaRota = config.rotasAdministracao[acao.toLowerCase()];
  } else {
    nomeDaRota = `${config.rotaPrefix}.${acao.toLowerCase()}`;
  }

  if (id) {
    return { name: nomeDaRota, params: { etapaId: id } };
  }
  return { name: nomeDaRota };
}

function podeRealizar(acao) {
  const config = obterConfiguracao();

  if (!config.requerPermissão) {
    return true;
  }

  const chavePermissao = config.permissões[acao];

  return chavePermissao ? temPermissãoPara(chavePermissao) : false;
}

function buscarDados() {
  etapasProjetosStore.$reset();
  etapasProjetosStore.buscarTudo();
}

async function excluirItem({ id }) {
  if (await etapasProjetosStore.excluirItem(id)) {
    buscarDados();
    alertStore.success('Etapa removida.');
  }
}

function montarRotaEditar({ id }) {
  return construirRota('Editar', id);
}

function podeEditar() {
  return podeRealizar('editar');
}

function podeInserir() {
  return podeRealizar('inserir');
}

function montarRotaCriar() {
  return construirRota('Criar');
}

onMounted(() => {
  buscarDados();
});
</script>
<template>
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink
        v-if="podeInserir()"
        :to="montarRotaCriar()"
        class="btn big ml1"
      >
        Nova etapa
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <div class="flex center mb2 spacebetween">
    <slot name="filtro" />

    <LocalFilter
      v-model="listaFiltrada"
      :lista="listaFiltradaPorContexto"
    />
  </div>

  <LoadingComponent v-if="chamadasPendentes?.lista" />
  <SmaeTable
    v-else
    :colunas="colunas"
    parametro-no-objeto-para-excluir="descricao"
    :dados="listaFiltrada"
    :rota-editar="podeEditar()
      ? montarRotaEditar
      : undefined"
    @deletar="excluirItem"
  >
    <template
      v-if="!ehTransferencia"
      #celula:portfolio_id="{ linha }"
    >
      {{ linha.portfolio?.titulo || '-' }}
    </template>

    <template
      v-if="!ehTransferencia"
      #celula:etapa_padrao="{ linha }"
    >
      {{ linha.eh_padrao ? 'Sim' : 'Não' }}
    </template>

    <template
      v-if="!ehTransferencia"
      #celula:etapa_padrao_associada="{ linha }"
    >
      {{ linha.etapa_padrao?.descricao || '-' }}
    </template>
  </SmaeTable>
</template>
