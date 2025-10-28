<script lang="ts" setup>
import { templateRef } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import * as CardEnvelope from '@/components/cardEnvelope';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import ListaLegendas from '@/components/ListaLegendas.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import type { Coluna } from '@/components/SmaeTable/tipagem.ts';
import SmallModal from '@/components/SmallModal.vue';
import DetalhamentoDeVinculosPorItem from '@/components/TransferenciasVoluntarias/DetalhamentoDeVinculosPorItem.vue';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import { LegendasStatus, useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import { useGeolocalizadorStore } from '@/stores/geolocalizador.store';

import ConsultaGeralVinculacaoIndex from '../ConsultaGeralVinculacao/ConsultaGeralVinculacaoIndex.vue';
import ConsultaGeralFiltroDotacao from './ConsultaGeralFiltroDotacao.vue';
import ConsultaGeralFiltroEndereco from './ConsultaGeralFiltroEndereco.vue';

const legendas = {
  status: Object.values(LegendasStatus),
};

const tiposPesquisa = {
  endereco: 'Endereço',
  dotacao: 'Dotação',
};

const valoresIniciais = {
  tipo: 'endereco',
};

const route = useRoute();

const geolocalizadorStore = useGeolocalizadorStore();
const entidadesProximasStore = useEntidadesProximasStore();
const { entidadesPorProximidade, entidadesPorDotacao } = storeToRefs(entidadesProximasStore);

const areaFiltroRef = templateRef('area-filtro');
const detalhamentoAberto = ref(-1);
const vinculacaoAberta = ref(-1);

const tipo = computed<'endereco' | 'dotacao'>(() => route.query.tipo as 'endereco' | 'dotacao');

const filtroSelecionado = computed(() => {
  const mapaTipo = {
    endereco: ConsultaGeralFiltroEndereco,
    dotacao: ConsultaGeralFiltroDotacao,
  };

  return mapaTipo[tipo.value] || 'h3';
});

const dadosParaTabela = computed(() => {
  switch (tipo.value) {
    case 'endereco':
      return entidadesPorProximidade.value;

    case 'dotacao':
      return entidadesPorDotacao.value;

    default:
      return [];
  }
});

const colunas = computed(() => {
  const colunasGerais: Coluna[] = [
    {
      chave: 'cor',
      label: '',
      atributosDaColuna: { class: 'col--minimum' },
      atributosDaCelula: { class: 'tc' },
    },
    { chave: 'portfolio_programa', label: 'portfólio/plano ou programa' },
    { chave: 'nome', label: 'nome/meta' },
    { chave: 'orgao', label: 'Órgão' },
    {
      chave: 'status',
      label: 'status',
      formatador: (v) => v?.nome || 'N/A',
      atributosDaColuna: { class: 'col--minimum' },
    },
    {
      chave: 'nro_vinculos',
      label: 'nº vínculos',
      atributosDaCelula: { class: 'cell--number' },
      atributosDaColuna: { class: 'col--minimum' },
      atributosDoCabecalhoDeColuna: { class: 'cell--number' },
      atributosDoRodapeDeColuna: { class: 'cell--number' },
    },
  ];

  const colunaDinamica = tipo.value === 'dotacao'
    ? {
      chave: 'dotacoes_encontradas',
      label: 'Dotação',
      ehCabecalho: true,
    }
    : {
      chave: 'localizacoes',
      label: 'Endereço / distância (km)',
      ehCabecalho: true,
    };

  return [
    colunasGerais[0],
    colunaDinamica,
  ].concat(colunasGerais.slice(1));
});

watch(tipo, (novoTipo, tipoAnterior) => {
  if (tipoAnterior !== undefined && novoTipo !== undefined && novoTipo !== tipoAnterior) {
    geolocalizadorStore.$reset();
    entidadesProximasStore.$reset();
  }
}, { immediate: true });

async function handleNovaVinculacao() {
  vinculacaoAberta.value = -1;

  await areaFiltroRef.value?.resetarPesquisa();
}
</script>

<template>
  <FormularioQueryString :valores-iniciais="valoresIniciais">
    <div class="flex flexwrap spacebetween center mb2 mt2">
      <TituloDaPagina />

      <hr class="ml2 f1">

      <div class="flex g2 ml1">
        <SmaeLink
          v-for="(tipoPesquisa, tipoPesquisaKey) in tiposPesquisa"
          :key="`tipo-pesquisa--${tipoPesquisaKey}`"
          class="btn big outline bgnone"
          :class="tipoPesquisaKey === tipo ? 'tamarelo' : 'tcprimary'"
          :to="{ query: { tipo: tipoPesquisaKey }}"
        >
          Pesquisar por {{ tipoPesquisa }}
        </SmaeLink>
      </div>
    </div>

    <component
      :is="filtroSelecionado"
      ref="area-filtro"
    >
      Carregando...
    </component>

    <CardEnvelope.Conteudo class="mt4">
      <article
        class="tabela-resultados "
      >
        <CardEnvelope.Titulo>
          <span class="tabela-resultados__titulo">
            Resultado por: &nbsp;
            <strong>{{ tiposPesquisa[tipo] }}</strong>
          </span>
        </CardEnvelope.Titulo>

        <ListaLegendas
          titulo=""
          :legendas="legendas"
          :borda="false"
          align="left"
          orientacao="horizontal"
        />

        <SmaeTable
          :key="tipo"
          class="mt3"
          replicar-cabecalho
          :colunas="colunas"
          :dados="dadosParaTabela"
          :atributos-da-tabela="{ class: 'cabecalho-congelado'}"
        >
          <template #celula:cor="{ celula }">
            <div
              :class="['celula__item', 'celula__item-classificacao']"
              :style="{ color: celula || '#000' }"
            />
          </template>
          <template #celula:localizacoes="{ celula }">
            {{ combinadorDeListas(celula, ' / ', 'geom_geojson.properties.string_endereco') }}
          </template>
          <template #celula:dotacoes_encontradas="{ celula }">
            {{ combinadorDeListas(celula, ', ') }}
          </template>
          <template #acoes="{ linha, linhaIndex }">
            <SmallModal
              v-if="linhaIndex == detalhamentoAberto"
              has-close-button
              @close="detalhamentoAberto = -1"
            >
              <DetalhamentoDeVinculosPorItem :dados="linha" />
            </SmallModal>

            <button
              v-if="linha.nro_vinculos || linha.detalhes"
              type="button"
              title="Ver detalhes"
              class="fs0 like-a__text addlink"
              @click="detalhamentoAberto = linhaIndex"
            >
              <svg
                width="20"
                height="20"
                class="fs0"
              >
                <use xlink:href="#i_eye" />
              </svg>
            </button>

            <button
              type="button"
              title="Ver detalhes"
              class="fs0 like-a__text addlink"
              @click="vinculacaoAberta = linhaIndex"
            >
              <svg
                width="20"
                height="20"
                class="fs0"
              >
                <use xlink:href="#i_+" />
              </svg>
            </button>

            <SmallModal
              v-if="linhaIndex == vinculacaoAberta"
              tamanho-ajustavel
              @close="vinculacaoAberta = -1"
            >
              <ConsultaGeralVinculacaoIndex
                :dados="linha"
                :tipo="tipo"
                @fechar="vinculacaoAberta = -1"
                @vinculado="handleNovaVinculacao"
              />
            </SmallModal>
          </template>
        </SmaeTable>

        <ListaLegendas
          titulo=""
          :legendas="legendas"
          :borda="false"
          align="left"
          orientacao="horizontal"
        />
      </article>
    </CardEnvelope.Conteudo>
  </FormularioQueryString>
</template>

<style lang="less" scoped>
.tabela-resultados__titulo {
  position: relative;
  font-weight: 300;
  font-size: 2rem;
  line-height: 1.3;

  display: flex;
  align-items: center;

  strong {
    font-weight: 700;
  }

  &::before {
    content: '';
    width: 20px;
    height: 20px;
    background-color: #F7C234;
    border-radius: 100%;
    border: 5px solid white;
    outline: 0.46px solid #B8C0CC;
    margin-right: 14px;
  }

  &::after {
    content: '';
    position: absolute;
    left: 30px;
    width: 10px;
    height: 0.46px;
    background-color: #B8C0CC;
  }
}

.legenda-item {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 100%;
  background-color: #3B5881;
}

.celula__lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.celula__item {
  display: flex;

  &::before {
    content: '';

    width: 5px;
    height: 5px;
    border-radius: 100%;
    background-color: #3B5881;
  }
}

.celula__item-classificacao {
  &::before {
    width: 10px;
    height: 10px;
    top: 0;

    background-color: currentColor;
  }
}
</style>
