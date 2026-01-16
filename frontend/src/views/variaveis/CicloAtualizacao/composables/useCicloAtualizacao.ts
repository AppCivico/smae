import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useCicloAtualizacaoStore } from '@/stores/cicloAtualizacao.store';

import type { FaseOpcoes, FormulariosTiposPosicao, FormulariosTiposSituacao } from '../interfaces/CicloAtualizacaoTypes';

export default function useCicloAtualizacao() {
  type BotoesLabel = {
    salvar: string;
    salvarESubmeter: string;
  };

  const route = useRoute();

  const cicloAtualizacaoStore = useCicloAtualizacaoStore(route.meta.entidadeMãe);

  const { emFoco } = storeToRefs(cicloAtualizacaoStore);
  const fase = computed<FaseOpcoes>(
    () => {
      const faseAtual = emFoco.value?.fase;

      if (!faseAtual || faseAtual === 'Preenchimento') {
        return 'cadastro';
      }

      if (faseAtual === 'Validacao') {
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

  const botoesLabel = computed<BotoesLabel>(() => {
    const salvarLabel = 'Salvar';
    if (fase.value === 'cadastro') {
      return {
        salvar: salvarLabel,
        salvarESubmeter: 'Salvar e enviar para conferência',
      };
    }

    if (fase.value === 'aprovacao') {
      return {
        salvar: salvarLabel,
        salvarESubmeter: 'Salvar e Aprovar',
      };
    }

    return {
      salvar: salvarLabel,
      salvarESubmeter: 'Salvar e Liberar',
    };
  });

  const forumlariosAExibir = computed<FormulariosTiposSituacao>(() => {
    const posicaoAtual = fasePosicao.value;

    return {
      cadastro: {
        exibir: true,
        liberado: true,
      },
      aprovacao: {
        exibir: posicaoAtual >= 2,
        liberado: true,
      },
      liberacao: {
        exibir: posicaoAtual >= 3,
        liberado: true,
      },
    };
  });

  const valorAnalise = computed(() => {
    const analisePreenchimento = emFoco.value?.analises?.find(
      (item) => item.fase === 'Preenchimento',
    );

    const analiseAprovador = emFoco.value?.analises?.find(
      (item) => item.fase === 'Validacao',
    );

    const analiseLiberador = emFoco.value?.analises?.find(
      (item) => item.fase === 'Liberacao',
    );

    return {
      analise_qualitativa: analisePreenchimento?.analise_qualitativa,
      analise_qualitativa_aprovador: analiseAprovador?.analise_qualitativa,
      analise_qualitativa_liberador: analiseLiberador?.analise_qualitativa,
    };
  });

  function temConteudo(valor: string | undefined | null): boolean {
    return !!valor?.trim();
  }

  return {
    valorAnalise,
    botoesLabel,
    fase,
    fasePosicao,
    forumlariosAExibir,
    dataReferencia: route.params.dataReferencia as string,
    temConteudo,
  };
}
