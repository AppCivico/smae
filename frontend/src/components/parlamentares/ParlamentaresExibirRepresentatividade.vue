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

const temMandato = computed(() => emFoco?.value?.mandatos?.length);
const temMandatoSP = computed(() => emFoco?.value?.mandatos?.some((mandato) => mandato.uf === 'SP'));
const habilitarBotaoDeRepresentatividade = computed(() => temMandato.value && temMandatoSP.value);

// eslint-disable-next-line max-len
const representatividade = computed(() => (Array.isArray(emFoco?.value?.ultimo_mandato?.representatividade)
  ? emFoco.value.ultimo_mandato.representatividade.reduce((acc, cur) => {
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
  if (!numero) {
    return '';
  }
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
        <col class="col--number">
        <col>
        <col>
        <col class="col--number">
        <col class="col--number">
        <col class="col--number">
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
            <th class="cell--number">
              Ranking na Capital
            </th>
            <th>Município/Subprefeitura</th>
            <th>Região</th>
            <th class="cell--number">
              Votos nominais do candidato
            </th>
            <th class="cell--number">
              Quantidade de Comparecimento
            </th>
            <th class="cell--number">
              Porcentagem do candidato
            </th>
            <th v-if="exibirEdição" />
            <th v-if="exibirEdição" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in representatividade.capital"
            :key="item.id"
          >
            <td class="cell--number">
              {{ item.ranking }}
            </td>
            <td>{{ item.municipio_tipo }}</td>
            <td>{{ item.regiao.descricao }}</td>
            <td class="cell--number">
              {{ formatarNumero(item.numero_votos) }}
            </td>
            <td class="cell--number">
              {{ formatarNumero(item.regiao.comparecimento.valor) }}
            </td>
            <td class="cell--number">
              {{ item.pct_participacao }}%
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
          </tr>
        </tbody>
      </table>
      <p v-else>
        <template v-if="!temMandato">
          É necessário ao menos um mandato para cadastrar representatividade na capital
        </template>
        <template v-else-if="!temMandatoSP">
          É necessário ao menos um mandato em SP para cadastrar representatividade na capital
        </template>
        <template v-else>
          Sem representatividade cadastrada na capital
        </template>
      </p>

      <component
        :is="!habilitarBotaoDeRepresentatividade ? 'span' : 'routerLink'"
        v-if="exibirEdição && emFoco?.id"
        :class="{ disabled: !habilitarBotaoDeRepresentatividade }"
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
      </component>
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
        <col class="col--number">
        <col>
        <col>
        <col class="col--number">
        <col class="col--number">
        <col class="col--number">
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
            <th class="cell--number">
              Ranking no Interior
            </th>
            <th>Município/Subprefeitura</th>
            <th>Região</th>
            <th class="cell--number">
              Votos nominais do candidato
            </th>
            <th class="cell--number">
              Quantidade de Comparecimento
            </th>
            <th class="cell--number">
              Porcentagem do candidato
            </th>
            <th v-if="exibirEdição" />
            <th v-if="exibirEdição" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in representatividade.interior"
            :key="item.id"
          >
            <td class="cell--number">
              {{ item.ranking }}
            </td>
            <td>{{ item.municipio_tipo }}</td>
            <td>{{ item.regiao.descricao }}</td>
            <td class="cell--number">
              {{ formatarNumero(item.numero_votos) }}
            </td>
            <td class="cell--number">
              {{ formatarNumero(item.regiao.comparecimento.valor) }}
            </td>
            <td class="cell--number">
              {{ item.pct_participacao }}%
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
          </tr>
        </tbody>
      </table>
      <p v-else>
        <template v-if="!temMandato">
          É necessário ao menos um mandato para cadastrar representatividade na capital
        </template>
        <template v-else-if="!temMandatoSP">
          É necessário ao menos um mandato em SP para cadastrar representatividade no interior
        </template>
        <template v-else>
          Sem representatividade cadastrada no Interior
        </template>
      </p>
      <component
        :is="!habilitarBotaoDeRepresentatividade ? 'span' : 'routerLink'"
        v-if="exibirEdição && emFoco?.id"
        :class="{ disabled: !habilitarBotaoDeRepresentatividade }"
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
      </component>
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
}
</style>
