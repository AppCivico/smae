<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import * as CardEnvelope from '@/components/cardEnvelope';
import ListaLegendas from '@/components/ListaLegendas.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import { useGeolocalizadorStore } from '@/stores/geolocalizador.store';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import ConsultaGeralFiltroEndereco from './ConsultaGeralFiltroEndereco.vue';
import ConsultaGeralFiltroDotacao from './ConsultaGeralFiltroDotacao.vue';

const legendasStatus = {
  obras: { item: 'Monitoramento de Obras', color: '#8EC122' },
  projetos: { item: 'Gestão de Projetos', color: '#F2890D' },
  metas: { item: 'Programa de Metas', color: '#4074BF' },
  plenoSetorial: { item: 'Planos Setoriais', color: '#9F045F' },
};

const legendas = {
  status: Object.values(legendasStatus),
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
const { proximidadeFormatada } = storeToRefs(geolocalizadorStore);

const tipo = computed<'endereco' | 'dotacao'>(() => route.query.tipo);

const filtroSelecionado = computed(() => {
  const { tipo } = route.query;

  const mapaTipo = {
    endereco: ConsultaGeralFiltroEndereco,
    dotacao: ConsultaGeralFiltroDotacao,
  };

  return mapaTipo[tipo] || 'h3';
});

onMounted(() => {
  geolocalizadorStore.$reset();
});
</script>

<template>
  <FormularioQueryString :valores-iniciais="valoresIniciais">
    <div class="flex spacebetween center mb2 mt2">
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

        <p
          v-if="tipo === 'endereco'"
          class="tabela-resultados__descricao mt1"
        >
          O resultado dessa pesquisa atinge até 2 km ao redor do endereço digitado.
        </p>

        <ListaLegendas
          titulo=""
          :legendas="legendas"
          :borda="false"
          align="left"
          orientacao="horizontal"
        />

        <SmaeTable
          class="mt3"
          replicar-cabecalho
          :colunas="[
            {
              chave: 'localizacoes',
              label: 'Endereço / distância (km)',
              ehCabecalho: true,
            },
            { chave: 'portfolio_programa', label: 'portfólio/plano ou programa' },
            { chave: 'nome', label: 'nome/meta' },
            { chave: 'orgao', label: 'Órgão' },
            { chave: 'status', label: 'status', formatador: v => v || 'N/A' },
            { chave: 'detalhes', label: 'detalhes' },
          ]"
          :dados="proximidadeFormatada"
        >
          <template #celula:localizacoes="{ celula, linha }">
            <div
              :class="['celula__item', 'celula__item-classificacao']"
              :style="{ color: legendasStatus[linha.modulo]?.color || undefined }"
            />

            <span>
              {{ combinadorDeListas(celula, ' / ', 'geom_geojson.properties.string_endereco') }}
            </span>
          </template>

          <template #celula:detalhes="{ celula }">
            <div
              v-if="celula"
              class="celula__lista"
            >
              <div
                v-for="(detalhe, detalheKey) in celula"
                :key="`detalhe--${detalheKey}`"
                class="celula__item"
              >
                {{ detalheKey }}: {{ detalhe }}
              </div>
            </div>

            <span v-else>
              -
            </span>
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
        margin-left: 10px;
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

.tabela-resultados__descricao {
  font-size: 1.3rem;
  font-weight: 300;
  line-height: 1;
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
