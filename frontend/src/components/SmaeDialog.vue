<script lang="ts" setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';

import { useAlertStore } from '@/stores/alert.store';

import { useDialogRegistry } from './useDialogRegistry.composable';

defineOptions({
  inheritAttrs: false,
});

type Emits = {
  (event: 'dialogo-fechado'): void;
};

const emit = defineEmits<Emits>();

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
  titulo: {
    type: String,
    default: '',
  },
  subtitulo: {
    type: String,
    default: '',
  },
  tamanhoAjustavel: {
    type: Boolean,
    default: false,
  },
  parametrosAssociados: {
    type: Array as () => Array<string>,
    default: () => [],
  },
  confirmarFechamento: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const alertStore = useAlertStore();
const dialogRegistry = useDialogRegistry(props.id);

const dialogRef = ref<HTMLDialogElement | null>(null);

// Computed para verificar se o diálogo deve estar visível
const dialogoEstaAberto = computed(
  () => router.currentRoute.value.query.dialogo === String(props.id),
);

function limparQuery() {
  const query = structuredClone(router.currentRoute.value.query);

  delete query.dialogo;

  props.parametrosAssociados.forEach((parametro) => {
    delete query[parametro];
  });

  return query;
}

function fecharDialogo() {
  const query = limparQuery();

  dialogRef.value?.close();
  router.push({ query });
  emit('dialogo-fechado');
}

function acionarFechamento() {
  if (props.confirmarFechamento) {
    alertStore.confirmAction('Deseja sair sem salvar as alterações?', () => {
      fecharDialogo();
    });

    return;
  }

  fecharDialogo();
}

// Função para abrir o diálogo
async function abrirDialogo() {
  // Aguarda o próximo tick para garantir que o elemento foi renderizado
  await nextTick();

  if (dialogRef.value) {
    dialogRef.value.showModal();
  }
}

// Watch para abrir o diálogo quando a rota mudar
watch(
  dialogoEstaAberto,
  (estaAberto) => {
    if (estaAberto) {
      abrirDialogo();
    }
  },
  { immediate: true },
);

onMounted(() => {
  // Registra o diálogo para detectar duplicatas
  dialogRegistry.register();

  // Valida se o elemento #modais existe no DOM
  if (import.meta.env.DEV && !document.getElementById('modais')) {
    // eslint-disable-next-line no-console
    console.warn('[SmaeDialog] Elemento #modais não encontrado no DOM');
  }
});

onBeforeUnmount(() => {
  // Remove o diálogo do registro
  dialogRegistry.unregister();
});
</script>
<template>
  <Teleport
    to="#modais"
  >
    <div
      v-if="dialogoEstaAberto"
      class="smae-dialog-backdrop"
      @click="acionarFechamento"
    />

    <dialog
      v-if="dialogoEstaAberto"
      :id="`smae-dialog-${props.id}`"
      ref="dialogRef"
      closedby="any"
      class="editModal-dialog"
      :class="{ 'editModal--tamanho-ajustavel': tamanhoAjustavel }"
      v-bind="$attrs"
      @cancel.prevent="acionarFechamento"
    >
      <header
        class="mb2"
      >
        <div class="flex spacebetween center g1">
          <TituloDaPagina>
            <slot name="titulo">
              {{ titulo }}
            </slot>
          </TituloDaPagina>

          <hr class="f1" />

          <button
            type="button"
            class="btn round botao-fechar-dialogo"
            aria-label="Fechar diálogo"
            @click="acionarFechamento"
          >
            <svg
              width="12"
              height="12"
            >
              <use xlink:href="#i_x" />
            </svg>
          </button>
        </div>

        <p
          v-if="!!$props.subtitulo || !!$slots.subtitulo?.()"
          role="doc-subtitle"
          class="t12 uc w700 tamarelo"
        >
          <slot name="subtitulo">
            {{ $props.subtitulo }}
          </slot>
        </p>
      </header>

      <slot :fechar-dialogo="fecharDialogo" />
    </dialog>
  </Teleport>
</template>
<style lang="less" scoped>
.smae-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.largura-total {
  width: 100% !important;
  max-width: none !important;
}

.botao-fechar-dialogo {
  aspect-ratio: 1;
}
</style>
