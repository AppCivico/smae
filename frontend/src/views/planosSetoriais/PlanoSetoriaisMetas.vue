<script setup>
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { storeToRefs } from 'pinia';
import { defineOptions } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({
  inheritAttrs: false,
});

const route = useRoute();

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe);
const { emFoco, erros } = storeToRefs(planosSetoriaisStore);
</script>
<template>
  <ErrorComponent
    v-if="erros.emFoco"
    class="fb100 mb1"
  >
    {{ erros.emFoco }}
  </ErrorComponent>

  <!-- Usando slots porque as rotas dessa parte sobrescrevem as `props` -->
  <!-- Esperando o id porque há cargas síncronas no template `SingleMeta.vue` -->
  <router-view
    v-if="planosSetoriaisStore.emFoco?.id"
    v-slot="{ Component }"
  >
    <component :is="Component">
      <template #icone>
        <img
          v-if="emFoco?.logo"
          class="título-da-página__ícone"
          :src="`${baseUrl}/download/${emFoco.logo}?inline=true`"
          width="100"
        >
      </template>
    </component>
  </router-view>
</template>
