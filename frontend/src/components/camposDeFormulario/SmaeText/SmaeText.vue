<script lang="ts" setup>
import { useField } from 'vee-validate';
import { computed, toRef } from 'vue';
import type { Test } from 'yup/lib/util/createValidation.d.ts';
import buscarDadosDoYup from '../helpers/buscarDadosDoYup';
import SmaeTextProps from './SmaeTextProps';

defineOptions({
  inheritAttrs: false,
});

const emit = defineEmits(['update:modelValue']);
const props = defineProps(SmaeTextProps);

const { handleChange } = useField(toRef(props, 'name'), undefined, {
  initialValue: props.modelValue,
});

function emitValue(e: Event, trim = false) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
  let valorFinal: string | null = trim
    ? target?.value?.trim()
    : target?.value;

  if (props.modelModifiers.anular || props.anularVazio) {
    if (valorFinal === '') {
      valorFinal = null;
    }
  }

  handleChange(valorFinal);

  emit('update:modelValue', valorFinal);
}

const max = computed(() => {
  if (props.maxlength) {
    return Number(props.maxlength);
  }

  if (props.maxLength) {
    return Number(props.maxLength);
  }

  if (props.schema) {
    const dados = buscarDadosDoYup(props.schema, props.name);

    if (Array.isArray(dados.tests)) {
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
    case max.value && ((props.modelValue?.length || 0) / max.value) > 0.9:
      return 'smae-text--com-contador smae-text--falta-pouco';
    case max.value && (props.modelValue?.length ?? 0) / max.value > 0.75:
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
      :value="props.modelValue"
      class="smae-text__campo smae-text__campo--textarea inputtext light"
      :name="$props.name"
      data-test="campo"
      :maxlength="max"
      @input="emitValue"
      @change="emitValue($event, true)"
    />

    <input
      v-else
      v-bind="$attrs"
      :id="$attrs.id as string || $props.name"
      :value="props.modelValue"
      class="smae-text__campo smae-text__campo--text inputtext light"
      :class="classeDeCondicao"
      :name="$props.name"
      type="text"
      data-test="campo"
      :maxlength="max"
      @input="emitValue"
      @change="emitValue($event, true)"
    >
    <span
      v-if="!$props.esconderLimitador && max"
      class="smae-text__contagem-de-caracteres"
    >
      <output
        class="smae-text__total-de-caracteres"
        data-test="total-de-caracteres"
        :for="$attrs.id as string || $props.name"
      >{{ props.modelValue ? String(props.modelValue).length : 0 }}</output>
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
