<script setup>
import { storeToRefs } from 'pinia';
import { useAlertStore } from '@/stores/alert.store';

const alertStore = useAlertStore();
const { alert } = storeToRefs(alertStore);
async function callbackFn() {
  await alert.value.callback();

  // talvez o tipo da janela já tenha sido substituído
  if (alert.value?.type === 'confirmAction') {
    alertStore.$reset();
  }
}
</script>

<template>
  <Teleport
    v-if="alert"
    to="body"
  >
    <div
      class="alert-wrap"
    >
      <div
        class="overlay"
        @click="alertStore.clear()"
      />
      <div
        class="alert"
        :class="alert.type"
      >
        <div
          class="mr2"
        >
          {{ alert.message }}
        </div>
        <template v-if="alert.type == 'confirmAction'">
          <button
            class="btn amarelo mr1"
            @click="callbackFn"
          >
            {{ alert.label }}
          </button>
          <button
            class="btn outline bgnone tcamarelo"
            @click="alert.fallback ? alert.fallback() : alertStore.clear()"
          >
            Cancelar
          </button>
        </template>
        <template v-else-if="alert.type == 'confirm'">
          <router-link
            v-if="typeof alert.url == 'string'"
            :to="alert.url"
            class="btn amarelo mr1"
            @click="alertStore.clear()"
          >
            Sair sem salvar
          </router-link>
          <button
            v-if="typeof alert.url != 'string'"
            class="btn amarelo mr1"
            @click="alert.url"
          >
            Sair sem salvar
          </button>
          <button
            class="btn amarelo outline"
            @click="alertStore.clear()"
          >
            Cancelar
          </button>
        </template>
        <template v-else>
          <button
            class="btn amarelo"
            @click="alertStore.clear()"
          >
            OK
          </button>
        </template>
      </div>
    </div>
  </Teleport>
</template>
