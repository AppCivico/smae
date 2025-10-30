<script setup>
import Big from 'big.js';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import LocalFilter from '@/components/LocalFilter.vue';
import { contratoDeObras as schema } from '@/consts/formSchemas';
import { dateToShortDate } from '@/helpers/dateToDate';
import dinheiro from '@/helpers/dinheiro';
import formatProcesso from '@/helpers/formatProcesso';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useContratosStore } from '@/stores/contratos.store.ts';
import { useObrasStore } from '@/stores/obras.store';

defineProps({
  obraId: {
    type: Number,
    default: 0,
  },
  projetoId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();

const processosStore = useContratosStore();
const {
  chamadasPendentes, erro, lista,
} = storeToRefs(processosStore);

const obrasStore = useObrasStore();

const {
  permissõesDaObraEmFoco,
} = storeToRefs(obrasStore);

const listaFiltradaPorTermoDeBusca = ref([]);
const grauVisível = ref(0);
const statusVisível = ref(0);

async function iniciar() {
  processosStore.$reset();

  await processosStore.buscarTudo();
}

const listaFiltrada = computed(() => (!statusVisível.value && !grauVisível.value
  ? listaFiltradaPorTermoDeBusca.value
  : listaFiltradaPorTermoDeBusca.value
    .filter((x) => (!grauVisível.value || x.grau === grauVisível.value)
      && (!statusVisível.value || x.status_processo === statusVisível.value))
));

const totalDeContratos = computed(() => lista.value
  .reduce(
    (acc, cur) => ({
      aditivos: new Big(Number(cur.quantidade_aditivos) || 0).plus(acc.aditivos),
      valor: new Big(Number(cur.valor) || 0).plus(acc.valor),
    }),
    { aditivos: 0, valor: 0 },
  ));

const totalDeContratosFiltrados = computed(() => listaFiltrada.value
  .reduce(
    (acc, cur) => ({
      aditivos: new Big(Number(cur.quantidade_aditivos) || 0).plus(acc.aditivos),
      valor: new Big(Number(cur.valor) || 0).plus(acc.valor),
    }),
    { aditivos: 0, valor: 0 },
  ));

const exibirColunasDeAção = computed(() => !permissõesDaObraEmFoco.value.apenas_leitura
  || permissõesDaObraEmFoco.value.sou_responsavel);

function excluirProcesso(id, nome) {
  alertStore.confirmAction(`Deseja mesmo remover "${nome}"?`, async () => {
    if (await useContratosStore().excluirItem(id)) {
      alertStore.success('Contrato removido.');

      await processosStore.buscarTudo();
    }
  }, 'Remover');
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Contratos
    </TítuloDePágina>

    <hr class="ml2 f1">

    <div class="ml2">
      <router-link
        v-if="exibirColunasDeAção"
        :to="{name: $route.params.obraId ? 'contratosDaObraCriar' : 'contratosDoProjetoCriar' }"
        class="btn"
      >
        Novo contrato
      </router-link>
    </div>
  </div>

  <div class="flex center mb1 spacebetween">
    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="lista"
      class="f1"
    />
  </div>

  <table
    class="tablemain tbody-zebra"
  >
    <colgroup>
      <col>
      <col class="col--minimum">
      <col class="col--data">
      <col class="col--data">
      <col class="col--minimum">
      <col>
      <col class="col--minimum">
      <col
        v-if="exibirColunasDeAção"
        class="col--botão-de-ação"
      >
      <col
        v-if="exibirColunasDeAção"
        class="col--botão-de-ação"
      >
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th>
          {{ schema.fields.numero.spec.label }}
        </th>
        <th>
          {{ schema.fields.status.spec.label }}
        </th>
        <th class="cell--data">
          Término planejado
        </th>
        <th class="cell--data">
          Término atual
        </th>
        <th class="cell--number">
          {{ schema.fields.valor.spec.label }}
        </th>
        <th>
          {{ schema.fields.processos_sei.spec.label }}
        </th>
        <th class="cell--number">
          Quantidade de Aditivos
        </th>
        <th
          v-if="exibirColunasDeAção"
        />
        <th
          v-if="exibirColunasDeAção"
        />
      </tr>
    </thead>

    <tbody
      v-for="linha in listaFiltrada"
      :key="linha.id"
    >
      <tr>
        <th class="">
          <router-link
            :to="{
              name: $route.params.obraId ? 'contratosDaObraResumo' : 'contratosDoProjetoResumo',
              params: {
                obraId: obraId,
                contratoId: linha.id,
                projetoId: projetoId
              }
            }"
          >
            {{ linha.numero }}
          </router-link>
        </th>
        <td>{{ linha.status }}</td>

        <td class="cell--data">
          {{ dateToShortDate(linha.data_termino_inicial) }}
        </td>
        <td class="cell--data">
          {{ dateToShortDate(linha.data_termino_atual) }}
        </td>

        <td class="cell--number">
          R$ {{ dinheiro(linha.valor) }}
        </td>
        <td class="contentStyle">
          <ul v-if="linha.processos_sei.length">
            <li
              v-for="processoSei in linha.processos_sei"
              :key="processoSei"
            >
              {{ formatProcesso(processoSei) }} <br>
            </li>
          </ul>
        </td>
        <td class="cell--number">
          {{ linha.quantidade_aditivos }}
        </td>
        <td
          v-if="exibirColunasDeAção"
          class="center"
        >
          <router-link
            :to="{
              name: $route.params.obraId ? 'contratosDaObraEditar' : 'contratosDoProjetoEditar',
              params: {
                obraId: obraId,
                contratoId: linha.id,
                projetoId: projetoId,
              }
            }"
            title="Editar contrato"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
        <td
          v-if="exibirColunasDeAção"
          class="center"
        >
          <button
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            @click="excluirProcesso(linha.id, linha.numero)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
      </tr>
      <tr>
        <td :colspan="exibirColunasDeAção ? 10 : 8">
          {{ linha.objeto_resumo ? truncate(linha.objeto_resumo, 100) : '-' }}
        </td>
      </tr>
    </tbody>
    <tr v-if="chamadasPendentes.lista">
      <td :colspan="exibirColunasDeAção ? 10 : 8">
        Carregando
      </td>
    </tr>
    <tr v-else-if="erro">
      <td :colspan="exibirColunasDeAção ? 10 : 8">
        Erro: {{ erro }}
      </td>
    </tr>
    <tr v-else-if="!lista.length">
      <td :colspan="exibirColunasDeAção ? 10 : 8">
        Nenhum resultado encontrado.
      </td>
    </tr>
    <tfoot>
      <tr v-if="lista.length && lista.length > listaFiltrada.length">
        <th>Total dos contratos visiveis</th>
        <td />
        <td />
        <td />
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratosFiltrados.valor)}` }}
        </td>
        <td />
        <td class="cell--number">
          {{ totalDeContratosFiltrados.aditivos }}
        </td>
        <th
          v-if="exibirColunasDeAção"
        />
        <th
          v-if="exibirColunasDeAção"
        />
      </tr>
      <tr>
        <th>Total dos contratos</th>
        <td />
        <td />
        <td />
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratos.valor)}` }}
        </td>
        <td />
        <td class="cell--number">
          {{ totalDeContratos.aditivos }}
        </td>
        <th
          v-if="exibirColunasDeAção"
        />
        <th
          v-if="exibirColunasDeAção"
        />
      </tr>
    </tfoot>
  </table>
</template>
