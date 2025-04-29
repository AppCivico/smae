<template>
  <component
    :is="tabelaEnvelope"
    :aria-label="tituloParaRolagemHorizontal"
  >
    <table class="smae-table tablemain">
      <slot name="titulo">
        <caption
          v-if="titulo"
          class="tl uc w700 tamarelo"
        >
          {{ titulo }}
        </caption>
      </slot>

      <slot
        name="colunas"
        :colunas="colunas"
      >
        <colgroup>
          <col
            v-for="coluna in colunas"
            :key="`colunas--${coluna.chave}`"
            class="smae-table__coluna"
            :class="`smae-table__coluna--${coluna.chave}`"
            v-bind="coluna.atributosDaColuna"
          >
          <col
            v-if="hasActionButton"
            class="col--botão-de-ação"
          >
        </colgroup>
      </slot>

      <thead>
        <slot
          name="cabecalho"
          :colunas="colunas"
        >
          <tr>
            <TableHeaderCell
              v-for="coluna in colunas"
              :key="`header--${coluna.chave}`"
              v-bind="coluna.atributosDoCabecalhoDeColuna"
              :chave="coluna.chave"
            >
              <slot
                :name="(`cabecalho:${normalizadorDeSlots(coluna.chave)}` as keyof Slots)"
                v-bind="coluna"
              >
                {{ coluna.label }}
              </slot>
            </TableHeaderCell>

            <td v-if="hasActionButton">
              <slot name="cabecalho:acao" />
            </td>
          </tr>
        </slot>
      </thead>

      <slot
        name="corpo"
        :dados="dados"
      >
        <tbody>
          <tr
            v-for="(linha, linhaIndex) in dados"
            :key="`linha--${linhaIndex}`"
            :class="[
              'smae-table__linha',
              `smae-table__linha--${linhaIndex}`,
              obterDestaqueDaLinha(linha)
            ]"
          >
            <TableCell
              v-for="coluna in colunas"
              :key="`linha--${linhaIndex}-${coluna.chave}`"
              class="smae-table__cell"
              :eh-cabecalho="!!coluna.ehCabecalho"
              :formatador="coluna.formatador"
              :linha="linha"
              :caminho="coluna.chave"
              v-bind="coluna.atributosDaCelula"
            >
              <slot
                :name="(`celula:${normalizadorDeSlots(coluna.chave)}` as keyof Slots)"
                :linha="linha"
              />
            </TableCell>

            <td v-if="hasActionButton">
              <div class="nowrap flex g1 justifyright">
                <EditButton
                  v-if="rotaEditar"
                  :linha="linha"
                  :rota-editar="rotaEditar"
                  :parametro-da-rota-editar="parametroDaRotaEditar"
                  :parametro-no-objeto-para-editar="parametroNoObjetoParaEditar"
                />

                <DeleteButton
                  v-if="!esconderDeletar"
                  :linha="linha"
                  :esconder-deletar="esconderDeletar"
                  :parametro-no-objeto-para-excluir="parametroNoObjetoParaExcluir"
                  @deletar="ev => emit('deletar', ev)"
                />
              </div>
            </td>
          </tr>

          <tr v-if="dados.length === 0">
            <td :colspan="colunas.length">
              Sem dados para exibir
            </td>
          </tr>
        </tbody>
      </slot>

      <tfoot v-if="$slots.rodape || exibirRodape">
        <slot
          v-if="slots.rodape"
          name="rodape"
          :colunas="colunas"
        />

        <tr v-else>
          <TableHeaderCell
            v-for="coluna in colunas"
            :key="`footer--${coluna.chave}`"
            :chave="coluna.chave"
            v-bind="coluna.atributosDoRodapeDeColuna"
          >
            <slot
              :name="(`rodape:${normalizadorDeSlots(coluna.chave)}` as keyof Slots)"
              v-bind="coluna"
            >
              {{ coluna.label }}
            </slot>
          </TableHeaderCell>
        </tr>
      </tfoot>
    </table>
  </component>
</template>

<script lang="ts" setup>
import { type Component, computed, useSlots } from 'vue';
import RolagemHorizontal from '../rolagem/RolagemHorizontal.vue';
import DeleteButton, { type DeleteButtonEvents, type DeleteButtonProps } from './partials/DeleteButton.vue';
import EditButton, { type EditButtonProps } from './partials/EditButton.vue';
import TableCell from './partials/TableCell.vue';
import TableHeaderCell from './partials/TableHeaderCell.vue';
import { Colunas, Linha, Linhas } from './tipagem';
import normalizadorDeSlots from './utils/normalizadorDeSlots';

type Slots = {
  titulo: []
  colunas: [colunas: Colunas]
  cabecalho: [colunas: Colunas]
  'cabecalho:acao': []
  rodape: [colunas: Colunas]
  corpo: [dados: Linhas]
};

type Props =
  EditButtonProps
  & DeleteButtonProps
  & {
    titulo?: string
    tituloRolagemHorizontal?: string
    colunas: Colunas,
    dados: Linhas
    replicarCabecalho?: boolean
    rolagemHorizontal?: boolean
    personalizarLinhas?: {
      parametro: string,
      alvo: unknown,
      classe: string
    }
  };

type Emits = DeleteButtonEvents;

const props = withDefaults(defineProps<Props>(), {
  titulo: undefined,
  rotaEditar: undefined,
  parametroDaRotaEditar: 'id',
  parametroNoObjetoParaEditar: 'id',
  parametroNoObjetoParaExcluir: 'descricao',
  rolagemHorizontal: false,
  personalizarLinhas: undefined,
});
const emit = defineEmits<Emits>();
defineSlots<Slots>();

const slots = useSlots();

const hasActionButton = computed<boolean>(() => {
  if (props.rotaEditar) {
    return true;
  }

  return false;
});

const tabelaEnvelope = computed<Component | string>(() => (props.rolagemHorizontal ? RolagemHorizontal : 'div'));
const tituloParaRolagemHorizontal = computed<string | undefined>(() => {
  if (!props.rolagemHorizontal) {
    return undefined;
  }

  if (props.tituloRolagemHorizontal) {
    return props.tituloRolagemHorizontal;
  }

  if (props.titulo) {
    return props.titulo;
  }

  throw new Error('"titulo" é obrigatório para utilizar rolagem horizontal');
});

const exibirRodape = computed<boolean>(() => props.replicarCabecalho
  || !!slots.rodape
  || Object.keys(slots).some((slot) => slot.includes('cabecalho:')));

function obterDestaqueDaLinha(linha: Linha): string | null {
  if (!props.personalizarLinhas) {
    return null;
  }

  if (linha[props.personalizarLinhas.parametro] === props.personalizarLinhas.alvo) {
    return props.personalizarLinhas.classe;
  }

  return null;
}
</script>
