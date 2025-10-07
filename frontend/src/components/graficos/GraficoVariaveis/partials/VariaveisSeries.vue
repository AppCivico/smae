<script lang="ts" setup>
import {
  computed, defineProps, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';
import { ListSeriesAgrupadas } from '@back/variavel/dto/list-variavel.dto';
import { VariavelAnaliseQualitativaResponseDto } from '@back/variavel/dto/variavel.ciclo.dto';
import SmallModal from '@/components/SmallModal.vue';
import CicloFisicoPS from '@/components/metas/CicloFisicoPS.vue';
import CicloFisicoPdM from '@/components/metas/CicloFisicoPdM.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import obterAnoAtual from '@/helpers/obterAnoAtual';
import { useVariaveisStore } from '@/stores/variaveis.store';

const route = useRoute();

type Props = {
  informacaoVariavel: ListSeriesAgrupadas
  variavel?: boolean
  temVariavelAcumulada?: boolean
};

type SerieLinha = {
  periodo: string,
  agrupador: string,
  ciclo_fisico?: {
    analise: string,
    contagem_qualitativa : number
    tem_documentos: boolean
  },
  series: {
    data_valor: string,
    valor_nominal: string,
    conferida: boolean,
    elementos: unknown
  }[]
};

type Periodo = {
  index: string,
  chave: string,
  temDocumento: boolean,
};

type LinhaAgrupada = Record<string, SerieLinha[]>;

const props = defineProps<Props>();
const variaveisStore = useVariaveisStore();

const serieAgrupadaSelecionada = ref<string>();
const analiseVariavelSelecionada = ref<VariavelAnaliseQualitativaResponseDto | null>(null);

async function obterDocumento(item: Periodo) {
  const { variavel } = props.informacaoVariavel;
  if (!item.temDocumento || !variavel) {
    return;
  }

  analiseVariavelSelecionada.value = await variaveisStore.buscarAnalise(
    variavel.id,
    `${item.index}-01`,
  ) as VariavelAnaliseQualitativaResponseDto;
}

const conteudoDoModal = computed(() => {
  const mapaConteudo = {
    planoSetorial: CicloFisicoPS,
    programaDeMetas: CicloFisicoPS,
  };

  return mapaConteudo[route.meta.entidadeMãe] || CicloFisicoPdM;
});

const agrupadores = computed<string[]>(() => {
  if (!props.informacaoVariavel?.linhas) {
    return [];
  }

  const listaAgrupadores = props.informacaoVariavel.linhas.map((linha) => linha.agrupador);

  return [...new Set(listaAgrupadores)] as string[];
});

const linhas = computed<LinhaAgrupada>(() => {
  const variavelLinhas = props.informacaoVariavel?.linhas;
  if (!variavelLinhas) {
    return {};
  }

  return variavelLinhas.reduce((agrupador, item) => {
    if (!agrupador[item.agrupador]) {
      agrupador[item.agrupador] = [];
    }

    agrupador[item.agrupador].push(item);

    return agrupador;
  }, {} as LinhaAgrupada);
});

const linhasSelecionadas = computed<SerieLinha[]>(() => {
  const linha = linhas.value?.[serieAgrupadaSelecionada.value];
  if (!linha) {
    return [];
  }

  return linha;
});

const periodos = computed<Periodo[]>(() => {
  if (!linhasSelecionadas.value) {
    return [];
  }

  return linhasSelecionadas.value.map((item) => {
    const [ano, mes] = item.periodo.split('-');

    return {
      index: item.periodo,
      chave: `${mes}/${ano}`,
      temDocumento: item.ciclo_fisico?.tem_documentos || false,
    };
  });
});

const colunas = computed(() => {
  const c = periodos.value.map((i) => ({ chave: i.chave, temDocumento: i.temDocumento }));

  return [
    { chave: 'label' },
    ...c,
  ];
});

const serieSelecionada = computed<any | null>(() => {
  const dadosSerieSelecionada = linhasSelecionadas.value;

  if (!dadosSerieSelecionada?.length) {
    return [];
  }

  const labelSerie = [
    'Previsto',
    'Previsto Acumulado',
    'Realizado',
    'Realizado Acumulado',
  ];

  const seriesSituacoes = dadosSerieSelecionada[0].series ?? [];

  const serieFormatada = seriesSituacoes.reduce((agrupador, serie, serieIndex) => {
    if (!agrupador[serieIndex]) {
      agrupador[serieIndex] = {
        label: labelSerie[serieIndex],
      };
    }

    periodos.value.forEach((item, itemIndex) => {
      const linhaAtual = linhasSelecionadas.value[itemIndex];

      if (linhaAtual) {
        agrupador[serieIndex][item.chave] = linhaAtual.series[serieIndex].valor_nominal;
      }
    });

    return agrupador;
  }, {} as Record<string, any>);

  return serieFormatada;
});

watch(
  () => agrupadores.value,
  (lista) => {
    if (!lista?.length) {
      serieAgrupadaSelecionada.value = undefined;
      return;
    }

    const anoAtual = obterAnoAtual();
    const anoExiste = lista.find((item) => item === anoAtual);
    if (anoExiste) {
      serieAgrupadaSelecionada.value = anoExiste;
      return;
    }

    serieAgrupadaSelecionada.value = lista[0] || undefined;
  },
  { immediate: true },
);

</script>

<template>
  <article class="variaveis-series mt3">
    <div
      class="variaveis-series__ciclo"
    >
      <div class="f1 fb10em mr2 variaveis-series__ciclo-campo">
        <label
          for="agrupador-selecionado"
        >
          Agrupador
        </label>

        <select
          id="agrupador-selecionado"
          v-model="serieAgrupadaSelecionada"
          class="inputtext light mb1 mt05"
        >
          <option
            v-for="agrupadorItem in agrupadores"
            :key="`agrupador-${agrupadorItem}`"
            :value="agrupadorItem"
          >
            {{ agrupadorItem }}
          </option>
        </select>
      </div>
    </div>
  </article>

  <SmaeTable
    v-if="serieAgrupadaSelecionada"
    class="variaveis-series__tabela"
    :colunas="colunas"
    :dados="serieSelecionada"
    rolagem-horizontal
    titulo-para-rolagem-horizontal="Series Agrupadas por ano"
  >
    <template #cabecalho:label>
      <span />
    </template>

    <template
      v-for="periodo in periodos"
      :key="`celula:${periodo.chave}`"
      #[`cabecalho:${periodo.chave}`]="{ chave }"
    >
      <div class="flex center">
        {{ chave }}

        <button
          v-if="periodo.temDocumento"
          class="variaveis-series__tabela-botao ml1 like-a__text"
          @click="obterDocumento(periodo)"
        >
          <svg
            width="16"
            height="20"
          ><use xlink:href="#i_document" /></svg>
        </button>
      </div>
    </template>
  </SmaeTable>

  <SmallModal
    v-if="analiseVariavelSelecionada"
    class="largura-total"
  >
    <div class="flex spacebetween center mb2">
      <h2>
        Análise Qualitativa da Variável
      </h2>

      <hr class="ml2 f1">

      <CheckClose
        :apenas-modal="true"
        :formulario-sujo="false"
        @close="analiseVariavelSelecionada = null"
      />
    </div>

    <component
      :is="conteudoDoModal"
      :analise="analiseVariavelSelecionada"
      :periodo="serieAgrupadaSelecionada"
      :dados-auxiliares="informacaoVariavel.dados_auxiliares"
    />
  </SmallModal>
</template>

<style lang="less" scoped>
.variaveis-series__ciclo {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 47px;
}

.variaveis-series__tabela:deep {
  .smae-table__linha {
    background-color: transparent;
  }

  .table-cell--label {
    padding: 40px 10px;
  }

  .table-header-cell {
    min-width: 150px;
    white-space: nowrap;
  }

  tbody {
    border-top: 1px solid #E3E5E8;
  }

  tr {
    border: initial;
  }

  td {
    border-left: 1px solid #E3E5E8;
    border-right: 1px solid #E3E5E8;

    &:first-of-type {
      border-left: initial;
    }

    &:last-of-type {
      border-right: initial;
    }
  }

  .variaveis-series__tabela-botao {
    color: #94DA00;
  }
}
</style>
1\
