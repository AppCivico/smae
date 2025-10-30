<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useObservadoresStore } from '@/stores/observadores.store.ts';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const organsStore = useOrgansStore();
const { organs, órgãosPorId } = storeToRefs(organsStore);
const observadoresStore = useObservadoresStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(observadoresStore);
const route = useRoute();
const alertStore = useAlertStore();

async function excluirGrupoDeObservadores(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await observadoresStore.excluirItem(id)) {
      observadoresStore.$reset();
      observadoresStore.buscarTudo();
      alertStore.success('Grupo de observadores removido.');
    }
  }, 'Remover');
}

observadoresStore.$reset();
observadoresStore.buscarTudo({ retornar_uso: true });

if (!Array.isArray(organs) || !organs.length) {
  organsStore.getAll();
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Grupos de observadores
    </TítuloDePágina>

    <hr class="ml2 f1">

    <router-link
      :to="{ name: 'gruposDeObservadoresCriar' }"
      class="btn big ml1"
    >
      Novo grupo de observadores
    </router-link>
  </div>

  <table class="tablemain">
    <col>
    <col>
    <col class="col--number">
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
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
        <th>Portfolios</th>
        <th>Projetos</th>
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
            <li v-if="!item.portfolios?.length">
              Nenhum portfolio associado
            </li>
            <li
              v-for="portfolio in item.portfolios"
              :key="portfolio.id"
            >
              <router-link
                :to="{
                  name: 'projetosListar',
                  hash: `#portfolio--${portfolio.id}`
                }"
              >
                {{ portfolio.titulo }}
              </router-link>
            </li>
          </ul>
        </td>
        <td>
          <ul>
            <li v-if="!item.projetos?.length">
              Nenhum projeto associado
            </li>
            <li
              v-for="projeto in item.projetos"
              :key="projeto.id"
            >
              <router-link
                :to="{
                  name: 'projetosResumo',
                  params: {
                    projetoId: projeto.id,
                  }
                }"
              >
                <strong v-if="projeto.codigo">
                  {{ projeto.codigo }} -
                </strong>
                {{ projeto.nome }}
              </router-link>
            </li>
          </ul>
        </td>
        <td>
          <button
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            @click="excluirGrupoDeObservadores(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
        <td>
          <router-link
            :to="{ name: 'gruposDeObservadoresEditar', params: { grupoDeObservadoresId: item.id } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
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
