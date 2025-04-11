<script lang="ts" setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';

const route = useRoute();

const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote as string);
const { emFoco } = storeToRefs(edicoesEmLoteStore);

onMounted(() => {
  if (route.params.edicaoEmLoteId) {
    throw new Error('Parâmetro "edicaoEmLoteId" não informado');
  }

  edicoesEmLoteStore.buscarItem(route.params.edicaoEmLoteId as unknown as number);
});
</script>

<template>
  <CabecalhoDePagina />

  <section class="edicoes-em-lote-resumo">
    <h3 class="edicoes-em-lote-resumo__titulo">
      Edição
    </h3>

    <h2 class="edicoes-em-lote-resumo__criador">
      {{ emFoco?.criador.nome_exibicao }}
    </h2>

    <SmaeTable
      titulo-rolagem-horizontal="Tabela: Edição em Lote - Resumo"
      class="mt2"
      rolagem-horizontal
      :dados="emFoco?.operacao || []"
      :colunas="[
        { chave: 'col', label: 'nome da obra' },
        { chave: 'set', label: 'erros' },
      ]"
    />
  </section>
</template>

<style lang="less" scoped>
.edicoes-em-lote-resumo__titulo {
  font-weight: 400;
  font-size: 22px;
  color: #005C8A;
}

.edicoes-em-lote-resumo__criador {
  font-weight: 300;
  font-size: 20px;
  color: #152741;
}
</style>
