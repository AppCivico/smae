<script setup>
import FeedbackEmptyList from '@/components/FeedbackEmptyList.vue';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

const panoramaStore = usePanoramaStore();
const {
  listaDePendentes,
  ancestraisPorEtapa,
  chamadasPendentes,
} = storeToRefs(panoramaStore);

const idsDosItensAbertos = ref([]);

const gerarURL = (etapaId) => {
  let caminho = '';

  // /monitoramento/cronograma/:meta_id/:iniciativa_id/:atividade_id
  if (ancestraisPorEtapa.value[etapaId]?.meta_id) {
    caminho += `/monitoramento/cronograma/${ancestraisPorEtapa.value[etapaId]?.meta_id}`;

    if (ancestraisPorEtapa.value[etapaId]?.iniciativa_id) {
      caminho += `/${ancestraisPorEtapa.value[etapaId].iniciativa_id}`;

      if (ancestraisPorEtapa.value[etapaId]?.atividade_id) {
        caminho += `/${ancestraisPorEtapa.value[etapaId].atividade_id}`;
      }
    }
  }

  return caminho;
};

//  pendentes:
//    para o ponto focal:
//      - total - enviadas + aguardando complementação
//    para os outros:
//      - total - conferidas + aguardando complementação
const lista = computed(() => listaDePendentes.value
  .reduce((acc, cur) => (cur?.cronograma?.detalhes?.length
    ? acc.concat([{
      id: cur.id,
      código: cur.codigo,
      título: cur.titulo,
      atualizadoEm: cur.atualizado_em,
      cronogramas: cur.cronograma.detalhes.map((y) => ({
        ...y,
        caminho: gerarURL(y.id),
        inícioPendente: cur.cronograma.atraso_inicio.includes(y.id),
        términoPendente: cur.cronograma.atraso_fim.includes(y.id),
      })),
    }])
    : acc), []));
</script>
<template>
  <Transition name="fade">
    <LoadingComponent v-if="chamadasPendentes.lista" />

    <FeedbackEmptyList
      v-else-if="!lista.length"
      título="Bom trabalho!"
      tipo="positivo"
      mensagem="Você não possui pendências!"
    />

    <ul
      v-else
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
          :aria-label="idsDosItensAbertos.includes(meta.id)
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

          <small
            v-if="meta.atualizadoEm"
            v-ScrollLockDebug
          >
            (<code>meta.atualizado_em:&nbsp;{{ meta.atualizadoEm }}</code>)
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
              <router-link
                v-if="tarefa.caminho"
                :to="tarefa.caminho"
              >
                {{ tarefa.código || tarefa.id }} - {{ tarefa.titulo }}
              </router-link>
              <template v-else>
                {{ tarefa.código || tarefa.id }} - {{ tarefa.titulo }}
              </template>
            </li>
          </ul>
        </Transition>
      </li>
    </ul>
  </Transition>
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
