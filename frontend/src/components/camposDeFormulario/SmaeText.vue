<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed } from 'vue';
import type { AnyObjectSchema } from 'yup';
import type { Test } from 'yup/lib/util/createValidation.d.ts';
import buscarDadosDoYup from './helpers/buscarDadosDoYup';

const props = defineProps({
  as: {
    type: String,
    default: 'input',
    validator: (value: string) => ['input', 'textarea'].includes(value.toLocaleLowerCase()),
  },
  anularVazio: {
    type: Boolean,
    default: false,
  },
  // Aceitar caixas diferentes
  maxlength: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
  // Aceitar caixas diferentes
  maxLength: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
  name: {
    type: String,
    required: true,
  },
  schema: {
    type: Object as PropType<AnyObjectSchema>,
    default: () => null,
  },
});

const [model, modifiers] = defineModel<string>({
  set(value) {
    if (modifiers.anular || props.anularVazio) {
      return value === '' ? null : value;
    }
    return value;
  },
  get: (value) => value,
});

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
    case max.value && ((model.value?.length || 0) / max.value) > 0.9:
      return 'smae-text--com-contador smae-text--falta-pouco';
    case max.value && (model.value?.length ?? 0) / max.value > 0.75:
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
  >
    <textarea
      v-if="$props.as === 'textarea'"
      v-bind="$attrs"
      :id="$attrs.id as string || $props.name"
      v-model.trim="model"
      class="smae-text__campo smae-text__campo--textarea inputtext light"
      :name="$props.name"
      data-test="campo"
      :maxlength="max"
    />

    <input
      v-else
      v-bind="$attrs"
      :id="$attrs.id as string || $props.name"
      v-model.trim="model"
      class="smae-text__campo smae-text__campo--text inputtext light"
      :class="classeDeCondicao"
      :name="$props.name"
      type="text"
      data-test="campo"
      :maxlength="max"
    >
    <span
      v-if="max"
      class="smae-text__contagem-de-caracteres"
    >
      <output
        class="smae-text__total-de-caracteres"
        data-test="total-de-caracteres"
        :for="$attrs.id as string || $props.name"
      >{{ model ? String(model).length : 0 }}</output>
      /
      <span
        class="smae-text__maximo-de-caracteres"
        data-test="maximo-de-caracteres"
      >{{ max }}</span>
    </span>
  </div>
</template>
<style lang="less">
.smae-text {}

.smae-text--com-contador {
  display: flex;
  gap: 1rem;
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
