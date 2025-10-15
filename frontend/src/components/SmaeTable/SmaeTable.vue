<template>
  <component
    :is="tabelaEnvelope"
    :aria-label="tituloParaRolagemHorizontal"
  >
    <table
      class="smae-table tablemain"
      :class="{ 'tbody-zebra': $slots['sub-linha'] }"
    >
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
            v-if="$slots['sub-linha']"
            class="smae-table__coluna smae-table__coluna--toggle col--botão-de-ação"
          >
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
            <th
              v-if="$slots['sub-linha']"
              class="smae-table__toggle-header"
              aria-label="Expandir/Recolher"
            />

            <TableHeaderCell
              v-for="coluna in colunasFiltradas"
              :key="`header--${coluna.chave}`"
              v-bind="coluna"
              :schema="props.schema"
              :atributos="coluna.atributosDoCabecalhoDeColuna"
            >
              <slot
                v-if="listaSlotsUsados.cabecalho[coluna.slots?.coluna]"
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
        name="conteudo"
        :dados="dados"
      >
        <TableBody
          :dados="dados"
          :colunas-filtradas="colunasFiltradas"
          :has-action-button="hasActionButton"
          :lista-slots-usados="listaSlotsUsados"
          :rota-editar="rotaEditar"
          :parametro-da-rota-editar="parametroDaRotaEditar"
          :parametro-no-objeto-para-editar="parametroNoObjetoParaEditar"
          :esconder-deletar="esconderDeletar"
          :parametro-no-objeto-para-excluir="parametroNoObjetoParaExcluir"
          :personalizar-linhas="personalizarLinhas"
          @deletar="(ev: Linha) => emit('deletar', ev)"
        >
          <template #corpo="slotProps">
            <slot
              name="corpo"
              v-bind="slotProps"
            />
          </template>

          <template
            v-if="$slots['sub-linha']"
            #sub-linha="slotProps"
          >
            <slot
              name="sub-linha"
              v-bind="slotProps"
            />
          </template>

          <template
            v-for="coluna in colunasFiltradas"
            :key="`slot-${coluna.chave}`"
            #[coluna.slots?.celula]="slotProps"
          >
            <slot
              :name="coluna.slots?.celula"
              v-bind="slotProps"
            />
          </template>
        </TableBody>
      </slot>

      <tfoot v-if="$slots.rodape || exibirRodape">
        <slot
          v-if="slots.rodape"
          name="rodape"
          :colunas="colunasFiltradas"
        />

        <tr v-else>
          <th
            v-if="$slots['sub-linha']"
            class="smae-table__toggle-header"
          />

          <TableHeaderCell
            v-for="coluna in colunasFiltradas"
            :key="`footer--${coluna.chave}`"
            v-bind="coluna"
            :schema="props.schema"
            :atributos="coluna.atributosDoRodapeDeColuna"
          >
            <slot
              v-if="listaSlotsUsados.cabecalho[coluna.slots?.coluna]"
              :name="coluna.slots.coluna"
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
import type { Component } from 'vue';
import { computed, useAttrs, useSlots } from 'vue';
import type { AnyObjectSchema } from 'yup';
import RolagemHorizontal from '../rolagem/RolagemHorizontal.vue';
import { type DeleteButtonEvents, type DeleteButtonProps } from './partials/DeleteButton.vue';
import { type EditButtonProps } from './partials/EditButton.vue';
import TableBody from './partials/TableBody.vue';
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
  'sub-linha': { linha: Linha; linhaIndex: number }
  'celula:*': [linha: Linha, celula: unknown]
  conteudo: [dados: Linhas]
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
  || !!slots.rodape);

const colunasFiltradas = computed(() => props.colunas.filter((v) => v)
  .map((item) => ({
    ...item,
    slots: {
      coluna: `cabecalho:${normalizadorDeSlots(item.chave)}` as keyof Slots,
      celula: `celula:${normalizadorDeSlots(item.chave)}` as keyof Slots,
    },
  })));

const listaSlotsUsados = computed(() => Object.keys(slots).reduce((agrupador, item) => {
  if (item.includes('cabecalho:')) {
    agrupador.cabecalho[item] = true;
  }

  if (item.includes('celula:')) {
    agrupador.celula[item] = true;
  }

  return agrupador;
}, {
  cabecalho: {} as Record<string, true>,
  celula: {} as Record<string, true>,
}));

</script>
