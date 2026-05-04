<script setup>
import { storeToRefs } from 'pinia';
import { onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

import SmaeLink from '@/components/SmaeLink.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import dateToField from '@/helpers/dateToField';
import { useDistribuicaoSolicitacaoAjusteStore } from '@/stores/distribuicaoSolicitacaoAjuste.store.ts';

import { useDistribuicaoSolicitacaoAjustePermissoes } from './useDistribuicaoSolicitacaoAjustePermissoes.composable';

const { params } = useRoute();

const ajusteStore = useDistribuicaoSolicitacaoAjusteStore();
const { chamadasPendentes, erros, lista } = storeToRefs(ajusteStore);

const { ehCriador, ehAprovador } = useDistribuicaoSolicitacaoAjustePermissoes();

const colunas = [
  {
    chave: 'orgao_gestor.sigla',
    label: 'Gestor municipal',
    atributosDoCabecalhoDeColuna: { class: 'col--minimum' },
  },
  {
    chave: 'criado_em',
    label: 'Data da alteração',
    formatador: dateToField,
    atributosDaCelula: { class: 'cell--data' },
    atributosDoCabecalhoDeColuna: { class: 'col--data' },
  },
  { chave: 'criador.nome_exibicao', label: 'Solicitante' },
  { chave: 'status', label: 'Status' },
];

function podeMostrarLapis(linha) {
  if (ehAprovador.value) return true;
  if (ehCriador.value) return linha.status === 'Pendente' && !!linha.pode_editar;
  return false;
}

ajusteStore.buscarTudo({ distribuicao_recurso_id: params.recursoId });

onUnmounted(() => {
  ajusteStore.$reset();
});
</script>

<template>
  <div>
    <CabecalhoDePagina />

    <LoadingComponent v-if="chamadasPendentes.lista" />

    <ErrorComponent :erro="erros.lista" />

    <SmaeTable
      v-if="!chamadasPendentes.lista"
      class="mb2"
      :colunas="colunas"
      :dados="lista"
    >
      <template #acoes="{ linha }">
        <SmaeLink
          v-if="podeMostrarLapis(linha)"
          class="like-a__text"
          aria-label="editar"
          title="editar"
          :to="{
            name: 'DistribuicaoSolicitacaoAjuste.Editar',
            params: {
              ...$route.params,
              ajusteId: linha.id,
            },
          }"
        >
          <span class="tipinfo">
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_edit" />
            </svg>
            <div>Editar</div>
          </span>
        </SmaeLink>

        <SmaeLink
          v-else
          class="like-a__text"
          aria-label="visualizar"
          title="visualizar"
          :to="{
            name: 'DistribuicaoSolicitacaoAjuste.Editar',
            params: {
              ...$route.params,
              ajusteId: linha.id,
            },
          }"
        >
          <span class="tipinfo">
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_view" />
            </svg>
            <div>Visualizar</div>
          </span>
        </SmaeLink>
      </template>
    </SmaeTable>

    <pre v-ScrollLockDebug>
  ehCriador: {{ ehCriador }}
  ehAprovador: {{ ehAprovador }}
</pre>

    <p v-if="ehCriador">
      <SmaeLink
        class="like-a__text addlink"
        :to="{
          name: 'DistribuicaoSolicitacaoAjuste.Novo',
          params: { ...$route.params },
        }"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_+" />
        </svg> Registrar nova solicitação de ajuste
      </SmaeLink>
    </p>
  </div>
</template>
