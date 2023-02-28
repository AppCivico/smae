<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Processos' }}</h1>
    <hr class="ml2 f1">
  </div>
</template>
