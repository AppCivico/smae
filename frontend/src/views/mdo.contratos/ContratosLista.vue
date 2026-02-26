<script setup>
import Big from 'big.js';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import LocalFilter from '@/components/LocalFilter.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { contratoDeObras } from '@/consts/formSchemas';
import { dateToShortDate } from '@/helpers/dateToDate';
import dinheiro from '@/helpers/dinheiro';
import formatProcesso from '@/helpers/formatProcesso';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useContratosStore } from '@/stores/contratos.store.ts';
import { useObrasStore } from '@/stores/obras.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';

const props = defineProps({
  obraId: {
    type: Number,
    default: 0,
  },
  projetoId: {
    type: Number,
    default: 0,
  },
});

const route = useRoute();

const alertStore = useAlertStore();

const contratosStore = useContratosStore(route.meta.entidadeMãe);
const {
  chamadasPendentes, erro, lista,
} = storeToRefs(contratosStore);

const {
  permissõesDaObraEmFoco,
} = storeToRefs(useObrasStore());

const {
  permissõesDoProjetoEmFoco,
} = storeToRefs(useProjetosStore());

const permissoesDoItemEmFoco = computed(() => (route.meta.entidadeMãe === 'obras'
  ? permissõesDaObraEmFoco.value
  : permissõesDoProjetoEmFoco.value));

const listaFiltradaPorTermoDeBusca = ref([]);
const grauVisível = ref(0);
const statusVisível = ref(0);

const schema = computed(() => contratoDeObras(route.meta.entidadeMãe));

async function iniciar() {
  contratosStore.$reset();

  await contratosStore.buscarTudo();
}

const listaFiltrada = computed(() => (!statusVisível.value && !grauVisível.value
  ? listaFiltradaPorTermoDeBusca.value
  : listaFiltradaPorTermoDeBusca.value
    .filter((x) => (!grauVisível.value || x.grau === grauVisível.value)
      && (!statusVisível.value || x.status_processo === statusVisível.value))
));

function somarCamposDeContratos(itens) {
  return itens.reduce(
    (acc, cur) => ({
      quantidade_aditivos: new Big(cur.quantidade_aditivos || 0)
        .plus(acc.quantidade_aditivos),
      quantidade_reajustes: new Big(cur.quantidade_reajustes || 0)
        .plus(acc.quantidade_reajustes),
      valor: new Big(cur.valor || 0).plus(acc.valor),
      total_aditivos: new Big(cur.total_aditivos || 0).plus(acc.total_aditivos),
      total_reajustes: new Big(cur.total_reajustes || 0).plus(acc.total_reajustes),
      valor_reajustado: new Big(cur.valor_reajustado || 0).plus(acc.valor_reajustado),
    }),
    {
      quantidade_aditivos: 0,
      quantidade_reajustes: 0,
      valor: 0,
      total_aditivos: 0,
      total_reajustes: 0,
      valor_reajustado: 0,
    },
  );
}

const totalDeContratos = computed(() => somarCamposDeContratos(lista.value));
const totalDeContratosFiltrados = computed(() => somarCamposDeContratos(listaFiltrada.value));

const exibirColunasDeAção = computed(() => !permissoesDoItemEmFoco.value.apenas_leitura
  || permissoesDoItemEmFoco.value.sou_responsavel);

function excluirProcesso(id, nome) {
  alertStore.confirmAction(`Deseja mesmo remover "${nome}"?`, async () => {
    if (await contratosStore.excluirItem(id)) {
      alertStore.success('Contrato removido.');

      await contratosStore.buscarTudo();
    }
  }, 'Remover');
}

const colunas = computed(() => [
  {
    chave: 'numero',
    label: schema.value.fields.numero.spec.label,
    ehCabecalho: true,
  },
  {
    chave: 'status',
    label: schema.value.fields.status.spec.label,
    atributosDaColuna: { class: 'col--minimum' },
  },
  {
    chave: 'data_termino_inicial',
    label: 'Término planejado',
    formatador: (v) => (v ? dateToShortDate(v) : ''),
    atributosDaColuna: { class: 'col--data' },
    atributosDaCelula: { class: 'cell--data' },
    atributosDoCabecalhoDeColuna: { class: 'cell--data' },
  },
  {
    chave: 'data_termino_atual',
    label: 'Término atual',
    formatador: (v) => (v ? dateToShortDate(v) : ''),
    atributosDaColuna: { class: 'col--data' },
    atributosDaCelula: { class: 'cell--data' },
    atributosDoCabecalhoDeColuna: { class: 'cell--data' },
  },
  {
    chave: 'valor',
    label: schema.value.fields.valor.spec.label,
    formatador: (v) => (v ? `R$ ${dinheiro(v)}` : 'R$ 0,00'),
    atributosDaColuna: { class: 'col--minimum' },
    atributosDaCelula: { class: 'cell--number' },
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
  },
  {
    chave: 'total_aditivos',
    label: 'Valor total aditivos',
    formatador: (v) => (v ? `R$ ${dinheiro(v)}` : 'R$ 0,00'),
    atributosDaColuna: { class: 'col--minimum' },
    atributosDaCelula: { class: 'cell--number' },
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
  },
  {
    chave: 'total_reajustes',
    label: 'Valor total reajustes',
    formatador: (v) => (v ? `R$ ${dinheiro(v)}` : 'R$ 0,00'),
    atributosDaColuna: { class: 'col--minimum' },
    atributosDaCelula: { class: 'cell--number' },
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
  },
  {
    chave: 'valor_reajustado',
    label: 'Valor reajustado',
    formatador: (v) => (v ? `R$ ${dinheiro(v)}` : 'R$ 0,00'),
    atributosDaColuna: { class: 'col--minimum' },
    atributosDaCelula: { class: 'cell--number' },
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
  },
  {
    chave: 'processos_sei',
    label: schema.value.fields.processos_sei.spec.label,
    formatador: () => '',
  },
  {
    chave: 'quantidade_aditivos',
    label: 'Qtd. Aditivos',
    atributosDaColuna: { class: 'col--minimum' },
    atributosDaCelula: { class: 'cell--number' },
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
  },
  {
    chave: 'quantidade_reajustes',
    label: 'Qtd. Reajustes',
    atributosDaColuna: { class: 'col--minimum' },
    atributosDaCelula: { class: 'cell--number' },
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
  },
]);

const rotas = computed(() => (props.obraId
  ? {
    resumo: 'contratosDaObraResumo',
    editar: 'contratosDaObraEditar',
    criar: 'contratosDaObraCriar',
  }
  : {
    resumo: 'contratosDoProjetoResumo',
    editar: 'contratosDoProjetoEditar',
    criar: 'contratosDoProjetoCriar',
  }));

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina id="titulo-da-pagina">
      Contratos
    </TítuloDePágina>

    <hr class="ml2 f1">

    <div class="ml2">
      <SmaeLink
        v-if="exibirColunasDeAção"
        :to="{ name: rotas.criar }"
        class="btn"
      >
        Novo contrato
      </SmaeLink>
    </div>
  </div>

  <div class="flex center mb1 spacebetween">
    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="lista"
      class="f1"
    />
  </div>

  <SmaeTable
    v-if="!chamadasPendentes.lista && !erro && lista.length"
    :colunas="colunas"
    :dados="listaFiltrada"
    :rota-editar="exibirColunasDeAção
      ? {
        name: rotas.editar,
      }
      : undefined"
    parametro-da-rota-editar="contratoId"
    parametro-no-objeto-para-editar="id"
    :esconder-deletar="!exibirColunasDeAção"
    :aria-busy="chamadasPendentes.lista"
    titulo="Contratos"
    rolagem-horizontal
    sub-linha-sempre-visivel
    @deletar="(linha) => excluirProcesso(linha.id, linha.numero)"
  >
    <template #celula:numero="{ linha }">
      <SmaeLink
        :to="{
          name: rotas.resumo,
          params: {
            obraId,
            contratoId: linha.id,
            projetoId,
          },
        }"
      >
        {{ linha.numero }}
      </SmaeLink>
    </template>

    <template #celula:processos_sei="{ linha }">
      <ul v-if="linha.processos_sei?.length">
        <li
          v-for="processoSei in linha.processos_sei"
          :key="processoSei"
          class="nowrap"
        >
          {{ formatProcesso(processoSei) }}
        </li>
      </ul>
    </template>

    <template #sub-linha="{ linha }">
      <td :colspan="colunas.length + (exibirColunasDeAção ? 1 : 0)">
        <dl class="flex g1">
          <dt class="t12 uc w700 tc300">
            Resumo:
          </dt>
          <dd>
            {{ linha.objeto_resumo ? truncate(linha.objeto_resumo, 100) : '-' }}
          </dd>
        </dl>
      </td>
    </template>

    <template #rodape>
      <tr v-if="lista.length && lista.length > listaFiltrada.length">
        <th>Total dos contratos visíveis</th>
        <td />
        <td />
        <td />
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratosFiltrados.valor)}` }}
        </td>
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratosFiltrados.total_aditivos)}` }}
        </td>
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratosFiltrados.total_reajustes)}` }}
        </td>
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratosFiltrados.valor_reajustado)}` }}
        </td>
        <td />
        <td class="cell--number">
          {{ totalDeContratosFiltrados.quantidade_aditivos }}
        </td>
        <td class="cell--number">
          {{ totalDeContratosFiltrados.quantidade_reajustes }}
        </td>
        <td v-if="exibirColunasDeAção" />
      </tr>
      <tr>
        <th>Total dos contratos</th>
        <td />
        <td />
        <td />
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratos.valor)}` }}
        </td>
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratos.total_aditivos)}` }}
        </td>
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratos.total_reajustes)}` }}
        </td>
        <td class="cell--number">
          {{ `R$ ${dinheiro(totalDeContratos.valor_reajustado)}` }}
        </td>
        <td />
        <td class="cell--number">
          {{ totalDeContratos.quantidade_aditivos }}
        </td>
        <td class="cell--number">
          {{ totalDeContratos.quantidade_reajustes }}
        </td>
        <td v-if="exibirColunasDeAção" />
      </tr>
    </template>
  </SmaeTable>

  <div
    v-if="chamadasPendentes.lista"
    class="p1"
  >
    Carregando...
  </div>

  <div
    v-else-if="erro"
    class="error p1"
  >
    Erro: {{ erro }}
  </div>

  <div
    v-else-if="!lista.length"
    class="p1"
  >
    Nenhum resultado encontrado.
  </div>
</template>
