<script lang="ts" setup>
export interface EtapaDoVaral {
  responsavel?: string;
  nome: string;
  duracao?: string;
  atual: boolean,
  status:
  | 'concluida'
  | 'pendente'
  | 'encerrada-atendida'
  | 'encerrada-cancelada';
}

const props = defineProps<{
  etapas: EtapaDoVaral[];
  desativarNavegacao: boolean;
}>();
</script>

<template>
  <ol
    ref="listaDeEtapas"
    role="tablist"
    class="flex pb1 varal-etapas"
    :class="{
      'varal-etapas--desativar-navegacao': props.desativarNavegacao,
    }"
  >
    <li
      v-for="(item, index) in $props.etapas"
      :key="index"
      class="tc varal-etapas__item"
      :class="{
        'varal-etapas__item--atual': item.atual,
        'varal-etapas__item--concluida': item.status === 'concluida',
        'varal-etapas__item--cancelada': item.status === 'encerrada-cancelada',
        // 'varal-etapas__item--selecionada': item.status === '',
      }"
    >
      <button
        :id="`tab-${index}`"
        type="button"
        role="tab"
        class="w400 like-a__text varal-etapas__conteudo"
      >
        <slot :item="item" />

        <!-- :aria-selected="item.id === etapaEmFoco?.id"
        :aria-controls="`panel-${item.id}`"
        :tabindex="item.id === etapaEmFoco?.id ? '0' : '-1'"
        @click="workflowAndamento.setEtapaEmFoco(item.id)"
        @keydown="handleKeydown($event, index)" -->
      </button>
    </li>
  </ol>
</template>

<style lang="less" scoped>
.varal-etapas {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  position: relative;
  overflow-x: auto;
  counter-reset: varal-etapas;
  -webkit-overflow-scrolling: touch;
  padding: 0;
  scrollbar-width: thin;
  scrollbar-color: #888 #f0f0f0;

  &::before {
    content: "";
    width: 100%;
    height: 6px;
    position: absolute;
    top: 2.55rem;
    left: 0;
    z-index: -2;
    background-color: #c8c8c8;
  }
}

.varal-etapas__item {
  display: grid;
  align-items: center;
  justify-items: start;
  position: relative;
  padding: 1rem 0 1.5rem 1.5rem;

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

  &:nth-child(-n + 9)::before {
    content: "0" counter(varal-etapas);
  }

  &::after {
    @pedacinho: 1.5rem;

    content: "";
    width: calc(100% - @pedacinho);
    height: 6px;
    position: absolute;
    top: 2.55rem;
    z-index: -1;
    background-color: #c8c8c8;
    left: @pedacinho;
  }
}

.varal-etapas__item--concluida {
  &::before {
    background-color: @amarelo;
  }

  &::after {
    background-color: @amarelo;
  }
}

.varal-etapas__item--atual {
  &::before {
    background-color: @amarelo;
  }
}

.varal-etapas__item--atual {
  &::after {
    background-color: @amarelo;
  }
}

.varal-etapas__conteudo {
  min-width: 160px;
  position: relative;
  display: grid;
  gap: 0.4rem;
  padding-inline: 1rem;
  margin-top: 1.2rem;
  font-weight: 700;
  font-size: 1.4rem;
  width: fit-content;

  &::before, &::after {
    content: '';
    position: absolute;
    width: 5px;
    height: 100%;
    border-radius: 10px;
    background-color: transparent;

    .varal-etapas__item--atual & {
      background-color: @amarelo;
    }
  }

  &::after {
    right: 0;
    top: -40px;
  }

  .varal-etapas--desativar-navegacao & {
    cursor: initial;
  }
}

.varal-etapas__conteudo span {
  &::before {
    content: "";
    position: absolute;
    inset: 1rem;
  }
}
</style>
