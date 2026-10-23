<script lang="ts" setup>
// eslint-disable-next-line import/extensions
import type { ListSeriesAgrupadas } from '@back/variavel/dto/list-variavel.dto';
import { Field, useForm } from 'vee-validate';
import { computed, ref } from 'vue';

import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { ValorPrevioCategoricaSchema as schema } from '@/consts/formSchemas/InformarPreviaIndicador.schema';

type Campos = {
  valor_previo: {
    qualificacao: string
    quantidade: string
  }[]
};

type DadosARetornar = {
  valor: '0'
  elementos: {
    categorica_valor: number,
    valor: string
  }[]
};

type Props = {
  valores: ListSeriesAgrupadas;
};

type Emit = {
  (event: 'submit', values: DadosARetornar): void
};

const props = defineProps<Props>();
const emit = defineEmits<Emit>();

const { handleSubmit } = useForm<Campos>({
  validationSchema: schema,
});

const maxSoma = computed(() => props.valores.previa_modo?.max_soma ?? null);
const erroSoma = ref('');

const onSubmit = handleSubmit.withControlled((valoresControlados) => {
  const elementos = Object.values(valoresControlados.valor_previo).map((item) => ({
    categorica_valor: Number(item.qualificacao),
    valor: item.quantidade || '',
  }));

  const soma = elementos.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
  if (maxSoma.value !== null && soma > maxSoma.value) {
    erroSoma.value = `A soma das quantidades (${soma}) passa do número de regiões (${maxSoma.value}).`;
    return;
  }

  erroSoma.value = '';
  emit('submit', { valor: '0', elementos });
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

    <p
      v-if="maxSoma !== null"
      class="t13 tc60 mt1"
    >
      Soma máxima: {{ maxSoma }}
    </p>

    <div
      v-if="erroSoma"
      class="error-msg mt1"
    >
      {{ erroSoma }}
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
