<script lang="ts" setup>
// eslint-disable-next-line import/extensions
import { ListSeriesAgrupadas } from '@back/variavel/dto/list-variavel.dto';
import { Field, useForm } from 'vee-validate';
import { computed } from 'vue';

import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { ValorPrevioCategoricaSchema as schema } from '@/consts/formSchemas/InformarPreviaIndicador.schema';

type Props = {
  valores: ListSeriesAgrupadas;
};

const props = defineProps<Props>();

const { handleSubmit } = useForm({
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled((valoresControlados) => {
  console.log(Object.values(valoresControlados.valor_previo));
});

const dadosTabela = computed(() => {
  const categoricas = props.valores.dados_auxiliares?.categoricas;
  if (!categoricas) return [];

  return Object.entries(categoricas).map(([chave, valor]) => ({
    chave,
    qualificacao: valor,
  }));
});

const colunas = computed(() => {
  const type = schema.fields.valor_previo.innerType;
  if (!type) {
    return [];
  }

  return Object.keys(type.fields).map((item) => ({
    chave: item,
    label: type.fields[item].spec.label,
  }));
});
</script>

<template>
  <form
    class="informar-categorica"
    @submit="onSubmit"
  >
    <SmaeTable
      class="informar-categorica__tabela"
      :dados="dadosTabela"
      :colunas="colunas"
    >
      <template #celula:qualificacao="{ linha }">
        <Field
          :name="`valor_previo[${linha.chave}].qualificacao`"
          :value="linha.chave"
          hidden
        />

        <span class="tabela-item tabela-item--qualificacao">{{ linha.qualificacao }}</span>
      </template>

      <template #celula:quantidade="{ linha }">
        <Field
          :name="`valor_previo[${linha.chave}].quantidade`"
          class="inputtext light"
        />
      </template>
    </SmaeTable>

    <div class="flex justifycenter mt2">
      <button
        class="btn"
        type="submit"
      >
        Salvar
      </button>
    </div>
  </form>
</template>

<style lang="less" scoped>
.informar-categorica__tabela {
  :deep(.smae-table__coluna) {
    width: 50%;
  }

  :deep(tbody tr) {
    background-color: transparent;
  }

  :deep(tbody tr:last-child) {
    border-bottom: none;
  }
}

.tabela-item--qualificacao {
  color: #3B5881;
  font-weight: 700;
  font-size: 1.2rem;
  text-transform: capitalize;
}
</style>
