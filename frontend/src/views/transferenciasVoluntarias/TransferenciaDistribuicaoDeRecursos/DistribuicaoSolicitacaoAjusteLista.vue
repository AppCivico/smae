<script setup>
import { storeToRefs } from 'pinia';
import { onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

import SmaeLink from '@/components/SmaeLink.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import statusAjustesDistribuicaoRecursos from '@/consts/statusAjustesDistribuicaoRecursos';
import dateToField from '@/helpers/dateToField';
import { useDistribuicaoSolicitacaoAjusteStore } from '@/stores/distribuicaoSolicitacaoAjuste.store.ts';

import { useDistribuicaoSolicitacaoAjustePermissoes } from './useDistribuicaoSolicitacaoAjustePermissoes.composable';

const { params } = useRoute();

const ajusteStore = useDistribuicaoSolicitacaoAjusteStore();
const { chamadasPendentes, erros, lista } = storeToRefs(ajusteStore);

const {
  podeCriarAjuste,
} = useDistribuicaoSolicitacaoAjustePermissoes();

const colunas = [
  {
    chave: 'orgao_gestor',
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
  {
    chave: 'status',
    label: 'Status',
    formatador: (valor) => statusAjustesDistribuicaoRecursos[valor]?.nome || valor,
  },
];

ajusteStore.buscarTudo({ distribuicao_recurso_id: params.recursoId });

onUnmounted(() => {
  ajusteStore.$reset();
});
</script>

<template>
  <div>
    <CabecalhoDePagina />

    <ErrorComponent :erro="erros.lista" />

    <LoadingComponent v-if="chamadasPendentes.lista" />

    <SmaeTable
      v-else
      class="mb2"
      :colunas="colunas"
      :dados="lista"
    >
      <template #celula:orgao_gestor="{ celula }">
        <abbr
          v-if="celula.descricao"
          :title="celula.descricao"
        >{{ celula.sigla }}</abbr>
        <template v-else>
          {{ celula.sigla || celula }}
        </template>
      </template>

      <template #acoes="{ linha }">
        <SmaeLink
          class="like-a__text"
          :aria-label="linha.pode_editar ? 'editar' : 'visualizar'"
          :title="linha.pode_editar ? 'editar' : 'visualizar'"
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
              <use :xlink:href="linha.pode_editar ? '#i_edit' : '#i_eye'" />
            </svg>
            <div>{{ linha.pode_editar ? 'Editar' : 'Visualizar' }}</div>
          </span>
        </SmaeLink>
      </template>
    </SmaeTable>

    <p v-if="podeCriarAjuste()">
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
