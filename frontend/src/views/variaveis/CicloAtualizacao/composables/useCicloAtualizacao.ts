import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useCicloAtualizacaoStore } from '@/stores/cicloAtualizacao.store';

import type { FaseOpcoes, FormulariosTiposPosicao, FormulariosTiposSituacao } from '../interfaces/CicloAtualizacaoTypes';

export default function useCicloAtualizacao() {
  type BotoesLabel = {
    salvar: string;
    salvarESubmeter: string;
  };

  const cicloAtualizacaoStore = useCicloAtualizacaoStore();
  const route = useRoute();

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

  function obterValorAnalise() {
    type Analises = {
      analisePreenchimento?: string;
      analiseAprovador?: string;
      analiseLiberador?: string;
    };

    const analises: Analises = {};

    const analisePreenchimento = emFoco.value?.analises?.find(
      (item) => item.fase === 'Preenchimento',
    );
    if (analisePreenchimento) {
      analises.analisePreenchimento = analisePreenchimento.analise_qualitativa;
    }

    const analiseAprovador = emFoco.value?.analises?.find(
      (item) => item.fase === 'Validacao',
    );
    if (analiseAprovador) {
      analises.analiseAprovador = analiseAprovador.analise_qualitativa;
    }

    const analiseLiberador = emFoco.value?.analises?.find(
      (item) => item.fase === 'Liberacao',
    );
    if (analiseLiberador) {
      analises.analiseLiberador = analiseLiberador.analise_qualitativa;
    }

    return {
      analise_qualitativa: analises.analisePreenchimento,
      analise_qualitativa_aprovador: analises.analiseAprovador,
      analise_qualitativa_liberador: analises.analiseLiberador,
    };
  }

  return {
    obterValorAnalise,
    botoesLabel,
    fase,
    fasePosicao,
    forumlariosAExibir,
    dataReferencia: route.params.dataReferencia as string,
  };
}
