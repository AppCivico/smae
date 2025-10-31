<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import LocalFilter from '@/components/LocalFilter.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
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
  if (route.meta.entidadeMãe === 'projeto') {
    return { name: 'projeto.etapaEditar', params: { etapaId: id } };
  }
  if (route.meta.entidadeMãe === 'mdo') {
    return { name: 'mdo.etapaEditar', params: { etapaId: id } };
  }
  if (route.meta.entidadeMãe === 'TransferenciasVoluntarias') {
    return { name: 'TransferenciasVoluntarias.etapaEditar', params: { etapaId: id } };
  }
  return null;
}

function podeEditar() {
  if (route.meta.entidadeMãe === 'projeto') {
    return temPermissãoPara('CadastroProjetoEtapa.editar');
  }
  if (route.meta.entidadeMãe === 'mdo') {
    return temPermissãoPara('CadastroProjetoEtapaMDO.editar');
  }
  if (route.meta.entidadeMãe === 'TransferenciasVoluntarias') {
    return true;
  }
  return false;
}

function podeInserir() {
  if (route.meta.entidadeMãe === 'projeto') {
    return temPermissãoPara('CadastroProjetoEtapa.inserir');
  }
  if (route.meta.entidadeMãe === 'mdo') {
    return temPermissãoPara('CadastroProjetoEtapaMDO.inserir');
  }
  if (route.meta.entidadeMãe === 'TransferenciasVoluntarias') {
    return true;
  }
  return false;
}

function montarRotaCriar() {
  if (route.meta.entidadeMãe === 'projeto') {
    return { name: 'projeto.etapaCriar' };
  }
  if (route.meta.entidadeMãe === 'mdo') {
    return { name: 'mdo.etapaCriar' };
  }
  if (route.meta.entidadeMãe === 'TransferenciasVoluntarias') {
    return { name: 'TransferenciasVoluntarias.etapaCriar' };
  }
  return { name: '.etapaCriar' };
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
      { chave: 'descricao', label: 'Nome' }
    ]"
    parametro-no-objeto-para-excluir="descricao"
    :dados="listaFiltrada"
    :rota-editar="podeEditar() ? montarRotaEditar : undefined"
    @deletar="excluirItem"
  />
</template>
