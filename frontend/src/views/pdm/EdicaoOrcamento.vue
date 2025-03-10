<script setup>
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { usePdMStore } from '@/stores/pdm.store';
import { useAlertStore } from '@/stores/alert.store';
import { Dashboard } from '@/components';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import EdicaoOrcamentoFormulario from '@/views/planosSetoriais/EdicaoOrcamento/EdicaoOrcamentoFormulario.vue';

const router = useRouter();
const route = useRoute();

const PdMStore = usePdMStore();
const alertStore = useAlertStore();

const { singlePdm } = storeToRefs(PdMStore);

async function iniciar() {
  await PdMStore.getById(route.params.pdm_id);
}

async function handleEnviarDados(valoresControlados) {
  try {
    await PdMStore.updatePermissoesOrcamento(singlePdm.value.id, valoresControlados);
    alertStore.success('Dados salvos com sucesso!');

    router.push({
      name: route.meta.rotaDeEscape,
    });
  } catch (error) {
    alertStore.error(error);
  }
}

iniciar();
</script>

<template>
  <Dashboard>
    <MigalhasDePao class="mb1" />

    <EdicaoOrcamentoFormulario
      v-if="!(singlePdm?.loading || singlePdm?.error)"
      :orcamento-config="singlePdm.orcamento_config"
      @submit="handleEnviarDados"
    />

    <template v-if="singlePdm?.loading">
      <span class="spinner">Carregando</span>
    </template>

    <template v-if="singlePdm?.error">
      <div class="error p1">
        <div class="error-msg">
          {{ singlePdm.error }}
        </div>
      </div>
    </template>
  </Dashboard>
</template>
