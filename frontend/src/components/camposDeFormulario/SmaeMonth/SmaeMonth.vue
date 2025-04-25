<script lang="ts" setup>
import { format } from 'date-fns';
import { computed, ref, watch } from 'vue';

type Props = {
  separador?: string
  diaPrefixo?: string
  modelValue?: string | Date
};
type Emits = {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
};

const props = withDefaults(defineProps<Props>(), {
  separador: '-',
  diaPrefixo: undefined,
  modelValue: undefined,
});
const emit = defineEmits<Emits>();

const localValue = ref<string>('');
const valorExibicao = computed(() => localValue.value.replace(props.separador, '/'));

function obterMascara(valor: string) {
  if (!valor) {
    return valor;
  }

  let valorEmAndamento = valor.replace(/\D/g, ''); // remove tudo que não for número
  if (valorEmAndamento.length > 6) {
    valorEmAndamento = valorEmAndamento.slice(0, 6); // limita a 6 dígitos
  }

  if (valorEmAndamento.length > 2) {
    valorEmAndamento = [
      valorEmAndamento.slice(0, 2),
      valorEmAndamento.slice(2),
    ].join(props.separador);
  }

  return valorEmAndamento;
}

function handleInput(el: Event) {
  let value = el.target?.value || '';

  value = value.replace(/[a-zA-Z]/g, '');

  if (value.length > 7) {
    value = value.slice(0, 7);
  }

  el.target.value = value;

  localValue.value = obterMascara(value);
}

function handleAbandonarElemento() {
  if (localValue.value) {
    localValue.value = obterMascara(localValue.value.padEnd(7, '0'));
  }
}

function prepararValorExterno() {
  if (!props.modelValue) {
    return;
  }

  if (props.modelValue instanceof Date) {
    const dataFormatada = format(props.modelValue, `MM${props.separador}yyyy`);

    localValue.value = dataFormatada;
    return;
  }

  localValue.value = obterMascara(props.modelValue);
}

watch(() => props.modelValue, () => {
  prepararValorExterno();
}, { immediate: true });

watch(localValue, (val) => {
  let data = val;
  if (props.diaPrefixo) {
    data = [props.diaPrefixo.padStart(2, '0'), data].join(props.separador);
  }

  emit('change', data);
  emit('update:modelValue', data);
}, { immediate: true });

</script>

<template>
  <input
    class="inputtext"
    :value="valorExibicao"
    @input="handleInput"
    @blur="handleAbandonarElemento"
  >
</template>
