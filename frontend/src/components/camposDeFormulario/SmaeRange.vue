<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  name?: string;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  name: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const fill = computed(() => {
  const min = Number(props.min);
  const max = Number(props.max);
  if (max <= min) return '100%';
  return `${((props.modelValue - min) / (max - min)) * 100}%`;
});

function onChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', Number(target.value));
}
</script>

<template>
  <input
    type="range"
    :name="name"
    :min="min"
    :max="max"
    :step="step"
    :value="modelValue"
    :style="{ '--inputrange-fill': fill }"
    @input="onChange"
  >
</template>

<style lang="less" scoped>
input {
  --inputrange-thumb-size: 20px;
  --inputrange-track-height: 4px;

  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: none;
  border-radius: 0;
  font-size: inherit;
  margin: 0;
  min-width: var(--inputrange-thumb-size);
  outline: none;
  cursor: pointer;
  width: 100%;

  &::-webkit-slider-runnable-track {
    background-color: @c200;
    background-image: linear-gradient(
      to right,
      @amarelo var(--inputrange-fill, 0%),
      @c200 var(--inputrange-fill, 0%)
    );
    background-repeat: no-repeat;
    box-sizing: border-box;
    height: var(--inputrange-track-height);
    border-radius: 1rem;
    cursor: pointer;
  }

  &::-moz-range-track {
    background-color: @c200;
    background-image: linear-gradient(
      to right,
      @amarelo var(--inputrange-fill, 0%),
      @c200 var(--inputrange-fill, 0%)
    );
    background-repeat: no-repeat;
    box-sizing: border-box;
    height: var(--inputrange-track-height);
    border-radius: 1rem;
    cursor: pointer;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: var(--inputrange-thumb-size);
    height: var(--inputrange-thumb-size);
    margin-top: calc(var(--inputrange-track-height) / 2);
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

  &::-moz-range-thumb {
    width: var(--inputrange-thumb-size);
    height: var(--inputrange-thumb-size);
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

  &:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px fade(@amarelo, 30%), 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  &:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px fade(@amarelo, 30%), 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
