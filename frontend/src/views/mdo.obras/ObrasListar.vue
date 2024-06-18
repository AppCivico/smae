<template>
  <div>
    <div class="flex spacebetween center mb2">
      <h1>{{ route?.meta?.título || 'Painel de obras' }}</h1>
      <hr class="ml2 f1">
      <router-link
        :to="{name: 'obrasCriar'}"
        class="btn big ml1"
      >
        Novo
      </router-link>
    </div>
    lista:  <pre class="debug">{{ lista }}</pre>
    <table class="tablemain">
      <col>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <thead>
        <tr>
          <th>
            Órgão origem
          </th>
          <th>
            portfólio
          </th>
          <th>
            nome da obra
          </th>
          <th>
            grupo temático
          </th>
          <th>
            tipo de intervenção
          </th>
          <th>
            Equipamento
          </th>
          <th>
            Subprefeitura
          </th>
          <th>
            status da obra
          </th>
          <th />
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in lista"
          :key="item.id"
        >
          <td>{{ item.titulo }}</td>
          <td>
            <!-- {{ item.orgaos.map((x) => órgãosPorId[x.id]?.sigla || x.id).join(', ') }} -->
          </td>
          <td>{{ item.modelo_clonagem ? 'Sim' : 'Não' }}</td>
          <td>{{ item.modelo_clonagem ? 'Sim' : 'Não' }}</td>
          <td>{{ item.modelo_clonagem ? 'Sim' : 'Não' }}</td>
          <td>{{ item.modelo_clonagem ? 'Sim' : 'Não' }}</td>
          <td>{{ item.modelo_clonagem ? 'Sim' : 'Não' }}</td>
          <td>{{ item.modelo_clonagem ? 'Sim' : 'Não' }}</td>

          <td>
            <button
              v-if="item?.pode_editar"
              class="like-a__text"
              arial-label="excluir"
              title="excluir"
              @click="excluirPortfolio(item.id)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </td>
          <td>
            <router-link
              v-if="item?.pode_editar"
              :to="{ name: 'portfoliosEditar', params: { portfolioId: item.id } }"
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
  </div>
</template>
<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useObrasStore } from '@/stores/obras.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const obrasStore = useObrasStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(obrasStore);
const route = useRoute();
const alertStore = useAlertStore();

async function excluirObra(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await obrasStore.excluirItem(id)) {
      // obrasStore.$reset();
      obrasStore.buscarTudo();
      alertStore.success('Partido removido.');
    }
  }, 'Remover');
}

// obrasStore.$reset();
obrasStore.buscarTudo();

</script>
