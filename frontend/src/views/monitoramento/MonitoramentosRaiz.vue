<script setup>
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import FeedbackEmptyList from '@/components/FeedbackEmptyList.vue';
import LegendaDeVariáveis from '@/components/monitoramento/LegendaDeVariaveis.vue';
import LegendaDeTarefas from '@/components/monitoramento/LegendaDeTarefas.vue';
import truncate from '@/helpers/truncate';
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
const filtroPadrão = 'pessoal';
const statusesVálidos = ['pendentes', 'atualizadas', 'atrasadas'];

const panoramaStore = usePanoramaStore();
const {
  chamadasPendentes,
  listaDeAtrasadas,
  perfil,
  tarefasPorId,
  variáveisPorId,
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

//  pendentes:
//    para o ponto focal:
//      - total - enviadas + aguardando complementação
//    para os outros:
//      - total - conferidas + aguardando complementação
//  atualizadas
//    ponto focal:
//      - todas as conferidas
//    para os outros:
//      - todas as enviadas

const listaDePendentes = computed(() => {
  if (!perfil.value) return [];

  const aRemover = perfil.value === 'ponto_focal'
    ? 'enviadas'
    : 'conferidas';
  return panoramaStore.listaDePendentes.map((x) => ({
    id: x.id,
    código: x.codigo,
    título: x.titulo,
    variáveis: x.variaveis?.total?.reduce((acc, cur) => {
      const manter = x.variaveis.aguardando_complementacao.includes(cur);
      const remover = !x.variaveis[aRemover].includes(cur);
      return (manter || remover)
        ? acc.concat([{
          id: cur,
          código: variáveisPorId.value[cur]?.codigo || '',
          título: variáveisPorId.value[cur]?.titulo || '',
          aguardaComplementação: manter,
          aguardaConferência: x.variaveis.conferidas.includes(cur),
          aguardaEnvio: x.variaveis.enviadas.includes(cur),
          aguardaPreenchimento: x.variaveis.preenchidas.includes(cur),
        }])
        : acc;
    }, []),
  }));
});

const listaDeAtualizadas = computed(() => {
  if (!perfil.value) return [];

  const aUsar = perfil.value === 'ponto_focal'
    ? 'conferidas'
    : 'enviadas';
  return panoramaStore.listaDeAtualizadas.map((x) => ({
    id: x.id,
    código: x.codigo,
    título: x.titulo,
    variáveis: x.variaveis?.[aUsar]?.map((y) => ({
      id: y,
      código: variáveisPorId.value[y]?.codigo || '',
      título: variáveisPorId.value[y]?.titulo || '',
      aguardaComplementação: x.variaveis.aguardando_complementacao.includes(y),
      aguardaConferência: x.variaveis.conferidas.includes(y),
      aguardaEnvio: x.variaveis.enviadas.includes(y),
      aguardaPreenchimento: x.variaveis.preenchidas.includes(y),
    })),
  }));
});

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

if (!authStore.temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp'])) {
  router.replace({
    name: 'monitoramentoDeEvoluçãoDeMetas',
    hash: route.hash?.indexOf('#') === 0 ? route.hash : undefined,
    query: route.query,
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

    <LegendaDeVariáveis class="legenda legenda--variáveis" />
    <LegendaDeTarefas class="legenda legenda--tarefas" />

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

        <ul
          v-else
          class="uc w700"
        >
          <li
            v-for="meta in listaDePendentes"
            :key="meta.id"
          >
            <span class="block mb1 bgc50 p1">
              {{ meta.código }} - {{ meta.título }}
            </span>
            <ul
              v-if="meta.variáveis.length"
              class="pl2"
            >
              <li
                v-for="variável in meta.variáveis"
                :key="variável.id"
                :title="variável.título?.length > 36
                  ? variável.título
                  : undefined"
                class="mb1 bgc50 p1"
              >
                <svg
                  v-if="variável.aguardaPreenchimento"
                  title="Aguarda preenchimento"
                  class="ib mr1"
                  width="20"
                  height="20"
                  color="#ee3b2b"
                ><use xlink:href="#i_circle" /></svg>
                <svg
                  v-else-if="variável.aguardaComplementação"
                  title="Aguarda coleta"
                  class="ib mr1"
                  width="20"
                  height="20"
                  color="#4c626d"
                ><use xlink:href="#i_circle" /></svg>
                <svg
                  v-else-if="variável.aguardaConferência"
                  title="Aguarda complementação"
                  class="ib mr1"
                  width="20"
                  height="20"
                  color="#4c626d"
                ><use xlink:href="#i_alert" /></svg>
                <svg
                  v-else-if="variável.aguardaEnvio"
                  title="Aguarda envio"
                  class="ib mr1"
                  width="20"
                  height="20"
                  color="#f2890d"
                ><use xlink:href="#i_circle" /></svg>

                {{ variável.código || variável.id }} - {{
                  truncate(variável.título, 36) }}

                <small v-ScrollLockDebug>
                  (<code>aguardaComplementação:&nbsp;{{ variável.aguardaComplementação }}</code>)
                  (<code>aguardaConferência:&nbsp;{{ variável.aguardaConferência }}</code>)
                  (<code>aguardaEnvio:&nbsp;{{ variável.aguardaEnvio }}</code>)
                  (<code>aguardaPreenchimento:&nbsp;{{ variável.aguardaPreenchimento }}</code>)
                </small>
              </li>
            </ul>
          </li>
        </ul>
      </template>

      <template #atualizadas>
        <LoadingComponent v-if="chamadasPendentes.lista" />

        <FeedbackEmptyList
          v-else-if="!listaDeAtualizadas.length"
          tipo="negativo"
          título="Você ainda não possui atividades atualizadas!"
          mensagem="Complete pendências para visualizar-las aqui."
        />

        <ul v-else>
          <li
            v-for="meta in listaDeAtualizadas"
            :key="meta.id"
          >
            {{ meta.código }} - {{ meta.título }}
            <ul
              v-if="meta.variáveis.length"
            >
              <li
                v-for="variável in meta.variáveis"
                :key="variável.id"
                :title="variável.título?.length > 36
                  ? variável.título
                  : undefined"
                class="ml2"
              >
                {{ variável.código || variável.id }} - {{
                  truncate(variável.título, 36) }}

                <small>
                  (<code>aguardaComplementação:&nbsp;{{ variável.aguardaComplementação }}</code>)
                  (<code>aguardaConferência:&nbsp;{{ variável.aguardaConferência }}</code>)
                  (<code>aguardaEnvio:&nbsp;{{ variável.aguardaEnvio }}</code>)
                  (<code>aguardaPreenchimento:&nbsp;{{ variável.aguardaPreenchimento }}</code>)
                </small>
              </li>
            </ul>
          </li>
        </ul>
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
