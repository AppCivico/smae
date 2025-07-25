<script setup>
import { storeToRefs } from 'pinia';
import { onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import schemaDaBusca from '@/consts/formSchemas/buscaLivre';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';

const parlamentarStore = useParlamentaresStore();
const {
  lista, chamadasPendentes, erro, paginação,
} = storeToRefs(parlamentarStore);
const route = useRoute();
const alertStore = useAlertStore();
const authStore = useAuthStore();

const camposDeFiltro = [{
  campos: {
    palavra_chave: {
      tipo: 'text',
      placeholder: 'Termo de busca',
    },
  },
}];

async function excluirParlamentar(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await parlamentarStore.excluirItem(id)) {
      parlamentarStore.$reset();
      parlamentarStore.buscarTudo();
      alertStore.success('Parlamentar removido.');
    }
  }, 'Remover');
}

onUnmounted(() => {
  parlamentarStore.$reset();
});

watch(
  () => route.query.palavra_chave,
  (novaPalavraChave) => {
    parlamentarStore.$reset();

    if (novaPalavraChave) {
      parlamentarStore.buscarTudo({ palavra_chave: novaPalavraChave });
    } else {
      parlamentarStore.buscarTudo();
    }
  },
  { immediate: true },
);
</script>
<template>
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink
        v-if="authStore.temPermissãoPara('CadastroParlamentar.inserir')"
        :to="{ name: 'parlamentaresCriar' }"
        class="btn big ml1"
      >
        Novo parlamentar
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <FiltroParaPagina
    class="mb2"
    :formulario="camposDeFiltro"
    :schema="schemaDaBusca"
    :carregando="chamadasPendentes.lista"
  />

  <table class="tablemain">
    <colgroup>
      <col>
      <col>
      <col>
      <col
        v-if="authStore.temPermissãoPara('CadastroParlamentar.remover')"
        class="col--botão-de-ação"
      >
      <col
        v-if="authStore.temPermissãoPara('CadastroParlamentar.editar')"
        class="col--botão-de-ação"
      >
    </colgroup>
    <thead>
      <tr>
        <th>
          Nome de urna
        </th>
        <th>
          Partido
        </th>
        <th>
          Cargo
        </th>
        <th v-if="authStore.temPermissãoPara('CadastroParlamentar.remover')" />
        <th v-if="authStore.temPermissãoPara('CadastroParlamentar.editar')" />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>
          <router-link
            :to="{ name: 'parlamentarDetalhe', params: { parlamentarId: item.id } }"
            class="tprimary"
          >
            {{ item.nome_popular }}
          </router-link>
        </td>
        <td>
          <abbr
            v-if="item.partido"
            :title="item.partido.nome"
          >
            {{ item.partido.sigla }}
          </abbr>
          <template v-else>
            -
          </template>
        </td>
        <td>
          {{ cargosDeParlamentar[item.cargo]?.nome || item.cargo }}
        </td>
        <td v-if="authStore.temPermissãoPara('CadastroParlamentar.editar')">
          <router-link
            :to="{ name: 'parlamentaresEditar', params: { parlamentarId: item.id } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
        <td v-if="authStore.temPermissãoPara('CadastroParlamentar.remover')">
          <button
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirParlamentar(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_waste" /></svg>
          </button>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="3">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="3">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="3">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
  <button
    v-if="paginação.temMais && paginação.tokenDaPróximaPágina"
    :disabled="chamadasPendentes.lista"
    class="btn bgnone outline center mt2"
    @click="parlamentarStore.buscarTudo({
      ...route.query,
      token_proxima_pagina: paginação.tokenDaPróximaPágina
    })"
  >
    carregar mais
  </button>
</template>
