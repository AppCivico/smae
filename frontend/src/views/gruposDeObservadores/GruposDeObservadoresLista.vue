<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useObservadoresStore } from '@/stores/observadores.store.ts';

const { meta } = useRoute();

const alertStore = useAlertStore();
const organsStore = useOrgansStore();
const observadoresStore = useObservadoresStore(meta.entidadeMãe);

const { organs, órgãosPorId } = storeToRefs(organsStore);
const { lista, chamadasPendentes, erro } = storeToRefs(observadoresStore);

async function excluirGrupoDeObservadores(id) {
  alertStore.confirmAction(
    'Deseja mesmo remover esse item?',
    async () => {
      if (await observadoresStore.excluirItem(id)) {
        observadoresStore.$reset();
        observadoresStore.buscarTudo();
        alertStore.success('Grupo de observadores removido.');
      }
    },
    'Remover',
  );
}

observadoresStore.$reset();
observadoresStore.buscarTudo({ retornar_uso: true });

if (!Array.isArray(organs) || !organs.length) {
  organsStore.getAll();
}
</script>

<template>
  <MigalhasDePão class="mb1" />
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink
        :to="{ name: '.gruposObservadores.criar' }"
        class="btn big"
      >
        Novo grupo de observadores
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <ErrorComponent
    v-if="erro"
    :erro="erro"
  />

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
        <th>Nome</th>
        <th>Órgão</th>
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
          {{ item.participantes?.length ?? "-" }}
        </td>
        <td>
          <ul>
            <li v-if="!item.portfolios?.length">
              Nenhum portfólio associado
            </li>
            <li
              v-for="portfolio in item.portfolios"
              :key="portfolio.id"
            >
              <router-link
                :to="{
                  name: 'projetosListar',
                  hash: `#portfolio--${portfolio.id}`,
                }"
              >
                {{ portfolio.titulo }}
              </router-link>
            </li>
          </ul>
        </td>
        <td>
          <ul
            v-if="$route.meta.rotaParaItensAssociados.nome
              && $route.meta.rotaParaItensAssociados.nomeDoParametro"
          >
            <li v-if="!item.projetos?.length">
              Nenhum projeto associado
            </li>
            <li
              v-for="projeto in item.projetos"
              :key="projeto.id"
            >
              <SmaeLink
                :to="{
                  name: $route.meta.rotaParaItensAssociados.nome,
                  params: {
                    [$route.meta.rotaParaItensAssociados.nomeDoParametro]: projeto.id,
                  },
                }"
              >
                <strong v-if="projeto.codigo"> {{ projeto.codigo }} - </strong>
                {{ projeto.nome }}
              </SmaeLink>
            </li>
          </ul>
        </td>
        <td>
          <SmaeLink
            :to="{
              name: '.gruposObservadores.editar',
              params: { grupoDeObservadoresId: item.id },
            }"
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
            @click="excluirGrupoDeObservadores(item.id)"
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
      <tr v-else-if="!lista.length">
        <td colspan="7">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
