<script lang="ts" setup>
// eslint-disable-next-line import/extensions
import type { ListSeriesAgrupadas } from '@back/variavel/dto/list-variavel.dto';
import { ErrorMessage, Field, useForm } from 'vee-validate';
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
const modoDePreenchimento = ref<typeof opcoesPreenchimento[number]>('valor_nominal');

const { values, handleSubmit, errors } = useForm<Campos>({
  validationSchema: schema,
  initialValues: {
    valor: '',
  },
});

const onSubmit = handleSubmit.withControlled((valoresControlados) => {
  if (valoresControlados.valor === '') {
    emit('submit', {
      valor: '',
    });
    return;
  }

  if (modoDePreenchimento.value === 'valor_nominal') {
    emit('submit', {
      valor: `${valoresControlados.valor}`,
    });
    return;
  }

  const anterior = Number(props.valores.valor_acumulado_anterior) || 0;

  emit('submit', {
    valor: `${Number(valoresControlados.valor) - anterior}`,
  });
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

        <ErrorMessage name="valor" />

        <output
          v-if="modoDePreenchimento ==='valor_acumulado'"
          class="informar-numerica__legenda"
        >
          Valor acumulado vigente: {{ props.valores.valor_acumulado_anterior }}
        </output>
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
