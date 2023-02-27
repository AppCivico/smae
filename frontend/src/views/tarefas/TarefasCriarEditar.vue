<script setup>
import { useRouter } from 'vue-router';

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route?.meta?.título || 'Tarefa' }}</h1>
    <hr class="ml2 f1">
  </div>
</template>
