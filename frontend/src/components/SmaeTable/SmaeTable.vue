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
        :colunas="colunasFiltradas"
      >
        <colgroup>
          <col
            v-for="coluna in colunasFiltradas"
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
          :colunas="colunasFiltradas"
        >
          <tr>
            <TableHeaderCell
              v-for="coluna in colunasFiltradas"
              :key="`header--${coluna.chave}`"
              v-bind="coluna"
              :schema="props.schema"
              :atributos="coluna.atributosDoCabecalhoDeColuna"
            >
              <slot
                v-if="listaSlots.cabecalho.includes(coluna.slots?.coluna)"
                :name="coluna.slots.coluna"
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
              v-for="coluna in colunasFiltradas"
              :key="`linha--${linhaIndex}-${coluna.chave}`"
              class="smae-table__cell"
              :eh-cabecalho="!!coluna.ehCabecalho"
              :formatador="coluna.formatador"
              :linha="linha"
              :caminho="coluna.chave"
              v-bind="coluna.atributosDaCelula"
            >
              <slot
                v-if="listaSlots.celula.includes(coluna.slots?.celula)"
                :name="coluna.slots?.celula"
                :linha="linha"
                :celula="linha[coluna.chave]"
              />
            </TableCell>

            <td v-if="hasActionButton">
              <div class="flex g1 justifyright">
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
            <td :colspan="colunasFiltradas.length">
              Sem dados para exibir
            </td>
          </tr>
        </tbody>
      </slot>

      <tfoot v-if="$slots.rodape || exibirRodape">
        <slot
          v-if="slots.rodape"
          name="rodape"
          :colunas="colunasFiltradas"
        />

        <tr v-else>
          <TableHeaderCell
            v-for="coluna in colunasFiltradas"
            :key="`footer--${coluna.chave}`"
            v-bind="coluna"
            :schema="props.schema"
            :atributos="coluna.atributosDoRodapeDeColuna"
          >
            <slot
              :name="(`rodape:${normalizadorDeSlots(coluna.chave)}` as keyof Slots)"
              v-bind="coluna"
            />
          </TableHeaderCell>
        </tr>
      </tfoot>
    </table>
  </component>
</template>

<script lang="ts" setup>
import { computed, useAttrs, useSlots } from 'vue';
import type { Component } from 'vue';
import type { AnyObjectSchema } from 'yup';
import RolagemHorizontal from '../rolagem/RolagemHorizontal.vue';
import DeleteButton, { type DeleteButtonEvents, type DeleteButtonProps } from './partials/DeleteButton.vue';
import EditButton, { type EditButtonProps } from './partials/EditButton.vue';
import TableCell from './partials/TableCell.vue';
import TableHeaderCell from './partials/TableHeaderCell.vue';
import type { Colunas, Linha, Linhas } from './tipagem';
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
    tituloParaRolagemHorizontal?: string
    schema?: AnyObjectSchema,
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

const attributosDaRaiz = useAttrs();

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

  if (attributosDaRaiz.ariaLabel) {
    return attributosDaRaiz.ariaLabel;
  }

  if (props.tituloParaRolagemHorizontal) {
    return props.tituloParaRolagemHorizontal;
  }

  if (props.titulo) {
    return props.titulo;
  }

  throw new Error('"titulo" é obrigatório para utilizar rolagem horizontal');
});

const exibirRodape = computed<boolean>(() => props.replicarCabecalho
  || !!slots.rodape
  || Object.keys(slots).some((slot) => slot.includes('cabecalho:')));

const colunasFiltradas = computed(() => {
  const colunas = props.colunas.filter((v) => v);

  const colunasPreparadas = colunas.map((item) => ({
    ...item,
    slots: {
      coluna: `cabecalho:${normalizadorDeSlots(item.chave)}` as keyof Slots,
      celula: `celula:${normalizadorDeSlots(item.chave)}` as keyof Slots,
    },
  }));

  return colunasPreparadas;
});

function obterDestaqueDaLinha(linha: Linha): string | null {
  if (!props.personalizarLinhas) {
    return null;
  }

  if (linha[props.personalizarLinhas.parametro] === props.personalizarLinhas.alvo) {
    return props.personalizarLinhas.classe;
  }

  return null;
}

const listaSlots = computed(() => Object.keys(slots).reduce((agrupador, item) => {
  if (item.includes('cabecalho:')) {
    agrupador.cabecalho.push(item);
  }

  if (item.includes('celula:')) {
    agrupador.celula.push(item);
  }

  return agrupador;
}, {
  cabecalho: [] as string[],
  celula: [] as string[],
}));

</script>
