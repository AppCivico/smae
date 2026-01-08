<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAlertStore } from '@/stores/alert.store';

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

const dialogRef = ref<HTMLDialogElement | null>(null);

function fecharDialogo() {
  const query = structuredClone(router.currentRoute.value.query);

  delete query.dialogo;

  props.parametrosAssociados.forEach((parametro) => {
    delete query[parametro];
  });

  if (props.confirmarFechamento) {
    alertStore.confirmAction('Deseja sair sem salvar as alterações?', router.replace({ query }));

    return;
  }

  router.replace({ query });
  emit('close');
}

onMounted(() => {
  // Abre o dialog como modal ao montar
  if (dialogRef.value) {
    dialogRef.value.showModal();
  }
});

</script>
<template>
  <Teleport
    to="#modais"
  >
    <dialog
      v-if="$route.query.dialogo === String(props.id)"
      :id="String(props.id)"
      ref="dialogRef"
      :class="{ 'editModal--tamanho-ajustavel': tamanhoAjustavel }"
      v-bind="$attrs"
      @click.self="fecharDialogo"
    >
      <TituloDaPagina>
        <slot name="titulo">
          {{ titulo }}
        </slot>

        <button
          type="button"
          class="btn round botao-fechar-dialogo"
          @click="fecharDialogo"
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
