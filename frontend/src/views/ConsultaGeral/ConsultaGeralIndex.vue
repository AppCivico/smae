<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import * as CardEnvelope from '@/components/cardEnvelope';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import ListaLegendas from '@/components/ListaLegendas.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import SmallModal from '@/components/SmallModal.vue';
import DetalhamentoDeVinculosPorItem from '@/components/TransferenciasVoluntarias/DetalhamentoDeVinculosPorItem.vue';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import { LegendasStatus, useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import { useGeolocalizadorStore } from '@/stores/geolocalizador.store';

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
const { proximidadeFormatada } = storeToRefs(entidadesProximasStore);

const detalhamentoAberto = ref(-1);

const tipo = computed<'endereco' | 'dotacao' | undefined>(() => route.query.tipo);

const filtroSelecionado = computed(() => {
  const mapaTipo = {
    endereco: ConsultaGeralFiltroEndereco,
    dotacao: ConsultaGeralFiltroDotacao,
  };

  return mapaTipo[tipo.value] || 'h3';
});

const colunas = computed(() => {
  const colunasGerais = [
    { chave: 'portfolio_programa', label: 'portfólio/plano ou programa' },
    { chave: 'nome', label: 'nome/meta' },
    { chave: 'orgao', label: 'Órgão' },
    { chave: 'status', label: 'status', formatador: (v) => v?.nome || 'N/A' },
    {
      chave: 'nro_vinculos',
      label: 'nº vínculos',
      atributosDaCelula: { class: 'cell--number' },
      atributosDaColuna: { class: 'col--minimum' },
      atributosDoCabecalhoDeColuna: { class: 'cell--number' },
      atributosDoRodapeDeColuna: { class: 'cell--number' },
    },
  ];

  if (tipo.value === 'dotacao') {
    return [
      {
        chave: 'dotacoes_encontradas',
        label: 'Dotação',
        ehCabecalho: true,
        formatador: (ev) => combinadorDeListas(ev, ','),
      },
      ...colunasGerais,
    ];
  }

  return [
    {
      chave: 'localizacoes',
      label: 'Endereço / distância (km)',
      ehCabecalho: true,
    },
    ...colunasGerais,
  ];
});

watch(tipo, (novoTipo, tipoAnterior) => {
  // Só reseta se ambos os tipos estão definidos e são diferentes
  // Isso evita resetar quando navegamos para rotas filhas (modal) que não têm o parâmetro tipo
  if (tipoAnterior !== undefined && novoTipo !== undefined && novoTipo !== tipoAnterior) {
    geolocalizadorStore.$reset();
    entidadesProximasStore.$reset();
  }
}, { immediate: true });
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

    <component :is="filtroSelecionado">
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
          :dados="proximidadeFormatada"
        >
          <template #celula:localizacoes="{ celula, linha }">
            <div
              :class="['celula__item', 'celula__item-classificacao']"
              :style="{ color: linha.cor || '#000' }"
            />

            <span v-if="celula">
              {{ combinadorDeListas(celula, ' / ', 'geom_geojson.properties.string_endereco') }}
            </span>
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
            <!--
              <SmaeLink
                :to="{
                  name: 'DetalhesConsultaGeral',
                  params: { id: linha.id },
                  query: $route.query,
                }"
                title="Adicionar vínculo"
                class="fs0"
              >
                <svg
                  width="20"
                  height="20"
                  class="fs0"
                >
                  <use xlink:href="#i_+" />
                </svg>
              </SmaeLink>
            -->
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
.tabela-resultados {
  :deep {
    .table-cell {
      vertical-align: baseline;
      max-width: 200px;
    }

    .table-cell--localizacoes {
      span {
        display: block;
        margin-left: 15px;
      }
    }
  }
}

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
  position: relative;
  display: flex;
  margin-left: 10px;
  line-height: 20px;

  &::before {
    content: '';
    position: absolute;
    left: -10px;
    top: 7px;

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
