<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useAuthStore } from '@/stores/auth.store';
import { type FormatoDeEap, useTarefasStore } from '@/stores/tarefas.store.ts';

const formatos: { valor: FormatoDeEap; rótulo: string }[] = [
  { valor: 'pdf', rótulo: 'PDF' },
  { valor: 'svg', rótulo: 'SVG' },
  { valor: 'png', rótulo: 'PNG' },
];

const route = useRoute();
const authStore = useAuthStore();
const tarefasStore = useTarefasStore();
const { chamadasPendentes, lista } = storeToRefs(tarefasStore);

const podeExportar = computed(() => {
  switch (true) {
    case !!route.params.projetoId:
      return authStore.temPermissãoPara([
        'Projeto.administrador',
        'Projeto.administrador_no_orgao',
        'SMAE.gestor_de_projeto',
        'SMAE.colaborador_de_projeto',
      ]);
    case !!route.params.obraId:
      return authStore.temPermissãoPara([
        'ProjetoMDO.administrador',
        'ProjetoMDO.administrador_no_orgao',
        'MDO.gestor_de_projeto',
        'MDO.colaborador_de_projeto',
      ]);
    case !!route.params.transferenciaId:
      return authStore.temPermissãoPara('CadastroCronogramaTransferencia.listar');
    default:
      return false;
  }
});

const desabilitado = computed(() => chamadasPendentes.value.eap
  || chamadasPendentes.value.lista
  || !lista.value.length);
</script>

<template>
  <div
    v-if="podeExportar"
    class="dropbtn"
  >
    <span
      class="btn"
      :aria-disabled="desabilitado"
    >
      {{ chamadasPendentes.eap ? 'Baixando EAP...' : 'Baixar EAP' }}
    </span>
    <ul>
      <li
        v-for="formato in formatos"
        :key="formato.valor"
      >
        <button
          type="button"
          class="like-a__link"
          :disabled="desabilitado"
          :title="!lista.length ? 'Não há tarefas para exportar' : undefined"
          @click="tarefasStore.baixarEap(formato.valor)"
        >
          {{ formato.rótulo }}
        </button>
      </li>
    </ul>
  </div>
</template>
