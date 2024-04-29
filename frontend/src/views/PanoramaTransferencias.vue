<script setup>
import { Dashboard } from '@/components';
import QuadroNotas from '@/components/notas/QuadroNotas.vue';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import truncate from '@/helpers/truncate';
import { useOrgansStore } from '@/stores/organs.store';
import { usePanoramaTransferenciasStore } from '@/stores/panoramaTransferencias.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { storeToRefs } from 'pinia';
import { onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const panoramaTransferenciasStore = usePanoramaTransferenciasStore();
const partidoStore = usePartidosStore();
const OrgaosStore = useOrgansStore();

const route = useRoute();
const router = useRouter();

const { chamadasPendentes, erro, lista } = storeToRefs(
  panoramaTransferenciasStore,
);
const { partidosPorId } = storeToRefs(partidoStore);
const { órgãosPorId } = storeToRefs(OrgaosStore);

const esfera = ref(route.query.esfera
  ? Object.keys(esferasDeTransferencia)
    .find((x) => x.toLowerCase() === route.query.esfera.toLocaleLowerCase())
  : undefined);
const partido = ref(route.query.partido_ids);
const orgao = ref(route.query.orgaos_ids);
const palavraChave = ref(route.query.palavra_chave);
const atividade = ref(route.query.atividade);

const atividadesDisponíveis = ref([]);
const partidosDisponíveis = ref([]);
const órgãosDisponíveis = ref([]);

const iniciar = async () => {
  const atividades = [];
  let órgãos = [];
  const partidos = [];

  const requisições = [
    OrgaosStore.getAll(),
    partidoStore.buscarTudo(),
    panoramaTransferenciasStore.buscarTudo(),
  ];

  await Promise.allSettled(requisições);

  lista.value.forEach((item) => {
    if (item.atividade) {
      atividades.push(item.atividade);
    }

    if (Array.isArray(item.orgaos)) {
      órgãos = órgãos.concat(item.orgaos);
    }

    if (item.partido_id) {
      partidos.push(item.partido_id);
    }
  });

  atividadesDisponíveis.value = [...new Set(atividades)]
    .sort((a, b) => a.localeCompare(b));
  partidosDisponíveis.value = [...new Set(partidos)]
    .map((x) => partidosPorId.value[x])
    .sort((a, b) => a.sigla?.localeCompare(b.sigla));
  órgãosDisponíveis.value = [...new Set(órgãos)]
    .map((x) => órgãosPorId.value[x])
    .sort((a, b) => a.sigla?.localeCompare(b.sigla));
};

function atualizarUrl() {
  router.push({
    query: {
      ...route.query,
      partido_ids: partido.value || undefined,
      orgaos_ids: orgao.value || undefined,
      esfera: esfera.value || undefined,
      palavra_chave: palavraChave.value || undefined,
      atividade: atividade.value || undefined,
    },
  });
}

watch([
  () => route.query.esfera,
  () => route.query.partido_ids,
  () => route.query.orgaos_ids,
  () => route.query.palavra_chave,
  () => route.query.atividade,
], async () => {
  if (!partidosDisponíveis.value.length
    && !atividadesDisponíveis.value.length
    && !órgãosDisponíveis.value.length
  ) {
    await iniciar();

    panoramaTransferenciasStore.$reset();
  }

  let {
    partido_ids: partidoFiltro,
    orgaos_ids: orgaoFiltro,
    palavra_chave: palavraChaveParaBusca,
    atividade: atividadeFiltro,
  } = route.query;
  if (typeof palavraChaveParaBusca === 'string') {
    palavraChaveParaBusca = palavraChaveParaBusca.trim();
  }
  panoramaTransferenciasStore.$reset();
  panoramaTransferenciasStore.buscarTudo({
    esfera: route.query.esfera
      ? Object.keys(esferasDeTransferencia)
        .find((x) => x.toLowerCase() === route.query.esfera.toLocaleLowerCase())
      : undefined,
    partido_ids: partidoFiltro,
    orgaos_ids: orgaoFiltro,
    palavra_chave: palavraChaveParaBusca,
    atividade: atividadeFiltro,
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

iniciar();

onUnmounted(() => {
  panoramaTransferenciasStore.$reset();
});
</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>Quadro de atividades</h1>
      <hr class="ml2 f1">
    </div>

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
            {{ item.nome }}
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
            v-for="item in partidosDisponíveis"
            :key="item"
            :value="item.id"
          >
            {{ item.sigla }}
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
            v-for="item in atividadesDisponíveis"
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
            v-for="item in órgãosDisponíveis"
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

      <button class="btn outline bgnone tcprimary mtauto mb1">
        Pesquisar
      </button>
    </form>
    <div class="flex flexwrap g2 start">
      <table class="tablemain mb1 f1">
        <col>
        <col>
        <col>
        <col>
        <thead>
          <tr>
            <th>Identificador</th>
            <th>Transferência</th>
            <th>Atividade</th>
            <th>Prazo</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in lista"
            :key="item.transferencia_id"
          >
            <th>
              <router-link
                v-if="item?.transferencia_id"
                :to="{
                  name: 'TransferenciasVoluntariasDetalhes',
                  params: { transferenciaId: item.transferencia_id },
                }"
                class="tprimary"
              >
                {{ item.identificador }}
              </router-link>
            </th>
            <td
              style="max-width: 200px;"
            >
              {{ item.objeto ? item.objeto : " - " }}
            </td>
            <td>
              {{ item.atividade }}
            </td>
            <td :style="{color: dataColor(item.data)}">
              {{ item.data ? new Date(item.data).toLocaleDateString("pt-BR") : "" }}
            </td>
          </tr>
          <tr v-if="chamadasPendentes.lista">
            <td colspan="4">
              Carregando
            </td>
          </tr>
          <tr v-else-if="erro">
            <td colspan="4">
              Erro: {{ erro }}
            </td>
          </tr>
          <tr v-else-if="!lista.length">
            <td colspan="4">
              Nenhum resultado encontrado.
            </td>
          </tr>
        </tbody>
      </table>
      <QuadroNotas />
    </div>
  </Dashboard>
</template>

<style scoped>
.tablemain tbody td:nth-child(2) {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
