<script lang="ts" setup>
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import FiltroParaRegistros from '@/components/alteracaoEmLotes.componentes/Selecionar/FiltroParaRegistros.vue';
import { useObrasStore } from '@/stores/obras.store';
import { obras as obrasSchema } from '@/consts/formSchemas';
import statusObras from '@/consts/statusObras';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';
import SelecionarTudo from '@/components/camposDeFormulario/SelecionarTudo/SelecionarTudo.vue';
import ContadorItems from '@/components/alteracaoEmLotes.componentes/Selecionar/ContadorItems.vue';

const route = useRoute();

const obrasStore = useObrasStore();
const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote as string);

const { idsSelecionados } = storeToRefs(edicoesEmLoteStore);
const { lista: listaDeObras, paginacao, chamadasPendentes } = storeToRefs(obrasStore);

const desabilitarItems = computed<boolean>(() => (
  chamadasPendentes.value.lista || idsSelecionados.value.length === 0
));

const idsDaListaDeObras = computed(() => listaDeObras.value.map((obra) => obra.id));

function limparSelecionados() {
  edicoesEmLoteStore.limparIdsSelecionados();
}

async function handleSelecionarTodasObras() {
  const idsObras = await obrasStore.buscarTodosIds(route.query);

  idsSelecionados.value = structuredClone(idsObras);
}

watch(
  () => [
    route.query.portfolio_id,
    route.query.orgao_origem_id,
    route.query.regioes,
    route.query.status,
    route.query.grupo_tematico_id,
    route.query.tipo_intervencao_id,
    route.query.equipamento_id,
    route.query.registros_sei,
    route.query.palavra_chave,
    route.query.ordem_coluna,
    route.query.ordem_direcao,
    route.query.ipp,
  ],
  () => {
    obrasStore.buscarTudo(route.query);
  },
  { immediate: true },
);

</script>

<template>
  <CabecalhoDePagina />

  <FiltroParaRegistros>
    <ContadorItems class="mb1" />

    <MenuPaginacao
      v-bind="paginacao"
      class="mb2"
    />

    <SmaeTable
      v-selecionar-multiplas-opcoes
      titulo-rolagem-horizontal="Tabela: Edição em Lote"
      class="mb2"
      rolagem-horizontal
      :dados="listaDeObras"
      :colunas="[
        {
          chave: 'selecionado',
          atributosDaColuna: {
            class: 'col--minimum',
          },
        },
        { chave: 'orgao_origem.sigla', label: obrasSchema.fields['orgao_origem_id'].spec.label },
        { chave: 'portfolio.titulo', label: obrasSchema.fields['portfolio_id'].spec.label },
        { chave: 'nome', label: obrasSchema.fields['nome'].spec.label },
        {
          chave: 'grupo_tematico.nome',
          label: obrasSchema.fields['grupo_tematico_id'].spec.label
        },
        {
          chave: 'tipo_intervencao.nome',
          label: obrasSchema.fields['tipo_intervencao_id'].spec.label
        },
        { chave: 'equipamento.nome', label: obrasSchema.fields['equipamento_id'].spec.label },
        { chave: 'regioes', label: obrasSchema.fields['regiao_ids'].spec.label },
        { chave: 'status', label: obrasSchema.fields['status'].spec.label },
      ]"
      replicar-cabecalho
    >
      <template #cabecalho:selecionado>
        <SelecionarTudo
          v-model="idsSelecionados"
          :lista-de-opcoes="idsDaListaDeObras"
        />
      </template>

      <template #rodape:selecionado>
        <SelecionarTudo
          v-model="idsSelecionados"
          :lista-de-opcoes="idsDaListaDeObras"
        />
      </template>

      <template #celula:selecionado="{ linha }">
        <input
          v-model="idsSelecionados"
          type="checkbox"
          name="selecionado"
          :value="linha.id"
        >
      </template>

      <template #celula:status="{ linha }">
        {{ statusObras[linha.status]?.nome || linha.status }}
      </template>
    </SmaeTable>

    <MenuPaginacao
      v-bind="paginacao"
      class="mb2"
    />

    <ContadorItems class="mb2" />

    <SmaeFieldsetSubmit
      as="div"
    >
      <button
        class="btn big outline bgnone tcprimary"
        type="button"
        :aria-disabled="!idsSelecionados.length"
        @click="limparSelecionados"
      >
        Desselecionar todas
      </button>

      <button
        class="btn big outline bgnone tcprimary"
        @click="handleSelecionarTodasObras"
      >
        selecionar todas {{ paginacao.totalRegistros }} obras
      </button>

      <SmaeLink
        class="btn big"
        :aria-disabled="desabilitarItems"
        :desabilitar="desabilitarItems"
        exibir-desabilitado
        :to="{
          name: 'edicoesEmLoteObrasNovoConstruir'
        }"
      >
        finalizar seleção
      </SmaeLink>
    </SmaeFieldsetSubmit>
  </FiltroParaRegistros>
</template>
