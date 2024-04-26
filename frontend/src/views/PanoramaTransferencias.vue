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
const { lista: partidoComoLista } = storeToRefs(partidoStore);
const { órgãosComoLista } = storeToRefs(OrgaosStore);

// não finalizado
const esfera = ref(route.query.esfera
  ? Object.keys(esferasDeTransferencia)
    .find((x) => x.toLowerCase() === route.query.esfera.toLocaleLowerCase())
  : undefined);
const partido = ref(route.query.partido_ids);
const orgao = ref(route.query.orgaos_ids);
const palavraChave = ref(route.query.palavra_chave);

function atualizarUrl() {
  router.push({
    query: {
      ...route.query,
      partido_ids: partido.value || undefined,
      orgaos_ids: orgao.value || undefined,
      esfera: esfera.value || undefined,
      palavra_chave: palavraChave.value || undefined,
    },
  });
}

watch([
  () => route.query.esfera,
  () => route.query.partido_ids,
  () => route.query.orgaos_ids,
  () => route.query.palavra_chave,
], () => {
  let {
    partido_ids: partidoFiltro,
    orgaos_ids: orgaoFiltro,
    palavra_chave: palavraChaveParaBusca,
  } = route.query;
  if (typeof palavraChaveParaBusca === 'string') {
    // eslint-disable-next-line no-const-assign
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
  });
}, { immediate: true });

OrgaosStore.getAll();
panoramaTransferenciasStore.buscarTudo();
partidoStore.buscarTudo();

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
          v-model.trim="esfera"
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
          v-model.trim="partido"
          class="inputtext mb1"
          name="partido"
        >
          <option value="" />
          <option
            v-for="item in partidoComoLista"
            :key="item"
            :value="item.id"
          >
            {{ item.nome }} - {{ item.sigla }}
          </option>
        </select>
      </div>

      <!-- <div class="f1">
        <label
          for="situacao"
          class="label tc300"
        >Situação</label>
        <select
          id="situacao"
          v-model.trim="situacao"
          class="inputtext mb1"
          name="situacao"
        >
          <option value="" />
          <option
            v-for="item in lista"
            :key="item.id"
            :value="item.id"
          >
            {{ item.situacao }}
          </option>
        </select>
      </div> -->

      <div class="f1">
        <label
          for="orgao"
          class="label tc300"
        >orgão</label>
        <select
          id="orgao"
          v-model.trim="orgao"
          class="inputtext mb1"
          name="orgao"
        >
          <option value="" />
          <option
            v-for="item in órgãosComoLista"
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
                :to="{
                  name: 'TransferenciasVoluntariasDetalhes',
                  params: { transferenciaId: item.transferencia_id },
                }"
                class="tprimary"
              >
                {{ item.identificador }}
              </router-link>
            </th>
            <td>
              {{ item.transferencia_id }}
            </td>
            <td>
              {{ item.atividade }}
            </td>
            <td>
              {{
                item.data ? new Date(item.data).toLocaleDateString("pt-BR") : ""
              }}
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
.tablemain tbody tr:nth-child(5n+1) td:nth-child(4) {
  color: #EE3B2B;
;
}

.tablemain tbody tr:nth-child(5n+2) td:nth-child(4) {
  color: #F2890D;
;
}

.tablemain tbody tr:nth-child(5n+3) td:nth-child(4) {
  color: #F2890D;
;
}

.tablemain tbody tr:nth-child(5n+4) td:nth-child(4) {
 color: #F7C234;
}

.tablemain tbody tr:nth-child(5n+5) td:nth-child(4) {
 color: #F7C234;
}

.tablemain tbody tr:nth-child(n+6) td:nth-child(4) {
 color: #F7C234;
}
</style>
