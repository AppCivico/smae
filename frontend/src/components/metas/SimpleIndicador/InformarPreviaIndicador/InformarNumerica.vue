<script lang="ts" setup>
// eslint-disable-next-line import/extensions
import { ListSeriesAgrupadas } from '@back/variavel/dto/list-variavel.dto';
import { Field, useForm } from 'vee-validate';
import { computed, ref } from 'vue';

import { ValorPrevioNumericaSchema as schema } from '@/consts/formSchemas/InformarPreviaIndicador.schema';

type Props = {
  valores: ListSeriesAgrupadas;
};

const props = defineProps<Props>();

type Emit = {
  (event: 'submit', values: any): void
};
const emit = defineEmits<Emit>();

const opcoesPreenchimento = ['valor_acumulado', 'valor_nominal'] as const;
const modoDePreenchimento = ref<typeof opcoesPreenchimento[number]>('valor_acumulado');

const { values, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: {
    valor: 0,
  },
});

const onSubmit = handleSubmit.withControlled((valoresControlados) => {
  console.log(valoresControlados);
  emit('submit', valoresControlados);
});

const somaAcumulada = computed(() => {
  if (modoDePreenchimento.value === 'valor_nominal') {
    return 0;
  }

  return Number(props.valores.valor_acumulado_anterior) + Number(values.valor);
});
</script>

<template>
  <div
    class="informar-numerica flex"
  >
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
          type="number"
          class="inputtext light"
        />

        <legend
          v-if="modoDePreenchimento ==='valor_acumulado'"
          class="informar-numerica__legenda"
        >
          Valor total acumulado: {{ somaAcumulada }}
        </legend>
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
