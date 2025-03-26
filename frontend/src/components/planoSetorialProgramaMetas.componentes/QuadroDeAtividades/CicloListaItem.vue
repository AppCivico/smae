<script lang="ts" setup>
import { computed } from 'vue';
import { RouteLocationRaw } from 'vue-router';
// eslint-disable-next-line import/no-unresolved, import/extensions
import { PSMFCountDto, PSMFOrcamentoCountDto } from '@back/mf/ps-dash/dto/ps.dto';
import {
  obterFaseIcone, obterFaseStatus, ChavesFase,
} from './helpers/obterDadosItems';
import { type AbasDisponiveis } from '@/views/variaveis/CicloAtualizacao/CicloAtualizacaoLista.vue';

const variaveisMetadado: Record<string, {
  legenda: string,
  posicao: number,
  aba: AbasDisponiveis | undefined
}> = {
  total: {
    legenda: 'Total de variáveis',
    posicao: 1,
    aba: undefined,
  },
  a_coletar_total: {
    legenda: 'Total no ciclo',
    posicao: 2,
    aba: undefined,
  },
  a_coletar: {
    legenda: 'A coletar',
    posicao: 3,
    aba: 'Preenchimento',
  },
  coletadas_nao_conferidas: {
    legenda: 'Coletadas não conferidas',
    posicao: 4,
    aba: 'Validacao',
  },
  conferidas_nao_liberadas: {
    legenda: 'Conferidas não liberadas',
    posicao: 5,
    aba: 'Liberacao',
  },
  liberadas: {
    legenda: 'Liberadas',
    posicao: 6,
    aba: undefined,
  },
};

type VariaveisLengedas = keyof typeof variaveisMetadado;

export type ListaVariaveis = Record<VariaveisLengedas, number>;

export type CicloVigenteItemParams = {
  pdmId: unknown,
  metaId: number,
  iniciativaId?: number,
  atividadeId?: number,
  titulo: string;
  codigo: string;
  variaveis: ListaVariaveis,
  situacoes: {
    fase: ChavesFase,
    preenchido: boolean
  }[],
  pendencias: {
    cronograma: PSMFCountDto,
    orcamento: PSMFOrcamentoCountDto,
  },
};
type Props = CicloVigenteItemParams;

const props = defineProps<Props>();

function obterFaseRota(fase: ChavesFase): RouteLocationRaw {
  const parametros = {
    meta_id: props.metaId,
    planoSetorialId: props.pdmId as number,
  };

  switch (fase) {
    case 'Orcamento':
      return {
        name: '.orcamentoDeMetas',
        params: parametros,
      };

    case 'Analise':
    case 'Fechamento':
    case 'Risco':
      return {
        name: '.monitoramentoDeMetas',
        params: parametros,
      };

    case 'Cronograma':
      if (props.atividadeId && props.iniciativaId) {
        return {
          name: '.cronogramaDaAtividade',
          params: {
            ...parametros,
            iniciativa_id: props.iniciativaId,
            atividade_id: props.atividadeId,
          },
        };
      }

      if (props.iniciativaId) {
        return {
          name: '.cronogramaDaIniciativa',
          params: {
            ...parametros,
            iniciativa_id: props.iniciativaId,
          },

        };
      }

      return {
        name: '.cronogramaDaMeta',
        params: parametros,
      };

    default:
      throw new Error('Erro com a rota');
  }
}

const situacoesMapeadas = computed(() => {
  const { cronograma, orcamento } = props.pendencias;
  const situacoes = [...props.situacoes];

  if (cronograma.total >= 1) {
    situacoes.push({
      fase: 'Cronograma',
      preenchido: cronograma.total === cronograma.preenchido,
    });
  }

  if (orcamento.total.length >= 1) {
    situacoes.push({
      fase: 'Orcamento',
      preenchido: orcamento.total.length === orcamento.preenchido.length,
    });
  }

  return situacoes;
});

const variaveisMapeadas = computed(() => {
  const chavesVariaveis = Object.keys(props.variaveis) as VariaveisLengedas[];

  return chavesVariaveis.map((key) => {
    const variavel = props.variaveis[key];

    return {
      valor: variavel.toString().padStart(2, '0'),
      aba: variaveisMetadado[key].aba,
      posicao: variaveisMetadado[key].posicao,
      legenda: variaveisMetadado[key].legenda,
    };
  }).sort((a, b) => a.posicao - b.posicao);
});
</script>

<template>
  <article class="ciclo-lista-item g1">
    <div class="ciclo-lista-item__navegacao">
      <div class="ciclo-lista-item__navegacao-conteudo">
        <SmaeLink
          v-for="situacao in situacoesMapeadas"
          :key="situacao.fase"
          class="flex justifyCenter start"
          :to="obterFaseRota(situacao.fase)"
        >
          <svg
            class="navegacao-item__icon"
            :style="{ color: obterFaseStatus(situacao.preenchido) }"
          >
            <use :xlink:href="`#${obterFaseIcone(situacao.fase)}`" />
          </svg>
        </SmaeLink>
      </div>
    </div>

    <div
      class="ciclo-lista-item__conteudo"
    >
      <h3 class="ciclo-lista-item__titulo t16 w700">
        {{ $props.codigo }} - {{ $props.titulo }}
      </h3>

      <hr>
    </div>

    <div class="ciclo-lista-item__variaveis  mt025">
      <SmaeLink
        v-for="(situacao, situacaoIndex) in variaveisMapeadas"
        :key="`variavel--${situacaoIndex}`"
        :to="{
          name: 'cicloAtualizacao',
          query: {
            pdm_id: $props.pdmId,
            meta_id: $props.metaId,
            atividade_id: $props.atividadeId,
            iniciativa_id: $props.iniciativaId,
            aba: situacao.aba
          }
        }"
        class="variavel-item"
      >
        <span class="variavel-item__conteudo t12 w400 link-texto">
          {{ situacao.legenda }}

          <span class="variavel-item__conteudo--numero w700 ml05">
            {{ situacao.valor }}
          </span>
        </span>

        <svg
          class="ciclo-lista-item__vaiaveis-separador ml05 mr05"
          width="5"
          height="9.5"
        >
          <use xlink:href="#i_right" />
        </svg>
      </SmaeLink>
    </div>
  </article>
</template>

<style lang="less" scoped>
.ciclo-lista-item {
  display: grid;
  background: #f7f7f7;
  padding: 10px 10px 0 10px;
  border-radius: 10px;

  grid-template-columns: min-content;
  grid-template-rows: min-content;
  gap: 0 15px;

  grid-template-areas:
    'navegacao conteudo'
    'variaveis variaveis';

  @media screen and (min-width: 55em) {
    grid-template-areas:
      'navegacao conteudo'
      'navegacao variaveis';
  }
}

.ciclo-lista-item__navegacao {
  grid-area: navegacao;
}

.ciclo-lista-item__navegacao-conteudo {
  display: grid;
  grid-template-columns: repeat(3, 24px);
  grid-template-rows: repeat(2, 24px);
  gap: 10px 6px;
}

.navegacao-item__icon {
  width: 100%;
  height: 100%;
}

.ciclo-lista-item__conteudo {
  width: 100%;
  height: fit-content;
  padding-bottom: 4px;
  grid-area: conteudo;

  @media screen and (max-width: 55em) {
    hr {
      display: none;
    }
  }
}

.ciclo-lista-item__titulo {
  line-height: 130%;
  margin-bottom: 10px;
  color: #333;
}

.ciclo-lista-item__variaveis {
  padding-top: 4px;
  grid-area: variaveis;
}

.ciclo-lista-item__variaveis-separador {
  display: inline-block;
}

.variavel-item {
  display: inline-flex;
  white-space: wrap;
  padding: 6px 0;
  align-items: center;
}

.variavel-item:last-of-type .ciclo-lista-item__vaiaveis-separador {
  display: none;
}

.variavel-item__conteudo {
  white-space: nowrap;
  line-height: 130%;
}

.variavel-item__label {
  width: 100%;
}</style>
