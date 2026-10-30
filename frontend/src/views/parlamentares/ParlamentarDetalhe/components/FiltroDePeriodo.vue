<script setup lang="ts">
import { ErrorMessage, Field, useForm } from 'vee-validate';

import schema from '@/consts/formSchemas/painelParlamentarFiltro';

const props = defineProps<{
  anoInicio?: number;
  anoFim?: number;
}>();

const emit = defineEmits<{
  filtrar: [periodo: { ano_inicio?: number; ano_fim?: number }];
}>();

const PRIMEIRO_ANO = 2004;

const anos = Array.from(
  { length: new Date().getFullYear() - PRIMEIRO_ANO + 1 },
  (_, indice) => new Date().getFullYear() - indice,
);

const { handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: {
    ano_inicio: props.anoInicio ? String(props.anoInicio) : '',
    ano_fim: props.anoFim ? String(props.anoFim) : '',
  },
});

const filtrar = handleSubmit((valores) => {
  const periodo = schema.cast(valores);

  emit('filtrar', {
    ano_inicio: periodo.ano_inicio || undefined,
    ano_fim: periodo.ano_fim || undefined,
  });
});
</script>

<template>
  <form
    class="filtro-de-periodo"
    @submit="filtrar"
  >
    <div class="filtro-de-periodo__campos">
      <label class="filtro-de-periodo__campo">
        <span class="filtro-de-periodo__rotulo">Período</span>
        <Field
          as="select"
          name="ano_inicio"
          class="filtro-de-periodo__seletor"
        >
          <option value="">
            Começo
          </option>
          <option
            v-for="ano in anos"
            :key="ano"
            :value="String(ano)"
          >
            {{ ano }}
          </option>
        </Field>
      </label>

      <span class="filtro-de-periodo__ate">até</span>

      <label class="filtro-de-periodo__campo">
        <span class="filtro-de-periodo__rotulo">Período</span>
        <Field
          as="select"
          name="ano_fim"
          class="filtro-de-periodo__seletor"
        >
          <option value="">
            Fim
          </option>
          <option
            v-for="ano in anos"
            :key="ano"
            :value="String(ano)"
          >
            {{ ano }}
          </option>
        </Field>
      </label>

      <button
        type="submit"
        class="btn filtro-de-periodo__botao"
      >
        Filtrar
      </button>
    </div>

    <ErrorMessage
      class="error-msg"
      name="ano_fim"
    />
  </form>
</template>

<style scoped lang="less">
.filtro-de-periodo__campos {
  display: flex;
  align-items: flex-end;
  gap: 24px;
}

.filtro-de-periodo__campo {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 186px;
}

.filtro-de-periodo__rotulo {
  font-size: 12px;
  font-weight: 700;
  line-height: 24px;
  text-transform: uppercase;
  color: @c600;
}

.filtro-de-periodo__seletor {
  height: 44px;
  padding: 10px 16px;
  border: 1.5px solid @c100;
  border-radius: 4px;
  background-color: @branco;
  font-size: 14px;
  line-height: 1.4;
  color: @c400;
}

.filtro-de-periodo__ate {
  padding-bottom: 12px;
  font-size: 12px;
  font-weight: 900;
  line-height: 21px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: @c600;
}

.filtro-de-periodo__botao {
  height: 40px;
  margin-bottom: 2px;
}
</style>
