<script lang="ts" setup>
import { useEquipesStore } from '@/stores/equipes.store';
import { useOrgansStore } from '@/stores/organs.store';
import { storeToRefs } from 'pinia';
import { onUnmounted } from 'vue';
import { RouterView } from 'vue-router';

const equipesStore = useEquipesStore();
const organsStore = useOrgansStore();

const { organs } = storeToRefs(organsStore);

if (!(organs.value as [])?.length && !(organs.value as { loading: boolean })?.loading) {
  organsStore.getAll();
}

// redefinindo porque a resposta usada é diferente da padrão
equipesStore.$reset();
equipesStore.buscarTudo({ remover_participantes: true });

// limpando porque a resposta usada é diferente da padrão
onUnmounted(() => {
  equipesStore.$reset();
});
</script>
<template>
  <RouterView />
</template>
