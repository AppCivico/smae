<script lang="ts" setup>
import { ListSeriesAgrupadas } from '@back/variavel/dto/list-variavel.dto';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed } from 'vue';

import SmaeLabel from '@/components/camposDeFormulario/SmaeLabel.vue';
import { ValorPrevioCategoricaRegionalizadaSchema as schema } from '@/consts/formSchemas/InformarPreviaIndicador.schema';

type Props = {
  valores: ListSeriesAgrupadas;
};

const props = defineProps<Props>();

const { handleSubmit, errors } = useForm({
  validationSchema: schema,
  initialValues: {
    qualificacao: '',
  },
});

const opcoesCategoria = computed(() => {
  const categoricas = props.valores?.dados_auxiliares?.categoricas;
  if (!categoricas) return [];

  return Object.entries(categoricas).map(([chave, valor]) => ({
    value: chave,
    label: valor,
  }));
});

const onSubmit = handleSubmit.withControlled((valoresControlados) => {
  console.log(valoresControlados);
});
</script>

<template>
  <div class="informar-categorica-regionalizavel flex">
    <form
      class="f1"
      @submit="onSubmit"
    >
      <div>
        <SmaeLabel name="qualificacao" />

        <Field
          name="qualificacao"
          as="select"
          class="inputtext light"
          :class="{'error': errors.qualificacao}"
        >
          <option value="">
            Selecione uma categoria
          </option>

          <option
            v-for="opcao in opcoesCategoria"
            :key="opcao.value"
            :value="opcao.value"
          >
            {{ opcao.label }}
          </option>
        </Field>

        <ErrorMessage name="qualificacao" />
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
