<script lang="ts" setup>
import SmaeLink from '@/components/SmaeLink.vue';
import {
  obterSituacaoIcone, obterStatus, obterRota, ChavesSituacoes, ChavesStatus,
} from './helpers/obterDadosItems';

export type CicloVigenteItemParams = {
  id: number,
  metaId: number,
  titulo: string;
  variaveis: {
    label: string;
    contagem: number
  }[],
  situacoes: {
    item: ChavesSituacoes,
    status: ChavesStatus
  }[]
};
type Props = CicloVigenteItemParams;

defineProps<Props>();
</script>

<template>
  <article class="ciclo-lista-item flex g1">
    <div class="ciclo-lista-item__navegacao">
      <SmaeLink
        v-for="situacao in $props.situacoes"
        :key="situacao.item"
        class="flex justifyCenter start"
        :to="{
          name: obterRota(situacao.item),
          params: {
            meta_id: $props.metaId,
            planoSetorialId: $props.id,
          }
        }"
      >
        <svg
          class="navegacao-item__icon"
          :style="{ color: obterStatus(situacao.status) }"
        >
          <use :xlink:href="`#${obterSituacaoIcone(situacao.item)}`" />
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
            {{ situacao.label }}

            <span class="variavel-item__conteudo--numero w700 ml05">
              {{ situacao.contagem.toString().padStart(2, '0') }}
            </span>
          </span>

          <svg
            v-if="situacaoIndex !== $props.variaveis.length - 1"
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

.variavel-item__conteudo {
  white-space: nowrap;
  line-height: 130%;
}

.variavel-item__label {
  width: 100%;
}
</style>
