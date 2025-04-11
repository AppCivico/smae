<script lang="ts" setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import BarraDeProgresso from '@/components/BarraDeProgresso.vue';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import dateToDate from '@/helpers/dateToDate';

const route = useRoute();

const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote as string);
const { lista } = storeToRefs(edicoesEmLoteStore);

onMounted(() => {
  edicoesEmLoteStore.buscarTudo({ tipo: route.meta.tipoDeAcoesEmLote as string });
});
</script>

<template>
  <CabecalhoDePagina>
    <template #acoes>
      <router-link
        v-if="$route.meta.rotaDeAdição"
        :to="$route.meta.rotaDeAdição"
        class="btn big ml1"
      >
        Nova edição em lote
      </router-link>
    </template>
  </CabecalhoDePagina>

  <section class="edicoes-em-lote-lista">
    <SmaeTable
      titulo-rolagem-horizontal="Tabela: Edição em Lote - Lista"
      class="mt2"
      rolagem-horizontal
      :dados="lista"
      :colunas="[
        { chave: 'iniciou_em', label: 'Data do processamento', formatador: (v) => dateToDate(v) },
        { chave: 'id', label: 'Item(s) modificado(s)' },
        { chave: 'criador.nome_exibicao', label: 'Responsável pela solicitação' },
        { chave: 'regitros_processados', label: 'registros processados', ehDadoComputado: true },
        { chave: 'progresso', label: 'Progresso', ehDadoComputado: true },
        { chave: 'acao', label: 'detalhamento', ehDadoComputado: true },
      ]"
    >
      <template #celula:regitros_processados="{ linha }">
        {{ linha.n_sucesso + linha.n_erro }} / {{ linha.n_total }}
      </template>

      <template #celula:progresso="{ linha }">
        <BarraDeProgresso
          :atual="linha.n_sucesso + linha.n_erro"
          :total="linha.n_total"
        />
      </template>

      <template #celula:acao="{ linha }">
        <SmaeLink
          class="btn small bgnone tcprimary edicoes-em-lote-lista__ler-mais"
          :to="{
            name: 'edicoesEmLoteObrasResumo',
            params: { edicaoEmLoteId: linha.id },
          }"
        >
          <span class="flex g05 center nowrap">
            <svg
              width="24"
              height="24"
            ><use xlink:href="#i_eye" /></svg>
            Ler mais
          </span>
        </SmaeLink>
      </template>
    </SmaeTable>
  </section>
</template>

<style lang="less" scoped>
.edicoes-em-lote-lista {
  :deep(.table-cell--progresso) {
    width: 190px;
  }
}

.edicoes-em-lote-lista__ler-mais svg {
  width: initial;
  height: initial;
}
</style>
