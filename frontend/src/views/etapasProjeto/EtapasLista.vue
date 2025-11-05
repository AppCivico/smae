<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
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
const { lista } = storeToRefs(etapasProjetosStore);

const alertStore = useAlertStore();
const listaFiltrada = ref([]);

function obterConfiguracao() {
  return configEtapas[route.meta.entidadeMãe];
}

function construirRota(acao, id = null) {
  const config = obterConfiguracao();
  if (!config) return null;

  const nomeDaRota = `${config.rotaPrefix}.${acao.toLowerCase()}`;
  if (id) {
    return { name: nomeDaRota, params: { etapaId: id } };
  }
  return { name: nomeDaRota };
}

function podeRealizar(acao) {
  const config = obterConfiguracao();
  if (!config) return false;

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
      :lista="lista"
    />
  </div>

  <SmaeTable
    :colunas="[
      { chave: 'descricao', label: 'Nome' },
      { chave: 'portfolio_id', label: 'Portfólio' },
      { chave: 'etapa_padrao_associada', label: 'Etapa Padrão Associada' },
      { chave: 'etapa_padrao', label: 'Etapa Padrão' },
    ]"
    parametro-no-objeto-para-excluir="descricao"
    :dados="listaFiltrada"
    :rota-editar="podeEditar()
      ? montarRotaEditar
      : undefined"
    @deletar="excluirItem"
  >
    <template #celula:portfolio_id="{ linha }">
      {{ linha.portfolio?.titulo || '-' }}
    </template>

    <template #celula:etapa_padrao="{ linha }">
      {{ linha.eh_padrao ? 'Sim' : 'Não' }}
    </template>

    <template #celula:etapa_padrao_associada="{ linha }">
      {{ linha.etapa_padrao?.descricao || '-' }}
    </template>
  </SmaeTable>
</template>
