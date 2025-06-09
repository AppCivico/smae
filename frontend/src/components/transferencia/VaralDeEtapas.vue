<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store.ts';

const { params } = useRoute();

const workflowAndamento = useWorkflowAndamentoStore();
const { workflow, chamadasPendentes, etapaEmFoco } = storeToRefs(workflowAndamento);

workflowAndamento.buscar();
</script>
<template>
  Etapa em foco: {{ etapaEmFoco?.id }}
  <LoadingComponent
    v-if="chamadasPendentes?.workflow"
    class="horizontal"
  />
  <template
    v-else
  >
    <p
      v-if="!workflow?.fluxo?.length"
    >
      Nenhuma etapa encontrada.
    </p>
    <ol
      v-else
      ref="listaDeEtapas"
      class="flex pb1 varal-etapas"
    >
      <li
        v-for="item in workflow.fluxo"
        :key="item.id"
        class="tc varal-etapas__etapa"
        :class="{
          'varal-etapas__etapa--atual': item?.atual,
          'varal-etapas__etapa--concluida': !!item?.andamento?.concluida,
          'varal-etapas__etapa--selecionada': item.id === etapaEmFoco?.id
        }"
      >
        <button
          type="button"
          class="w400 like-a__text varal-etapas__nome-da-etapa"
          @click="workflowAndamento.setEtapaEmFoco(item.id)"
        >
          <span class="w400">Etapa {{ item.atual ? 'atual' : '' }}</span>
          {{ item.workflow_etapa_de.descricao }}
        </button>
      </li>
    </ol>
  </template>
</template>
<style scoped>
.varal-etapas {
  display: flex;
  align-items: flex-start;
  position: relative;
  overflow-x: auto;
  padding: 2rem;
  counter-reset: varal-etapas;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #888 #f0f0f0;

  &::after {
    content: '';
    width: 100%;
    height: 6px;
    position: absolute;
    top: 4.55rem;
    left: 0;
    z-index: -2;
    background-color: #c8c8c8;
  }
}

.varal-etapas__etapa {
  display: grid;
  align-items: center;
  justify-items: start;
  gap: 1.2rem;
  position: relative;
  padding: 1rem 6rem 1.5rem 1.5rem;

  &::before {
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 3.5rem;
    aspect-ratio: 1;
    background-color: #c8c8c8;
    border-radius: 100%;
    font-weight: 700;
    counter-increment: varal-etapas;
    content: counter(varal-etapas);
  }

  &:nth-child(-n+9)::before {
    content: '0'counter(varal-etapas);
  }

  &::after {
    content: '';
    width: 100%;
    height: 6px;
    position: absolute;
    top: 2.55rem;
    z-index: -1;
    background-color: #c8c8c8;
  }
}

.varal-etapas__etapa--concluida {
  &::before {
    background-color: #ffda00;
  }
}

.varal-etapas__etapa--atual {
  &::before {
    background-color: #ffda00;
  }
}

.varal-etapas__etapa--selecionada {
  &::after {
    background-color: #ffda00;
  }
}

.varal-etapas__nome-da-etapa {
  display: grid;
  gap: 0.4rem;
  padding-block-end: 1rem;
  padding-inline: 1rem;
  text-align: start;
  font-weight: 700;
  font-size: 1.4rem;
  width: max-content;
}

.varal-etapas__nome-da-etapa span {
  &::before {
    content: '';
    position: absolute;
    inset: 1rem;
  }
}

.varal-etapas__etapa--selecionada .varal-etapas__nome-da-etapa span {
  &::before {
    --step-yellow: #ffda00;
    --border-thickness: 2px;
    --radius: 16px;

    /* socorro deus */
    background:
      linear-gradient(var(--step-yellow), var(--step-yellow))
      no-repeat
      0px 60% / 4px 30%,

      linear-gradient(var(--step-yellow), var(--step-yellow))
      no-repeat
      right 27px / 5px calc(100% - 30px),

      linear-gradient(var(--step-yellow), var(--step-yellow))
      no-repeat
      bottom 3px right / 60% 2px,

      radial-gradient(circle, var(--step-yellow) 3px, transparent 3px)
      no-repeat
      bottom right 62% / 6px 8px
  }
}
</style>
