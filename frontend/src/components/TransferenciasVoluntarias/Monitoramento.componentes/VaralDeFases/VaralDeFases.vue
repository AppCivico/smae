<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useResizeObserver } from '@vueuse/core';
import { debounce } from 'lodash';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store';
import VaralDeFaseItem from './componentes/VaralDeFaseItem.vue';

const TAMANHO_LARGO = 600;

const workflowAndamentoStore = useWorkflowAndamentoStore();

const varalDeFasesEl = ref<HTMLElement>();
const tamanhoLargo = ref<boolean>(true);

const { etapaCorrente } = storeToRefs(workflowAndamentoStore);

useResizeObserver(varalDeFasesEl, debounce(async ([ev]) => {
  await nextTick();

  tamanhoLargo.value = ev.contentRect.width > TAMANHO_LARGO;
}, 0));

onMounted(() => {
  workflowAndamentoStore.buscar();

  setTimeout(() => {
    console.log(etapaCorrente.value);
  }, 2000);
});
</script>

<template>
  <section
    ref="varalDeFasesEl"
    class="varal-de-fases mt2 container-inline"
  >
    <div
      v-if="etapaCorrente?.fases.length"
      class="varal-de-fases__lista "
    >
      <div
        v-for="(faseObjeto, faseIndex) in etapaCorrente.fases"
        :key="`fase--${faseIndex}`"
        class="fase-item"
      >
        <div
          :class="[
            'item-contador',
            { 'item-contador--atual': faseObjeto.andamento.atual },
            {
              'item-contador--bloqueado':
                !faseObjeto.andamento?.pode_concluir && !faseObjeto.andamento?.concluida
            },
          ]"
        >
          {{ `${faseIndex+1}`.padStart(2, '0') }}

          <div
            v-if="tamanhoLargo && faseObjeto.andamento.atual"
            class="item-contador__fase-atual smae-tooltip"
          >
            <span class="smae-tooltip__conteudo">Fase atual</span>
          </div>
        </div>

        <VaralDeFaseItem
          :id="faseObjeto.fase.id"
          :titulo="faseObjeto.fase.fase"
          :duracao="faseObjeto.duracao"
          :situacao="faseObjeto.andamento?.situacao?.tipo_situacao"
          :responsavel="faseObjeto.andamento?.orgao_responsavel"
          :tarefas="faseObjeto.tarefas"
          :situacoes="faseObjeto.situacoes"
          :atual="faseObjeto.andamento.atual"
          :concluida="faseObjeto.andamento?.concluida"
          :pode-concluir="faseObjeto.andamento?.pode_concluir"
          :bloqueado="!faseObjeto.andamento?.pode_concluir && !faseObjeto.andamento?.concluida"
          :largo="tamanhoLargo"
          tipo="fase"
        />
      </div>
    </div>
  </section>
</template>

<style lang="less" scoped>
@import "@/_less/tamanho-dispostivo.less";

@gap-items: 50px;
@tamanho-largo: 600px;

.varal-de-fases__lista {
  display: flex;
  flex-direction: column;
  gap: @gap-items;

  padding-top: 1px;
  padding-left: 1px;
}

.fase-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;

  &:last-child {
    .item-contador::before {
      height: 100%;
    }
  }
}

.item-contador {
  display: flex;
  justify-content: center;

  padding: 5px;
  border: 5px solid #fff;
  border-radius: 999px;
  background-color: #E0F2FF;
  outline: 1px solid #B8C0CC;

  &::before {
    content: '';
    height: calc(100% + @gap-items);
    position: absolute;
    width: 1px;
    background-color: #B8C0CC;
    z-index: -1;
  }
}

.item-contador--atual {
  background-color: #F7C234;
}

.item-contador--bloqueado {
  background-color: #C8C8C8;
}

@container (width > @tamanho-largo) {
  .varal-de-fases__lista {
    flex-direction: row;
    overflow: auto;
    padding: 140px 0 20px;
  }

  .fase-item {
    width: fit-content;
    flex-direction: column;
    align-items: center;

    &:last-child {
      .item-contador::before {
        height: 2px;
        width: 100%;
      }
    }
  }

  .item-contador {
    justify-content: center;
    align-items: center;
    font-size: 1.71rem;
    line-height: 1;
    padding: 12px;

    &::before {
      left: 0;
      height: 2px;
      width: calc(100% + @gap-items);
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      width: 2px;
      height: 100px;
      background-color: #B8C0CC;
      z-index: -1;
    }
  }

  .item-contador__fase-atual {
    position: absolute;
    color: #F7C234;
    bottom: calc(100% + 25px);
    text-wrap: nowrap;
  }
}
</style>
