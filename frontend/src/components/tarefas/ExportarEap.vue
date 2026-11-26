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
const somentePrimeiroNivel = ref(false);

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
    <button
      type="button"
      class="btn"
      :aria-disabled="desabilitado"
    >
      {{ chamadasPendentes.eap ? 'Baixando EAP...' : 'Baixar EAP' }}
    </button>
    <form
      class="exportar-eap__painel"
      method="post"
      @submit.prevent
    >
      <fieldset class="exportar-eap__opcoes">
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
        <label class="t12">
          <input
            v-model="somentePrimeiroNivel"
            type="checkbox"
            class="inputcheckbox"
          ><span>Somente o primeiro nível</span>
        </label>
      </fieldset>
      <fieldset class="exportar-eap__formatos">
        <legend class="label">
          Formato
        </legend>
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
                nivel_maximo: somentePrimeiroNivel ? 1 : null,
              })"
            >
              {{ formato.rótulo }}
            </button>
          </li>
        </ul>
      </fieldset>
    </form>
  </div>
</template>

<style lang="less" scoped>
// O painel é um `form`, não um `ul`, então não recebe a aparência que o
// `.dropbtn ul` global dá aos menus; ela vem do mesmo mixin.
.exportar-eap__painel {
  .menu-flutuante();
  right: 75%;

  legend.label {
    margin-bottom: 0;
  }

  &::before {
    left: 65%;
  }

  .dropbtn:hover &,
  .dropbtn:focus-within & {
    display: block;
  }
}

// O `.dropbtn ul` global também pega a lista de formatos, que está dentro do
// painel; aqui se desfaz o visual de painel que ele aplica a ela.
// Propriedades comentadas não têm efeito visível dentro do painel.
.dropbtn .exportar-eap__painel ul {
  position: static;
  transform: none;
  padding: 0;
  border: 0;
  box-shadow: none;
  animation: none;
  display: block;

  &::before {
    content: none;
  }
}
</style>
