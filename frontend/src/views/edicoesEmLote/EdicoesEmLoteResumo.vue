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
    [
      { descricao: 'Iniciado em', valor: emFoco.value ? dateToDate(emFoco.value.iniciou_em) : '-' },
      { descricao: 'Terminado em', valor: emFoco.value ? dateToDate(emFoco.value.terminou_em) : '-' },
      { descricao: 'Executado por', valor: emFoco.value?.criador.nome_exibicao || '-' },
      { descricao: 'Órgão', valor: emFoco.value?.orgao?.sigla || '-' },
    ],
    [
      { descricao: 'Itens concluidos com sucesso', valor: emFoco.value?.n_sucesso || '-' },
      { descricao: 'Itens ignorados', valor: emFoco.value?.n_ignorado || '-' },
      { descricao: 'Itens com erro', valor: emFoco.value?.n_erro || '-' },
      { descricao: 'Total itens', valor: emFoco.value?.n_total || '-' },
    ],
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

  <article>
    <template
      v-for="(linha, linhaIndex) in detalhesEdicao"
      :key="`detalhe-linha--${linhaIndex}`"
    >
      <div class="flex column">
        <dl class="flex g2 flexwrap f1 mb1">
          <div
            v-for="(itemDetalhe, detalheIndex) in linha"
            :key="`detalhe-item--${linhaIndex}-${detalheIndex}`"
            class="f1 mb1"
          >
            <dt class="t12 uc w700 mb05 tamarelo">
              {{ itemDetalhe.descricao }}
            </dt>

            <dd class="t13">
              {{ itemDetalhe.valor }}
            </dd>
          </div>
        </dl>
      </div>
    </template>
  </article>

  <SmaeTable
    titulo-rolagem-horizontal="Tabela: Edição em Lote - Resumo"
    class="mt2"
    rolagem-horizontal
    :dados="emFoco?.results_log?.falhas || []"
    :colunas="[
      { chave: 'nome', label: 'nome da obra' },
      { chave: 'erro', label: 'erros' },
    ]"
  />
</template>
