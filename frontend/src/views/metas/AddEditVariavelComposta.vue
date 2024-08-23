<script setup>
import EditorDeFormula from '@/components/metas/EditorDeFormula.vue';
import { variávelComposta as schema } from '@/consts/formSchemas';
import niveisRegionalizacao from '@/consts/niveisRegionalizacao';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useIndicadoresStore } from '@/stores/indicadores.store';
import { useVariaveisStore } from '@/stores/variaveis.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  computed, defineOptions, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';

defineOptions({ inheritAttrs: false });

const alertStore = useAlertStore();
const editModalStore = useEditModalStore();
const IndicadoresStore = useIndicadoresStore();
const VariaveisStore = useVariaveisStore();

const route = useRoute();
const { indicador_id: indicadorId, var_id: variávelId } = route.params;

const { singleIndicadores } = storeToRefs(IndicadoresStore);
const {
  variáveisCompostas,
  Variaveis,
  variáveisCompostasPorReferência,
} = storeToRefs(VariaveisStore);

const emFoco = computed(() => variáveisCompostasPorReferência.value?.[`@_${variávelId}`] || null);

const itemParaEdição = computed(() => emFoco.value || {
  titulo: '',
  formula: '',
  formula_variaveis: [],
  mostrar_monitoramento: false,
  nivel_regionalizacao: 1,
});

const formula = ref('');
const variaveisFormula = ref([]);
const loading = ref(false);

const {
  errors, handleSubmit, isSubmitting, resetField, resetForm, values,
} = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});

const formulárioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async () => {
  loading.value = true;
  try {
    const msg = variávelId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';
    const r = await VariaveisStore.salvarVariávelComposta(values, variávelId);

    if (r) {
      // VariaveisStore.$reset();
      VariaveisStore.getAllCompound(indicadorId);
      alertStore.success(msg);
      editModalStore.$reset();

      if (route.meta.rotaDeEscape) {
        router.push({
          name: route.meta.rotaDeEscape,
          // ao que parece, os parâmetros só não são necessários
          // se a rota corrente e a de destino forem aninhadas
          params: route.params,
          query: route.query,
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  } finally {
    loading.value = false;
  }
});

if (String(singleIndicadores.value?.id) !== String(indicadorId)) {
  IndicadoresStore.getById(indicadorId);
}

if (variávelId) {
  if (!emFoco.value) {
    VariaveisStore.getAllCompound(indicadorId);
  }

  watch(
    itemParaEdição,
    (novosValores) => {
      formula.value = emFoco.value?.formula || '';
      variaveisFormula.value = emFoco.value?.formula_variaveis || '';
      resetForm({ values: novosValores });
    },
    { immediate: true },
  );
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>{{ $route.meta.título }}</h2>
    <hr class="ml2 f1">

    <CheckClose
      :formulário-sujo="formulárioSujo"
    />
  </div>

  <form
    :disabled="isSubmitting"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1">
        <label class="label">
          Título <span class="tvermelho">*</span>
        </label>
        <Field
          name="titulo"
          type="text"
          class="inputtext light mb1"
          :class="{ 'error': errors.titulo }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="titulo"
        />
      </div>
    </div>

    <div class="mb1">
      <label class="label">
        Nível de regionalização
        <span class="tvermelho">*</span>
      </label>
      <Field
        id="nivel_regionalizacao"
        name="nivel_regionalizacao"
        as="select"
        class="inputtext light"
        :class="{ 'error': errors.nivel_regionalizacao }"
        :disabled="typeof singleIndicadores?.nivel_regionalizacao !== 'number'"
        @change="() => resetField('regioes', { value: [] })"
      >
        <option
          :value="0"
          disabled
        />
        <option
          v-for="nível in Object.values(niveisRegionalizacao)"
          :key="nível.id"
          :value="nível.id"
          :disabled="typeof singleIndicadores?.nivel_regionalizacao !== 'number'
            || singleIndicadores?.nivel_regionalizacao < nível.id"
        >
          {{ nível.nome }}
        </option>
      </Field>
      <ErrorMessage
        name="nivel_regionalizacao"
        class="error-msg"
      />
    </div>

    <Field
      v-model="formula"
      type="hidden"
      name="formula"
    />
    <Field
      v-model="variaveisFormula"
      type="hidden"
      name="formula_variaveis"
    />

    <EditorDeFormula
      v-model="formula"
      v-model:variaveis-formula="variaveisFormula"
      :variáveis-do-indicador="Array.isArray(Variaveis[indicadorId])
        ? Variaveis[indicadorId]
        : []"
      :em-foco="emFoco"
      :variáveis-em-uso="Array.isArray(emFoco?.formula_variaveis)
        ? emFoco.formula_variaveis
        : []"
    />

    <label class="block mt2 mb2">
      <Field
        name="mostrar_monitoramento"
        type="checkbox"
        class="inputcheckbox"
        :value="true"
        :unchecked-value="false"
        :class="{ 'error': errors.mostrar_monitoramento }"
      />
      <span>Utilizar como agrupamento na coleta de dados</span>
    </label>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>

  <span
    v-if="variáveisCompostas[indicadorId]?.loading"
    class="spinner"
  >Carregando</span>

  <div
    v-if="variáveisCompostas[indicadorId]?.error"
    class="error p1"
  >
    <div class="error-msg">
      {{ variáveisCompostas[indicadorId]?.error }}
    </div>
  </div>
</template>

<style lang="less">
.lista-de-opções {}

.lista-de-opções__item {
  flex-basis: 20%;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
