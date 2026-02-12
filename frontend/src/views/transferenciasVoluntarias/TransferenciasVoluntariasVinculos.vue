<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  computed, onUnmounted, watch,
} from 'vue';

import * as CardEnvelope from '@/components/cardEnvelope';
import ListaLegendas from '@/components/ListaLegendas.vue';
import TabelaVinculos from '@/components/TransferenciasVoluntarias/TabelaVinculos.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { LegendasStatus } from '@/stores/entidadesProximas.store';
import type { Vinculo } from '@/stores/transferenciasVinculos.store';
import { useTransferenciasVinculosStore } from '@/stores/transferenciasVinculos.store';

const props = defineProps<{
  transferenciaId: number;
}>();

const authStore = useAuthStore();
const alertStore = useAlertStore();
const vinculosStore = useTransferenciasVinculosStore();

const {
  linhasEndereco,
  linhasDotacao,
  linhasDemanda,
  erros,
  chamadasPendentes,
} = storeToRefs(vinculosStore);

const { temPermissãoPara } = authStore;

const legendas = {
  modulos: [
    LegendasStatus.obras,
    LegendasStatus.projetos,
    LegendasStatus.programaDeMetas,
    LegendasStatus.planoSetorial,
  ],
};

function obterObjetoVinculado(linha: Vinculo) {
  return linha.projeto || linha.meta || linha.iniciativa || linha.atividade || null;
}

const dadosEndereco = computed(() => linhasEndereco.value.map((linha) => ({
  ...linha,
  objeto_vinculado: obterObjetoVinculado(linha)?.nome || '-',
})));

const dadosDotacao = computed(() => linhasDotacao.value.map((linha) => ({
  ...linha,
  objeto_vinculado: obterObjetoVinculado(linha)?.nome || '-',
})));

const dadosDemanda = computed(() => linhasDemanda.value.map((linha) => ({
  ...linha,
  objeto_vinculado: obterObjetoVinculado(linha)?.nome || '-',
})));

// Função para carregar vínculos por endereço
async function carregarEndereco() {
  await vinculosStore.buscarVinculos({
    transferencia_id: props.transferenciaId,
    campo_vinculo: 'Endereco',
  });
}

// Função para carregar vínculos por dotação
async function carregarDotacao() {
  await vinculosStore.buscarVinculos({
    transferencia_id: props.transferenciaId,
    campo_vinculo: 'Dotacao',
  });
}

// Função para carregar vínculos por demanda
async function carregarDemanda() {
  await vinculosStore.buscarVinculos({
    transferencia_id: props.transferenciaId,
    campo_vinculo: 'Demanda',
  });
}

function excluirVinculo(vinculo: Vinculo): void {
  alertStore.confirmAction(
    'Deseja mesmo remover este vínculo?',
    async () => {
      if (await vinculosStore.excluirItem(vinculo.id)) {
        // Recarregar apenas o card correto usando as funções individuais
        if (vinculo.campo_vinculo === 'Endereco') {
          await carregarEndereco();
        } else if (vinculo.campo_vinculo === 'Dotacao') {
          await carregarDotacao();
        } else if (vinculo.campo_vinculo === 'Demanda') {
          await carregarDemanda();
        }
        alertStore.success('Vínculo removido com sucesso!');
      }
    },
    'Remover',
  );
}

function limparDados() {
  vinculosStore.$patch({
    linhasEndereco: [],
    linhasDotacao: [],
    linhasDemanda: [],
  });
}

function carregarTudo() {
  carregarEndereco();
  carregarDotacao();
  carregarDemanda();
}

carregarTudo();

watch(() => props.transferenciaId, () => {
  limparDados();
  carregarTudo();
});

onUnmounted(() => {
  limparDados();
});
</script>

<template>
  <CabecalhoDePagina />

  <div class="flex column g2">
    <CardEnvelope.Conteudo class="flex column g1">
      <CardEnvelope.Titulo
        cor="#221f43"
        cor-bolinha="#F7C234"
        estilo="com-marcador"
      >
        Endereço
      </CardEnvelope.Titulo>

      <ListaLegendas
        :legendas="legendas"
        :borda="false"
        orientacao="horizontal"
        align="left"
        titulo=""
      />

      <LoadingComponent
        v-if="chamadasPendentes.endereco && !linhasEndereco.length"
        class="mb1"
      />

      <ErrorComponent
        v-else-if="erros.endereco"
        :erro="erros.endereco"
      >
        <p class="mb1">
          Erro ao carregar vínculos por endereço.
        </p>
        <button
          type="button"
          class="btn"
          @click="carregarEndereco"
        >
          Tentar novamente
        </button>
      </ErrorComponent>

      <TabelaVinculos
        v-else
        :dados="dadosEndereco"
        tipo="endereco"
        :tem-permissao="!!temPermissãoPara('CadastroTransferencia.editar')"
        @excluir="excluirVinculo"
      />
    </CardEnvelope.Conteudo>

    <CardEnvelope.Conteudo class="flex column g1">
      <CardEnvelope.Titulo
        cor="#221f43"
        cor-bolinha="#F7C234"
        estilo="com-marcador"
      >
        Dotação
      </CardEnvelope.Titulo>

      <ListaLegendas
        :legendas="legendas"
        :borda="false"
        orientacao="horizontal"
        align="left"
        titulo=""
      />

      <LoadingComponent
        v-if="chamadasPendentes.dotacao && !linhasDotacao.length"
        class="mb1"
      />

      <ErrorComponent
        v-else-if="erros.dotacao"
        :erro="erros.dotacao"
      >
        <p class="mb1">
          Erro ao carregar vínculos por dotação.
        </p>
        <button
          type="button"
          class="btn"
          @click="carregarDotacao"
        >
          Tentar novamente
        </button>
      </ErrorComponent>

      <TabelaVinculos
        v-else
        :dados="dadosDotacao"
        tipo="dotacao"
        :tem-permissao="!!temPermissãoPara('CadastroTransferencia.editar')"
        @excluir="excluirVinculo"
      />
    </CardEnvelope.Conteudo>

    <CardEnvelope.Conteudo class="flex column g1">
      <CardEnvelope.Titulo
        cor="#221f43"
        cor-bolinha="#F7C234"
        estilo="com-marcador"
      >
        Demanda
      </CardEnvelope.Titulo>

      <LoadingComponent
        v-if="chamadasPendentes.demanda && !linhasDemanda.length"
        class="mb1"
      />

      <ErrorComponent
        v-else-if="erros.demanda"
        :erro="erros.demanda"
      >
        <p class="mb1">
          Erro ao carregar vínculos por demanda.
        </p>
        <button
          type="button"
          class="btn"
          @click="carregarDemanda"
        >
          Tentar novamente
        </button>
      </ErrorComponent>

      <TabelaVinculos
        v-else
        :dados="dadosDemanda"
        tipo="demanda"
        :tem-permissao="!!temPermissãoPara('CadastroTransferencia.editar')"
        @excluir="excluirVinculo"
      />
    </CardEnvelope.Conteudo>
  </div>

  <router-view />
</template>
