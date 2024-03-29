<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { storeToRefs } from 'pinia';
import { computed, defineProps } from 'vue';

const alertStore = useAlertStore();
const parlamentaresStore = useParlamentaresStore();

const { emFoco } = storeToRefs(parlamentaresStore);

const props = defineProps({
  exibirEdição: {
    type: Boolean,
    default: false,
  },
});

// eslint-disable-next-line max-len
const representatividade = computed(() => (Array.isArray(emFoco?.value?.mandato_atual?.representatividade)
  ? emFoco.value.mandato_atual.representatividade.reduce((acc, cur) => {
    if (cur.municipio_tipo === 'Capital') {
      acc.capital.push(cur);
    }
    if (cur.municipio_tipo === 'Interior') {
      acc.interior.push(cur);
    }
    return acc;
  }, { capital: [], interior: [] })
  : { capital: [], interior: [] }));

function excluirRepresentatividade(representatividadeId, parlamentarId = emFoco.value.id) {
  alertStore.confirmAction('Deseja mesmo remover a pessoa nessa suplência?', async () => {
    if (await parlamentaresStore.excluirRepresentatividade(representatividadeId, parlamentarId)) {
      alertStore.success('Representatividade removida.');
      parlamentaresStore.buscarItem(parlamentarId);
    }
  }, 'Remover');
}

function formatarNumero(numero) {
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
</script>
<template>
  <div>
    <div class="mb4">
      <div class="flex spacebetween center">
        <h3 class="c500">
          Representatividade na Capital
        </h3>
        <hr class="ml2 f1">
      </div>
      <table
        v-if="representatividade.capital.length"
        class="tablemain mb1"
      >
        <col>
        <col>
        <col>
        <col>
        <col>
        <col>
        <col
          v-if="exibirEdição"
          class="col--botão-de-ação"
        >
        <col
          v-if="exibirEdição"
          class="col--botão-de-ação"
        >
        <thead>
          <tr>
            <th>Ranking na Capital</th>
            <th>Município/Subprefeitura</th>
            <th>Região</th>
            <th>Votos nominais do candidato </th>
            <th>Quantidade de Comparecimento</th>
            <th>Porcentagem do candidato</th>
            <th v-if="exibirEdição" />
            <th v-if="exibirEdição" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in representatividade.capital"
            :key="item.id"
          >
            <td>{{ item.ranking }}</td>
            <td>{{ item.municipio_tipo }}</td>
            <td>{{ item.regiao.descricao }}</td>
            <td>{{ formatarNumero(item.numero_votos) }}</td>
            <td>{{ formatarNumero(item.regiao.comparecimento.valor) }}</td>
            <td>{{ item.pct_participacao }}%</td>
            <td v-if="exibirEdição">
              <button
                class="like-a__text"
                arial-label="excluir"
                title="excluir"
                type="button"
                @click="excluirRepresentatividade(suplente.id, emFoco?.id)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg>
              </button>
            </td>

            <td v-if="exibirEdição">
              <router-link
                :to="{
                  name: 'parlamentaresEditarRepresentatividade',
                  params: { parlamentarId: emFoco?.id, representatividadeId: item.id }
                }"
                class="tprimary"
                aria-label="Editar representatividade"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>
        Sem representatividade cadastrada na Capital
      </p>

      <router-link
        v-if="exibirEdição && emFoco?.id"
        :to="{
          name: 'parlamentaresEditarRepresentatividade',
          params: { parlamentarId: emFoco.id },
          query: { tipo: 'capital' }
        }"
        class="like-a__text addlink"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg>Registrar representatividade
      </router-link>
    </div>

    <div class="mb4">
      <div class="flex spacebetween center">
        <h3 class="c500">
          Representatividade no Interior
        </h3>
        <hr class="ml2 f1">
      </div>
      <table
        v-if="representatividade.interior.length"
        class="tablemain mb1"
      >
        <col>
        <col>
        <col>
        <col>
        <col>
        <col>
        <col
          v-if="exibirEdição"
          class="col--botão-de-ação"
        >
        <col
          v-if="exibirEdição"
          class="col--botão-de-ação"
        >
        <thead>
          <tr>
            <th>Ranking no Interior</th>
            <th>Município/Subprefeitura</th>
            <th>Região</th>
            <th>Votos nominais do candidato</th>
            <th>Quantidade de Comparecimento</th>
            <th>Porcentagem do candidato</th>
            <th v-if="exibirEdição" />
            <th v-if="exibirEdição" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in representatividade.interior"
            :key="item.id"
          >
            <td>{{ item.id }}</td>
            <td>{{ item.municipio_tipo }}</td>
            <td>{{ item.regiao.descricao }}</td>
            <td>{{ formatarNumero(item.numero_votos) }}</td>
            <td>{{ formatarNumero(item.regiao.comparecimento.valor) }}</td>
            <td>{{ item.pct_participacao }}%</td>
            <td v-if="exibirEdição">
              <button
                class="like-a__text"
                arial-label="excluir"
                title="excluir"
                type="button"
                @click="excluirRepresentatividade(suplente.id, emFoco?.id)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg>
              </button>
            </td>
            <td v-if="exibirEdição">
              <router-link
                :to="{
                  name: 'parlamentaresEditarRepresentatividade',
                  params: { parlamentarId: emFoco?.id, representatividadeId: item.id }
                }"
                class="tprimary"
                aria-label="Editar representatividade"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>
        Sem representatividade cadastrada no Interior
      </p>
      <router-link
        v-if="exibirEdição && emFoco?.id"
        :to="{
          name: 'parlamentaresEditarRepresentatividade',
          params: { parlamentarId: emFoco.id },
          query: { tipo: 'interior' }
        }"
        class="like-a__text addlink"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg>Registrar representatividade
      </router-link>
    </div>
  </div>
</template>
<style scoped ang="less">
h3{
  color: #607A9F;
  font-weight: 700;
  font-size: 24px;
}
table{
  max-width: 1000px;
  margin: 0 auto;
}
</style>
