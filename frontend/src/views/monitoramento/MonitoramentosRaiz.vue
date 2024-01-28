<script setup>
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import FeedbackEmptyList from '@/components/FeedbackEmptyList.vue';
import LegendaDeVariáveis from '@/components/monitoramento/LegendaDeVariaveis.vue';
import LegendaDeTarefas from '@/components/monitoramento/LegendaDeTarefas.vue';
import ListaDeAtrasadas from '@/components/monitoramento/ListaDeAtrasadas.vue';
import ListaDeAtualizadas from '@/components/monitoramento/ListaDeAtualizadas.vue';
import ListaDePendentes from '@/components/monitoramento/ListaDePendentes.vue';
import { Dashboard } from '@/components';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import { usePdMStore } from '@/stores/pdm.store';
import { storeToRefs } from 'pinia';
import dateToField from '@/helpers/dateToField';
import dateToTitle from '@/helpers/dateToTitle';
import { computed, watch } from 'vue';

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
const exibiçãoPadrão = 'variaveis';
const statusesVálidos = ['pendentes', 'atualizadas', 'atrasadas'];

const panoramaStore = usePanoramaStore();
const {
  chamadasPendentes,
  listaDeAtrasadasComDetalhes,
  listaDeAtualizadas,
  listaDePendentes,
  erro,
} = storeToRefs(panoramaStore);
const PdMStore = usePdMStore();
const { activePdm } = storeToRefs(PdMStore);

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const faseCorrente = computed(() => (Array.isArray(activePdm.value?.ciclo_fisico_ativo?.fases)
  ? activePdm.value.ciclo_fisico_ativo.fases.find((x) => x.fase_corrente)
  : null));

async function iniciar() {
  if (!route.query.exibir) {
    router.replace({
      query: {
        ...route.query,
        exibir: exibiçãoPadrão,
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
    await PdMStore.getActive();
  }

  panoramaStore.buscarTudo(activePdm.value.id, route.query.status, {
    retornar_detalhes: true,
  });
}

if (!authStore.temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp'])) {
  router.replace({
    name: 'monitoramentoDeEvoluçãoDeMetas',
    hash: route.hash?.indexOf('#') === 0 ? route.hash : undefined,
    query: route.query,
  });
}

watch([
  () => route.query.status,
  () => route.query.exibir,
], () => {
  iniciar();
}, { immediate: true });
</script>
<template>
  <Dashboard>
    <header class="flex center mb2 spacebetween g1 flexwrap">
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
            :to="{ query: { ...$route.query, exibir: 'variaveis' } }"
            class="btn bgnone outline tcprimary"
            :class="{
              tcamarelo: $route.query.exibir === 'variaveis'
            }"
            :aria-current="$route.query.exibir === 'variaveis' ? 'page' : undefined"
          >
            por Variável
          </router-link>

          <router-link
            :to="{ query: { ...$route.query, exibir: 'tarefas' } }"
            class="btn bgnone outline tcprimary"
            :class="{
              tcamarelo: $route.query.exibir === 'tarefas'
            }"
            :aria-current="$route.query.exibir === 'tarefas' ? 'page' : undefined"
          >
            por Cronograma
          </router-link>
        </nav>
      </div>
    </header>

    <template v-if="$route.query.exibir === 'variaveis'">
      <LegendaDeVariáveis class="legenda legenda--variáveis" />

      <EnvelopeDeAbas
        :meta-dados-por-id="dadosExtrasDeAbas"
        nome-da-chave-de-abas="status"
        class="mb1 f3"
        alinhamento="esquerda"
      >
        <template #pendentes="{ estáAberta }">
          <template v-if="estáAberta">
            <LoadingComponent v-if="chamadasPendentes.lista" />

            <FeedbackEmptyList
              v-else-if="!listaDePendentes.length"
              título="Bom trabalho!"
              tipo="positivo"
              mensagem="Você não possui pendências!"
            />

            <ListaDePendentes v-else />
          </template>
        </template>

        <template #atualizadas="{ estáAberta }">
          <template v-if="estáAberta">
            <LoadingComponent v-if="chamadasPendentes.lista" />

            <FeedbackEmptyList
              v-else-if="!listaDeAtualizadas.length"
              tipo="negativo"
              título="Você ainda não possui atividades atualizadas!"
              mensagem="Complete pendências para visualizar-las aqui."
            />

            <ListaDeAtualizadas v-else />
          </template>
        </template>

        <template #atrasadas="{ estáAberta }">
          <template v-if="estáAberta">
            <LoadingComponent v-if="chamadasPendentes.lista" />

            <FeedbackEmptyList
              v-else-if="!listaDeAtrasadasComDetalhes.length"
              título="Bom trabalho!"
              tipo="positivo"
              mensagem="Você não possui atrasos!"
            />

            <ListaDeAtrasadas v-else />

            <textarea
              readonly
              cols="30"
              rows="10"
            >listaDeAtrasadasComDetalhes:
    {{ listaDeAtrasadasComDetalhes }}
    </textarea>
          </template>
        </template>
      </EnvelopeDeAbas>
    </template>

    <template v-if="$route.query.exibir === 'tarefas'">
      <LegendaDeTarefas class="legenda legenda--tarefas" />
    </template>

    <ErrorComponent v-if="erro">
      {{ erro }}
    </ErrorComponent>
  </Dashboard>
</template>
<style lang="less" scoped>
.legenda {
  margin-right: 0;
  margin-left: auto;
}

.legenda h2 {
  text-align: center;
}

.legenda--variáveis {
  max-width: 20em;
}

.legenda--tarefas {
  max-width: 40em;
}
</style>
