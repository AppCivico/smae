<template>
  <component
    :is="as"
    ref="element"
  >
    <slot name="prefix" />
    {{ formattedNumber }}
    <slot name="sufix" />
  </component>
</template>
<script setup lang="ts">
import isValidHtmlTag from '@/helpers/isValidHtmlTag';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';

const props = defineProps({
  as: {
    type: String,
    default: 'span',
    validator(value: string) { return isValidHtmlTag(value); },
  },
  value: {
    type: [Number, String],
    default: 0,
    validator(value) { return !Number.isNaN(Number(value)); },
  },
  slowness: {
    // smaller is faster
    type: [
      Number,
      String,
    ],
    default: 5,
    validator(value) { return Number(value) !== 0; },
  },
  formatter: {
    type: Function,
    default: undefined,
    validator(value) { return typeof value === 'function'; },
  },
});

let interval: ReturnType<typeof setInterval> | null = null;

const displayNumber = ref<number>(0);
const element = ref<HTMLElement | null>(null);
const isVisible = ref(false);

const formattedNumber = computed(() => (
  props.formatter
    ? props.formatter(displayNumber.value)
    : displayNumber.value));

const updateDisplayNumber = (newVal: number | string) => {
  const castedNumber = Number(newVal);

  if (interval) {
    clearInterval(interval);
  }

  if (castedNumber === displayNumber.value || Number.isNaN(castedNumber)) {
    return;
  }

  interval = setInterval(() => {
    if (Math.floor(displayNumber.value) !== Math.floor(castedNumber)) {
      let change = (castedNumber - displayNumber.value) / Number(props.slowness) || 5;
      change = change >= 0
        ? Math.ceil(change)
        : Math.floor(change);
      displayNumber.value += change;
    } else {
      displayNumber.value = castedNumber;
      if (interval) {
        clearInterval(interval);
      }
    }
  }, 20);
};

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible.value = entry.isIntersecting;
      if (isVisible.value) {
        updateDisplayNumber(props.value);
      }
    });
  });

  if (element.value) {
    observer.observe(element.value);
  }

  onBeforeUnmount(() => {
    if (element.value) {
      observer.unobserve(element.value);
    }
  });
});

watch(() => props.value, (newVal: number | string) => {
  if (isVisible.value) {
    updateDisplayNumber(newVal);
  }
}, { immediate: true });
</script>
