<script setup>
import { cloneDeep } from 'lodash';
import { storeToRefs } from 'pinia';
import {
  computed, onUnmounted, ref, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Dashboard } from '@/components';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import QuadroNotas from '@/components/notas/QuadroNotas.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { localizarData } from '@/helpers/dateToDate';
import truncate from '@/helpers/texto/truncate';
import { useAuthStore } from '@/stores/auth.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePanoramaTransferenciasStore } from '@/stores/panoramaTransferencias.store.ts';
import { usePartidosStore } from '@/stores/partidos.store';

const panoramaTransferenciasStore = usePanoramaTransferenciasStore();
const partidoStore = usePartidosStore();
const OrgaosStore = useOrgansStore();
const authStore = useAuthStore();

const route = useRoute();
const router = useRouter();

const {
  chamadasPendentes, erro, lista, paginacao,
} = storeToRefs(panoramaTransferenciasStore);
const { partidosPorId } = storeToRefs(partidoStore);
const { órgãosPorId } = storeToRefs(OrgaosStore);

const prazo = ref(route.query.prazo || 60);
const esfera = ref(route.query.esfera
  ? Object.keys(esferasDeTransferencia)
    .find((x) => x.toLowerCase() === route.query.esfera.toLocaleLowerCase())
  : undefined);
const partido = ref(route.query.partido_ids);
const orgao = ref(route.query.orgaos_ids);
const palavraChave = ref(route.query.palavra_chave);
const atividade = ref(route.query.atividade);

const listaSemFiltro = ref([]);

const itensEmUso = computed(() => {
  const atividades = [];
  let orgaos = [];
  let partidos = [];

  listaSemFiltro.value.forEach((item) => {
    if (item.atividade) {
      atividades.push(item.atividade);
    }

    if (Array.isArray(item.orgaos)) {
      orgaos = orgaos.concat(item.orgaos);
    }

    if (item.partido_id) {
      partidos.push(item.partido_id);
    } else if (Array.isArray(item.partido_ids)) {
      partidos = partidos.concat(item.partido_ids);
    }
  });

  return {
    atividades,
    orgaos,
    partidos,
  };
});

const listaComOrgaos = computed(() => lista.value.map((x) => ({
  ...x,
  orgaos: Array.isArray(x.orgaos)
    ? x.orgaos.map((y) => órgãosPorId.value[y.id || y]?.sigla || y.id || y).join(', ')
    : [],
})));

const atividadesDisponiveis = computed(() => [...new Set(itensEmUso.value.atividades)]
  .sort((a, b) => a.localeCompare(b)));

const partidosDisponiveis = computed(() => [...new Set(itensEmUso.value.partidos)]
  .map((x) => partidosPorId.value[x] || x)
  .sort((a, b) => a.sigla?.localeCompare(b.sigla)));

const orgaosDisponiveis = computed(() => [...new Set(itensEmUso.value.orgaos)]
  .map((x) => órgãosPorId.value[x] || x)
  .sort((a, b) => a.sigla?.localeCompare(b.sigla)));

const iniciar = async () => {
  OrgaosStore.getAll();
  partidoStore.buscarTudo();
};

function atualizarUrl() {
  router.push({
    query: {
      ...route.query,
      partido_ids: partido.value || undefined,
      orgaos_ids: orgao.value || undefined,
      esfera: esfera.value || undefined,
      prazo: prazo.value || undefined,
      palavra_chave: palavraChave.value || undefined,
      atividade: atividade.value || undefined,
      pagina: 1,
      token_paginacao: undefined,
    },
  });
}

const parametrosDeBusca = computed(() => ({
  esfera: route.query.esfera
    ? Object.keys(esferasDeTransferencia)
      .find((x) => x.toLowerCase() === route.query.esfera.toLocaleLowerCase())
    : undefined,
  partido_ids: route.query.partido_ids,
  orgaos_ids: route.query.orgaos_ids,
  palavra_chave: typeof route.query.palavra_chave === 'string'
    ? route.query.palavra_chave.trim()
    : route.query.palavra_chave,
  atividade: route.query.atividade,
  prazo: route.query.prazo || prazo.value,
  pagina: route.query.pagina,
  ipp: route.query.ipp || 1000,
  token_paginacao: route.query.token_paginacao,
}));

const parametrosSerializados = computed(() => JSON.stringify(parametrosDeBusca.value));

watch(parametrosSerializados, async () => {
  if (!partidosDisponiveis.value.length
    && !atividadesDisponiveis.value.length
    && !orgaosDisponiveis.value.length
  ) {
    await iniciar();
  }

  panoramaTransferenciasStore.buscarTudo(parametrosDeBusca.value)
    .then(() => {
      listaSemFiltro.value = cloneDeep(lista.value);
    });
}, { immediate: true });

function diferencaEmDias(data1, data2) {
  const umDia = 1000 * 60 * 60 * 24;
  const diferencaTempo = Math.abs(data1.getTime() - data2.getTime());
  return Math.floor(diferencaTempo / umDia);
}

function dataColor(data) {
  const hoje = new Date();
  const dataNota = new Date(data);

  hoje.setHours(0, 0, 0, 0);
  dataNota.setHours(0, 0, 0, 0);

  const diferenca = diferencaEmDias(hoje, dataNota);

  let cor;
  if (dataNota.getTime() === hoje.getTime()) {
    cor = '#000';
  } else if (dataNota > hoje) {
    cor = '#607A9F';
  } else {
    switch (true) {
      case diferenca >= 15:
        cor = '#EE3B2B';
        break;
      case diferenca >= 8:
        cor = '#F2890D';
        break;
      case diferenca >= 1 && diferenca <= 7:
        cor = '#F7C234';
        break;
      default:
        cor = '#000';
    }
  }

  return cor;
}

onUnmounted(() => {
  panoramaTransferenciasStore.$reset();
});
</script>
<template>
  <Dashboard>
    <header class="flex spacebetween center mb2">
      <h1>Quadro de atividades</h1>
      <hr class="ml2 f1">
    </header>

    <form
      class="flex flexwrap bottom mb2 g1"
      @submit.prevent="atualizarUrl"
    >
      <div class="f1">
        <label
          for="esfera"
          class="label tc300"
        >Esfera</label>
        <select
          id="esfera"
          v-model="esfera"
          class="inputtext mb1"
          name="esfera"
        >
          <option value="" />
          <option
            v-for="item in Object.values(esferasDeTransferencia)"
            :key="item.valor"
            :value="item.valor"
          >
            {{ item.nome || item }}
          </option>
        </select>
      </div>

      <div class="f1">
        <label
          for="partido"
          class="label tc300"
        >Partido</label>
        <select
          id="partido"
          v-model="partido"
          class="inputtext mb1"
          name="partido"
        >
          <option value="" />
          <option
            v-for="item in partidosDisponiveis"
            :key="item"
            :value="item.id || item"
            :title="item.nome || null"
          >
            {{ item.sigla || item }}
          </option>
        </select>
      </div>

      <div class="f1">
        <label
          for="atividade"
          class="label tc300"
        >Atividades</label>
        <select
          id="atividade"
          v-model="atividade"
          class="inputtext mb1"
          name="atividade"
        >
          <option value="" />
          <option
            v-for="item in atividadesDisponiveis"
            :key="item"
            :value="item"
          >
            {{ item }}
          </option>
        </select>
      </div>

      <div class="f1">
        <label
          for="orgao"
          class="label tc300"
        >
          Órgão
        </label>
        <select
          id="orgao"
          v-model="orgao"
          class="inputtext mb1"
          name="orgao"
        >
          <option value="" />
          <option
            v-for="item in orgaosDisponiveis"
            :key="item"
            :value="item.id"
          >
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </select>
      </div>

      <div class="f1">
        <label
          for="palavra_chave"
          class="label tc300"
        >Palavra-chave</label>
        <input
          id="palavra_chave"
          v-model.trim="palavraChave"
          class="inputtext"
          name="palavra_chave"
          type="text"
        >
      </div>

      <div class="f1">
        <label
          class="label tc300"
          for="prazo"
        >
          Prazo
        </label>
        <select
          id="prazo"
          v-model="prazo"
          class="inputtext mb1"
          name="visao_pessoal"
        >
          <option value="">
            -
          </option>
          <option
            v-for="prazoItem in [30, 60, 90]"
            :key="`prazo--${prazoItem}`"
            :value="prazoItem"
          >
            {{ prazoItem }} dias
          </option>
        </select>
      </div>

      <button class="btn outline bgnone tcprimary mtauto mb1">
        Pesquisar
      </button>
    </form>

    <p v-if="!chamadasPendentes.lista">
      Exibindo <strong>{{ lista.length }}</strong> resultados de {{ paginacao.totalRegistros }}.
    </p>

    <div class="flex flexwrap g2 start">
      <SmaeTable
        titulo-para-rolagem-horizontal="Panorama de transferências"
        rolagem-horizontal
        class="mb1 f1 fb25em"
        :dados="listaComOrgaos"
        :colunas="[
          {
            chave: 'emenda',
            label: 'Emenda',
          },
          {
            chave: 'identificador',
            label: 'Identificador',
            ehCabecalho: true, atributosDaColuna: { class: 'col--minimum' }
          },
          { chave: 'objeto', label: 'Transferência' },
          { chave: 'atividade', label: 'Atividade' },
          { chave: 'orgaos', label: 'Responsável' },
          { chave: 'data', label: 'Prazo', atributosDaColuna: { class: 'col--data' } },
        ]"
      >
        <template #celula:identificador="{ linha }">
          <SmaeLink
            :to="{
              name: 'TransferenciasVoluntariasDetalhes',
              params: { transferenciaId: linha.transferencia_id },
            }"
            :desabilitar="!linha.transferencia_id"
            class="tprimary"
            exibir-desabilitado
          >
            {{ linha.identificador }}
          </SmaeLink>
        </template>

        <template #celula:data="{ linha }">
          <span
            v-if="linha.data"
            :style="{ color: dataColor(linha.data) }"
          >{{ localizarData(linha.data) }}</span>
          <template v-else>
            -
          </template>
        </template>
      </SmaeTable>

      <LoadingComponent v-if="chamadasPendentes.lista" />
      <ErrorComponent
        v-else-if="erro"
        :erro="erro"
      />
      <QuadroNotas v-if="!authStore.temPermissãoPara('SMAE.PerfilGestorDistribuicaoRecurso')" />
    </div>

    <MenuPaginacao
      class="mt2"
      v-bind="paginacao"
    />
  </Dashboard>
</template>
<style scoped>
:deep(.table-cell--objeto) {
  max-width: 14em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
