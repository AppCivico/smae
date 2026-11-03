<script setup lang="ts">
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { watch } from 'vue';

import SmaeLabel from '@/components/camposDeFormulario/SmaeLabel.vue';
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

const valoresDoPeriodo = () => ({
  ano_inicio: props.anoInicio ? String(props.anoInicio) : '',
  ano_fim: props.anoFim ? String(props.anoFim) : '',
});

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
  initialValues: valoresDoPeriodo(),
});

watch(() => [props.anoInicio, props.anoFim], () => {
  resetForm({ values: valoresDoPeriodo() });
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
      <div class="filtro-de-periodo__campo">
        <SmaeLabel
          class="filtro-de-periodo__rotulo"
          name="ano_inicio"
          :schema="schema"
        />
        <Field
          id="ano_inicio"
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
      </div>

      <span class="filtro-de-periodo__ate">até</span>

      <div class="filtro-de-periodo__campo">
        <SmaeLabel
          class="filtro-de-periodo__rotulo"
          name="ano_fim"
          :schema="schema"
        />
        <Field
          id="ano_fim"
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
      </div>

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
  gap: 1.7rem;
}

.filtro-de-periodo__campo {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 13.3rem;
}

.filtro-de-periodo__rotulo {
  margin-bottom: 0;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.7rem;
  text-transform: uppercase;
  color: @c600;
}

.filtro-de-periodo__seletor {
  height: 3.1rem;
  padding: 0.7rem 1.1rem;
  border: 0.1rem solid @c100;
  border-radius: 0.3rem;
  background-color: @branco;
  font-size: 1rem;
  line-height: 1.4;
  color: @c400;
}

.filtro-de-periodo__ate {
  padding-bottom: 0.9rem;
  font-size: 0.9rem;
  font-weight: 900;
  line-height: 1.5rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: @c600;
}

.filtro-de-periodo__botao {
  height: 2.9rem;
  margin-bottom: 0.1rem;
}
</style>
