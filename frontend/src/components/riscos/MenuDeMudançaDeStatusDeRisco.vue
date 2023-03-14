<script setup>
import statuses from '@/consts/riskStatuses';
import arrayToValueAndLabel from '@/helpers/arrayToValueAndLabel';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { storeToRefs } from 'pinia';

const listaDeStatuses = arrayToValueAndLabel(statuses);

const riscosStore = useRiscosStore();
const {
  chamadasPendentes,
  emFoco,
} = storeToRefs(riscosStore);

async function mudarStatus(id, status) {
  const resposta = await riscosStore.salvarItem({ status }, id);
  if (resposta) {
    riscosStore.buscarItem(id);
  }
}
</script>
<template>
  <div class="ml2 dropbtn">
    <span class="btn">Mudar status</span>
    <ul>
      <li
        v-for="item in listaDeStatuses"
        :key="item.valor"
      >
        <button
          type="button"
          class="like-a__link"
          :disabled="chamadasPendentes.mudarStatus"

          @click="mudarStatus(emFoco.id, item.valor)"
        >
          {{ item.etiqueta }}
        </button>
      </li>
    </ul>
  </div>
</template>
