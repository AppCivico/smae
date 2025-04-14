<script lang="ts" setup>
import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import FiltroParaRegistros from '@/components/alteracaoEmLotes.componentes/Selecionar/FiltroParaRegistros.vue';
import { useObrasStore } from '@/stores/obras.store';
import { obras as obrasSchema } from '@/consts/formSchemas';
import statusObras from '@/consts/statusObras';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';
import ContadorItems from '@/components/alteracaoEmLotes.componentes/Selecionar/ContadorItems.vue';

const route = useRoute();
const router = useRouter();

const obrasStore = useObrasStore();
const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote as string);

const { idsSelecionados } = storeToRefs(edicoesEmLoteStore);
const { lista: listaDeObras, paginacao } = storeToRefs(obrasStore);

function limparSelecionados() {
  edicoesEmLoteStore.limparIdsSelecionados();
}

function handleSelecionarTodasObras() {
  alert('Aguardando BE');

  return;

  router.push({
    name: 'edicoesEmLoteObrasNovoConstruir',
  });
}

function handleFinalizarSelecao() {

}

watch(
  () => [
    route.query.portfolio_id,
    route.query.orgao_origem_id,
    route.query.regioes,
    route.query.status_obra,
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

  <FiltroParaRegistros />

  <section>
    <ContadorItems />

    <MenuPaginacao
      v-bind="paginacao"
      class="mt1"
    />

    <SmaeTable
      v-selecionar-multiplas-opcoes
      titulo-rolagem-horizontal="Tabela: Edição em Lote"
      class="mt2"
      rolagem-horizontal
      :dados="listaDeObras"
      :colunas="[
        { chave: 'selecionado', ehDadoComputado: true },
        { chave: 'orgao_origem.sigla', label: obrasSchema.fields['orgao_origem_id'].spec.label },
        { chave: 'portfolio.titulo', label: obrasSchema.fields['portfolio_id'].spec.label },
        { chave: 'nome', label: obrasSchema.fields['nome'].spec.label },
        { chave: 'grupo_tematico.nome', label: obrasSchema.fields['grupo_tematico_id'].spec.label },
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
        <button
          class="btn outline bgnone tcprimary nowrap"
          type="button"
          @click="limparSelecionados"
        >
          Desmarcar todas
        </button>
      </template>

      <template #celula:selecionado="{ linha }">
        <div class="flex justifycenter">
          <input
            v-model="idsSelecionados"
            type="checkbox"
            name="selecionado"
            :value="linha.id"
          >
        </div>
      </template>

      <template #celula:status="{ linha }">
        {{ statusObras[linha.status]?.nome || linha.status }}
      </template>
    </SmaeTable>

    <MenuPaginacao
      v-bind="paginacao"
      class="mt2"
    />

    <ContadorItems class="mt2" />

    <SmaeFieldsetSubmit>
      <button
        class="btn big outline bgnone tcprimary"
        @click="handleSelecionarTodasObras"
      >
        selecionar todas obras ({{ paginacao.totalRegistros }})
      </button>

      <SmaeLink
        class="btn big"
        :aria-disabled="idsSelecionados.length === 0"
        :desabilitar="idsSelecionados.length === 0"
        :to="{
          name: 'edicoesEmLoteObrasNovoConstruir'
        }"
        @click="handleFinalizarSelecao"
      >
        finalizar seleção
      </SmaeLink>
    </SmaeFieldsetSubmit>
  </section>
</template>
