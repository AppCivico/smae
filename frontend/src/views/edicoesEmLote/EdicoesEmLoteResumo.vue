<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import dateToDate from '@/helpers/dateToDate';

const route = useRoute();

const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote as string);
const { emFoco } = storeToRefs(edicoesEmLoteStore);

const detalhesEdicao = computed(() => {
  if (!emFoco.value) {
    return [];
  }

  return [
    { descricao: 'Iniciado em', valor: dateToDate(emFoco.value.iniciou_em) },
    { descricao: 'terminado em', valor: dateToDate(emFoco.value.terminou_em) },
    { descricao: 'Executado por', valor: emFoco.value.criador.nome_exibicao },
    { descricao: 'Órgão', valor: emFoco.value.orgao?.sigla },
    { descricao: 'Itens concluidos com sucesso', valor: emFoco.value.n_sucesso },
    { descricao: 'Itens ignorados', valor: emFoco.value.n_ignorado },
    { descricao: 'Itens com erro', valor: emFoco.value.n_erro },
    { descricao: 'Total itens', valor: emFoco.value.n_total },
  ];
});

onMounted(() => {
  if (!route.params.edicaoEmLoteId) {
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

    <dl
      v-if="emFoco"
      class="edicoes-em-lote-resumo__detalhes"
    >
      <div
        v-for="(itemDetalhe, detalheIndex) in detalhesEdicao"
        :key="`detalhe-item--${detalheIndex}`"
      >
        <dt>{{ itemDetalhe.descricao }}</dt>
        <dd>{{ itemDetalhe.valor }}</dd>
      </div>
    </dl>

    <SmaeTable
      titulo-rolagem-horizontal="Tabela: Edição em Lote - Resumo"
      class="mt2"
      rolagem-horizontal
      :dados="emFoco?.results_log?.falhas || []"
      :colunas="[
        { chave: 'id', label: 'nome da obra' },
        { chave: 'erro', label: 'erros' },
      ]"
    />
  </section>
</template>

<style lang="less" scoped>
@duas-colunas: 55rem;

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

.edicoes-em-lote-resumo__detalhes {
  @media screen and (min-width: @duas-colunas) {
    max-width: 50%;
  }
}

.edicoes-em-lote-resumo__detalhes div {
  width: 100%;
  display: grid;
  position: relative;
  grid-template-columns: repeat(2, 1fr);
  padding: .5rem;

  &:before {
    content: '';
    position: absolute;
    height: 1px;
    width: 100%;
    background-color: @c100;
  }

  &:first-of-type:before {
    content: initial;
  }

  dt {
    font-weight: 700;
  }

  dt:after {
    content: ':'
  }

}
</style>
