<script setup>
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import FeedbackEmptyList from '@/components/FeedbackEmptyList.vue';
import { Dashboard } from '@/components';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import { usePdMStore } from '@/stores/pdm.store';
import { storeToRefs } from 'pinia';
import dateToField from '@/helpers/dateToField';
import dateToTitle from '@/helpers/dateToTitle';
import { watch } from 'vue';

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
const filtroPadrão = 'pessoal';
const statusesVálidos = ['pendentes', 'atualizadas', 'atrasadas'];

const panoramaStore = usePanoramaStore();
const {
  chamadasPendentes,
  listaDePendentes,
  listaDeAtualizadas,
  listaDeAtrasadas,
  detalhesPorId,
  erro,
} = storeToRefs(panoramaStore);
const PdMStore = usePdMStore();
const { activePdm } = storeToRefs(PdMStore);

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

if (!authStore.temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp'])) {
  router.replace({
    name: 'monitoramentoDeEvoluçãoDeMetas',
    hash: route.hash?.indexOf('#') === 0 ? route.hash : undefined,
    query: route.query,
  });
}

async function iniciar() {
  if (!route.query.filtro) {
    router.replace({
      query: {
        ...route.query,
        filtro: filtroPadrão,
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

watch([
  () => route.query.status,
  () => route.query.filtro,
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
        {{ activePdm?.ciclo_fisico_ativo?.data_ciclo ?
          dateToTitle(activePdm.ciclo_fisico_ativo.data_ciclo)
          : 'Ciclo ativo'
        }}
      </TítuloDePágina>

      <hr class="f1">

      <div class="fb100 flex flexwrap spacebetween center g1 mb1">
        <template v-if="activePdm?.ciclo_fisico_ativo">
          <p
            v-for="c in activePdm.ciclo_fisico_ativo.fases.filter(x => x.fase_corrente)"
            :key="c.id"
            class="t24 mb0"
          >
            Etapa atual: {{ c.ciclo_fase }}
            - de <strong>{{ dateToField(c.data_inicio) }}</strong>
            até <strong>{{ dateToField(c.data_fim) }}</strong>
          </p>
        </template>

        <hr class="f1">

        <nav
          class="flex g1 flexwrap"
        >
          <router-link
            :to="{ query: { ...$route.query, filtro: 'variavel' } }"
            class="btn bgnone outline tcprimary"
            :class="{
              tcamarelo: $route.query.filtro === 'variavel'
            }"
            :aria-current="$route.query.filtro === 'variavel' ? 'page' : undefined"
          >
            por Variável
          </router-link>

          <router-link
            :to="{ query: { ...$route.query, filtro: 'cronograma' } }"
            class="btn bgnone outline tcprimary"
            :class="{
              tcamarelo: $route.query.filtro === 'cronograma'
            }"
            :aria-current="$route.query.filtro === 'cronograma' ? 'page' : undefined"
          >
            por Cronograma
          </router-link>
        </nav>
      </div>
    </header>

    <EnvelopeDeAbas
      :meta-dados-por-id="dadosExtrasDeAbas"
      nome-da-chave-de-abas="status"
      class="mb1 f3"
      alinhamento="esquerda"
    >
      <template #pendentes>
        <LoadingComponent v-if="chamadasPendentes.lista" />

        <FeedbackEmptyList
          v-else-if="!listaDePendentes.length"
          título="Bom trabalho!"
          tipo="positivo"
          mensagem="Você não possui pendências!"
        />

        <textarea
          v-else
          readonly
          cols="30"
          rows="10"
        >listaDePendentes:
{{ listaDePendentes }}
</textarea>
      </template>

      <template #atualizadas>
        <LoadingComponent v-if="chamadasPendentes.lista" />

        <FeedbackEmptyList
          v-else-if="!listaDeAtualizadas.length"
          tipo="negativo"
          título="Você ainda não possui atividades atualizadas!"
          mensagem="Complete pendências para visualizar-las aqui."
        />

        <textarea
          v-else
          readonly
          cols="30"
          rows="10"
        >listaDeAtualizadas:
{{ listaDeAtualizadas }}
</textarea>
      </template>

      <template #atrasadas>
        <LoadingComponent v-if="chamadasPendentes.lista" />

        <FeedbackEmptyList
          v-else-if="!listaDeAtrasadas.length"
          título="Bom trabalho!"
          tipo="positivo"
          mensagem="Você não possui atrasos!"
        />

        <textarea
          v-else
          readonly
          cols="30"
          rows="10"
        >listaDeAtrasadas:
{{ listaDeAtrasadas }}
</textarea>
      </template>
    </EnvelopeDeAbas>

    <textarea
      readonly
      cols="30"
      rows="10"
    >detalhesPorId:
{{ detalhesPorId }}
</textarea>

    <pre>
Object.keys(detalhesPorId.tarefas).length: {{ Object.keys(detalhesPorId.tarefas).length }}
</pre>
    <pre>
Object.keys(detalhesPorId.variáveis).length: {{ Object.keys(detalhesPorId.variáveis).length }}
</pre>

    <ErrorComponent v-if="erro">
      {{ erro }}
    </ErrorComponent>
  </Dashboard>
</template>
