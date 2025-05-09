<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';

const alertStore = useAlertStore();
const { alertas, estaCarregando } = storeToRefs(alertStore);

async function callbackFn(i) {
  await alertas.value[i].callback();

  alertas.value.splice(i, 1);
}
</script>
<template>
  <Teleport
    to="body"
  >
    <div
      v-for="(alert, i) in alertas"
      :key="i"
      class="alert-wrap"
    >
      <div
        class="overlay"
        @click="['alert-danger', 'alert-success'].indexOf(alert.type) > -1
          ? alertas.splice(i, 1)
          : null"
      />
      <div
        class="alert"
        :class="alert.type"
        :aria-busy="estaCarregando"
      >
        <div
          class="mr2"
        >
          {{ alert.message }}
        </div>
        <template v-if="alert.type == 'confirmAction'">
          <button
            type="button"
            class="btn amarelo mr1"
            @click="callbackFn(i)"
          >
            {{ alert.label }}
          </button>
          <button
            class="btn outline bgnone tcamarelo"
            @click="alert.fallback ? alert.fallback() : alertas.splice(i, 1)"
          >
            Cancelar
          </button>
        </template>
        <template v-else-if="alert.type == 'confirm'">
          <router-link
            v-if="typeof alert.url == 'string'"
            :to="alert.url"
            class="btn amarelo mr1"
            @click="alertas.splice(i, 1)"
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
            @click="alertas.splice(i, 1)"
          >
            Cancelar
          </button>
        </template>
        <button
          v-else
          v-focus
          type="button"
          class="btn amarelo"
          @click="alertas.splice(i, 1)"
        >
          OK
        </button>
      </div>
    </div>
  </Teleport>
</template>
