<script setup lang="ts">
import { useField } from 'vee-validate';
import {
  computed, ref, watch, nextTick, onMounted,
} from 'vue';

import dinheiro from '@/helpers/dinheiro';
import toFloat from '@/helpers/toFloat';

interface Props {
  nameMin: string;
  nameMax: string;
  min: number;
  max: number;
  step?: number | null;
  formatarMoeda?: boolean;
  precision?: number;
  mostrarInputs?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  step: null,
  formatarMoeda: true,
  precision: 3,
  mostrarInputs: false,
});

const stepCalculado = computed<number>(() => {
  if (props.step !== null && props.step !== undefined) {
    return props.step;
  }
  return 0.01;
});

const { value: valorMin, setValue: setMin } = useField<number | string | null>(() => props.nameMin);
const { value: valorMax, setValue: setMax } = useField<number | string | null>(() => props.nameMax);

const inputMinRef = ref<HTMLInputElement | null>(null);
const inputMaxRef = ref<HTMLInputElement | null>(null);
const ready = ref<boolean>(false);

const sliderMin = ref<number>(
  valorMin.value !== undefined && valorMin.value !== null && valorMin.value !== ''
    ? parseFloat(String(valorMin.value))
    : props.min,
);

const sliderMax = ref<number>(
  valorMax.value !== undefined && valorMax.value !== null && valorMax.value !== ''
    ? parseFloat(String(valorMax.value))
    : props.max,
);

if (valorMin.value === undefined || valorMin.value === null || valorMin.value === '') {
  setMin(sliderMin.value);
}
if (valorMax.value === undefined || valorMax.value === null || valorMax.value === '') {
  setMax(sliderMax.value);
}

const thumbWidth = 20;
const thumbWidthVar = `${thumbWidth}px`;

type RoundingMethod = 'ceil' | 'floor';

function updateRanges(method: RoundingMethod = 'ceil'): void {
  if (!inputMinRef.value || !inputMaxRef.value) return;

  const { min } = props;
  const { max } = props;
  const step = stepCalculado.value;
  const minValue = sliderMin.value;
  const maxValue = sliderMax.value;

  const midValue = (maxValue - minValue) / 2;
  let mid = minValue + Math[method](midValue / step) * step;

  mid = Math.max(minValue, Math.min(maxValue, mid));

  const range = max - min;

  // Quando range é 0 (min === max), cria um range artificial para renderização
  if (range === 0) {
    // Cria um range artificial de ±1 ao redor do valor único
    const artificialMin = min - 1;
    const artificialMax = max + 1;
    const artificialMid = min; // O meio é o valor único

    inputMinRef.value.style.flexBasis = `calc(50% + ${thumbWidthVar})`;
    inputMinRef.value.min = artificialMin.toString();
    inputMinRef.value.max = artificialMid.toString();

    inputMaxRef.value.style.flexBasis = `calc(50% + ${thumbWidthVar})`;
    inputMaxRef.value.min = artificialMid.toString();
    inputMaxRef.value.max = artificialMax.toString();

    // Ambos os thumbs ficam no final de seus ranges (100%)
    inputMinRef.value.style.setProperty('--gradient-position', `calc(100% + (-0.5 * ${thumbWidthVar}))`);
    inputMaxRef.value.style.setProperty('--gradient-position', `calc(0% + (0.5 * ${thumbWidthVar}))`);
    return;
  }

  // Cálculo normal: divide o range baseado no ponto médio
  const leftWidthPercent = (((mid - min) / range) * 100).toFixed(props.precision);
  const rightWidthPercent = (((max - mid) / range) * 100).toFixed(props.precision);

  inputMinRef.value.style.flexBasis = `calc(${leftWidthPercent}% + ${thumbWidthVar})`;
  inputMinRef.value.min = min.toString();
  inputMinRef.value.max = mid.toFixed(props.precision);

  inputMaxRef.value.style.flexBasis = `calc(${rightWidthPercent}% + ${thumbWidthVar})`;
  inputMaxRef.value.min = mid.toFixed(props.precision);
  inputMaxRef.value.max = max.toString();

  const minRange = mid - min;
  const maxRange = max - mid;

  const minFill = (minValue - min) / minRange || 0;
  const maxFill = (maxValue - mid) / maxRange || 0;

  const minFillPercentage = (minFill * 100).toFixed(props.precision);
  const maxFillPercentage = (maxFill * 100).toFixed(props.precision);

  const minFillThumb = (0.5 - minFill).toFixed(props.precision);
  const maxFillThumb = (0.5 - maxFill).toFixed(props.precision);

  inputMinRef.value.style.setProperty(
    '--gradient-position',
    `calc(${minFillPercentage}% + (${minFillThumb} * ${thumbWidthVar}))`,
  );

  inputMaxRef.value.style.setProperty(
    '--gradient-position',
    `calc(${maxFillPercentage}% + (${maxFillThumb} * ${thumbWidthVar}))`,
  );
}

function atualizarMin(event: Event): void {
  const target = event.target as HTMLInputElement;
  const novo = parseFloat(target.value);
  sliderMin.value = novo;
  setMin(novo);
  updateRanges('ceil');
}

function atualizarMax(event: Event): void {
  const target = event.target as HTMLInputElement;
  const novo = parseFloat(target.value);
  sliderMax.value = novo;
  setMax(novo);
  updateRanges('floor');
}

function handleMinFocus(): void {
  updateRanges('ceil');
}

function handleMaxFocus(): void {
  updateRanges('floor');
}

const inputMinValue = ref<string>('');
const inputMaxValue = ref<string>('');

function formatarParaInput(valor: number): string {
  if (props.formatarMoeda) {
    return dinheiro(valor, { style: 'decimal' });
  }
  return valor.toString();
}

watch(() => props.min, (): void => {
  updateRanges('ceil');
});

watch(() => props.max, (): void => {
  updateRanges('ceil');
});

watch(valorMin, (novo: number | string | null | undefined): void => {
  if (novo !== undefined && novo !== null && novo !== '') {
    const valor = parseFloat(String(novo));
    if (valor !== sliderMin.value) {
      sliderMin.value = valor;
      updateRanges('ceil');
    }
  }
});

watch(valorMax, (novo: number | string | null | undefined): void => {
  if (novo !== undefined && novo !== null && novo !== '') {
    const valor = parseFloat(String(novo));
    if (valor !== sliderMax.value) {
      sliderMax.value = valor;
      updateRanges('floor');
    }
  }
});

watch(sliderMin, (valor: number): void => {
  inputMinValue.value = formatarParaInput(valor);
});

watch(sliderMax, (valor: number): void => {
  inputMaxValue.value = formatarParaInput(valor);
});

onMounted(async (): Promise<void> => {
  await nextTick();

  if (inputMinRef.value && inputMaxRef.value) {
    inputMinRef.value.min = props.min.toString();
    inputMinRef.value.max = props.max.toString();
    inputMaxRef.value.min = props.min.toString();
    inputMaxRef.value.max = props.max.toString();
  }
  inputMinValue.value = formatarParaInput(sliderMin.value);
  inputMaxValue.value = formatarParaInput(sliderMax.value);

  updateRanges('ceil');
  ready.value = true;
});

function atualizarMinViaInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  const valorString = target.value;
  const valor = toFloat(valorString);

  if (!Number.isNaN(valor)) {
    sliderMin.value = Math.max(props.min, Math.min(props.max, valor));
    setMin(sliderMin.value);
    updateRanges('ceil');
    inputMinValue.value = formatarParaInput(sliderMin.value);
  }
}

function atualizarMaxViaInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  const valorString = target.value;
  const valor = toFloat(valorString);

  if (!Number.isNaN(valor)) {
    sliderMax.value = Math.max(props.min, Math.min(props.max, valor));
    setMax(sliderMax.value);
    updateRanges('floor');
    inputMaxValue.value = formatarParaInput(sliderMax.value);
  }
}

const valorMinFormatado = computed<string | number>(() => (
  props.formatarMoeda
    ? dinheiro(sliderMin.value, { style: 'currency', currency: 'BRL' })
    : sliderMin.value
));

const valorMaxFormatado = computed<string | number>(() => (
  props.formatarMoeda
    ? dinheiro(sliderMax.value, { style: 'currency', currency: 'BRL' })
    : sliderMax.value
));

const isReadonly = computed<boolean>(() => props.min === props.max);
</script>

<template>
  <div class="smae-range-input">
    <div
      class="range-wrapper"
      :style="{ '--thumb-width': thumbWidthVar, '--track-height': '4px' }"
    >
      <input
        ref="inputMinRef"
        type="range"
        :step="stepCalculado"
        :value="sliderMin"
        :data-ready="ready"
        :data-readonly="isReadonly"
        :aria-readonly="isReadonly"
        class="range-input"
        :aria-label="mostrarInputs ? 'Slider valor mínimo' : 'Valor mínimo'"
        @input="atualizarMin"
        @focus="handleMinFocus"
        @mousedown="handleMinFocus"
        @touchstart="handleMinFocus"
      >

      <input
        ref="inputMaxRef"
        type="range"
        :step="stepCalculado"
        :value="sliderMax"
        :data-ready="ready"
        :data-readonly="isReadonly"
        :aria-readonly="isReadonly"
        class="range-input"
        :aria-label="mostrarInputs ? 'Slider valor máximo' : 'Valor máximo'"
        @input="atualizarMax"
        @focus="handleMaxFocus"
        @mousedown="handleMaxFocus"
        @touchstart="handleMaxFocus"
      >
    </div>

    <div
      v-if="!mostrarInputs"
      class="range-labels flex space-between mt1"
    >
      <span class="range-label">{{ valorMinFormatado }}</span>
      <span class="range-label">{{ valorMaxFormatado }}</span>
    </div>

    <div
      v-else
      class="range-inputs flex g2 mt1"
    >
      <div class="f1 flex">
        <span
          v-if="formatarMoeda"
          class="input-prefix"
        >R$</span>
        <input
          v-model="inputMinValue"
          :type="formatarMoeda ? 'text' : 'number'"
          :min="formatarMoeda ? undefined : min"
          :max="formatarMoeda ? undefined : max"
          :step="formatarMoeda ? undefined : stepCalculado"
          :readonly="isReadonly"
          :class="['inputtext light', { 'with-prefix': formatarMoeda }]"
          placeholder="Mínimo"
          aria-label="Valor mínimo"
          @change="atualizarMinViaInput"
          @keyup.enter="atualizarMinViaInput"
        >
      </div>
      <div class="f1 flex">
        <span
          v-if="formatarMoeda"
          class="input-prefix"
        >R$</span>
        <input
          v-model="inputMaxValue"
          :type="formatarMoeda ? 'text' : 'number'"
          :min="formatarMoeda ? undefined : min"
          :max="formatarMoeda ? undefined : max"
          :readonly="isReadonly"
          :step="formatarMoeda ? undefined : stepCalculado"
          :class="['inputtext light', { 'with-prefix': formatarMoeda }]"
          placeholder="Máximo"
          aria-label="Valor máximo"
          @change="atualizarMaxViaInput"
          @keyup.enter="atualizarMaxViaInput"
        >
      </div>
    </div>

    <input
      type="hidden"
      :name="nameMin"
      :value="sliderMin"
    >
    <input
      type="hidden"
      :name="nameMax"
      :value="sliderMax"
    >
  </div>
</template>

<style lang="less" scoped>
@import '@/_less/variables.less';

.smae-range-input {
  position: relative;
  padding: 0.5rem 0;
}

.range-wrapper {
  display: flex;
  height: 1.5rem;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  // Padding apenas na direita para acomodar os thumbs
  padding-inline-end: calc(var(--thumb-width) * 2);
}

.range-input {
  -webkit-tap-highlight-color: transparent;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: none;
  border-radius: 0;
  // Flexbox: começa em 50% + thumb width
  flex-basis: calc(50% + var(--thumb-width));
  flex-shrink: 0;
  font-size: inherit;
  height: 100%;
  margin: 0;
  min-width: var(--thumb-width);
  outline: none;
  cursor: pointer;
  pointer-events: all;

  // === WEBKIT (Chrome, Safari, Edge) ===

  // Track base
  &::-webkit-slider-runnable-track {
    background-color: @c200;
    background-repeat: no-repeat;
    box-sizing: border-box;
    height: var(--track-height);
    cursor: pointer;
  }

  // Track do input MIN (first-child)
  &:first-child::-webkit-slider-runnable-track {
    border-start-start-radius: 1rem;
    border-end-start-radius: 1rem;
    // Cinza até gradient-position, depois amarelo
    background-image: linear-gradient(
      to right,
      @c200 var(--gradient-position),
      @amarelo var(--gradient-position),
      @amarelo
    );
  }

  // Track do input MAX (last-child)
  &:last-child::-webkit-slider-runnable-track {
    border-start-end-radius: 1rem;
    border-end-end-radius: 1rem;
    // Amarelo até gradient-position, depois cinza
    background-image: linear-gradient(
      to right,
      @amarelo,
      @amarelo var(--gradient-position),
      @c200 var(--gradient-position)
    );
  }

  // Thumb
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: var(--thumb-width);
    height: var(--thumb-width);
    margin-top: calc(var(--track-height) / 2);
    transform: translateY(-50%);
    background-color: @amarelo;
    border-radius: 50%;
    cursor: grab;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
      transform: translateY(-50%) scale(1.1);
    }

    &:active {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      transform: translateY(-50%) scale(0.95);
      cursor: grabbing;
    }
  }

  // Esconder thumbs até estar pronto
  &:not([data-ready="true"])::-webkit-slider-thumb {
    opacity: 0;
  }

  &:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px fade(@amarelo, 30%), 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  // === FIREFOX ===

  // Track base
  &::-moz-range-track {
    background-color: @c200;
    background-repeat: no-repeat;
    box-sizing: border-box;
    height: var(--track-height);
    cursor: pointer;
  }

  // Track do input MIN (first-child)
  &:first-child::-moz-range-track {
    border-start-start-radius: 1rem;
    border-end-start-radius: 1rem;
    // Cinza até gradient-position, depois amarelo
    background-image: linear-gradient(
      to right,
      @c200 var(--gradient-position),
      @amarelo var(--gradient-position),
      @amarelo
    );
  }

  // Track do input MAX (last-child)
  &:last-child::-moz-range-track {
    border-start-end-radius: 1rem;
    border-end-end-radius: 1rem;
    // Amarelo até gradient-position, depois cinza
    background-image: linear-gradient(
      to right,
      @amarelo,
      @amarelo var(--gradient-position),
      @c200 var(--gradient-position)
    );
  }

  // Thumb
  &::-moz-range-thumb {
    width: var(--thumb-width);
    height: var(--thumb-width);
    background-color: @amarelo;
    border-radius: 50%;
    cursor: grab;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    max-width: 99.99%;

    &:hover {
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
      transform: scale(1.1);
    }

    &:active {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      transform: scale(0.95);
      cursor: grabbing;
    }
  }

  // Esconder thumbs até estar pronto
  &:not([data-ready="true"])::-moz-range-thumb {
    opacity: 0;
  }

  &:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px fade(@amarelo, 30%), 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  // Estado readonly: desabilita interação
  &[data-readonly="true"] {
    pointer-events: none;
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// Focus no wrapper quando qualquer input tiver foco
.range-wrapper:has(input:focus-visible) {
  outline: 2px solid fade(@amarelo, 50%);
  outline-offset: 4px;
  border-radius: 2px;
}

.range-labels {
  user-select: none;
}

.range-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: @c600;
}

// Inputs editáveis
.range-inputs {
  .input-prefix {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background-color: @c100;
    border: 1px solid @c200;
    border-right: none;
    border-radius: 4px 0 0 4px;
    font-weight: 500;
    color: @c600;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .with-prefix {
    border-radius: 0 4px 4px 0;
    flex: 1;
  }
}
</style>
