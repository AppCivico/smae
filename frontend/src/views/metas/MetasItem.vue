<script setup>
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import { useMetasStore } from '@/stores/metas.store';
import { storeToRefs } from 'pinia';
import { defineOptions, onUnmounted, watch } from 'vue';

const MetasStore = useMetasStore();

const { singleMeta } = storeToRefs(MetasStore);

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  // manter compatibilidade com a definição anterior de props
  // eslint-disable-next-line vue/prop-name-casing
  meta_id: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
});

watch(() => props.meta_id, () => {
  if (singleMeta.value.id !== props.meta_id) {
    MetasStore.getById(props.meta_id);
  }
}, { immediate: true });

onUnmounted(() => {
  MetasStore.$reset();
});
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <router-view />
</template>
