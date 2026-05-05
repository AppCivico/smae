<script setup>
import { storeToRefs } from 'pinia';
import { useIsFormDirty } from 'vee-validate';
import { computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import SmaeLink from '@/components/SmaeLink.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';

import { useDistribuicaoSolicitacaoAjustePermissoes } from './useDistribuicaoSolicitacaoAjustePermissoes.composable';

const router = useRouter();
const { params } = useRoute();

const formularioSujo = useIsFormDirty();

const alertStore = useAlertStore();
const distribuicaoRecursos = useDistribuicaoRecursosStore();

const { chamadasPendentes, lista } = storeToRefs(distribuicaoRecursos);

const { ehCriador, ehAprovador } = useDistribuicaoSolicitacaoAjustePermissoes();
const podeAcessarSolicitacaoAjuste = computed(() => ehCriador.value || ehAprovador.value);

const colunas = [
  { chave: 'orgao_gestor.sigla', label: 'Gestor municipal' },
  {
    chave: 'valor_total',
    label: 'Valor total',
    formatador: (v) => (v ? dinheiro(v) : '-'),
    atributosDaCelula: { class: 'cell--number' },
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
  },
  {
    chave: 'vigencia',
    label: 'Data de vigência',
    formatador: dateToField,
    atributosDaCelula: { class: 'cell--data' },
    atributosDoCabecalhoDeColuna: { class: 'cell--data' },
  },
  { chave: 'nome', label: 'Nome' },
  { chave: 'status_atual', label: 'Último Status' },
];

async function excluirDistribuição({ id, nome }) {
  alertStore.confirmAction(`Deseja mesmo remover o item "${nome}"?`, async () => {
    if (await distribuicaoRecursos.excluirItem(id)) {
      distribuicaoRecursos.$reset();
      distribuicaoRecursos.buscarTudo({ transferencia_id: params.transferenciaId });
      alertStore.success('Distribuição removida.');
    }
  }, 'Remover');
}

function voltarTela() {
  router.push({
    name: 'TransferenciasVoluntariasDetalhes',
    params: {
      ...params,
    },
  });
}

async function iniciar() {
  distribuicaoRecursos.buscarTudo({ transferencia_id: params.transferenciaId });
}

iniciar();

onUnmounted(() => {
  distribuicaoRecursos.$reset();
});
</script>

<template>
  <div>
    <div class="flex spacebetween center mb2 mt2">
      <TítuloDePágina />

      <hr class="ml2 f1">

      <CheckClose
        :formulario-sujo="formularioSujo"
        :apenas-emitir="true"
        @close="voltarTela"
      />
    </div>

    <LoadingComponent v-if="chamadasPendentes.lista" />

    <SmaeTable
      v-else
      class="mb2"
      :colunas="colunas"
      :dados="lista"
    >
      <template #acoes="{ linha }">
        <SmaeLink
          v-if="linha.pode_editar"
          class="like-a__text"
          aria-label="editar"
          title="editar"
          :to="{
            name: 'TransferenciaDistribuicaoDeRecursos.Editar',
            params: {
              ...$route.params,
              recursoId: linha.id,
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
          v-if="podeAcessarSolicitacaoAjuste"
          :to="{
            name: 'DistribuicaoSolicitacaoAjuste.Lista',
            params: {
              ...$route.params,
              recursoId: linha.id,
            },
          }"
        >
          <span class="tipinfo">
            <svg
              width="20"
              height="20"
              :class="{
                tvermelho: linha.possui_solicitacao_ajuste_pendente
              }"
            >
              <use xlink:href="#i_atividade" />
            </svg>
            <div v-if="linha.possui_solicitacao_ajuste_pendente">
              Há solicitações de ajuste pendentes
            </div>
            <div v-else>Solicitações de ajuste</div>
          </span>
        </SmaeLink>

        <SmaeLink
          :to="{
            name: 'TransferenciaDistribuicaoDeRecursos.Editar.Status',
            params: {
              ...$route.params,
              recursoId: linha.id,
            },
          }"
        >
          <span class="tipinfo">
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_check" />
            </svg>

            <div>Histórico de Status</div>
          </span>
        </SmaeLink>

        <button
          class="like-a__text"
          aria-label="excluir"
          title="excluir"
          type="button"
          @click="excluirDistribuição(linha)"
        >
          <svg
            width="20"
            height="20"
          >
            <use xlink:href="#i_waste" />
          </svg>
        </button>
      </template>
    </SmaeTable>

    <p>
      <SmaeLink
        class="like-a__text addlink"
        :to="{
          name: 'TransferenciaDistribuicaoDeRecursos.Novo',
        }"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_+" />
        </svg> Registrar nova distribuição de recurso
      </SmaeLink>
    </p>
  </div>
</template>
