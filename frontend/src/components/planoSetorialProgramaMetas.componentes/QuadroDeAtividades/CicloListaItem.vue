<script lang="ts" setup>
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
  <li class="ciclo-lista-item flex">
    <div class="ciclo-lista-item__navegacao">
      <SmaeLink
        v-for="situacao in $props.situacoes"
        :key="situacao.item"
        class="navegacao-item"
        :to="{
          name: obterRota(situacao.item),
          params: {
            id: $props.id,
            meta_id: $props.metaId
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
      <h5 class="ciclo-lista-item__titulo">
        {{ $props.titulo }}
      </h5>

      <hr>

      <div class="ciclo-lista-item__vaiaveis">
        <div
          v-for="(situacao, situacaoIndex) in $props.variaveis"
          :key="`variavel--${situacaoIndex}`"
          class="variavel-item"
        >
          <span class="variavel-item__conteudo">
            {{ situacao.label }}

            <span class="variavel-item__conteudo--numero">
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
  </li>
</template>

<style lang="less" scoped>
.ciclo-lista-item {
  background: #f7f7f7;
  padding: 10px 10px 0 10px;
  border-radius: 10px;
  gap: 15px;
}

.ciclo-lista-item__navegacao {
  display: grid;
  grid-template-columns: repeat(3, 24px);
  grid-template-rows: repeat(2, 24px);
  gap: 10px 6px;
}

.navegacao-item {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.navegacao-item__icon {
  width: 100%;
  height: 100%;
}

.ciclo-lista-item__conteudo {
  padding-bottom: 4px;
}

.ciclo-lista-item__titulo {
  font-size: 15px;
  line-height: 130%;
  font-weight: 700;
  margin-bottom: 10px;
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
  font-weight: 400;
  font-size: 12.5px;
  line-height: 130%;
}

.variavel-item__conteudo--numero {
  font-weight: 600;
  margin-left: 6px;
}

.variavel-item__label {
  width: 100%;
}
</style>
