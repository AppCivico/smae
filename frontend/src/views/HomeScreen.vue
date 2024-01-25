<script setup>
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import FiltroDeMetas from '@/components/panorama/FiltroDeMetas.vue';
import LegendaDeAtrasadas from '@/components/panorama/LegendaDeAtrasadas.vue';
import LegendaPadrão from '@/components/panorama/LegendaPadrao.vue';
import MetaNormal from '@/components/panorama/MetaNormal.vue';
import MetaAtrasada from '@/components/panorama/MetaAtrasada.vue';
import CalendárioDoPdM from '@/components/panorama/CalendarioDoPdM.vue';
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePdMStore } from '@/stores/pdm.store';
import LoadingComponent from '@/components/LoadingComponent.vue';

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const PdmStore = usePdMStore();
const { user, temPermissãoPara } = storeToRefs(authStore);
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
    await PdmStore.getActive();
  }

  panoramaStore.buscarTudo(activePdm.value.id, route.query.status, {
    metas: route.query.metas,
    coordenadores_cp: route.query.coordenadores_cp,
    orgaos: route.query.orgaos,
  });
}

watch([
  () => route.query.metas,
  () => route.query.coordenadores_cp,
  () => route.query.orgaos,
  () => route.query.status,
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

      <nav class="flex g1 flexwrap">
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
      <div class="mb1 f1">
        <Transition name="fade">
          <FiltroDeMetas v-if="perfil && perfil !== 'ponto_focal'" />
        </Transition>

        <Transition
          v-if="perfil"
          name="fade"
        >
          <LegendaDeAtrasadas
            v-if="$route.query.status === 'atrasadas'"
          />
          <LegendaPadrão
            v-else
            :perfil="perfil"
            :status="$route.query.status"
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

          <div
            v-else-if="!listaDePendentes.length"
            class="celebrate flex column center tc600 w700 mb1"
          >
            <svg
              width="107"
              height="107"
              fill="#f7c234"
            ><use xlink:href="#i_celebrate" /></svg>
            <p class="t20 mb0">
              Bom trabalho!
            </p>
            <p class="mb0">
              Você não possui pendências!
            </p>
          </div>

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

          <div
            v-else-if="!listaDeAtrasadas.length"
            class="celebrate flex column center tc600 w700 mb1"
          >
            <svg
              width="107"
              height="107"
              fill="#f7c234"
            ><use xlink:href="#i_celebrate" /></svg>
            <p class="t20 mb0">
              Bom trabalho!
            </p>
            <p class="mb0">
              Você não possui atrasos!
            </p>
          </div>

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
          :pdm="activePdm"
          :perfil="perfil"
        />
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
