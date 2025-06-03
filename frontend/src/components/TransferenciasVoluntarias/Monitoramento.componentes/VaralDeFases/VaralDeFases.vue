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
    <div
      v-if="etapaCorrente?.fases.length"
      class="varal-de-fases__lista"
    >
      <div
        v-for="faseObjeto in etapaCorrente.fases"
        :key="`fase--${faseObjeto.id}`"
        class="fase-item"
      >
        <div class="fase-item__contador">
          <div class="fase-item__contador-container">
            <div class="fase-item__contador-wrapper">
              {{ `${faseObjeto.ordem}`.padStart(2, 0) }}
            </div>
          </div>
        </div>

        <VaralDeFaseItem
          :titulo="faseObjeto.fase.fase"
          :duracao="faseObjeto.duracao"
          :situacao="faseObjeto.andamento?.situacao?.tipo_situacao"
          :responsavel="faseObjeto.andamento?.orgao_responsavel.sigla"
          :tarefas="faseObjeto.tarefas"
        />
      </div>
    </div>
  </section>
</template>

<style lang="less" scoped>
.varal-de-fases__lista {
  display: flex;
  flex-direction: column;
}

.fase-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
  padding-bottom: 60px;

  &:last-of-type {
    padding-bottom: initial;
  }
}

.fase-item__contador {
  display: flex;
  justify-content: center;

  &::before {
    content: '';
    height: 100%;
    position: absolute;
    width: 1px;
    background-color: #B8C0CC;
    z-index: -1;
  }
}

.fase-item__contador-container {
  transform: translateY(-5px);
  padding: 5px;
  border: 1px solid #B8C0CC;
  border-radius: 999px;
  background-color: #fff;
}

.fase-item__contador-wrapper {
  padding: .42rem;
  background-color: #E0F2FF;
  border-radius: 999px;
  font-size: 1.14rem;
  font-weight: 700;
}
</style>
