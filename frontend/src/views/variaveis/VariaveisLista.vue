<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import FormularioQueryString from '@/components/FormularioQueryString.vue';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import SmallModal from '@/components/SmallModal.vue';
import DialogoValorBase from '@/components/variaveis/DialogoValorBase.vue';
import FiltroDeDeVariaveis from '@/components/variaveis/FiltroDeDeVariaveis.vue';
import TabelaDeVariaveisGlobais from '@/components/variaveis/TabelaDeVariaveisGlobais.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';
import VariaveisSeries from '@/views/variaveis/VariaveisSeries.vue';
import VariaveisSeriesFilhas from '@/views/variaveis/VariaveisSeriesFilhas.vue';

const route = useRoute();

const alertStore = useAlertStore();
const variaveisGlobaisStore = useVariaveisGlobaisStore();

const variavelCujosValoresSeraoExibidos = ref(0);
const tipoDeValor = ref('Previsto');
const editandoValoresDeFilhas = ref(false);

const {
  lista, chamadasPendentes, paginacao,
} = storeToRefs(variaveisGlobaisStore);

function abrirEdicaoValores(idDaVariavel, tipo, ehMae = false) {
  variavelCujosValoresSeraoExibidos.value = idDaVariavel;
  tipoDeValor.value = tipo;
  editandoValoresDeFilhas.value = ehMae;
}

async function excluirVariavel(id, nome) {
  alertStore.confirmAction(`Deseja mesmo remover a variável "${nome}"?`, async () => {
    if (await variaveisGlobaisStore.excluirItem(id)) {
      variaveisGlobaisStore.buscarTudo();
      alertStore.success('Portfólio removido.');
    }
  }, 'Remover');
}

// Extrai apenas os parâmetros relevantes em um computed
// Isso cria uma "barreira" de reatividade - mudanças em outros parâmetros não afetam este computed
const parametrosDeBusca = computed(() => ({
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
}));

// String serializada dos parâmetros para comparação estável
const parametrosSerializados = computed(() => JSON.stringify(parametrosDeBusca.value));

// Watch na string serializada - só dispara quando os VALORES mudam, não quando o objeto é recriado
watch(parametrosSerializados, () => {
  variaveisGlobaisStore.buscarTudo(parametrosDeBusca.value);
}, { immediate: true });
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
    numero-de-colunas-extras="6"
  >
    <template #definicaoUltimasColunas>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </template>

    <template #finalLinhaCabecalho>
      <td />
      <td />
      <td />
      <td />
      <td />
      <td />
    </template>

    <template #finalLinhaVariavel="{ variavel, ehFilha, mae }">
      <td>
        <SmaeLink
          type="button"
          class="tipinfo tprimary like-a__text"
          :to="{
            name: 'variaveisResumo',
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
          v-if="variavel?.pode_editar_valor
            && variavel?.tipo !== 'Calculada'"
          type="button"
          class="tipinfo tprimary like-a__text"
          @click="abrirEdicaoValores(variavel.id, 'Previsto', variavel?.possui_variaveis_filhas)"
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
          v-if="variavel?.pode_editar_valor
            && variavel?.tipo !== 'Calculada'"
          type="button"
          class="tipinfo tprimary like-a__text"
          @click="abrirEdicaoValores(variavel.id, 'Realizado', variavel?.possui_variaveis_filhas)"
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
          v-if="!ehFilha"
          :to="{
            name: 'variaveisCriar',
            query: {
              copiar_de: variavel.id,
              escape: { query: $route.query }
            }
          }"
          class="tipinfo tprimary"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_copy" /></svg>
          <div>Clonar variável "{{ variavel.titulo }}"</div>
        </SmaeLink>
      </td>

      <td>
        <SmaeLink
          v-if="variavel?.pode_editar_valor && variavel?.pode_editar"
          :to="{
            name: 'variaveisEditar',
            params: { variavelId: variavel.id },
            query: { escape: { query: $route.query } }
          }"
          class="tipinfo left tprimary"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_edit" /></svg>
          <div>Editar variável "{{ variavel.titulo }}"</div>
        </SmaeLink>

        <SmaeLink
          v-if="ehFilha
            && variavel.tipo === 'Global'
            && mae?.pode_editar_valor
            && mae?.pode_editar"
          :to="{
            query: {
              ...$route.query,
              dialogo: 'editar-valor-base',
              variavel_filha_id: variavel.id,
              variavel_mae_id: mae?.id,
            }
          }"
          class="tipinfo left tprimary"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_edit" /></svg>
          <div>Editar valor base "{{ variavel.titulo }}"</div>
        </SmaeLink>
      </td>

      <td>
        <button
          v-if="variavel?.pode_excluir"
          class="tipinfo left like-a__text"
          aria-label="excluir"
          title="excluir"
          @click="excluirVariavel(variavel.id, variavel.titulo)"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_remove" /></svg>
          <div>Excluir variável "{{ variavel.titulo }}"</div>
        </button>
      </td>
    </template>
  </TabelaDeVariaveisGlobais>

  <MenuPaginacao
    class="mt2"
    v-bind="paginacao"
  />

  <template v-if="variavelCujosValoresSeraoExibidos && tipoDeValor">
    <SmallModal
      v-if="editandoValoresDeFilhas"
      @close="abrirEdicaoValores(0, '', false)"
    >
      <VariaveisSeriesFilhas
        :variavel-id="variavelCujosValoresSeraoExibidos"
        :tipo-de-valor="tipoDeValor"
        @close="abrirEdicaoValores(0, '', false)"
      />
    </SmallModal>
    <SmallModal
      v-else
      @close="abrirEdicaoValores(0, '', false)"
    >
      <VariaveisSeries
        :variavel-id="variavelCujosValoresSeraoExibidos"
        :tipo-de-valor="tipoDeValor"
        @close="abrirEdicaoValores(0, '', false)"
      />
    </SmallModal>
  </template>

  <DialogoValorBase />
</template>
