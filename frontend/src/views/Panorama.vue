<script setup>
import { Dashboard } from '@/components';
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import FeedbackEmptyList from '@/components/FeedbackEmptyList.vue';
import CalendárioDoPdM from '@/components/panorama/CalendarioDoPdM.vue';
import FiltroDeMetas from '@/components/panorama/FiltroDeMetas.vue';
import LegendaDeAtrasadas from '@/components/panorama/LegendaDeAtrasadas.vue';
import LegendaPadrão from '@/components/panorama/LegendaPadrao.vue';
import MetaAtrasada from '@/components/panorama/MetaAtrasada.vue';
import MetaNormal from '@/components/panorama/MetaNormal.vue';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import { usePdMStore } from '@/stores/pdm.store';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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
const visãoPadrão = 'pessoal';

const route = useRoute();
const router = useRouter();

const PdmStore = usePdMStore();
const { activePdm } = storeToRefs(PdmStore);

const panoramaStore = usePanoramaStore();
const {
  listaDePendentes,
  listaDeAtualizadas,
  listaDeAtrasadas,
  perfil,
  chamadasPendentes,
  erro,
} = storeToRefs(panoramaStore);

async function iniciar() {
  if (!route.query.visao) {
    router.replace({
      query: {
        ...route.query,
        visao: visãoPadrão,
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

  if (!activePdm.value?.id) {
    await PdmStore.getActive();
  }

  const filtros = route.query.visao === 'geral'
    ? {
      metas: route.query.metas,
      coordenadores_cp: route.query.coordenadores_cp,
      orgaos: route.query.orgaos,
      visao_geral: true,
    }
    : undefined;

  panoramaStore.buscarTudo(activePdm.value.id, route.query.status, filtros);
}

watch([
  () => route.query.coordenadores_cp,
  () => route.query.metas,
  () => route.query.orgaos,
  () => route.query.status,
  () => route.query.visao,
], () => {
  iniciar();
}, { immediate: true });
</script>
<template>
  <Dashboard>
    <header class="flex center mb2 spacebetween g1 flexwrap">
      <div class="t12 uc w700 tamarelo fb100">
        Programa de metas
      </div>

      <TítuloDePágina>
        Quadro de atividades
      </TítuloDePágina>

      <hr class="f1">

      <nav
        v-if="perfil && perfil !== 'ponto_focal'"
        class="flex g1 flexwrap"
      >
        <router-link
          :to="{ query: { ...$route.query, visao: 'pessoal' } }"
          class="btn bgnone outline tcprimary"
          :class="{
            tcamarelo: $route.query.visao === 'pessoal'
          }"
          :aria-current="$route.query.visao === 'pessoal' ? 'page' : undefined"
        >
          Visão pessoal
        </router-link>

        <router-link
          :to="{ query: { ...$route.query, visao: 'geral' } }"
          class="btn bgnone outline tcprimary"
          :class="{
            tcamarelo: $route.query.visao === 'geral'
          }"
          :aria-current="$route.query.visao === 'geral' ? 'page' : undefined"
        >
          Visão geral
        </router-link>
      </nav>
    </header>

    <div class="flex flexwrap g2 start">
      <div class="legenda-e-filtro mb1 f1">
        <Transition name="fade">
          <FiltroDeMetas
            v-if="perfil && perfil !== 'ponto_focal'
              && $route.query.visao === 'geral'"
            class="mb2"
          />
        </Transition>

        <Transition
          v-if="perfil"
          name="fade"
        >
          <LegendaDeAtrasadas
            v-if="$route.query.status === 'atrasadas'"
            class="mb1"
          />
          <LegendaPadrão
            v-else
            :perfil="perfil"
            :status="$route.query.status"
            class="mb1"
          />
        </Transition>
      </div>

      <EnvelopeDeAbas
        :meta-dados-por-id="dadosExtrasDeAbas"
        nome-da-chave-de-abas="status"
        class="mb1 f3"
      >
        <template #pendentes>
          <LoadingComponent v-if="chamadasPendentes.lista" />

          <FeedbackEmptyList
            v-else-if="!listaDePendentes.length"
            título="Bom trabalho!"
            tipo="positivo"
            mensagem="Você não possui pendências!"
          />

          <MetaNormal
            v-for="(item, i) in listaDePendentes"
            v-else
            :key="i"
            :meta="item"
            :perfil="perfil"
            :visão="$route.query.visao"
            class="mb2"
          />
        </template>

        <template #atualizadas>
          <LoadingComponent v-if="chamadasPendentes.lista" />

          <FeedbackEmptyList
            v-else-if="!listaDeAtualizadas.length"
            tipo="negativo"
            título="Você ainda não possui atividades atualizadas!"
            mensagem="Complete pendências para visualiza-las aqui."
          />

          <MetaNormal
            v-for="(item, i) in listaDeAtualizadas"
            v-else
            :key="i"
            :meta="item"
            :perfil="perfil"
            :visão="$route.query.visao"
            class="mb2"
          />
        </template>

        <template #atrasadas>
          <LoadingComponent v-if="chamadasPendentes.lista" />

          <FeedbackEmptyList
            v-else-if="!listaDeAtrasadas.length"
            título="Bom trabalho!"
            tipo="positivo"
            mensagem="Você não possui atrasos!"
          />

          <MetaAtrasada
            v-for="(item, i) in listaDeAtrasadas"
            v-else
            :key="i"
            :meta="item"
            class="mb2"
          />
        </template>
      </EnvelopeDeAbas>

      <div class="mb1 card-shadow f1 p15">
        <LoadingComponent v-if="activePdm?.loading || !perfil" />
        <CalendárioDoPdM
          v-else-if="activePdm?.ciclo_fisico_ativo"
          :pdm="activePdm"
          :perfil="perfil"
        />
      </div>
    </div>

    <ErrorComponent v-if="erro">
      {{ erro }}
    </ErrorComponent>
  </Dashboard>
</template>
<style lang="less">
.legenda-e-filtro {
  @media screen and (min-width: 51.25em) {
    //820px
    margin-top: 7em;
  }
}
</style>
