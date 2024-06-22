<template>
  <div>
    <div class="flex spacebetween center mb2 g2">
      <TítuloDePágina id="titulo-da-pagina" />
      <hr class="f1">
      <router-link
        :to="{name: 'obrasCriar'}"
        class="btn big ml1"
      >
        Nova obra
      </router-link>
    </div>

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
        <col>
        <col>
        <col>
        <col>
        <col>

        <col class="col--botão-de-ação">
        <col class="col--botão-de-ação">
        <thead>
          <tr>
            <th>
              {{ schema.fields.orgao_origem_id.spec.label }}
            </th>
            <th>
              {{ schema.fields.portfolio_id.spec.label }}
            </th>
            <th>
              {{ schema.fields.nome.spec.label }}
            </th>
            <th>
              {{ schema.fields.grupo_tematico_id.spec.label }}
            </th>
            <th>
              {{ schema.fields.tipo_intervencao_id.spec.label }}
            </th>
            <th>
              {{ schema.fields.equipamento_id.spec.label }}
            </th>
            <th>
              {{ schema.fields.regiao_ids.spec.label }}
            </th>
            <th>
              {{ schema.fields.status.spec.label }}
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
            <td>{{ item.orgao_origem.sigla }}</td>
            <td>{{ item.portfolio?.titulo || item.portfolio }}</td>
            <th>{{ item.nome }}</th>
            <td>{{ item.grupo_tematico.nome }}</td>
            <td>
              {{ item.tipo_intervencao?.nome || item.tipo_intervencao || ' - ' }}
            </td>
            <td>
              {{ item.equipamento ? item.equipamento.nome : ' - ' }}
            </td>
            <td>
              {{ item.regioes || ' - ' }}
            </td>
            <td class="cell--minimum">
              {{ statusObras[item.status]?.nome || item.status }}
            </td>

            <td>
              <router-link
                :to="{ name: 'obrasEditar', params: { obraId: item.id } }"
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
                arial-label="excluir"
                title="excluir"
                @click="excluirObra(item.id, item.nome)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg>
              </button>
            </td>
          </tr>
          <tr v-if="chamadasPendentes.lista">
            <td colspan="10">
              Carregando
            </td>
          </tr>
          <tr v-else-if="erro">
            <td colspan="10">
              Erro: {{ erro }}
            </td>
          </tr>
          <tr v-else-if="!lista.length">
            <td colspan="10">
              Nenhum resultado encontrado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import { obras as schema } from '@/consts/formSchemas';
import statusObras from '@/consts/statusObras';
import { useAlertStore } from '@/stores/alert.store';
import { useObrasStore } from '@/stores/obras.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const obrasStore = useObrasStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(obrasStore);
const alertStore = useAlertStore();

const listaFiltradaPorTermoDeBusca = ref([]);

async function excluirObra(id, nome) {
  alertStore.confirmAction(`Deseja mesmo remover "${nome}"?`, async () => {
    if (await obrasStore.excluirItem(id)) {
      obrasStore.buscarTudo({ ipp: 100 });
      alertStore.success('Obra removida.');
    }
  }, 'Remover');
}

obrasStore.buscarTudo({ ipp: 100 });
</script>
