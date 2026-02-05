<script setup>
// TODO: Implementar listagem de demandas
</script>

<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'demandas.criar' }"
      class="btn"
    >
      Nova Demanda
    </router-link>
  </div>

  <div class="boards">
    <p class="tc500">
      Listagem de demandas em desenvolvimento.
    </p>
  </div>
</template>
