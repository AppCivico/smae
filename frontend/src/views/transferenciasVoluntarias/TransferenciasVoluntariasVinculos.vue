<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';

import TabelaVinculos from '@/components/TransferenciasVoluntarias/TabelaVinculos.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
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
  chamadasPendentes,
} = storeToRefs(vinculosStore);

const { temPermissãoPara } = authStore;

const visualizacao: Ref<'endereco' | 'dotacao'> = ref('endereco');
const dotacaoCarregada: Ref<boolean> = ref(false);

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

function excluirVinculo(vinculo: Vinculo): void {
  alertStore.confirmAction(
    'Deseja mesmo remover este vínculo?',
    async () => {
      if (await vinculosStore.excluirItem(vinculo.id)) {
        vinculosStore.buscarVinculos({ transferencia_id: props.transferenciaId, campo_vinculo: visualizacao.value === 'endereco' ? 'Endereco' : 'Dotacao' });
        alertStore.success('Vínculo removido com sucesso!');
      }
    },
    'Remover',
  );
}

async function alterarVisualizacao(novaVisualizacao: 'endereco' | 'dotacao'): Promise<void> {
  visualizacao.value = novaVisualizacao;

  if (novaVisualizacao === 'dotacao' && !dotacaoCarregada.value) {
    await vinculosStore.buscarVinculos({ transferencia_id: props.transferenciaId, campo_vinculo: 'Dotacao' });
    dotacaoCarregada.value = true;
  }
}

vinculosStore.buscarVinculos({ transferencia_id: props.transferenciaId, campo_vinculo: 'Endereco' });
</script>

<template>
  <CabecalhoDePagina>
    <template #acoes>
      <div class="flex g2">
        <button
          type="button"
          class="btn big outline bgnone"
          :class="visualizacao === 'endereco' ? 'tamarelo' : 'tcprimary'"
          :aria-pressed="visualizacao === 'endereco'"
          @click="alterarVisualizacao('endereco')"
        >
          por Endereço
        </button>
        <button
          type="button"
          class="btn big outline bgnone"
          :class="visualizacao === 'dotacao' ? 'tamarelo' : 'tcprimary'"
          :aria-pressed="visualizacao === 'dotacao'"
          @click="alterarVisualizacao('dotacao')"
        >
          por Dotação
        </button>
      </div>
    </template>
  </CabecalhoDePagina>

  <LoadingComponent
    v-if="chamadasPendentes.lista"
    class="mb1"
  />

  <TabelaVinculos
    v-else-if="visualizacao === 'endereco'"
    :dados="dadosEndereco"
    tipo="endereco"
    :tem-permissao="!!temPermissãoPara('CadastroTransferencia.editar')"
    @excluir="excluirVinculo"
  />

  <TabelaVinculos
    v-else-if="visualizacao === 'dotacao'"
    :dados="dadosDotacao"
    tipo="dotacao"
    :tem-permissao="!!temPermissãoPara('CadastroTransferencia.editar')"
    @excluir="excluirVinculo"
  />

  <router-view />
</template>
