<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import { planoSetorial as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const alertStore = useAlertStore();

const planosSetoriaisStore = usePlanosSetoriaisStore();
const {
  lista, chamadasPendentes, erros,
} = storeToRefs(planosSetoriaisStore);

const listaFiltradaPorTermoDeBusca = ref([]);

async function excluirPlano(id, nome) {
  alertStore.confirmAction(`Deseja mesmo remover o plano "${nome}"?`, async () => {
    if (await planosSetoriaisStore.excluirItem(id)) {
      planosSetoriaisStore.buscarTudo();
      alertStore.success('Plano removido.');
    }
  }, 'Remover');
}

planosSetoriaisStore.buscarTudo();
</script>
<template>
  <header class="flex spacebetween center mb2 g2">
    <TítuloDePágina id="titulo-da-pagina" />

    <hr class="f1">

    <router-link
      :to="{ name: 'planosSetoriaisCriar' }"
      class="btn big ml1"
    >
      Novo plano setorial
    </router-link>
  </header>

  <LocalFilter
    v-model="listaFiltradaPorTermoDeBusca"
    class="mb2"
    :lista="lista"
  />

  <div
    role="region"
    aria-labelledby="titulo-da-pagina"
    tabindex="0"
  >
    <table class="tablemain">
      <col>
      <col>
      <col>
      <col class="col--minimum">
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <thead>
        <tr>
          <th>
            {{ schema.fields.nome.spec.label }}
          </th>
          <th>
            {{ schema.fields.descricao.spec.label }}
          </th>
          <th>
            {{ schema.fields.prefeito.spec.label }}
          </th>
          <th>
            {{ schema.fields.ativo.spec.label }}
          </th>
          <th />
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in listaFiltradaPorTermoDeBusca"
          :key="item.id"
        >
          <th>
            <router-link
              :to="{ name: 'planosSetoriaisResumo', params: { planoSetorialId: item.id } }"
            >
              {{ item.nome }}
            </router-link>
          </th>
          <td>
            {{ truncate(item?.descricao, 36) }}
          </td>
          <td>
            {{ item.prefeito }}
          </td>
          <td>{{ item.ativo ? 'Sim' : 'Não' }}</td>
          <td>
            <router-link
              :to="{ name: 'planosSetoriaisEditar', params: { planoSetorialId: item.id } }"
              class="tprimary"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
            </router-link>
          </td>
          <td>
            <button
              class="like-a__text"
              aria-label="excluir"
              title="excluir"
              @click="excluirPlano(item.id, item.nome)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </td>
        </tr>
        <tr v-if="chamadasPendentes.lista">
          <td colspan="6">
            Carregando
          </td>
        </tr>
        <tr v-else-if="erros.lista">
          <td colspan="6">
            Erro: {{ erros.lista }}
          </td>
        </tr>
        <tr v-else-if="!lista.length">
          <td colspan="6">
            Nenhum resultado encontrado.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
