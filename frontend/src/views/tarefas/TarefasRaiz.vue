<script setup>
import { onUnmounted } from 'vue';

import { useTarefasStore } from '@/stores/tarefas.store.ts';

// Não repassar os `$attrs` ao `<router-view>`: a rota envia todos os parâmetros da
// URL, inclusive os das rotas filhas, e nenhum é declarado aqui. Se herdados, eles
// chegariam à rota filha por cima das props que ela mesma calcula; por exemplo, o
// `TarefasItem` receberia `tarefaId` como string, e não como o número que a rota
// dele entrega. Cada rota filha já recebe os parâmetros pelas próprias `props`.
defineOptions({ inheritAttrs: false });

const tarefasStore = useTarefasStore();

onUnmounted(() => { tarefasStore.$reset(); });
</script>
<template>
  <router-view />
</template>
