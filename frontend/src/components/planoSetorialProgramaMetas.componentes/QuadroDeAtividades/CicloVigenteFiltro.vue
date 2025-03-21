<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const selecionado = ref(false);

function handleFiltrar() {
  const query = {
    ...route.query,
    apenas_pendentes: selecionado.value.toString(),
  };

  router.replace({ query });
}

watch(selecionado, () => handleFiltrar());

onMounted(() => {
  selecionado.value = !!route.query.apenas_pendentes;
});
</script>

<template>
  <div class="ciclo-vigente-filtro">
    <label class="flex g05 center">
      <span
        :class="[
          'ciclo-vigente-filtro__texto',
          { 'ciclo-vigente-filtro__texto--selecionado': !selecionado }
        ]"
      >
        Exibir todas
      </span>

      <input
        v-model="selecionado"
        type="checkbox"
        class="interruptor mr05 ml05"
      >

      <span
        :class="[
          'ciclo-vigente-filtro__texto',
          { 'ciclo-vigente-filtro__texto--selecionado': selecionado }
        ]"
      >
        Exibir pendentes
      </span>
    </label>
  </div>
</template>

<style lang="less" scoped>
.ciclo-vigente-filtro__texto {
  color: #C8C8C8;
}

.ciclo-vigente-filtro__texto--selecionado {
  color: @amarelo;
}
</style>
