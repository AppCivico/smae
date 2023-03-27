<script setup>
import EstruturaAnalíticaProjeto from '@/components/projetos/EstruturaAnaliticaProjeto.vue';
import MenuDeMudançaDeStatusDeProjeto from '@/components/projetos/MenuDeMudançaDeStatusDeProjeto.vue';
import { projeto as schema } from '@/consts/formSchemas';
import statuses from '@/consts/taskStatuses';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';

const portfolioStore = usePortfolioStore();
const projetosStore = useProjetosStore();
const tarefasStore = useTarefasStore();
const {
  chamadasPendentes, emFoco, erro,
} = storeToRefs(projetosStore);
const {
  estruturaAnalíticaDoProjeto,
} = storeToRefs(tarefasStore);

defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

function iniciar() {
  portfolioStore.buscarTudo();

  if (!tarefasStore.lista.length) {
    tarefasStore.buscarTudo();
  }
}

iniciar();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo">
        Projeto
        <template v-if="emFoco?.eh_prioritario">
          prioritário
        </template>
      </div>

      <h1>{{ emFoco?.nome }}</h1>
    </div>
    <hr class="ml2 f1">
    <MenuDeMudançaDeStatusDeProjeto />

    <template v-if="emFoco?.id && !emFoco.arquivado">
      <router-link
        :to="{ name: 'projetosEditar', params:{ projetoId: emFoco.id }}"
        class="btn big ml2"
      >
        Editar
      </router-link>
    </template>
  </div>

  <div class="boards">
    <div class="flex g2 mb1 flexwrap">
      <dl
        v-if="emFoco?.codigo"
        class="f1 mb1"
      >
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['codigo'].spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.codigo }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['portfolio_id'].spec.label }}
        </dt>
        <dd class="t13">
          {{ portfolioStore?.portfoliosPorId[emFoco?.portfolio_id]?.titulo }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['nome'].spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.nome }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Status
        </dt>
        <dd class="t13">
          {{ statuses[emFoco?.status] || emFoco?.status }}
        </dd>
      </dl>
    </div>
    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['resumo'].spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.resumo || '-' }}
        </dd>
      </dl>
    </div>
    <hr class="mb1 f1">
    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['escopo'].spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.escopo || '-' }}
        </dd>
      </dl>
    </div>

    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['principais_etapas'].spec.label }}
        </dt>
        <dd
          class="t13"
          v-html="emFoco?.principais_etapas || '-'"
        />
      </dl>
    </div>

    <hr class="mb1 f1">

    <h2>
      Órgãos
    </h2>
    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['orgao_gestor_id'].spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.orgao_gestor.sigla }} - {{ emFoco?.orgao_gestor.descricao }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Responsáveis
        </dt>
        <dd class="t13">
          <template
            v-for="item in emFoco?.responsaveis_no_orgao_gestor"
            :key="item"
          >
            {{ item.nome_exibicao || item }},
          </template>
        </dd>
      </dl>
    </div>
    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['orgao_responsavel_id'].spec.label }}
        </dt>
        <dd class="t13">
          {{ emFoco?.orgao_responsavel?.sigla }} - {{ emFoco?.orgao_responsavel?.descricao }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Responsável
        </dt>
        <dd class="t13">
          {{ emFoco?.responsavel?.nome_exibicao || emFoco?.responsavel_id || '-' }}
        </dd>
      </dl>
    </div>

    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          {{ schema.fields['orgaos_participantes'].spec.label }}
        </dt>
        <dd class="t13">
          <template
            v-for="item in emFoco?.orgaos_participantes"
            :key="item.id"
          >
            {{ item.sigla }} - {{ item.descricao }},
          </template>
        </dd>
      </dl>
    </div>
  </div>

  <template v-if="estruturaAnalíticaDoProjeto?.length">
    <hr class="mb1 f1">

    <h2>Estrutura Analítica</h2>
    <EstruturaAnalíticaProjeto :data="estruturaAnalíticaDoProjeto" />
  </template>

  <span
    v-if="chamadasPendentes?.emFoco"
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
