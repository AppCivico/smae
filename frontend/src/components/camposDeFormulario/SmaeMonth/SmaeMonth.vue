<script lang="ts" setup>
import { format } from 'date-fns';
import { useField } from 'vee-validate';
import {
  computed, ref, watch,
} from 'vue';

type Props = {
  name?: string
  separador?: string
  diaPrefixo?: string
  modelValue?: string | Date
};
type Emits = {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
};

const props = withDefaults(defineProps<Props>(), {
  name: undefined,
  separador: '-',
  diaPrefixo: undefined,
  modelValue: undefined,
});
const emit = defineEmits<Emits>();

let setValue: (value: unknown) => void | undefined;

const localValue = ref<string>('');
const valorExibicao = computed(() => localValue.value.replace(props.separador, '/'));

function obterMascara(valor: string) {
  if (!valor) {
    return valor;
  }

  let valorEmAndamento = valor.replace(/\D/g, '').replace(props.separador, ''); // remove tudo que não for número

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

function prepararValorExterno(valorInicial?: string | Date) {
  if (!valorInicial || valorInicial === '') {
    return;
  }

  if (valorInicial instanceof Date) {
    const dataFormatada = format(valorInicial, `MM${props.separador}yyyy`);

    localValue.value = dataFormatada;
    return;
  }

  const [ano, mes] = valorInicial.split(props.separador);

  const formatoInterno = [mes, ano].join(props.separador);
  localValue.value = obterMascara(formatoInterno);
}

function formatarParaExpedicao(value: string) {
  const [dia, mes, ano] = value.split(props.separador);

  return [ano, mes, dia].join(props.separador);
}

if (props.name) {
  const { setValue: setValueField, value } = useField(props.name);
  setValue = setValueField;
  prepararValorExterno(value.value as string);
}

watch(localValue, (val) => {
  let data = val;
  if (props.diaPrefixo && val) {
    data = [props.diaPrefixo.padStart(2, '0'), data].join(props.separador);
  }

  data = formatarParaExpedicao(data);

  emit('change', data);
  emit('update:modelValue', data);
  if (props.name && setValue) {
    setValue(data);
  }
});

watch(() => props.modelValue, () => {
  prepararValorExterno(props.modelValue);
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
