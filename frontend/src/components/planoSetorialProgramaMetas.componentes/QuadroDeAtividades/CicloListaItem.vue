<script lang="ts" setup>
import { RouteLocationRaw } from 'vue-router';
import {
  obterFaseIcone, obterFaseStatus, ChavesFase,
} from './helpers/obterDadosItems';

const variaveisLegenda = {
  a_coletar: 'A coletar',
  a_coletar_total: 'A coletar total',
  coletadas_nao_conferidas: 'Coletadas não conferidas',
  conferidas_nao_liberadas: 'Conferidas não liberadas',
  liberadas: 'Liberadas',
  total: 'Total',
};

type VariaveisLengedas = keyof typeof variaveisLegenda;
export type ListaVariaveis = Record<VariaveisLengedas, number>;

export type CicloVigenteItemParams = {
  id: number,
  metaId: number,
  iniciativaId?: number,
  atividadeId?: number,
  titulo: string;
  variaveis: ListaVariaveis,
  situacoes: {
    fase: ChavesFase,
    preenchido: boolean
  }[]
};
type Props = CicloVigenteItemParams;

const props = defineProps<Props>();

function obterFaseRota(fase: ChavesFase): RouteLocationRaw {
  const parametros = {
    meta_id: props.metaId,
    planoSetorialId: props.id,
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

    case 'Coleta':
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

</script>

<template>
  <article class="ciclo-lista-item flex g1">
    <div class="ciclo-lista-item__navegacao">
      <SmaeLink
        v-for="situacao in $props.situacoes"
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

    <div class="ciclo-lista-item__conteudo">
      <h3 class="ciclo-lista-item__titulo t16 w700">
        {{ $props.titulo }}
      </h3>

      <hr>

      <div class="ciclo-lista-item__vaiaveis mt025">
        <div
          v-for="(situacao, situacaoIndex) in $props.variaveis"
          :key="`variavel--${situacaoIndex}`"
          class="variavel-item"
        >
          <span class="variavel-item__conteudo t12 w400">
            {{ variaveisLegenda[situacaoIndex] || situacaoIndex }}

            <span class="variavel-item__conteudo--numero w700 ml05">
              {{ situacao.toString().padStart(2, '0') }}
            </span>
          </span>

          <svg
            class="ciclo-lista-item__vaiaveis-separador ml05 mr05"
            width="5"
            height="9.5"
          >
            <use xlink:href="#i_right" />
          </svg>
        </div>
      </div>
    </div>
  </article>
</template>

<style lang="less" scoped>
.ciclo-lista-item {
  background: #f7f7f7;
  padding: 10px 10px 0 10px;
  border-radius: 10px;
}

.ciclo-lista-item__navegacao {
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
  padding-bottom: 4px;
}

.ciclo-lista-item__titulo {
  line-height: 130%;
  margin-bottom: 10px;
  color: #333;
}

.ciclo-lista-item__variaveis {
  padding-top: 4px;
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
}
</style>
