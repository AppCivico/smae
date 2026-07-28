<script setup>
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import FONTES_POR_SISTEMA from '@/consts/fontesDeRelatoriosPorSistema';
import schema, { filtro as schemaDeFiltro } from '@/consts/formSchemas/modelosDeRelatorio';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useModelosDeRelatorioStore } from '@/stores/modelosDeRelatorio.store';

const route = useRoute();

const { sistemaEscolhido } = useAuthStore();
const modelosDeRelatorioStore = useModelosDeRelatorioStore(sistemaEscolhido);
const alertStore = useAlertStore();

const { lista, chamadasPendentes, erros } = storeToRefs(modelosDeRelatorioStore);

const camposDeFiltro = [
  {
    campos: {
      fonte: {
        tipo: 'select',
        opcoes: Object.values(FONTES_POR_SISTEMA[sistemaEscolhido] || {})
          .map((fonte) => ({ id: fonte.valor, label: fonte.nome })),
      },
    },
  },
];

// SmaeTable/TableHeaderCell já resolvem o label de cada coluna pelo `schema` (via
// buscarDadosDoYup); `label` aqui só serve de fallback pra `criador`, que não é campo do form.
const colunas = [
  { chave: 'nome' },
  {
    chave: 'fonte',
    // Mesmo nome amigável exibido no `select` de fonte do formulário de criação/edição.
    formatador: (valor) => (FONTES_POR_SISTEMA[sistemaEscolhido] || {})[valor]?.nome || valor,
  },
  { chave: 'criador', label: 'Criado por' },
];

const parametrosDeBusca = computed(() => ({
  fonte: route.query.fonte || undefined,
}));

async function excluirModelo(linha) {
  if (await modelosDeRelatorioStore.excluirItem(linha.id)) {
    alertStore.success(`Modelo "${linha.nome}" removido.`);
  }
}

watch(parametrosDeBusca, () => {
  modelosDeRelatorioStore.buscarTudo(parametrosDeBusca.value);
}, { immediate: true });
</script>

<template>
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink
        :to="{ name: 'modelosDeRelatorio.criar' }"
        class="btn big"
      >
        Novo modelo de relatório
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <FiltroParaPagina
    class="mb2"
    :formulario="camposDeFiltro"
    :schema="schemaDeFiltro"
    :carregando="chamadasPendentes.lista"
  />

  <LoadingComponent v-if="chamadasPendentes.lista" />

  <SmaeTable
    v-else
    :dados="lista"
    :colunas="colunas"
    :schema="schema"
    :rota-editar="(linha) => (linha.pode_editar ? {
      name: 'modelosDeRelatorio.editar',
      params: { modelosDeRelatorioId: linha.id },
    } : undefined)"
    parametro-no-objeto-para-excluir="nome"
    @deletar="excluirModelo"
  >
    <template #celula:criador="{ linha }">
      {{ linha.criador?.nome_exibicao }}
    </template>
  </SmaeTable>

  <ErrorComponent
    v-if="erros.lista"
    :erro="erros.lista"
  />
</template>
