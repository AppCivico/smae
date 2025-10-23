<script setup>
import { storeToRefs } from 'pinia';
import { ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import SmallModal from '@/components/SmallModal.vue';
import FiltroDeDeVariaveis from '@/components/variaveis/FiltroDeDeVariaveis.vue';
import TabelaDeVariaveisGlobais from '@/components/variaveis/TabelaDeVariaveisGlobais.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';
import VariaveisSeries from '@/views/variaveis/VariaveisSeries.vue';

const route = useRoute();

const alertStore = useAlertStore();
const variaveisGlobaisStore = useVariaveisGlobaisStore();

const variavelCujosValoresSeraoExibidos = ref(0);
const tipoDeValor = ref('Previsto');

const {
  lista, chamadasPendentes, paginacao,
} = storeToRefs(variaveisGlobaisStore);

function abrirEdicaoValores(idDaVariavel, tipo) {
  variavelCujosValoresSeraoExibidos.value = idDaVariavel;
  tipoDeValor.value = tipo;
}

async function excluirVariavel(id, nome) {
  alertStore.confirmAction(`Deseja mesmo remover a variável "${nome}"?`, async () => {
    if (await variaveisGlobaisStore.excluirItem(id)) {
      variaveisGlobaisStore.buscarTudo();
      alertStore.success('Portfólio removido.');
    }
  }, 'Remover');
}

watchEffect(() => {
  variaveisGlobaisStore.buscarTudo({
    assuntos: route.query.assuntos,
    codigo: route.query.codigo,
    descricao: route.query.descricao,
    meta_id: route.query.meta_id,
    medicao_orgao_id: route.query.medicao_orgao_id,
    orgao_proprietario_id: route.query.orgao_proprietario_id,
    nivel_regionalizacao: route.query.nivel_regionalizacao,
    palavra_chave: route.query.palavra_chave,
    periodicidade: route.query.periodicidade,
    plano_setorial_id: route.query.plano_setorial_id,
    regiao_id: route.query.regiao_id,
    titulo: route.query.titulo,
    variavel_categorica_id: route.query.variavel_categorica_id,

    pagina: route.query.pagina,

    ipp: route.query.ipp,
    token_paginacao: route.query.token_paginacao,

    ordem_coluna: route.query.ordem_coluna,
    ordem_direcao: route.query.ordem_direcao,
  });
});
</script>
<template>
  <CabecalhoDePagina class="mb2">
    <template #acoes>
      <SmaeLink
        :to="{ name: 'variaveisCriar' }"
        class="btn big"
      >
        Nova variável
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <FormularioQueryString
    v-slot="{ aplicarQueryStrings }"
    :valores-iniciais="{
      ordem_coluna: 'criado_em',
      ordem_direcao: 'desc',
      ipp: gblIpp,
      pagina: 1,
      token_paginacao: undefined,
    }"
  >
    <FiltroDeDeVariaveis
      :aria-busy="chamadasPendentes.lista"
      @submit="aplicarQueryStrings"
    />
  </FormularioQueryString>

  <p v-if="!chamadasPendentes.lista">
    Exibindo <strong>{{ lista.length }}</strong> resultados de {{ paginacao.totalRegistros }}.
  </p>

  <TabelaDeVariaveisGlobais
    aria-labelledby="titulo-da-pagina"
    numero-de-colunas-extras="5"
  >
    <template #definicaoUltimasColunas>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </template>

    <template #finalLinhaVariavel="{ variavel }">
      <td>
        <SmaeLink
          type="button"
          class="tipinfo tprimary like-a__text"
          :to="{
            name: 'variavel.composicao',
            params: { variavelId: variavel.id },
            query: $route.query,
          }"
          exibir-desabilitado
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_eye" /></svg>
          <div>Resumo da variável</div>
        </SmaeLink>
      </td>

      <td>
        <button
          v-if="
            variavel?.pode_editar_valor
              && !variavel?.possui_variaveis_filhas
              && variavel?.tipo !== 'Calculada'
          "
          type="button"
          class="tipinfo tprimary like-a__text"
          @click="abrirEdicaoValores(variavel.id, 'Previsto')"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_valores" /></svg>
          <div>Preencher valores Previstos e Acumulados</div>
        </button>
      </td>
      <td>
        <button
          v-if="
            variavel?.pode_editar_valor
              && !variavel?.possui_variaveis_filhas
              && variavel?.tipo !== 'Calculada'
          "
          type="button"
          class="tipinfo tprimary like-a__text"
          @click="abrirEdicaoValores(variavel.id, 'Realizado')"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_check" /></svg>
          <div>Preencher valores Realizados Retroativos</div>
        </button>
      </td>

      <td>
        <SmaeLink
          v-if="variavel?.pode_editar_valor && variavel?.pode_editar"
          :to="{
            name: 'variaveisEditar',
            params: { variavelId: variavel.id },
            query: { escape: { query: $route.query } }
          }"
          class="tprimary"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_edit" /></svg>
        </SmaeLink>
      </td>
      <td>
        <button
          v-if="variavel?.pode_excluir"
          class="like-a__text"
          arial-label="excluir"
          title="excluir"
          @click="excluirVariavel(variavel.id, variavel.titulo)"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_remove" /></svg>
        </button>
      </td>
    </template>
  </TabelaDeVariaveisGlobais>

  <MenuPaginacao
    class="mt2"
    v-bind="paginacao"
  />

  <SmallModal
    v-if="variavelCujosValoresSeraoExibidos && tipoDeValor"
    @close="abrirEdicaoValores(0, '')"
  >
    <VariaveisSeries
      :variavel-id="variavelCujosValoresSeraoExibidos"
      :tipo-de-valor="tipoDeValor"
      @close="abrirEdicaoValores(0, '')"
    />
  </SmallModal>
</template>
