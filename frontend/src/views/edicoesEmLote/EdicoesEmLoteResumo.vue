<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import type { TipoOperacao } from '@back/task/run_update/dto/create-run-update.dto';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import tiposDeOperacoesEmLote from '@/consts/tiposDeOperacoesEmLote';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import dateToDate from '@/helpers/dateToDate';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

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
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink
        v-if="emFoco?.relatorio_arquivo"
        class="btn with-icon amarelo"
        download
        :to="`${baseUrl}/download/${emFoco?.relatorio_arquivo}`"
        :title="`Baixar detalhamento da edição em lote ${emFoco?.id}`"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_download" />
        </svg>
        Arquivo detalhado
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <article>
    <template
      v-for="(linha, linhaIndex) in detalhesEdicao"
      :key="`detalhe-linha--${linhaIndex}`"
    >
      <div class="flex column mb2">
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

    <SmaeTable
      :dados="emFoco?.operacao_processada?.items || []"
      :colunas="[
        {
          chave: 'col_label',
          ehCabecalho: true,
          label: 'Campo',
        },
        {
          chave: 'tipo_operacao',
          label: 'Tipo de operação',
          atributosDaCelula: {
            class: 'cell--minimum',
          }
        },
        {
          chave: 'valor_formatado',
          label: 'Valor formatado',
          atributosDaCelula: {
            class: 'cell--minimum'
          }
        },
      ]"
      titulo="Operações"
      rolagem-horizontal
      class="mb2"
    >
      <template #celula:tipo_operacao="{ linha }">
        {{ tiposDeOperacoesEmLote[(linha.tipo_operacao as TipoOperacao)]?.nome
          || linha.tipo_operacao }}
      </template>

      <template #celula:valor_formatado="{ linha }">
        {{ Array.isArray(linha.valor_formatado)
          ? combinadorDeListas(linha.valor_formatado, ', ')
          : linha.valor_formatado }}
      </template>
    </SmaeTable>

    <SmaeTable
      titulo="Falhas"
      titulo-rolagem-horizontal="Tabela: Edição em Lote - Resumo"
      rolagem-horizontal
      :dados="emFoco?.results_log?.falhas || []"
      :colunas="[
        { chave: 'nome', label: 'nome da obra' },
        { chave: 'erro', label: 'erros' },
      ]"
    />
  </article>
</template>
