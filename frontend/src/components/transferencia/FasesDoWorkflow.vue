<script setup>
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store.ts';
import { storeToRefs } from 'pinia';
import {
  computed, defineOptions, nextTick, ref,
} from 'vue';

defineOptions({ inheritAttrs: false });

const workflowAndamento = useWorkflowAndamentoStore();
const { emFoco: workflow, chamadasPendentes } = storeToRefs(workflowAndamento);

const etapaCorrente = computed(() => workflow.value?.fluxo?.[0] || {});
const listaDeFases = ref(null);

workflowAndamento.buscar().then(async () => {
  await nextTick();
  listaDeFases.value.scrollLeft = listaDeFases.value.scrollWidth;
});
</script>
<template>
  <LoadingComponent
    v-if="chamadasPendentes.emFoco"
    class="horizontal"
    v-bind="$attrs"
  />
  <div
    v-else
    v-bind="$attrs"
    class="dedo-duro"
  >
    <h2 class="dedo-duro__título w400">
      Etapa de
      <strong class="w600">{{ etapaCorrente.fluxo_etapa_de.etapa_fluxo }}</strong>
    </h2>

    <p class="tc400 t14 dedo-duro__info">
      Clique em uma fase para visualizar tarefas e editar situação.
    </p>

    <ul
      v-if="etapaCorrente?.fases?.length"
      ref="listaDeFases"
      class="flex dedo-duro__lista-de-fases"
    >
      <li
        v-for="item in etapaCorrente.fases"
        :key="item.id"
        class="p1 tcamarelo tc dedo-duro__fase"
        :class="{
          'dedo-duro__fase--iniciada': !!item?.andamento,
          concluida: item?.andamento?.concluida
        }"
      >
        <strong class="w400 dedo-duro__nome-da-fase">
          {{ item.fase.fase }}
        </strong>

        <span class="dedo-duro__dados-da-fase">
          {{ item.andamento?.pessoa_responsavel }}
        </span>
      </li>
    </ul>
  </div>
</template>
<style lang="less" scoped>
@tamanho-da-bolinha: 1.8rem;

.dedo-duro {
}

.dedo-duro__título {
}

.dedo-duro__info {
}

.dedo-duro__lista-de-fases {
  overflow-x: auto;
  overflow-y: clip;
}

.dedo-duro__fase {
  min-width: 18rem;
  position: relative;
  flex-grow: 1;

  &::before {
    width: @tamanho-da-bolinha;
    height: @tamanho-da-bolinha;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 1rem;
    border-radius: 100%;
    content: '';
    display: block;
    background-color: currentColor;
    color: @c300;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAD9SURBVHgBrZK9DcIwEIXfXaChYoSwAaNAT+FMQDokGqAAiY4FUMIGbAAbkA2ADaigAnM4/AVsR0I8yfLPne8+PRv4g8gXVL0kBFMXJz1KZ9HBlce+IhJVIB2jxl38QmIoAqxkGco44IiGi4a9FHmBm+o+GvJQbO/bpYyWj8ZOEtDAzBrrdBK1pVXmo2ErBbQqntK9+yVWcVIvLfKksMtKw+UUnxIak+co8kVBaKp+oqB1WKAJMCimvVO8XqRcZ3mpabQrkti9WAZUDaVX+hV5o+EnhdULzubjzh52qYc3OUmFHL/xMhRPNk6zOb9XMRutF7gZ5lZmPSVz7z+6AjAITco9Fq1nAAAAAElFTkSuQmCC);
    background-position: 50% 50%;
    background-repeat: no-repeat;
  }

  &::after {
    position: absolute;
    content: '';
    left: 50%;
    right: -50%;
    top: calc(@tamanho-da-bolinha *0.5 + 1rem);
    height: 2px;
    background-color: currentColor;
    margin-top: -1px;
    z-index: -1;
    color: @c300;
  }

  &:first-child::after {
    left: 50%;
  }

  &:last-child::after {
    right: 25%;
    background-image: linear-gradient(to left, @branco, @c300 3rem);
  }
}

.dedo-duro__fase--iniciada {
  &::before,
  &::after {
    color: @amarelo;
  }

  &::before {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAC9SURBVHgB7ZAxDoIwFIb7UHZ3WIxx1oXQwoJLS1z0BngDjiCeQI/gDdx1YmN118QELkFiqCWxxoApYhz5pte+/l/bh1DHXyCEhZ7nDeRaQy0hxN8DoF2e6xO512+Rfwp4UBQ8SpJTXDtgWfMpIXSpEjgO4xjTdbX3+o6u3xcAcMDYD9QvOG6q/Z4s0vQam+ZoqGkoMozxLcsu528EJVC/lYoQiBCsxABnTYKPkndRWTcJlLgu29o2C1HHTzwAp05KMEpINHYAAAAASUVORK5CYII=);
  }
}

.dedo-duro__nome-da-fase {
  text-wrap: balance;
  width: 50%;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.dedo-duro__dados-da-fase {}
</style>
