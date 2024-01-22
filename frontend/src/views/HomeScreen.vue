<script setup>
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import FiltroDeMetas from '@/components/panorama/FiltroDeMetas.vue';
import LegendaPadrão from '@/components/panorama/LegendaPadrao.vue';
import MetaNormal from '@/components/panorama/MetaNormal.vue';
import MetaAtrasada from '@/components/panorama/MetaAtrasada.vue';
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMetasStore } from '@/stores/metas.store';
import LoadingComponent from '@/components/LoadingComponent.vue';

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const MetasStore = useMetasStore();
const { user, temPermissãoPara } = storeToRefs(authStore);
const { Metas, activePdm } = storeToRefs(MetasStore);

const panoramaStore = usePanoramaStore();
const {
  listaDePendentes,
  listaDeAtualizadas,
  listaDeAtrasadas,
  perfil,
  chamadasPendentes,
  erro,
} = storeToRefs(panoramaStore);

const dadosExtrasDeAbas = {
  TabelaDeVariaveis: {
    id: 'variaveis',
    etiqueta: 'Variáveis',
  },
  TabelaDeVariaveisCompostas: {
    id: 'variaveis-compostas',
    etiqueta: 'Variáveis Compostas',
  },
  TabelaDeVariaveisCompostasEmUso: {
    id: 'variaveis-compostas-em-uso',
    etiqueta: 'Variáveis compostas em uso',
    aberta: true,
  },
};
const statusesVálidos = ['pendentes', 'atualizadas', 'atrasadas'];

async function iniciar() {
  if (!route.query.visao) {
    router.replace({
      query: {
        ...route.query,
        visao: 'pessoal',
      },
    });
  }

  if (statusesVálidos.indexOf(route.query.status) === -1) {
    router.replace({
      query: {
        ...route.query,
        status: statusesVálidos[0],
      },
    });
  }

  if (!activePdm.value.id) {
    await MetasStore.getPdM(activePdm.value.id);
  }

  panoramaStore.buscarTudo(activePdm.value.id, route.query.status);
}

watch([
  () => route.query.meta,
  () => route.query.coordenadores_cp,
  () => route.query.orgao,
  () => route.query.status,
], () => {
  iniciar();
}, { immediate: true });
</script>
<template>
  <Dashboard>
    <header class="flex center mb2 spacebetween g1 flexwrap">
      <div class="t12 uc w700 tamarelo f100">
        Programa de metas
      </div>

      <TítuloDePágina class="f1">
        Quadro de atividades
      </TítuloDePágina>

      <hr class="f1">

      <nav class="flex g1 flexwrap">
        <router-link
          :to="{ query: { ...$route.query, visao: 'pessoal' } }"
          class="btn bgnone outline ml1"
          :class="{
            tcprimary: $route.query.visao === 'pessoal'
          }"
        >
          Visão pessoal
        </router-link>

        <router-link
          :to="{ query: { ...$route.query, visao: 'geral' } }"
          class="btn bgnone outline ml1"
          :class="{
            tcprimary: $route.query.visao === 'geral'
          }"
        >
          Visão geral
        </router-link>
      </nav>
    </header>

    <div class="flex flexwrap g2">
      <div class="mb1 f1">
        <Transition name="fade">
          <FiltroDeMetas v-if="perfil && perfil !== 'ponto_focal'" />
        </Transition>

        <LegendaPadrão
          v-if="perfil"
          :perfil="perfil"
        />
      </div>

      <EnvelopeDeAbas
        :meta-dados-por-id="dadosExtrasDeAbas"
        nome-da-chave-de-abas="status"
        class="mb1 f3"
      >
        <template #pendentes>
          <LoadingComponent v-if="chamadasPendentes.pendentes" />
          <MetaNormal
            v-for="(item, i) in listaDePendentes"
            v-else
            :key="i"
            :meta="item"
            :perfil="perfil"
            class="mb2"
          />
        </template>

        <template #atualizadas>
          <LoadingComponent v-if="chamadasPendentes.atualizadas" />
          <MetaNormal
            v-for="(item, i) in listaDeAtualizadas"
            v-else
            :key="i"
            :meta="item"
            :perfil="perfil"
            class="mb2"
          />
        </template>

        <template #atrasadas>
          <LoadingComponent v-if="chamadasPendentes.pendentes" />
          <MetaAtrasada
            v-for="(_item, i) in [...Array(10).keys()]"
            v-else
            :key="i"
            class="mb2"
          />
        </template>
      </EnvelopeDeAbas>

      <div class="mb1 card-shadow f1 p15 calendario">
        <h2 class="w400 t20 tc tamarelo calendario__titulo mb1">
          Setembro
        </h2>

        <dl class="calendario__lista">
          <div class="flex calendario__item center mb1">
            <dt class="f1 t20 tamarelo calendario__intervalo">
              01 - 15
            </dt>
            <dd class="f2 t12 w700 tprimary calendario__evento">
              Coleta de Dados
            </dd>
          </div>
          <div class="flex calendario__item center mb1">
            <dt class="f1 t20 tamarelo calendario__intervalo">
              16 - 19
            </dt>
            <dd class="f2 t12 w700 tprimary calendario__evento">
              Qualificação
            </dd>
          </div>
          <div class="flex calendario__item calendario__item--destaque center mb1">
            <dt class="f1 t20 tamarelo calendario__intervalo">
              20 - 22
            </dt>
            <dd class="f2 t12 w700 tprimary calendario__evento">
              Análise de Risco
            </dd>
          </div>
          <div class="flex calendario__item center mb1">
            <dt class="f1 t20 tamarelo calendario__intervalo">
              23 - 30
            </dt>
            <dd class="f2 t12 w700 tprimary calendario__evento">
              Fechamento
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div
      v-if="erro"
      class="error p1"
    >
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>
  </Dashboard>
</template>
<style lang="less">
.calendario {}

.calendario__titulo {
  border-bottom: 1px solid @c200;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.calendario__lista {}

.calendario__item {}

.calendario__item--destaque {
  border-radius: 4px;
  outline: 1px solid @amarelo;
  outline-offset: 8px;
}

.calendario__intervalo {
  display: flex;
  white-space: nowrap;

  &:after {
    content: '';
    display: block;
    flex-grow: 1;
    border-bottom: 1px solid @c200;
    height: 0;
    margin-top: auto;
    margin-bottom: auto;
    margin-left: 1rem;
  }
}

.calendario__evento {
  display: flex;

  &:before {
    content: '';
    display: block;
    flex-grow: 1;
    border-bottom: 1px solid @c200;
    height: 0;
    margin-top: auto;
    margin-right: 1rem;
    margin-bottom: auto;
  }
}
</style>
