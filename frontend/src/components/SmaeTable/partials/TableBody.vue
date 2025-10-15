<template>
  <tbody>
    <slot
      name="corpo"
      :dados="dados"
    >
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
            v-if="coluna.slots?.celula && listaSlotsUsados.celula[coluna.slots.celula]"
            :name="coluna.slots.celula"
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
    </slot>
  </tbody>
</template>

<script lang="ts" setup>
import type { Coluna, Linha, Linhas } from '../tipagem';
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
    dados: Linhas
    colunasFiltradas: ColunaComSlots[]
    hasActionButton: boolean
    listaSlotsUsados: {
      cabecalho: Record<string, true>
      celula: Record<string, true>
    }
    personalizarLinhas?: {
      parametro: string,
      alvo: unknown,
      classe: string
    }
  };

type Emits = DeleteButtonEvents;

const props = withDefaults(defineProps<Props>(), {
  parametroDaRotaEditar: 'id',
  parametroNoObjetoParaEditar: 'id',
  parametroNoObjetoParaExcluir: 'descricao',
});
const emit = defineEmits<Emits>();

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
