import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useCicloAtualizacaoStore } from '@/stores/cicloAtualizacao.store';

import type { FaseOpcoes, FormulariosTiposPosicao, FormulariosTiposSituacao } from '../interfaces/CicloAtualizacaoTypes';

export default function useCicloAtualizacao() {
  const cicloAtualizacaoStore = useCicloAtualizacaoStore();

  const { emFoco } = storeToRefs(cicloAtualizacaoStore);

  const $route = useRoute();

  const fase = computed<FaseOpcoes>(
    () => {
      const [ultimaAnalise] = emFoco.value?.analises || [];

      if (!ultimaAnalise || ultimaAnalise.fase === 'Preenchimento') {
        return 'cadastro';
      }

      if (ultimaAnalise.fase === 'Validacao') {
        return 'aprovacao';
      }

      return 'liberacao';
    },
  );

  const fasePosicao = computed<number>(() => {
    const fasePosicaoOpcoes: FormulariosTiposPosicao = {
      cadastro: 1,
      aprovacao: 2,
      liberacao: 3,
    };

    return fasePosicaoOpcoes[fase.value] || 0;
  });

  const forumlariosAExibir = computed<FormulariosTiposSituacao>(() => {
    const posicaoAtual = fasePosicao.value;

    return {
      cadastro: {
        exibir: true,
        liberado: posicaoAtual === 1,
      },
      aprovacao: {
        exibir: posicaoAtual >= 2,
        liberado: posicaoAtual === 2,
      },
      liberacao: {
        exibir: posicaoAtual >= 3,
        liberado: posicaoAtual === 3,
      },
    };
  });

  return {
    fase,
    fasePosicao,
    forumlariosAExibir,
    dataReferencia: $route.params.dataReferencia as string,
  };
}
