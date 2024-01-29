<script setup>
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import FeedbackEmptyList from '@/components/FeedbackEmptyList.vue';
import LegendaDeVariáveis from '@/components/monitoramento/LegendaDeVariaveis.vue';
import ListaDeAtrasadas from '@/components/monitoramento/ListaDeAtrasadas.vue';
import ListaDeAtualizadas from '@/components/monitoramento/ListaDeAtualizadas.vue';
import ListaDePendentes from '@/components/monitoramento/ListaDePendentes.vue';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import { usePdMStore } from '@/stores/pdm.store';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { watch } from 'vue';

const route = useRoute();
const router = useRouter();

const statusesVálidos = ['pendentes', 'atualizadas', 'atrasadas'];

const panoramaStore = usePanoramaStore();
const {
  chamadasPendentes,
  listaDeAtrasadasComDetalhes,
  listaDeAtualizadas,
  listaDePendentes,
  perfil,
} = storeToRefs(panoramaStore);

const PdMStore = usePdMStore();
const { activePdm } = storeToRefs(PdMStore);

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

async function iniciar() {
  if (statusesVálidos.indexOf(route.query.status) === -1) {
    await router.replace({
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

watch(() => route.query.status, () => {
  iniciar();
}, { immediate: true });
</script>
<template>
  <Transition name="fade">
    <LegendaDeVariáveis
      v-if="perfil && $route.query.status === 'pendentes'"
      class="legenda legenda--variáveis"
      :perfil="perfil"
    />
  </Transition>

  <EnvelopeDeAbas
    :meta-dados-por-id="dadosExtrasDeAbas"
    nome-da-chave-de-abas="status"
    class="mb1 f3"
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
  </EnvelopeDeAbas>
</template>
