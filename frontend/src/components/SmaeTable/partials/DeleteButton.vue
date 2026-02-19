<script lang="ts" setup>
import obterPropriedadeNoObjeto from '@/helpers/objetos/obterPropriedadeNoObjeto';
import { useAlertStore } from '@/stores/alert.store';

import { Linha } from '../tipagem';

export type DeleteButtonProps = {
  esconderDeletar?: boolean
  parametroNoObjetoParaExcluir?: string,
  mensagemExclusao?: (linha: Linha) => string
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
  let mensagem = '';

  if (props.mensagemExclusao) {
    mensagem = props.mensagemExclusao(props.linha);
  } else {
    const valorDoParametro = obterPropriedadeNoObjeto(
      props.parametroNoObjetoParaExcluir,
      props.linha,
    );

    mensagem = `Deseja mesmo remover o item "${valorDoParametro}"?`;
  }

  alertStore.confirmAction(
    mensagem,
    async () => {
      emit('deletar', props.linha);
    },
    'Remover',
  );
}
</script>

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
