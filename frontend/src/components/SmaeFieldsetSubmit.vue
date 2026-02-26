<script lang="ts" setup>
import {
  nextTick, onBeforeUnmount, onMounted, useTemplateRef,
} from 'vue';

import isValidHtmlTag from '@/helpers/isValidHtmlTag';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  as: {
    type: String,
    default: 'fieldset',
    validator: (val: string) => isValidHtmlTag(val),
  },
  estaCarregando: {
    type: Boolean,
    default: false,
  },
  erros: {
    type: Object,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
    validator: (val: boolean) => {
      if (import.meta.env.DEV && val) {
        // eslint-disable-next-line no-console
        console.warn('[SmaeFieldsetSubmit] Prefira `aria-disabled` a `disabled`: o atributo `disabled` impede o foco no botão.');
      }
      return true;
    },
  },
  ariaDisabled: {
    type: Boolean,
    default: false,
  },
  removerLinhasDecoracao: {
    type: Boolean,
    default: false,
  },
  rotulo: {
    type: String,
    default: 'Salvar',
  },
});

const raizEl = useTemplateRef<HTMLElement>('raizEl');
let form: HTMLFormElement | null = null;

function rolarParaPrimeiroCampoComErro() {
  if (!props.erros || !form) return;

  const nomesComErro = new Set(Object.keys(props.erros));
  const elemento = Array.from(form.elements)
    .find((el): el is HTMLElement => nomesComErro.has((el as HTMLInputElement).name)) ?? null;

  if (elemento) {
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elemento.focus();
    elemento.classList.add('focus-visible');
    setTimeout(() => elemento.classList.remove('focus-visible'), 2000);
  }
}

async function aoSubmeter() {
  await nextTick();
  if (props.erros && Object.keys(props.erros).length) {
    rolarParaPrimeiroCampoComErro();
  }
}

onMounted(() => {
  form = raizEl.value?.closest('form') ?? null;
  if (form) {
    form.addEventListener('submit', aoSubmeter);
  }
});

onBeforeUnmount(() => {
  if (form) {
    form.removeEventListener('submit', aoSubmeter);
  }
});
</script>

<template>
  <FormErrorsList
    v-if="$props.erros"
    :errors="$props.erros"
    class="mb1"
  />

  <component
    :is="as"
    ref="raizEl"
    v-bind="$attrs"
    class="smae-fieldset-submit flex center g2"
    :class="{ 'smae-fieldset-submit--remover-linhas-decoracao': $props.removerLinhasDecoracao }"
  >
    <slot>
      <button
        class="btn big"
        type="submit"
        :aria-disabled="$props.disabled
          || ($props.erros && !!Object.keys($props.erros).length)
          || $props.ariaDisabled"
        :aria-busy="$props.estaCarregando"
        :disabled="$props.disabled"
      >
        {{ $props.rotulo }}
      </button>
    </slot>
  </component>
</template>

<style lang="less" scoped>
.smae-fieldset-submit {
  display: flex;
  justify-content: center;

  &::before, &::after {
    flex-grow: 1;
    content: '';
    height: 1.5px;
    background-color: @c100;
  }

  fieldset + & {
    border-top: 0;
  }
}

.smae-fieldset-submit--remover-linhas-decoracao {
  border-top: 0 !important;

  &::before, &::after {
    content: initial;
  }
}
</style>
