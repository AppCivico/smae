<script lang="ts" setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import dateToDate from '@/helpers/dateToDate';
import SmaeTooltip from '@/components/SmaeTooltip/SmaeTooltip.vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const route = useRoute();

const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote as string);
const { lista } = storeToRefs(edicoesEmLoteStore);

type MapaStatus = { [key: string]: string };

function obterTraducaoStatus(status: keyof MapaStatus) {
  const mapaStatus: { [key: string]: string } = {
    Pendente: 'Pendente',
    Executando: 'Executando',
    Concluido: 'Todos os itens processados com sucesso',
    ConcluidoParcialmente: 'Finalizado, mas alguns itens falharam',
    Falhou: 'Abortado devido a erros',
    Abortado: 'Abortado',
  };

  return mapaStatus[status as keyof MapaStatus] || status;
}

onMounted(() => {
  edicoesEmLoteStore.buscarTudo({ tipo: route.meta.tipoDeAcoesEmLote as string });
  edicoesEmLoteStore.limparIdsSelecionados();
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
        {
          chave: 'iniciou_em',
          label: 'Data do processamento',
          formatador: (v) => dateToDate(v),
          atributosDaColuna: {
            class: 'col--dataHora'
          }
        },
        {
          chave: 'n_sucesso',
          label: 'Registro(s) modificado(s)',
          atributosDaCelula: {
            class: 'cell--number'
          },
          atributosDaColuna: {
            class: 'col--number'
          },
          atributosDoCabecalhoDeColuna: {
            class: 'cell--number'
          },
        },
        { chave: 'criador.nome_exibicao', label: 'Responsável pela solicitação' },
        {
          chave: 'registros_processados',
          label: 'obras processadas/selecionadas',
          atributosDaCelula: {
            class: 'tc'
          },
          atributosDoCabecalhoDeColuna: {
            class: 'tc'
          }
        },
        { chave: 'status', label: 'Status' },
        {
          chave: 'acao',
          label: 'detalhamento',
          atributosDaCelula: {
            class: 'tc'
          },
          atributosDoCabecalhoDeColuna: {
            class: 'tc'
          },
          atributosDaColuna: {
            class: 'col--botão-de-ação'
          },
        },
      ]"
    >
      <template #celula:registros_processados="{ linha }">
        {{ linha.n_sucesso + linha.n_ignorado + linha.n_erro }} / {{ linha.n_total }}
      </template>

      <template #celula:status="{ linha }">
        {{ obterTraducaoStatus(linha.status) }}
      </template>

      <template #celula:acao="{ linha }">
        <div class="nowrap flex g1 justifyright">
          <SmaeLink
            v-if="linha?.relatorio_arquivo"
            class="tcprimary edicoes-em-lote-lista__ler-mais"
            download
            :to="`${baseUrl}/download/${linha?.relatorio_arquivo}`"
            :title="`Baixar detalhamento da edição em lote ${linha?.id}`"
          >
            <SmaeTooltip
              texto="Baixar detalhamento"
            >
              <template #botao>
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_download" /></svg>
              </template>
            </SmaeTooltip>
          </SmaeLink>
          <SmaeLink
            class="tcprimary edicoes-em-lote-lista__ler-mais"
            :to="{
              name: 'edicoesEmLoteObrasResumo',
              params: { edicaoEmLoteId: linha.id },
            }"
          >
            <SmaeTooltip
              texto="Ler detalhamento"
            >
              <template #botao>
                <svg
                  width="24"
                  height="24"
                ><use xlink:href="#i_eye" /></svg>
              </template>
            </SmaeTooltip>
          </SmaeLink>
        </div>
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
