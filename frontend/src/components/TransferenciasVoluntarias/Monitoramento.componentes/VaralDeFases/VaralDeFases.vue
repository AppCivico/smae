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
        v-for="(faseObjeto, faseIndex) in [
          ...etapaCorrente.fases,
          // ...etapaCorrente.fases,
          // ...etapaCorrente.fases,
          // ...etapaCorrente.fases,
        ]"
        :key="`fase--${faseIndex}`"
        class="fase-item"
      >
        <!-- <div class="fase-item__contador">
          <div class="fase-item__contador-container">
            <div class="fase-item__contador-wrapper">
              {{ `${faseIndex+1}`.padStart(2, 0) }}
            </div>
          </div>
        </div> -->

        <!-- style="min-width: 150px;" -->
        <VaralDeFaseItem
          :titulo="faseObjeto.fase.fase"
          :duracao="faseObjeto.duracao"
          :situacao="faseObjeto.andamento?.situacao?.tipo_situacao"
          :responsavel="faseObjeto.andamento?.orgao_responsavel.sigla"
          :tarefas="faseObjeto.tarefas"
          :pendente="!faseObjeto.andamento?.concluida"
        />
      </div>
    </div>
  </section>
</template>

<style lang="less" scoped>
@import "@/_less/tamanho-dispostivo.less";

.varal-de-fases__lista {
  display: flex;
  flex-direction: column;

  .breakpoint-web();
  .-aplicar-web() {
    flex-direction: row;
    flex-wrap: wrap;
  }
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

  .breakpoint-web();
  .-aplicar-web() {
    flex-direction: column;
    align-items: center;
    padding-bottom: initial;
    padding-right: 60px;
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

  .breakpoint-web();
  .-aplicar-web() {
    justify-content: initial;
    align-items: center;

    &::before {
      width: 100%;
      height: 1px;
      left: 0;
    }
  }
}

.fase-item__contador-container {
  transform: translateY(-5px);
  padding: 5px;
  border: 1px solid #B8C0CC;
  border-radius: 999px;
  background-color: #fff;

  .breakpoint-web();
  .-aplicar-web() {
    transform: initial;
  }
}

.fase-item__contador-wrapper {
  padding: .42rem;
  background-color: #E0F2FF;
  border-radius: 999px;
  font-size: 1.14rem;
  font-weight: 700;
}
</style>
