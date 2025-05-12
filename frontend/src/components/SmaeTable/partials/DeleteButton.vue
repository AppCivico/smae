<template>
  <button
    type="button"
    class="like-a__text"
    aria-label="apagar"
    @click="handleRemoverItem"
  >
    <svg
      width="20"
      height="20"
    >
      <use xlink:href="#i_waste" />
    </svg>
  </button>
</template>

<script lang="ts" setup>
import obterPropriedadeNoObjeto from '@/helpers/objetos/obterPropriedadeNoObjeto';
import { useAlertStore } from '@/stores/alert.store';
import { Linha } from '../tipagem';

export type DeleteButtonProps = {
  esconderDeletar?: boolean
  parametroNoObjetoParaExcluir?: string
};

type Props = Omit<DeleteButtonProps, 'parametroNoObjetoParaExcluir'> & {
  parametroNoObjetoParaExcluir: string
  linha: Linha,
};

export type DeleteButtonEvents = {
  deletar: [Linha]
};
type Emits = DeleteButtonEvents;

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const alertStore = useAlertStore();

function handleRemoverItem() {
  const valorDoParametro = obterPropriedadeNoObjeto(props.parametroNoObjetoParaExcluir, props.linha);

  alertStore.confirmAction(
    `Deseja mesmo remover o item "${valorDoParametro}"?`,
    async () => {
      emit('deletar', props.linha);
    },
    'Remover',
  );
}
</script>
