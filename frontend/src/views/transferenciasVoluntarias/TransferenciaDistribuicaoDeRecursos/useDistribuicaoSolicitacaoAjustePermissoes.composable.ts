import type { DistribuicaoRecursoDto } from '@back/casa-civil/distribuicao-recurso/entities/distribuicao-recurso.entity';
import type { DistribuicaoSolicitacaoAjusteDto } from '@back/casa-civil/distribuicao-recurso/entities/distribuicao-solicitacao-ajuste.entity';
import type { MaybeRef } from 'vue';
import { computed, toValue } from 'vue';

import { useAuthStore } from '@/stores/auth.store';

type AjusteParam = {
  ajuste?: MaybeRef<DistribuicaoSolicitacaoAjusteDto | null | undefined>;
};
type DistribuicaoParam = {
  distribuicao?: MaybeRef<DistribuicaoRecursoDto | null | undefined>;
};
type Params = AjusteParam & DistribuicaoParam;

function podeAprovarAjuste({ ajuste }: AjusteParam = {}) {
  return !!toValue(ajuste)?.pode_aprovar;
}

function podeEditarAjuste({ ajuste }: AjusteParam = {}) {
  return !!toValue(ajuste)?.pode_editar;
}

function podeSolicitarAjuste({ distribuicao }: DistribuicaoParam = {}) {
  return !!toValue(distribuicao)?.pode_solicitar_ajuste;
}

/**
 * Resolve as permissões do usuário sobre uma solicitação de ajuste de distribuição de recurso.
 *
 * As permissões `podeAprovarAjuste`, `podeEditarAjuste` e `podeSolicitarAjuste` vêm dos
 * campos `pode_*` retornados pela API — o backend já considera o estado atual do item
 * (ex.: status, fase do workflow) ao calculá-los.
 *
 * As permissões `ehCriador` e `ehAprovador` derivam exclusivamente dos privilégios do
 * usuário e são úteis para exibir/esconder controles independentemente de um item existir.
 *
 * @returns
 * - `ehCriador`          — computed: usuário com perfil de gestor e permissão de inserção.
 * - `ehAprovador`        — computed: usuário com perfil de administrador de ajustes.
 * - `podeAprovarAjuste`  — função: o item pode ser aprovado por este usuário (`pode_aprovar`).
 * - `podeEditarAjuste`   — função: o item pode ser editado por este usuário (`pode_editar`).
 * - `podeSalvarAjuste`   — função: usuário pode criar/salvar um ajuste.
 * - `podeSolicitarAjuste`— função: usuário pode solicitar ajuste para essa distribuição.
 * - `podeVerAjuste`      — função: usuário pode visualizar ajustes da distribuição.
 * - `podeCriarAjuste`    — função: usuário pode criar um novo ajuste (equivale a `ehCriador`).
 */
export function useDistribuicaoSolicitacaoAjustePermissoes() {
  const { temPermissãoPara } = useAuthStore();

  const ehCriador = computed(
    () => temPermissãoPara('SMAE.PerfilGestorDistribuicaoRecurso')
      && temPermissãoPara('SMAE.CadastroDistribuicaoSolicitacaoAjuste.inserir'),
  );

  const ehAprovador = computed(() => temPermissãoPara(['CadastroDistribuicaoSolicitacaoAjuste.administrador']));

  function podeSalvarAjuste({ ajuste }: AjusteParam = {}) {
    const ajusteVal = toValue(ajuste);
    return ajusteVal ? !!ajusteVal.pode_editar : ehCriador.value;
  }

  function podeVerAjuste({ ajuste, distribuicao }: Params = {}) {
    return (
      ehAprovador.value
      || !!toValue(ajuste)?.pode_aprovar
      || !!toValue(distribuicao)?.pode_solicitar_ajuste
    );
  }

  function podeCriarAjuste() {
    return ehCriador.value;
  }

  return {
    ehCriador,
    ehAprovador,
    podeAprovarAjuste,
    podeEditarAjuste,
    podeSalvarAjuste,
    podeSolicitarAjuste,
    podeVerAjuste,
    podeCriarAjuste,
  };
}
