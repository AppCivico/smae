<template>
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
      v-if="coluna.slots?.celula && listaSlotsUsados.celula[coluna.slots.celula]"
      :name="coluna.slots.celula"
      :linha="linha"
      :celula="linha[coluna.chave]"
    />
  </TableCell>

  <td v-if="hasActionButton">
    <slot
      name="acoes"
      :linha="linha"
    >
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
    </slot>
  </td>
</template>

<script lang="ts" setup>
import type { Coluna, Linha } from '../tipagem';
import DeleteButton, { type DeleteButtonEvents, type DeleteButtonProps } from './DeleteButton.vue';
import EditButton, { type EditButtonProps } from './EditButton.vue';
import TableCell from './TableCell.vue';

type ColunaComSlots = Coluna & {
  slots?: {
    coluna?: string
    celula?: string
  }
};

type Props =
  EditButtonProps
  & DeleteButtonProps
  & {
    linha: Linha
    linhaIndex: number
    colunasFiltradas: ColunaComSlots[]
    hasActionButton: boolean
    listaSlotsUsados: {
      cabecalho: Record<string, true>
      celula: Record<string, true>
    }
  };

type Emits = DeleteButtonEvents;

withDefaults(defineProps<Props>(), {
  parametroDaRotaEditar: 'id',
  parametroNoObjetoParaEditar: 'id',
  parametroNoObjetoParaExcluir: 'descricao',
});
const emit = defineEmits<Emits>();
</script>
