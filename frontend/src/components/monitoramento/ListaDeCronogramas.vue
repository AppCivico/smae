<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePanoramaStore } from '@/stores/panorama.store.ts';

const panoramaStore = usePanoramaStore();
const {
  listaDePendentes,
} = storeToRefs(panoramaStore);

const idsDosItensAbertos = ref([]);

//  pendentes:
//    para o ponto focal:
//      - total - enviadas + aguardando complementação
//    para os outros:
//      - total - conferidas + aguardando complementação
const lista = computed(() => listaDePendentes.value
  .reduce((acc, cur) => (cur.cronograma.detalhes.length
    ? acc.concat([{
      id: cur.id,
      código: cur.codigo,
      título: cur.titulo,
      cronogramas: cur.cronograma.detalhes.map((y) => ({
        ...y,
        inícioPendente: cur.cronograma.atraso_inicio.includes(y.id),
        términoPendente: cur.cronograma.atraso_fim.includes(y.id),
      })),
    }])
    : acc), []));
</script>
<template>
  <ul
    class="uc w700"
  >
    <li
      v-for="meta in lista"
      :key="meta.id"
    >
      <input
        :id="`cronograma--${meta.id}`"
        v-model="idsDosItensAbertos"
        type="checkbox"
        :value="meta.id"
        :arial-label="idsDosItensAbertos.includes(meta.id)
          ? `fechar tarefas da meta ${meta.código}`
          : `abrir tarefas da meta ${meta.código}`"
        :title="idsDosItensAbertos.includes(meta.id)
          ? `fechar tarefas da meta ${meta.código}`
          : `abrir tarefas da meta ${meta.código}`"
        :disabled="!meta.cronogramas.length"
        class="accordion-opener"
      >
      <label
        :for="`cronograma--${meta.id}`"
        class="block mb1 bgc50 br6 p1 g1 flex center"
      >
        {{ meta.código }} - {{ meta.título }}

        <small v-ScrollLockDebug>
          (<code>meta.atualizado_em:&nbsp;{{ meta.atualizado_em }}</code>)
        </small>
      </label>
      <Transition
        name="expand"
      >
        <ul
          v-if="idsDosItensAbertos.includes(meta.id)"
          class="pl2"
        >
          <li
            v-for="tarefa in meta.cronogramas"
            :key="tarefa.id"
            class="mb1 bgc50 br6 p1 flex start"
          >
            <span
              v-if="(tarefa.inícioPendente && tarefa.términoPendente) || 1"
              class="tipinfo ib mr1 f0 lista__ícone lista__ícone--duplo"
            >
              <svg
                width="20"
                height="20"
                color="#e47d0f"
              ><use xlink:href="#i_circle" /></svg>
              <svg
                width="20"
                height="20"
                color="#4074bf"
              ><use xlink:href="#i_circle" /></svg>
              <div>Início e Término pendentes</div>
            </span>
            <span
              v-else-if="tarefa.inícioPendente"
              class="tipinfo ib mr1 f0"
            >
              <svg
                width="22"
                height="22"
                color="#e47d0f"
              ><use xlink:href="#i_circle" /></svg>
              <div>Início pendente</div>
            </span>
            <span
              v-else-if="tarefa.términoPendente"
              class="tipinfo ib mr1 f0"
            >
              <svg
                width="22"
                height="22"
                color="#4074bf"
              ><use xlink:href="#i_circle" /></svg>
              <div>Término pendente</div>
            </span>
            {{ tarefa.código || tarefa.id }} - {{ tarefa.titulo }}
          </li>
        </ul>
      </Transition>
    </li>
  </ul>
</template>
<style lang="less">
.lista__ícone--duplo {
  display: block;

  svg {
    display: inline;
    position: relative;
    z-index: 1;
  }

  svg + svg {
    transform: translateX(-50%);
    z-index: 0;
  }
}
</style>
