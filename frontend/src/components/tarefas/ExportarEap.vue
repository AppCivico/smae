<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, useId } from 'vue';
import { useRoute } from 'vue-router';

import { useAuthStore } from '@/stores/auth.store';
import {
  type FormatoDeEap,
  type OrientacaoDeEap,
  useTarefasStore,
} from '@/stores/tarefas.store.ts';

const formatos: { valor: FormatoDeEap; rótulo: string }[] = [
  { valor: 'pdf', rótulo: 'PDF' },
  { valor: 'svg', rótulo: 'SVG' },
  { valor: 'png', rótulo: 'PNG' },
];

const orientações: { valor: OrientacaoDeEap; rótulo: string }[] = [
  { valor: 'vertical', rótulo: 'Vertical' },
  { valor: 'horizontal', rótulo: 'Horizontal' },
];

const id = useId();
const orientacao = ref<OrientacaoDeEap>('vertical');
const nivelMaximo = ref<number | ''>('');

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
          @click="tarefasStore.baixarEap(formato.valor, {
            orientacao,
            nivel_maximo: nivelMaximo || null,
          })"
        >
          {{ formato.rótulo }}
        </button>
      </li>
      <li class="exportar-eap__opcoes">
        <fieldset>
          <legend class="label">
            Orientação
          </legend>
          <div class="flex g1 mb1">
            <label
              v-for="opcao in orientações"
              :key="opcao.valor"
              class="t12"
            >
              <input
                v-model="orientacao"
                type="radio"
                class="inputcheckbox"
                :name="`${id}-orientacao`"
                :value="opcao.valor"
              ><span>{{ opcao.rótulo }}</span>
            </label>
          </div>
        </fieldset>
        <label
          class="label"
          :for="`${id}-nivel-maximo`"
        >
          Níveis
        </label>
        <input
          :id="`${id}-nivel-maximo`"
          v-model.number="nivelMaximo"
          type="number"
          min="1"
          step="1"
          class="inputtext light"
          placeholder="Todos"
        >
      </li>
    </ul>
  </div>
</template>

<style lang="less" scoped>
.dropbtn:focus-within ul {
  display: block;
}

.exportar-eap__opcoes {
  padding-top: 1rem;
  border-top: 1px solid @c100;
}

fieldset {
  border: 0;
  padding: 0;
  margin: 0;
}
</style>
