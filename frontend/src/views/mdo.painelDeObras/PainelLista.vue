<script setup>

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Painéis de obras' }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{name: 'paineisCriar'}"
      class="btn big ml1"
    >
      Novo painel
    </router-link>
  </div>
</template>
