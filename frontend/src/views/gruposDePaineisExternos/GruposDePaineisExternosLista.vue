<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useGruposPaineisExternos } from '@/stores/grupospaineisExternos.store.ts';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import SmaeLink from '@/components/SmaeLink.vue';

const organsStore = useOrgansStore();
const { organs, órgãosPorId } = storeToRefs(organsStore);
const useGruposPaineisExternosStore = useGruposPaineisExternos();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(useGruposPaineisExternosStore);
const route = useRoute();
const alertStore = useAlertStore();

async function excluirGrupoDePaineisExternos(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await useGruposPaineisExternosStore.excluirItem(id)) {
      useGruposPaineisExternosStore.$reset();
      useGruposPaineisExternosStore.buscarTudo();
      alertStore.success('Grupos de painéis Externos removido.');
    }
  }, 'Remover');
}

useGruposPaineisExternosStore.$reset();
useGruposPaineisExternosStore.buscarTudo({ retornar_uso: true });

if (!Array.isArray(organs) || !organs.length) {
  organsStore.getAll();
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Grupos de Painéis Externos
    </TítuloDePágina>

    <hr class="ml2 f1">

    <router-link
      :to="{ name: 'grupospaineisExternosCriar' }"
      class="btn big ml1"
    >
      Novo Grupo de Painéis Externos
    </router-link>
  </div>

  <table class="tablemain">
    <colgroup>
      <col>
      <col>
      <col class="col--number">
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </colgroup>
    <thead>
      <tr>
        <th>
          Nome
        </th>
        <th>
          Órgão
        </th>
        <th class="cell--number">
          Nº de participantes
        </th>
        <th>Painéis Externos</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.titulo }}</td>
        <td>
          {{ órgãosPorId[item.orgao_id]?.sigla || item.id }}
        </td>
        <td class="cell--number">
          {{ item.participantes?.length ?? '-' }}
        </td>
        <td>
          <ul>
            <li v-if="!item.paineis?.length">
              Grupo não associado a um painel
            </li>
            <li
              v-for="painel in item.paineis"
              :key="painel.id"
            >
              {{ painel.titulo }}
            </li>
          </ul>
        </td>
        <td>
          <SmaeLink
            :to="{ name: 'gruposPaineisExternosEditar', params: { gruposPaineisExternosId: item.id } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </SmaeLink>
        </td>
        <td>
          <button
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirGrupoDePaineisExternos(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="7">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="7">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="7">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
