<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import {
  computed,
  nextTick,
  ref,
  watch,
} from 'vue';

const alertStore = useAlertStore();
const { alertas, estaCarregando } = storeToRefs(alertStore);

// desabilitar Teleport para testes porque os recursos do Vue Test Utils não
// funcionam quando abrimos múltiplos diálogos consecutivos
const isTestEnv = import.meta.env.MODE === 'test';

const dialogos = ref([]);

const ultimoDialogo = computed(() => dialogos.value[dialogos.value.length - 1]);

async function fecharAlerta(i) {
  if (dialogos.value[i]) {
    if (typeof dialogos.value[i].close === 'function' && dialogos.value[i].open) {
      dialogos.value[i].close();
    }

    await nextTick();

    alertas.value.splice(i, 1);
  }
}

async function callbackFn(i) {
  if (typeof alertas.value[i]?.callback === 'function') {
    await alertas.value[i].callback();
  }

  fecharAlerta(i);
}

async function fallbackFn(i) {
  if (typeof alertas.value[i]?.fallback === 'function') {
    alertas.value[i].fallback();
  }

  fecharAlerta(i);
}

watch(ultimoDialogo, (novoDialogo) => {
  if (novoDialogo) {
    nextTick().then(() => {
      if (novoDialogo instanceof HTMLDialogElement && !novoDialogo.open) {
        novoDialogo.showModal();
      }
    });
  }
}, { immediate: true });
</script>
<template>
  <Teleport
    :disabled="isTestEnv"
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
          ? fecharAlerta(i)
          : null"
      />
      <dialog
        ref="dialogos"
        class="alert"
        :class="alert.type"
        :aria-busy="estaCarregando"
        @close="fecharAlerta(i)"
      >
        <div
          class="mr2"
          data-test="mensagem"
        >
          {{ alert.message }}
        </div>
        <template v-if="alert.type === 'confirmAction'">
          <pre>{{ alert.fallback }}</pre>

          <button
            v-focus
            type="button"
            class="btn amarelo mr1"
            data-test="aceite"
            @click="callbackFn(i)"
          >
            {{ alert.label }}
          </button>
          <button
            type="button"
            class="btn outline bgnone tcamarelo"
            data-test="escape"
            @click="fallbackFn(i)"
          >
            Cancelar
          </button>
        </template>
        <template v-else-if="alert.type === 'confirm'">
          <router-link
            v-if="typeof alert.url === 'string'"
            v-focus
            :to="alert.url"
            class="btn amarelo mr1"
            data-test="aceite"
            @click="fecharAlerta(i)"
          >
            Sair sem salvar
          </router-link>
          <button
            v-else
            v-focus
            type="button"
            class="btn amarelo mr1"
            data-test="aceite"
            @click="alert.url(); fecharAlerta(i);"
          >
            Sair sem salvar
          </button>
          <button
            class="btn amarelo outline"
            data-test="escape"
            @click="fecharAlerta(i)"
          >
            Cancelar
          </button>
        </template>
        <button
          v-else
          v-focus
          type="button"
          class="btn amarelo"
          data-test="aceite"
          @click="fecharAlerta(i)"
        >
          OK
        </button>
      </dialog>
    </div>
  </Teleport>
</template>
<style scoped lang="less">
.backdrop() {
  background-color: fade(@c50, 75%);
}

.alert-wrap {
  padding: 1rem;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.overlay {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  .backdrop();
}

@supports selector(::backdrop) {
  .overlay {
    display: none;
  }
}

dialog {
  position: relative;
  background: @primary;
  color: @branco;
  padding: 2rem;
  border-radius: 8px;
  border-width: 2px;
  box-shadow: 0px 8px 16px rgba(21, 39, 65, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1em;
  max-width: 100%;
  white-space: pre-wrap;

  opacity: 0;
  transform: scaleY(0);
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out,
    overlay 0.3s ease-out allow-discrete,
    display 0.3s ease-out allow-discrete;
}

[aria-busy="true"] {
  animation: none;
}

/* Open state of the dialog  */
dialog[open] {
  opacity: 1;
  transform: scaleY(1);
}

/* Before open state  */
/* Needs to be after the previous dialog[open] rule to take effect,
    as the specificity is the same */
@starting-style {
  dialog[open] {
    opacity: 0;
    transform: scaleY(0);
  }
}

/* Transition the :backdrop when the dialog modal is promoted to the top layer */
dialog::backdrop {
  .backdrop();

  transition:
    display 0.3s allow-discrete,
    overlay 0.3s allow-discrete,
    background-color 0.3s;
}

dialog[open]::backdrop {
  .backdrop();
}

@starting-style {
  dialog[open]::backdrop {
    .backdrop();
  }
}
</style>
