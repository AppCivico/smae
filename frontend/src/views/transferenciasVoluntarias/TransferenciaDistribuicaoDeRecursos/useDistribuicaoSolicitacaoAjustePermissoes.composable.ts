import { computed } from 'vue';

import { useAuthStore } from '@/stores/auth.store';

export function useDistribuicaoSolicitacaoAjustePermissoes() {
  const { temPermissãoPara } = useAuthStore();

  const ehCriador = computed(() => temPermissãoPara('SMAE.PerfilGestorDistribuicaoRecurso')
    && temPermissãoPara('SMAE.CadastroDistribuicaoSolicitacaoAjuste.inserir'));

  const ehAprovador = computed(() => temPermissãoPara([
    'CadastroDistribuicaoSolicitacaoAjuste.administrador',
  ]));

  return {
    ehCriador, ehAprovador,
  };
}
