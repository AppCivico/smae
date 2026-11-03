<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useAuthStore } from '@/stores/auth.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

const props = defineProps({
  transferenciaId: {
    type: Number,
    required: true,
  },
});

const authStore = useAuthStore();
const distribuicaoRecursosStore = useDistribuicaoRecursosStore();
const { emFoco: transferenciaEmFoco } = storeToRefs(useTransferenciasVoluntariasStore());

const anoCorrente = new Date().getUTCFullYear();

// sem ano na transferência, oferecemos os últimos cinco anos
const anosDisponiveis = computed(() => {
  const anoDaTransferencia = Number(transferenciaEmFoco.value?.ano);
  const anoInicial = anoDaTransferencia && anoDaTransferencia <= anoCorrente
    ? anoDaTransferencia
    : anoCorrente - 5;

  return Array.from(
    { length: anoCorrente - anoInicial + 1 },
    (_, i) => anoCorrente - i,
  );
});

const podeEditar = computed(() => authStore.temPermissãoPara('CadastroTransferencia.editar'));

const parametrosParaValidacao = computed(() => ({
  transferencia_id: props.transferenciaId,
}));

// o ano do registro determina a carga das listas do SOF; fica guardado aqui
// para valer entre uma inclusão e outra
const anoDeReferencia = ref(anoCorrente);

watch(() => props.transferenciaId, (transferenciaId) => {
  if (transferenciaId) {
    distribuicaoRecursosStore.buscarTudo({ transferencia_id: transferenciaId });
  }
}, { immediate: true });
</script>
<template>
  <router-view v-slot="{ Component }">
    <component
      :is="Component"
      :ano-de-referencia="anoDeReferencia"
      :distribuicoes-de-recursos="distribuicaoRecursosStore.lista"
      :parametros-para-validacao="parametrosParaValidacao"
      :pode-editar="podeEditar"
    >
      <template #ano-de-referencia>
        <div class="mb2">
          <label
            for="ano-de-referencia"
            class="label"
          >
            Ano de referência
          </label>
          <select
            id="ano-de-referencia"
            v-model.number="anoDeReferencia"
            class="inputtext light"
          >
            <option
              v-for="ano in anosDisponiveis"
              :key="ano"
              :value="ano"
            >
              {{ ano }}
            </option>
          </select>
        </div>
      </template>
    </component>
  </router-view>

  <ErrorComponent
    v-if="distribuicaoRecursosStore.erro"
    :erro="distribuicaoRecursosStore.erro"
  />
</template>
