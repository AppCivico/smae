<script lang="ts" setup>
// eslint-disable-next-line import/extensions
import type { ListSeriesAgrupadas } from '@back/variavel/dto/list-variavel.dto';
import { Field, useForm } from 'vee-validate';
import { computed, ref } from 'vue';

import { ValorPrevioNumericaSchema as schema } from '@/consts/formSchemas/InformarPreviaIndicador.schema';

type Campos = {
  valor: string
};

type Props = {
  valores: ListSeriesAgrupadas;
};

type Emit = {
  (event: 'submit', values: Campos): void
};

const emit = defineEmits<Emit>();
const props = defineProps<Props>();

const opcoesPreenchimento = ['valor_acumulado', 'valor_nominal'] as const;
const modoDePreenchimento = ref<typeof opcoesPreenchimento[number]>('valor_acumulado');

const { values, handleSubmit, errors } = useForm<Campos>({
  validationSchema: schema,
  initialValues: {
    valor: '0',
  },
});

const onSubmit = handleSubmit.withControlled((valoresControlados) => {
  emit('submit', {
    valor: `${valoresControlados.valor}`,
  });
});

const somaAcumulada = computed(() => {
  if (modoDePreenchimento.value === 'valor_nominal') {
    return 0;
  }

  const anterior = Number(props.valores.valor_acumulado_anterior) || 0;
  return anterior + Number(values.valor);
});
</script>

<template>
  <div class="informar-numerica flex">
    <form
      class="f1"
      @submit="onSubmit"
    >
      <div>
        <SmaeLabel
          :schema="schema"
          name="valor"
        />

        <Field
          name="valor"
          class="inputtext light"
          :class="{ error: errors.valor }"
        />

        <span
          v-if="modoDePreenchimento ==='valor_acumulado'"
          class="informar-numerica__legenda"
        >
          Valor total acumulado: {{ somaAcumulada }}
        </span>
      </div>

      <div class="f1 flex g1 mt2">
        <label class="f1">
          <input
            v-model="modoDePreenchimento"
            type="radio"
            class="inputcheckbox"
            value="valor_nominal"
          >

          <span>Preencher por valor realizado</span>
        </label>

        <label class="f1">
          <input
            v-model="modoDePreenchimento"
            type="radio"
            class="inputcheckbox"
            value="valor_acumulado"
          >
          <span>Preencher por valor acumulado</span>
        </label>
      </div>

      <div class="flex justifycenter mt2">
        <button
          class="btn"
          type="submit"
        >
          Salvar
        </button>
      </div>
    </form>
  </div>
</template>

<style lang="less" scoped>
.informar-numerica__legenda {
  color: @c300;
}
</style>
