<script lang="ts" setup>
/**
 * SmaeText.vue
 * Componente de entrada de texto com contador de caracteres.
 * Permite personalização através de props e integração com VeeValidate.
 *
 * Suporta três modos de uso:
 *
 * - **Modo autônomo** (padrão): basta passar `name` (e opcionalmente `:schema`).
 *   O componente se registra automaticamente no form via `useField`.
 * - **Modo Field v-slot**: o pai usa `<Field v-slot>` e passa `:model-value` e
 *   `@update:model-value`. O `useField` interno fica em modo `standalone` para
 *   evitar registro duplo no form.
 * - **Modo v-model**: igual ao modo Field v-slot, mas sem o wrapper `<Field>`.
 *   Útil fora de um `<Form>` ou `useForm`.
 *
 * @example
 * ```vue
 * <!-- Modo autônomo: integrado ao form via useField interno -->
 * <SmaeText
 *  name="mdo_observacoes"
 *  as="textarea"
 *  rows="5"
 *  class="inputtext light mb1"
 *  :schema="schema"
 *  anular-vazio
 * />
 * ```
 *
 * @example
 * ```vue
 * <!-- Modo Field v-slot: registro no form controlado pelo Field pai -->
 * <Field v-slot="{ field, handleChange, value }" name="mdo_observacoes">
 *   <SmaeText
 *    name="mdo_observacoes"
 *    as="textarea"
 *    rows="5"
 *    class="inputtext light mb1"
 *    :schema="schema"
 *    :model-value="value"
 *    anular-vazio
 *    @update:model-value="handleChange"
 *   />
 * </Field>
 * ```
 *
 * @example
 * ```vue
 * <!-- Modo v-model: controlado pelo pai, sem VeeValidate -->
 * <SmaeText
 *  name="mdo_observacoes"
 *  as="textarea"
 *  rows="5"
 *  class="inputtext light mb1"
 *  v-model="mdo_observacoes"
 *  anular-vazio
 * />
 * ```
 */
import { useField } from 'vee-validate';
import {
  computed, ref, useAttrs, watch,
} from 'vue';
import type { Test } from 'yup/lib/util/createValidation.d.ts';

import buscarDadosDoYup from '../helpers/buscarDadosDoYup';
import SmaeTextProps from './SmaeTextProps';

defineOptions({
  inheritAttrs: false,
});

const emit = defineEmits(['update:modelValue']);
const props = defineProps(SmaeTextProps);

const attrs = useAttrs();
const modoVModel = computed(() => 'onUpdate:modelValue' in attrs);

const { handleChange, value: fieldValue } = useField<string>(props.name as string, undefined, {
  initialValue: props.modelValue,
  standalone: modoVModel.value,
});

// `valorLocal` rastreia o valor no modo autônomo. Necessário porque `fieldValue`
// do VeeValidate pode não ser reativo fora de um contexto de `<Form>` ou `useForm`.
// No modo v-model, o pai controla o valor via `props.modelValue`.
const valorLocal = ref<string | null>(props.modelValue ?? '');

// Quando o VeeValidate atualiza `fieldValue` externamente (ex.: `setFieldValue`),
// mantemos `valorLocal` sincronizado.
watch(fieldValue, (novoValor) => {
  valorLocal.value = novoValor ?? '';
});

const valorAtual = computed(() => (modoVModel.value ? props.modelValue : valorLocal.value));

function emitValue(e: Event) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
  let valorFinal: string | null = target?.value;

  if (props.modelModifiers.anular || props.anularVazio) {
    if (valorFinal === '') {
      valorFinal = null;
    }
  }

  valorLocal.value = valorFinal;
  handleChange(valorFinal);

  emit('update:modelValue', valorFinal);
}

function emitValueComTrim() {
  let valorFinal: string | null = (valorLocal.value ?? '').trim();

  if (props.modelModifiers.anular || props.anularVazio) {
    if (valorFinal === '') {
      valorFinal = null;
    }
  }

  valorLocal.value = valorFinal;
  handleChange(valorFinal);

  emit('update:modelValue', valorFinal);
}

const max = computed(() => {
  if (import.meta.env.DEV && (props.maxlength || props.maxLength)) {
    console.warn(
      `[SmaeText] Evite usar "maxlength" ou "maxLength" no campo "${props.name}". `
      + 'Prefira usar ":schema" para que o componente extraia o limite automaticamente do schema Yup. '
      + 'Isso evita duplicação de lógica e garante consistência.',
    );
  }

  if (props.maxlength) {
    return Number(props.maxlength);
  }

  if (props.maxLength) {
    return Number(props.maxLength);
  }

  if (props.schema && props.name) {
    const dados = buscarDadosDoYup(props.schema, props.name);

    if (Array.isArray(dados?.tests)) {
      const maxTest = dados.tests.find((test: Test) => test.OPTIONS.name === 'max');

      if (maxTest) {
        return maxTest.OPTIONS.params?.max;
      }
    }
  }

  return 0;
});

const classeDeCondicao = computed(() => {
  switch (true) {
    case max.value && ((valorAtual.value?.length || 0) / max.value) > 0.9:
      return 'smae-text--com-contador smae-text--falta-pouco';
    case max.value && (valorAtual.value?.length ?? 0) / max.value > 0.75:
      return 'smae-text--com-contador smae-text--falta-muito';
    default:
      return 'smae-text--com-contador';
  }
});
</script>
<template>
  <div
    class="smae-text"
    :class="classeDeCondicao"
    v-bind="atributosDaRaiz"
  >
    <textarea
      v-if="$props.as === 'textarea'"
      v-bind="$attrs"
      :id="$attrs.id as string || $props.name"
      :value="valorAtual"
      class="smae-text__campo smae-text__campo--textarea inputtext light"
      :name="$props.name"
      data-test="campo"
      :maxlength="max"
      @input="emitValue"
      @change="emitValueComTrim"
    />

    <input
      v-else
      v-bind="$attrs"
      :id="$attrs.id as string || $props.name"
      :value="valorAtual"
      class="smae-text__campo smae-text__campo--text inputtext light"
      :class="classeDeCondicao"
      :name="$props.name"
      type="text"
      data-test="campo"
      :maxlength="max"
      @input="emitValue"
      @change="emitValueComTrim"
    >
    <span
      v-if="!$props.esconderContador && max"
      class="smae-text__contagem-de-caracteres"
    >
      <output
        class="smae-text__total-de-caracteres"
        data-test="total-de-caracteres"
        :for="$attrs.id as string || $props.name"
      >{{ valorAtual ? String(valorAtual).length : 0 }}</output>
      /
      <span
        class="smae-text__maximo-de-caracteres"
        data-test="maximo-de-caracteres"
      >{{ max }}</span>
    </span>
  </div>
</template>
<style lang="less" scoped>
.smae-text {}

.smae-text--com-contador {
  position: relative;
}

.smae-text--falta-muito {}
.smae-text--falta-pouco {}

.smae-text__campo {
  display: block;
  width: 100%;
}

.smae-text__campo--textarea {
  resize: vertical;

  .smae-text--com-contador > & {
    padding-bottom: 1.5em;
  }
}

.smae-text__campo--text {
  .smae-text--com-contador > & {
    padding-right: 6em;
  }
}

.smae-text__contagem-de-caracteres {
  position: absolute;
  right: 1.2em;
  line-height: 1;
  pointer-events: none;
  font-size: smaller;
  color: @c600;
  opacity: .65;

  .smae-text__campo--text + & {
    line-height: 1.5;
    top: 50%;
    transform: translateY(-50%);
  }

  .smae-text__campo--textarea + & {
    bottom: .75em;
  }

  :focus + & {
    opacity: 1;
  }
}

.smae-text__total-de-caracteres,
.smae-text__maximo-de-caracteres {}

.smae-text__total-de-caracteres {
  color: @verde--escuro;

  .smae-text--falta-muito & {
    color: @laranja;
  }

  .smae-text--falta-pouco & {
    color: @vermelho;
  }
}

.smae-text__maximo-de-caracteres {
}
</style>
