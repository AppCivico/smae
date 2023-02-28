<script setup>
import MenuDeMudançaDeStatusDeProjeto from '@/components/projetos/MenuDeMudançaDeStatusDeProjeto.vue';
import statuses from '@/consts/statuses';
import { usePortfolioStore, useProjetosStore } from '@/stores';
import { storeToRefs } from 'pinia';

const portfolioStore = usePortfolioStore();
const projetosStore = useProjetosStore();
const {
  chamadasPendentes, emFoco, erro,
} = storeToRefs(projetosStore);

defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

async function iniciar() {
  portfolioStore.buscarTudo();
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
      <hr class="ml2 f1">
      <router-link
        :to="{ name: 'projetosEditar', params:{ projetoId: emFoco.id }}"
        class="btn big ml2"
      >
        Editar
      </router-link>
    </template>
  </div>

  <div class="boards">
    <div class="flex g2 mb1">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Portfolio
        </dt>
        <dd class="t13">
          {{ portfolioStore?.portfoliosPorId[emFoco?.portfolio_id]?.titulo }}
        </dd>
      </dl>
      <div class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Nome do projeto
        </dt>
        <dd class="t13">
          {{ emFoco?.nome }}
        </dd>
      </div>
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
          Resumo
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
          Escopo
        </dt>
        <dd class="t13">
          {{ emFoco?.escopo || '-' }}
        </dd>
      </dl>
    </div>

    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Principais etapas
        </dt>
        <dd class="t13">
          {{ emFoco?.principais_etapas || '-' }}
        </dd>
      </dl>
    </div>

    <hr class="mb1 f1">

    <h2>
      Órgãos
    </h2>
    <div class="flex g2">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Órgão gestor
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
          Órgão responsável
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
          Orgãos participantes
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
