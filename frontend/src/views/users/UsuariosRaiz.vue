<script lang="ts" setup>
import { useOrgansStore } from '@/stores/organs.store';
import { storeToRefs } from 'pinia';

const organsStore = useOrgansStore();

const { organs } = storeToRefs(organsStore);

if (!(organs.value as [])?.length && !(organs.value as { loading: boolean })?.loading) {
  organsStore.getAll();
}
</script>
<template>
  <RouterView />
</template>
