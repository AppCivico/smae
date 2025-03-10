<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useAlertStore } from '@/stores/alert.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';
import EdicaoOrcamentoFormulario from './EdicaoOrcamentoFormulario.vue';

const route = useRoute();
const router = useRouter();

const alertStore = useAlertStore();
const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe);
const { emFoco } = storeToRefs(planosSetoriaisStore);

async function handleEnviarDados(valoresControlados) {
  if (!emFoco.value) {
    console.error('ID não encontrado');
    return;
  }

  try {
    await planosSetoriaisStore.atualizarPermissoesOrcamento(
      emFoco.value.id,
      valoresControlados,
    );
    alertStore.success('Dados salvos com sucesso!');

    router.push({
      name: route.meta.rotaDeEscape,
    });
  } catch (error) {
    alertStore.error(error);
  }
}
</script>

<template>
  <div class="edicao-orcamento">
    <EdicaoOrcamentoFormulario
      :orcamento-config="emFoco?.orcamento_config"
      @submit="handleEnviarDados"
    />
  </div>
</template>
