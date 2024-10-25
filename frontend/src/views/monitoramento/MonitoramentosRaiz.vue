<script setup>
import { Dashboard } from '@/components';
import dateToField from '@/helpers/dateToField';
import dateToTitle from '@/helpers/dateToTitle';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
// eslint-disable-next-line import/no-cycle
import { usePdMStore } from '@/stores/pdm.store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const panoramaStore = usePanoramaStore();
const {
  erro,
} = storeToRefs(panoramaStore);
const PdMStore = usePdMStore();
const { activePdm } = storeToRefs(PdMStore);

const faseCorrente = computed(() => (Array.isArray(activePdm.value?.ciclo_fisico_ativo?.fases)
  ? activePdm.value.ciclo_fisico_ativo.fases.find((x) => x.fase_corrente)
  : null));

if (!activePdm.value.id) {
  PdMStore.getActive();
}
</script>
<template>
  <Dashboard class="página-de-monitoramento">
    <header class="flex center mb2 spacebetween g1 flexwrap">
      <MigalhasDePão class="mb1" />

      <div class="t12 uc w700 tamarelo fb100">
        Ciclo vigente
      </div>

      <TítuloDePágina>
        {{ activePdm?.ciclo_fisico_ativo?.data_ciclo
          ? dateToTitle(activePdm.ciclo_fisico_ativo.data_ciclo)
          : 'Ciclo ativo' }}
      </TítuloDePágina>

      <hr class="f1">

      <div class="fb100 flex flexwrap spacebetween center g1 mb1">
        <p
          v-if="faseCorrente"
          class="t24 mb0"
        >
          Etapa atual: {{ faseCorrente.ciclo_fase }}
          - de <strong>{{ dateToField(faseCorrente.data_inicio) }}</strong>
          até <strong>{{ dateToField(faseCorrente.data_fim) }}</strong>
        </p>

        <nav
          class="flex g1 flexwrap"
        >
          <router-link
            :to="{
              name: 'monitoramentoPorVariáveis',
              query: $route.query,
            }"
            class="btn bgnone outline tcprimary"
            exact-active-class="tcamarelo"
          >
            variáveis
          </router-link>

          <router-link
            :to="{
              name: 'monitoramentoPorTarefas',
            }"
            class="btn bgnone outline tcprimary"
            exact-active-class="tcamarelo"
          >
            cronograma
          </router-link>
        </nav>
      </div>
    </header>

    <RouterView />

    <ErrorComponent v-if="erro">
      {{ erro }}
    </ErrorComponent>
  </Dashboard>
</template>
<style lang="less">
.página-de-monitoramento {
  .legenda {
    margin-bottom: 2rem;
    margin-left: auto;
    margin-right: auto;
    max-width: 40em;
  }

  .legenda h2 {
    text-align: center;
  }

  .legenda__lista {
    justify-content: center;
  }

  //1180px
  @media screen and (min-width: 73.75em) {
    .legenda {
      margin-right: 0;
      margin-left: auto;
      margin-bottom: -3rem;
    }

    .legenda h2 {
      text-align: right;
    }

    .legenda__lista {
      justify-content: flex-end;
    }

        .abas__navegacao {
      margin-left: 0;
      margin-right: auto;
    }
  }
}
</style>
