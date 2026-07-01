<script lang="ts" setup>
import { Mask, vMaska } from 'maska';
import type { MaskaDetail } from 'maska';
import { useField } from 'vee-validate';
import {
  computed, ref, useAttrs, watch,
} from 'vue';

import SmaeCNPJCampoProps from './SmaeCNPJCampoProps';

defineOptions({
  inheritAttrs: false,
});

const emit = defineEmits(['update:modelValue']);
const props = defineProps(SmaeCNPJCampoProps);

const attrs = useAttrs();
const modoVModel = computed(() => 'onUpdate:modelValue' in attrs);

const { handleChange, value: fieldValue } = useField<string>(props.name as string, undefined, {
  initialValue: props.modelValue,
  standalone: modoVModel.value,
});

const MASCARA_CNPJ = '##.###.###/####-##';
const mascara = new Mask({ mask: MASCARA_CNPJ });

// `valorLocal` rastreia o valor (sempre limpo, sem máscara) no modo autônomo.
// No modo v-model, o pai controla o valor via `props.modelValue`.
const valorLocal = ref<string>(props.modelValue ?? '');

watch(fieldValue, (novoValor) => {
  valorLocal.value = novoValor ?? '';
}, { immediate: true });

const valorAtual = computed(() => (modoVModel.value ? props.modelValue : valorLocal.value) ?? '');

// A exibição é recalculada a partir do valor limpo usando a própria classe
// `Mask` do Maska, mantendo a formatação consistente com a digitação.
const valorExibido = computed(() => mascara.masked(valorAtual.value));

function emitValue(valorBruto: string) {
  let valorFinal: string | null = valorBruto;

  if (props.modelModifiers.anular || props.anularVazio) {
    if (valorFinal === '') {
      valorFinal = null;
    }
  }

  valorLocal.value = valorFinal ?? '';
  handleChange(valorFinal);

  emit('update:modelValue', valorFinal);
}

// O Maska dispara o evento `maska` a cada alteração, com o valor mascarado
// e o valor limpo (`unmasked`) no `detail`. Usamos o `unmasked` como valor real.
function aoDigitar(e: Event) {
  const { unmasked } = (e as CustomEvent<MaskaDetail>).detail;
  emitValue(unmasked);
}
</script>
<template>
  <input
    v-bind="$attrs"
    :id="$attrs.id as string || $props.name"
    v-maska
    :value="valorExibido"
    class="smae-cnpj-campo inputtext light"
    :name="$props.name"
    type="text"
    inputmode="numeric"
    data-test="campo"
    :data-maska="MASCARA_CNPJ"
    maxlength="18"
    @maska="aoDigitar"
  >
</template>
<style lang="less" scoped>
.smae-cnpj-campo {
  display: block;
  width: 100%;
}
</style>
