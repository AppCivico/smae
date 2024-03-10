<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { useAuthStore } from '@/stores/auth.store';

const parlamentarStore = useParlamentaresStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(parlamentarStore);
const route = useRoute();
const alertStore = useAlertStore();
const authStore = useAuthStore();

async function excluirParlamentar(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await parlamentarStore.excluirItem(id)) {
      parlamentarStore.$reset();
      parlamentarStore.buscarTudo();
      alertStore.success('Parlamentar removido.');
    }
  }, 'Remover');
}

parlamentarStore.$reset();
parlamentarStore.buscarTudo();

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Lista de Parlamentares' }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{name: 'parlamentaresCriar'}"
      class="btn big ml1"
    >
      Novo parlamentar
    </router-link>
  </div>
  <table class="tablemain">
    <col>
    <col>
    <col>
    <col
      v-if="authStore.temPermissãoPara('SMAE.acesso_telefone')"
      class="col--botão-de-ação"
    >
    <col
      v-if="authStore.temPermissãoPara('SMAE.acesso_telefone')"
      class="col--botão-de-ação"
    >
    <thead>
      <tr>
        <th>
          Nome
        </th>
        <th>
          Partido
        </th>
        <th>
          Cargo
        </th>
        <th v-if="authStore.temPermissãoPara('SMAE.acesso_telefone')" />
        <th v-if="authStore.temPermissãoPara('SMAE.acesso_telefone')" />
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
            {{ item.nome }}
          </router-link>
        </td>
        <td> <span v-if="item.partido">{{ item.partido.sigla }}</span></td>
        <td> <span v-if="item.cargo">{{ item.cargo }}</span></td>
        <td v-if="authStore.temPermissãoPara('SMAE.acesso_telefone')">
          <button
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirParlamentar(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
        <td v-if="authStore.temPermissãoPara('SMAE.acesso_telefone')">
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
</template>
