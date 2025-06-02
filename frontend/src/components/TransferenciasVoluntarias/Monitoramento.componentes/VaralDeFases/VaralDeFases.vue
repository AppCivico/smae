<script lang="ts" setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store';
import VaralDeFaseItem from './componentes/VaralDeFaseItem.vue';

const workflowAndamentoStore = useWorkflowAndamentoStore();

const { etapaCorrente } = storeToRefs(workflowAndamentoStore);

onMounted(() => {
  workflowAndamentoStore.buscar();
});
</script>

<template>
  <section class="varal-de-fases mt2">
    <div v-if="etapaCorrente?.fases.length">
      <VaralDeFaseItem
        v-for="faseObjeto in etapaCorrente.fases"
        :key="`fase--${faseObjeto.id}`"
        :titulo="faseObjeto.fase.fase"
        :duracao="faseObjeto.duracao"
        :situacao="faseObjeto.andamento?.situacao?.tipo_situacao"
        :responsavel="faseObjeto.andamento?.orgao_responsavel.sigla"
        :situacoes="faseObjeto.situacoes"
      >
        {{ faseObjeto.andamento }}
      </VaralDeFaseItem>
    </div>
  </section>
</template>
