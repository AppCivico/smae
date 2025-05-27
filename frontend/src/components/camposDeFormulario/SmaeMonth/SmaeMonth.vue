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

const mesesDoAno = [
  { valor: '01', nome: 'Janeiro' },
  { valor: '02', nome: 'Fevereiro' },
  { valor: '03', nome: 'Março' },
  { valor: '04', nome: 'Abril' },
  { valor: '05', nome: 'Maio' },
  { valor: '06', nome: 'Junho' },
  { valor: '07', nome: 'Julho' },
  { valor: '08', nome: 'Agosto' },
  { valor: '09', nome: 'Setembro' },
  { valor: '10', nome: 'Outubro' },
  { valor: '11', nome: 'Novembro' },
  { valor: '12', nome: 'Dezembro' },
];

const navegadorSuportaInputMonth = (() => {
  const input = document.createElement('input');
  input.setAttribute('type', 'month');
  return input.type === 'month';
})();

const props = defineProps({
  type: {
    type: String,
    default: 'month',
    validator: (value: string) => ['month', 'text', 'composto'].includes(value),
  },
  name: {
    type: String,
    default: undefined,
  },
  separador: {
    type: String,
    default: '-',
  },
  diaPrefixo: {
    type: String,
    default: undefined,
  },
  modelValue: {
    type: String,
    default: undefined,
  },
});
const emit = defineEmits<Emits>();

let setValue: (value: unknown) => void | undefined;

const localValue = ref<string>('');
const valorExibicao = computed(() => localValue.value.replace(props.separador, '/'));
const tipoParaExibir = computed(() => {
  if (navegadorSuportaInputMonth && props.type === 'month') {
    return 'month';
  }
  if (props.type === 'composto') {
    return 'composto';
  }
  return 'text';
});

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
