<script lang="ts" setup>
import { computed, toRaw, watch } from 'vue';
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
const {
  lista: listaDeObras, listaDeTodosIds, paginacao, chamadasPendentes,
} = storeToRefs(obrasStore);

const desabilitarBuscaDeTodosIds = computed(() => listaDeTodosIds.value
  .length === idsSelecionados.value.length
  && !!idsSelecionados.value.length);

const desabilitarAvanco = computed<boolean>(() => (
  chamadasPendentes.value.lista
  || chamadasPendentes.value.listaDeTodosIds
  || !idsSelecionados.value.length
));

const idsDaListaDeObras = computed(() => listaDeObras.value.map((obra) => obra.id));

function limparSelecao() {
  edicoesEmLoteStore.limparIdsSelecionados();
}

async function selecionarTodasObras() {
  if (desabilitarBuscaDeTodosIds.value) return;

  if (!listaDeTodosIds.value.length) {
    await obrasStore.buscarTodosIds(route.query);
  }

  idsSelecionados.value = structuredClone(toRaw(listaDeTodosIds.value));
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
  <MigalhasDePão class="mb1" />
  <CabecalhoDePagina />

  <FiltroParaRegistros>
    <ContadorItems class="mb1" />

    <MenuPaginacao
      v-bind="paginacao"
      class="mb2"
    />

    <SmaeTable
      v-selecionar-multiplas-opcoes
      titulo-para-rolagem-horizontal="Tabela: Edição em Lote"
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

    <div class="flex flexwrap g2 justifyright">
      <button
        class="btn big outline bgnone tcprimary"
        type="button"
        :aria-disabled="!idsSelecionados.length"
        @click="limparSelecao"
      >
        desmarcar {{ idsSelecionados.length }} obras
      </button>

      <button
        class="btn big outline bgnone tcprimary"
        type="button"
        :aria-busy="chamadasPendentes.listaDeTodosIds"
        :aria-disabled="desabilitarBuscaDeTodosIds"
        @click="selecionarTodasObras"
      >
        marcar todas {{ paginacao.totalRegistros }} obras
      </button>
    </div>

    <ContadorItems class="mb2" />

    <SmaeFieldsetSubmit
      as="div"
    >
      <SmaeLink
        class="btn big"
        :aria-disabled="desabilitarAvanco"
        :desabilitar="desabilitarAvanco"
        exibir-desabilitado
        :to="{
          name: 'edicoesEmLoteObrasNovoConstruir'
        }"
      >
        finalizar marcação
      </SmaeLink>
    </SmaeFieldsetSubmit>
  </FiltroParaRegistros>
</template>
