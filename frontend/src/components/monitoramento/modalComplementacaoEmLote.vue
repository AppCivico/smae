<script setup>
import { perdidoDeComplementação as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useCiclosStore } from '@/stores/ciclos.store';
import { useEditModalStore } from '@/stores/editModal.store';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const route = useRoute();
const { meta_id } = route.params;

// PRA-FAZER: remover as prop desnecessárias
const pr = defineProps(['props']);
// BUG-CONHECIDO: explodir as props as faz perder reatividade. Já que esse modal
// não tem rota, é provável, mas não garantido, que não dê problemas.
const { props } = pr;

const CiclosStore = useCiclosStore();

const valoresIniciais = computed(() => ({
  pedido: '',
  linhas: !Array.isArray(props.variávelComposta?.variaveis)
    ? [{
      data_valor: null,
      variavel_id: 0,
    }]
    : props.variávelComposta.variaveis.reduce((acc, cur) => (cur.series[0]?.pode_editar
      ? acc.concat(
        cur.series.map((y) => ({
          data_valor: y.periodo,
          variavel_id: cur.variavel.id,
        })),
      )
      : acc), []),
}));

const {
  errors, handleSubmit, isSubmitting, resetForm, values: carga,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
  const cargaManipulada = carga.linhas.map((x) => ({
    ...x,
    pedido: carga.pedido,
  }));

  try {
    await CiclosStore.solicitarComplementaçãoEmLote({ linhas: cargaManipulada });
    const msg = 'Dados salvos!';

    editModalStore.clear();
    alertStore.success(msg);
    CiclosStore.getMetaVars(meta_id);
  } catch (error) {
    alertStore.error(error);
  }
});
const formularioSujo = useIsFormDirty();

watch(valoresIniciais, (novoValor) => {
  resetForm({ values: novoValor });
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>Solicitar complementação</h2>
    <hr class="ml2 f1">

    <CheckClose
      :formulario-sujo="formularioSujo"
      :apenas-modal="true"
    />
  </div>

  <div class="flex center mb2">
    <svg
      class="f0 tlaranja mr1"
      style="flex-basis: 2rem;"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    ><use
      :xlink:href="`#i_${props.parent.atividade
        ? 'atividade'
        : props.parent.iniciativa
          ? 'iniciativa'
          : 'indicador'}`"
    /></svg>
    <div class="t20">
      <strong>{{ props.parent.indicador.codigo }} {{ props.parent.indicador.titulo }}</strong>
    </div>
  </div>

  <h3 class="t20 mb2 w700">
    {{ props.variávelComposta?.titulo }}
  </h3>

  <form
    :disabled="isSubmitting"
    @submit="onSubmit"
  >
    <div class="mb1">
      <LabelFromYup
        name="pedido"
        :schema="schema"
      />
      <Field
        name="pedido"
        as="textarea"
        rows="5"
        class="inputtext light mb1"
        :class="{ 'error': errors.pedido }"
      />
      <ErrorMessage
        class="error-msg mb2"
        name="pedido"
      />
    </div>

    <FormErrorsList
      :errors="errors"
      class="mb1"
    />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        type="submit"
        class="btn big"
        :disabled="isSubmitting"
      >
        Enviar solicitação
      </button>
      <hr class="ml2 f1">
    </div>
  </form>
</template>
