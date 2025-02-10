<template>
  <table class="smae-table tablemain">
    <slot
      name="colunas"
      colunas="colunas"
    >
      <colgroup>
        <col
          v-for="coluna in colunas"
          :key="`colunas--${coluna.chave}`"
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
        v-bind="colunas"
      >
        <tr>
          <TableHeaderCell
            v-for="coluna in colunas"
            :key="`header--${coluna.chave}`"
            v-bind="coluna"
          >
            <template
              v-for="nomeSlot in slotsDoCabecalho"
              :key="nomeSlot"
              #[nomeSlot]="slotProps"
            >
              <slot
                :name="nomeSlot"
                v-bind="slotProps"
              />
            </template>
          </TableHeaderCell>
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
          :key="`coluna--${linhaIndex}`"
        >
          <template
            v-for="coluna in colunas"
            :key="`linha--${linhaIndex}-${coluna.key}`"
          >
            <TableCell
              class="smae-table__cell"
              :linha="linha"
              :caminho="coluna.chave"
            >
              <template
                v-for="nomeSlot in slotsDaCelula"
                :key="nomeSlot"
                #[nomeSlot]="slotProps"
              >
                <slot
                  :name="nomeSlot"
                  v-bind="slotProps"
                />
              </template>
            </TableCell>
          </template>

          <td v-if="hasActionButton">
            <div class="nowrap flex g1">
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
      </tbody>
    </slot>

    <tfoot v-if="$slots.rodape || replicarCabecalho">
      <slot
        v-if="!replicarCabecalho"
        name="rodape"
        :colunas="colunas"
      />

      <tr v-else>
        <TableHeaderCell
          v-for="coluna in colunas"
          :key="`header--${coluna.chave}`"
          v-bind="coluna"
        >
          <template
            v-for="nomeSlot in slotsDoCabecalho"
            :key="nomeSlot"
            #[nomeSlot]="slotProps"
          >
            <slot
              :name="nomeSlot"
              v-bind="slotProps"
            />
          </template>
        </TableHeaderCell>
      </tr>
    </tfoot>
  </table>
</template>

<script lang="ts" setup>
import { computed, useSlots } from 'vue';
import TableCell from './partials/TableCell.vue';
import TableHeaderCell from './partials/TableHeaderCell.vue';
import EditButton, { type EditButtonProps } from './partials/EditButton.vue';
import DeleteButton, { type DeleteButtonEvents, type DeleteButtonProps } from './partials/DeleteButton.vue';
import { Colunas, Linhas } from './types/tipagem';

type Slots = {
  colunas: [colunas: Colunas]
  cabecalho: [colunas: Colunas]
  rodape: [colunas: Colunas]
  corpo: [dados: Linhas]
};

type Props =
  EditButtonProps
  & DeleteButtonProps
  & {
    colunas: Colunas,
    dados: Linhas
    replicarCabecalho?: boolean
  };

type Emits = DeleteButtonEvents;

const props = withDefaults(defineProps<Props>(), {
  rotaEditar: undefined,
  parametroDaRotaEditar: 'id',
  parametroNoObjetoParaEditar: 'id',
  parametroNoObjetoParaExcluir: 'descricao',
});
const emit = defineEmits<Emits>();
defineSlots<Slots>();

const slots = useSlots();

const listaSlots = computed<string[]>(() => Object.keys(slots));
const slotsDaCelula = computed<string[]>(() => {
  const slotsCelula = listaSlots.value.filter((slot) => slot.includes('celula:'));

  return slotsCelula;
});

const slotsDoCabecalho = computed<string[]>(() => {
  const slotsCelula = listaSlots.value.filter((slot) => slot.includes('cabecalho:'));

  return slotsCelula;
});

const hasActionButton = computed<boolean>(() => {
  if (props.rotaEditar) {
    return true;
  }

  return false;
});
</script>
