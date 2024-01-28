<script setup>
import LegendaDeTarefas from '@/components/monitoramento/LegendaDeTarefas.vue';
</script>
<template>
  <div>
    <LegendaDeTarefas class="legenda legenda--tarefas" />
  </div>
</template>
<style lang="less" scoped>
.legenda {
  margin-right: 0;
  margin-left: auto;
}

.legenda h2 {
  text-align: center;
}

.legenda--tarefas {
  max-width: 40em;
}
</style>
