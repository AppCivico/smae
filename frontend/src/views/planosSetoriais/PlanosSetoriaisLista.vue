<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import { planoSetorial as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const alertStore = useAlertStore();

const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe);
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

if (!lista.length) {
  planosSetoriaisStore.buscarTudo();
}
</script>
<template>
  <header class="flex spacebetween center mb2 g2">
    <TítuloDePágina id="titulo-da-pagina" />

    <hr class="f1">

    <router-link
      :to="{ name: `${route.meta.entidadeMãe}.planosSetoriaisCriar` }"
      class="btn big ml1"
    >
      Novo {{ $route.meta.tituloSingular }}
    </router-link>
  </header>

  <LocalFilter
    v-model="listaFiltradaPorTermoDeBusca"
    :lista="lista"
  />

  <div
    role="region"
    aria-labelledby="titulo-da-pagina"
    tabindex="0"
  >
    <table class="tablemain mt2">
      <col>
      <col>
      <col>
      <col class="col--minimum">
      <col>
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
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in listaFiltradaPorTermoDeBusca"
          :key="item.id"
        >
          <th>
            <SmaeLink
              :to="{
                name: `${route.meta.entidadeMãe}.planosSetoriaisResumo`,
                params: { planoSetorialId: item.id } }"
            >
              {{ item.nome }}
            </SmaeLink>
          </th>
          <td>
            {{ truncate(item?.descricao, 36) }}
          </td>
          <td>
            {{ item.prefeito }}
          </td>
          <td>{{ item.ativo ? 'Sim' : 'Não' }}</td>
          <td>
            <span class="flex justifycenter g1">
              <SmaeLink
                v-if="item.pode_editar"
                class="tprimary tipinfo left"
                :to="{
                  name: '.planosSetoriaisEditar',
                  params: { planoSetorialId: item.id }
                }"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </SmaeLink>

              <SmaeLink
                class="tprimary tipinfo left"
                :to="{
                  name: '.permissoesOrcamento',
                  params: {
                    planoSetorialId: item.id
                  }
                }"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_calendar" /></svg>
                <div>Permissões para edições no orçamento</div>
              </SmaeLink>

              <button
                v-if="item.pode_editar"
                class="like-a__text"
                arial-label="excluir"
                title="excluir"
                @click="excluirPlano(item.id, item.nome)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_waste" /></svg>
              </button>
            </span>
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
