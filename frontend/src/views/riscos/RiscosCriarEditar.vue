<script setup>
import CheckClose from '@/components/CheckClose.vue';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { storeToRefs } from 'pinia';

const riscosStore = useRiscosStore();

const {
  chamadasPendentes,
  emFoco,
  erro,
} = storeToRefs(riscosStore);

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
  riscoId: {
    type: Number,
    default: 0,
  },
});

async function iniciar() {
  // apenas porque alguma risco nova pode ter sido criada por outra pessoa
  riscosStore.buscarTudo();
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="riscoId"
        class="t12 uc w700 tamarelo"
      >
        {{ $route?.meta?.título || 'Editar risco' }}
      </div>
      {{ emFoco?.risco || (riscoId ? 'Risco' : 'Nova risco') }}
    </h1>
    <hr class="ml2 f1">

    <CheckClose />
  </div>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
