<script setup>
import { storeToRefs } from 'pinia';
import {
  computed, onUnmounted, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';

import FiltroPorOrgaoEUnidade from '@/components/orcamento/FiltroPorOrgaoEUnidade.vue';
import mesDoUltimoItem from '@/components/orcamento/helpers/mesDoUltimoItem';
import somaItems from '@/components/orcamento/helpers/somaItems';
import SmaeDescriptionList from '@/components/SmaeDescriptionList.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import formataValor from '@/helpers/formataValor';
import { useAlertStore } from '@/stores/alert.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';

defineOptions({ inheritAttrs: false });

defineProps({
  podeEditar: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();

const alertStore = useAlertStore();

const orcamentosStore = useOrcamentosStore();
const { OrcamentoRealizado } = storeToRefs(orcamentosStore);

const rotasParaAdicao = computed(() => route.meta.rotasParaAdição || []);

const chamadasPendentes = ref(false);
const erro = ref(null);

const linhas = computed(() => Object.values(OrcamentoRealizado.value)
  .filter((x) => Array.isArray(x))
  .flat()
  .sort((a, b) => b.ano_referencia - a.ano_referencia));

// prefixo órgão.unidade escolhido no filtro por dotação
const prefixoDaDotacao = ref('');

const linhasFiltradas = computed(() => (prefixoDaDotacao.value
  ? linhas.value.filter((x) => x.dotacao?.startsWith(prefixoDaDotacao.value))
  : linhas.value));

// a lista mistura anos; os nomes de órgão e unidade vêm do mais recente
const anoMaisRecente = computed(() => linhas.value[0]?.ano_referencia);

// a execução da própria transferência vem primeiro, seguida de um grupo por
// distribuição de recursos, como metas e iniciativas no Programa de Metas
const grupos = computed(() => {
  const daTransferencia = {
    chave: 'transferencia',
    rotulo: 'Transferência',
    ehDistribuicao: false,
    linhas: [],
  };
  const porDistribuicao = new Map();

  linhasFiltradas.value.forEach((linha) => {
    const distribuicao = linha.distribuicao_recurso;

    if (!distribuicao) {
      daTransferencia.linhas.push(linha);
      return;
    }

    if (!porDistribuicao.has(distribuicao.id)) {
      porDistribuicao.set(distribuicao.id, {
        chave: `distribuicao-${distribuicao.id}`,
        rotulo: distribuicao.nome || distribuicao.objeto || `Distribuição ${distribuicao.id}`,
        ehDistribuicao: true,
        linhas: [],
      });
    }
    porDistribuicao.get(distribuicao.id).linhas.push(linha);
  });

  const distribuicoes = [...porDistribuicao.values()]
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo));

  return daTransferencia.linhas.length
    ? [daTransferencia, ...distribuicoes]
    : distribuicoes;
});

const colunas = [
  // linhas de grupo não têm ano nem data de atualização; sem
  // `permitirValorVazio`, o SmaeTable exibiria '-'
  {
    chave: 'ano_referencia',
    label: 'Ano',
    atributosDaColuna: { class: 'col--number' },
    permitirValorVazio: true,
  },
  {
    chave: 'dotacao',
    label: 'Dotação / Processo / Nota',
    atributosDoCabecalhoDeColuna: { style: 'width: 50%' },
    atributosDaCelula: { style: 'word-break: break-all;' },
  },
  {
    chave: 'soma_valor_empenho',
    label: 'Empenho',
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
    atributosDaCelula: { class: 'cell--number' },
  },
  {
    chave: 'soma_valor_liquidado',
    label: 'Liquidação',
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
    atributosDaCelula: { class: 'cell--number' },
  },
  { chave: 'itens', label: 'Atualizado em', permitirValorVazio: true },
];

// a tabela é plana: cada grupo vira uma linha com seus subtotais, seguida
// dos registros dele
const linhasDaTabela = computed(() => grupos.value.flatMap((grupo) => [
  {
    id: grupo.chave,
    ehGrupo: true,
    ehDistribuicao: grupo.ehDistribuicao,
    rotulo: grupo.rotulo,
    soma_valor_empenho: somaItems(grupo.linhas, 'soma_valor_empenho'),
    soma_valor_liquidado: somaItems(grupo.linhas, 'soma_valor_liquidado'),
  },
  ...grupo.linhas,
]));

const totais = computed(() => ({
  empenho: somaItems(linhasFiltradas.value, 'soma_valor_empenho'),
  liquidacao: somaItems(linhasFiltradas.value, 'soma_valor_liquidado'),
}));

// termo e valor na mesma linha, como no resumo da execução dos demais
// módulos; sem esticar os itens, pois a regra `flex: 1 1 auto` do componente
// vence uma classe utilitária
const estiloDosTotais = {
  atributosDoItem: { class: 'flex g025 center lh1', style: 'flex: 0 0 auto' },
  atributosDoTermo: { class: 't12 w700 tc300' },
  atributosDaDescricao: { class: 't12 w700' },
};

const listaDeTotais = computed(() => [
  {
    chave: 'empenho',
    titulo: 'Empenho:',
    valor: formataValor(totais.value.empenho),
    ...estiloDosTotais,
  },
  {
    chave: 'liquidacao',
    titulo: 'Liquidação:',
    valor: formataValor(totais.value.liquidacao),
    ...estiloDosTotais,
  },
]);

const alemDoEmpenhado = (x) => Number(x.smae_soma_valor_empenho) > Number(x.empenho_liquido);
const alemDoLiquidado = (x) => Number(x.smae_soma_valor_liquidado) > Number(x.valor_liquidado);

// só a busca mais recente controla o carregamento e o erro; uma anterior que
// termine antes exibiria a lista velha durante a carga da nova transferência
let buscaCorrente = 0;

async function iniciar() {
  buscaCorrente += 1;
  const estaBusca = buscaCorrente;

  chamadasPendentes.value = true;
  erro.value = null;

  try {
    await orcamentosStore.buscarTodosOsOrcamentosRealizados();
  } catch (e) {
    if (estaBusca === buscaCorrente) erro.value = e;
  }

  if (estaBusca === buscaCorrente) chamadasPendentes.value = false;
}

function excluir(item) {
  const pergunta = item.possui_vinculos
    ? 'Esse item possui vínculos, que serão invalidados. Deseja mesmo removê-lo?'
    : 'Deseja mesmo remover esse item?';

  alertStore.confirmAction(pergunta, async () => {
    try {
      if (await orcamentosStore.deleteOrcamentoRealizado(item.id)) {
        alertStore.success('Item removido');
        await iniciar();
      }
    } catch (e) {
      alertStore.error(e);
    }
  }, 'Remover');
}

// a mesma instância é reaproveitada ao trocar de transferência pela rota
watch(() => route.params.transferenciaId, () => {
  // o órgão e a unidade da transferência anterior podem não existir nesta
  prefixoDaDotacao.value = '';
  iniciar();
}, { immediate: true });

onUnmounted(() => {
  orcamentosStore.$reset();
});
</script>
<template>
  <CabecalhoDePagina />

  <div
    v-if="podeEditar"
    class="flex"
  >
    <div class="dropbtn mro mlauto">
      <span class="addlink"><svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg> <span>Informar execução orçamentária</span></span>
      <ul class="tl">
        <li
          v-for="item in rotasParaAdicao"
          :key="item.nome"
        >
          <SmaeLink
            :to="{ name: item.nome }"
            :data-test="`incluir-${item.texto}`"
          >
            {{ item.texto }}
          </SmaeLink>
        </li>
      </ul>
    </div>
  </div>

  <LoadingComponent v-if="chamadasPendentes" />

  <ErrorComponent
    v-else-if="erro"
    :erro="erro"
  />

  <template v-else>
    <div
      v-if="linhas.length > 1"
      class="flex mb2"
    >
      <FiltroPorOrgaoEUnidade
        v-model="prefixoDaDotacao"
        :ano="anoMaisRecente"
        :lista="linhas"
      />
    </div>

    <SmaeDescriptionList
      v-if="linhas.length"
      class="mb2"
      :lista="listaDeTotais"
    />

    <SmaeTable
      v-if="linhas.length"
      :colunas="colunas"
      :dados="linhasDaTabela"
      :atributos-da-tabela="{ class: 'no-zebra horizontal-lines' }"
      :personalizar-linhas="{
        parametro: 'ehGrupo',
        alvo: true,
        classe: 'linha-de-grupo tc600 w700',
      }"
    >
      <template #celula:ano_referencia="{ linha }">
        <template v-if="!linha.ehGrupo">
          {{ linha.ano_referencia }}
        </template>
      </template>

      <template #celula:dotacao="{ linha }">
        <span
          v-if="linha.ehGrupo"
          class="flex center"
        ><svg
          v-if="linha.ehDistribuicao"
          class="arrow f0 mr1"
          width="8"
          height="13"
        ><use xlink:href="#i_right" /></svg><span>{{ linha.rotulo }}</span></span>
        <template v-else>
          {{ linha.dotacao }}{{ linha.dotacao_complemento ? '.' + linha.dotacao_complemento : '' }}
          {{ linha.processo ? '/ ' + linha.processo : '' }}
          {{ linha.nota_empenho ? ' / ' + linha.nota_empenho : '' }}
        </template>
      </template>

      <template #celula:soma_valor_empenho="{ linha }">
        <span :class="{ tvermelho: !linha.ehGrupo && alemDoEmpenhado(linha) }">
          {{ formataValor(linha.soma_valor_empenho) }}
        </span>
      </template>

      <template #celula:soma_valor_liquidado="{ linha }">
        <span :class="{ tvermelho: !linha.ehGrupo && alemDoLiquidado(linha) }">
          {{ formataValor(linha.soma_valor_liquidado) }}
        </span>
      </template>

      <template #celula:itens="{ linha }">
        <template v-if="!linha.ehGrupo">
          {{ linha.itens?.length ? mesDoUltimoItem(linha.itens) || '-' : '-' }}
        </template>
      </template>

      <template
        v-if="podeEditar"
        #acoes="{ linha }"
      >
        <template v-if="!linha.ehGrupo && linha.pode_editar">
          <SmaeLink
            :to="{
              name: route.meta.rotaParaEdição,
              params: { id: linha.id },
            }"
            class="tprimary"
            aria-label="Editar"
            :data-test="`editar-${linha.id}`"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </SmaeLink>
          <button
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            type="button"
            :data-test="`excluir-${linha.id}`"
            @click="excluir(linha)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_waste" /></svg>
          </button>
        </template>
      </template>
    </SmaeTable>

    <p
      v-else
      class="p1"
    >
      Nenhuma execução orçamentária informada.
    </p>
  </template>
</template>
