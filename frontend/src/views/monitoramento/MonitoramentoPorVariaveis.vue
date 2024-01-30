<script setup>
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
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
    filtro_ponto_focal_cronograma: false,
    filtro_ponto_focal_variavel: true,
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
      <ListaDePendentes v-if="estáAberta" />
    </template>

    <template #atrasadas="{ estáAberta }">
      <ListaDeAtrasadas v-if="estáAberta" />
    </template>

    <template #atualizadas="{ estáAberta }">
      <ListaDeAtualizadas v-if="estáAberta" />
    </template>
  </EnvelopeDeAbas>
</template>
