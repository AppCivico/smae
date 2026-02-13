<script lang="ts" setup>
import { computed } from 'vue';

import SmaeStatusPillsItem from './SmaeStatusPillsItem.vue';

export interface StatusPillItem {
  valor: string;
  label: string;
  cor: string;
}

type Emits = {
  'update:modelValue': [valor: string | string[] | null];
};

type Props = {
  items: StatusPillItem[];
  modelValue: string | string[] | null;
  multiplo?: boolean;
};

const emit = defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), {
  multiplo: false,
});

const selecionados = computed<string[]>(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue;
  }

  return props.modelValue ? [props.modelValue] : [];
});

function estaSelecionado(valor: string): boolean {
  return selecionados.value.includes(valor);
}

function alternar(valor: string) {
  if (props.multiplo) {
    const novos = estaSelecionado(valor)
      ? selecionados.value.filter((v) => v !== valor)
      : [...selecionados.value, valor];
    emit('update:modelValue', novos);
  } else {
    emit('update:modelValue', estaSelecionado(valor) ? null : valor);
  }
}
</script>

<template>
  <div
    class="status-pills"
    role="group"
  >
    <SmaeStatusPillsItem
      v-for="item in items"
      :key="item.valor"
      :label="item.label"
      :cor="item.cor"
      :ativo="estaSelecionado(item.valor)"
      @click="alternar(item.valor)"
    />
  </div>
</template>

<style lang="less" scoped>
.status-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}
</style>
