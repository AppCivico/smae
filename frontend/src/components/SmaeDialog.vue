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

const emit = defineEmits(['close']);

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
  titulo: {
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
  router.replace({ query });
  emit('close');
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
    <dialog
      v-if="dialogoEstaAberto"
      :id="`smae-dialog-${props.id}`"
      ref="dialogRef"
      :class="{ 'editModal--tamanho-ajustavel': tamanhoAjustavel }"
      v-bind="$attrs"
      @click.self="acionarFechamento"
      @cancel.prevent="acionarFechamento"
    >
      <TituloDaPagina>
        <slot name="titulo">
          {{ titulo }}
        </slot>

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
      </TituloDaPagina>

      <slot />
    </dialog>
  </Teleport>
</template>
<style lang="less" scoped>
.largura-total {
  width: 100% !important;
  max-width: none !important;
}

.botao-fechar-dialogo {
  aspect-ratio: 1;
}
</style>
