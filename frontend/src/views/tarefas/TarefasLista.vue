<script setup>
import LinhaDeCronograma from '@/components/projetos/LinhaDeCronograma.vue';
import dateToField from '@/helpers/dateToField';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';

const projetosStore = useProjetosStore();
const tarefasStore = useTarefasStore();

const {
  emFoco: projetoEmFoco,
} = storeToRefs(projetosStore);
const {
  árvoreDeTarefas, chamadasPendentes, erro,
} = storeToRefs(tarefasStore);

function iniciar() {
  tarefasStore.$reset();
  tarefasStore.buscarTudo();
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Cronograma' }}</h1>
    <hr class="ml2 f1">

    <div class="ml2">
      <router-link
        :to="{ name: 'tarefasCriar' }"
        class="btn"
      >
        Nova tarefa
      </router-link>
    </div>
  </div>

  <div class="boards mb4">
    <dl class="flex g2">
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Início previsto
        </dt>
        <dd class="t13">
          {{
            projetoEmFoco?.previsao_inicio
            ? dateToField(projetoEmFoco.previsao_inicio)
            : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Término previsto
        </dt>
        <dd class="t13">
          {{
            projetoEmFoco?.previsao_termino
            ? dateToField(projetoEmFoco.previsao_termino)
            : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Início real
        </dt>
        <dd class="t13">
          {{
            projetoEmFoco?.realizado_inicio
            ? dateToField(projetoEmFoco.realizado_inicio)
            : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Término real
        </dt>
        <dd class="t13">
          {{
            projetoEmFoco?.realizado_termino
            ? dateToField(projetoEmFoco.realizado_termino)
            : '--/--/----'
          }}
        </dd>
      </div>
    </dl>
  </div>

  <table
    v-if="árvoreDeTarefas.length"
    class="tabela-de-etapas"
  >
    <colgroup>
      <col class="genealogia">
      <col>
      <col>
      <col>

      <col class="col--data">
      <col class="col--data">
      <col class="col--data">
      <col class="col--data">

      <col>

      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th class="" />
        <th class="" />
        <th class="cell--number">
          % concluída
        </th>
        <th class="cell--number">
          Duração
        </th>
        <th class="cell--data">
          Início Previsto
        </th>
        <th class="cell--data">
          Término Previsto
        </th>
        <th class="cell--data">
          Início Real
        </th>
        <th class="cell--data">
          Término Real
        </th>
        <th class="cell--number">
          Atraso
        </th>
        <th />
        <th />
        <th />
      </tr>
    </thead>

    <tbody
      v-for="(r, i) in árvoreDeTarefas"
      :key="r.id"
      class="tabela-de-etapas__item"
    >
      <LinhaDeCronograma
        :key="r.id"
        :linha="r"
        :índice="i"
      />
    </tbody>
  </table>

  <span
    v-if="chamadasPendentes?.lista"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
