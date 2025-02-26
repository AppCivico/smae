<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import {
  Field, FieldArray, useForm, useIsFormDirty,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import { usePdMStore } from '@/stores/pdm.store';
import { useAlertStore } from '@/stores/alert.store';
import { Dashboard } from '@/components';
import CheckClose from '@/components/CheckClose.vue';
import LabelFromYup from '@/components/LabelFromYup.vue';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import months from '@/consts/months';
import { permissaoEdicaoOrcamento as schema } from '@/consts/formSchemas';

const router = useRouter();
const route = useRoute();

const PdMStore = usePdMStore();
const alertStore = useAlertStore();

const { singlePdm } = storeToRefs(PdMStore);

const anosOrcamento = ref({});
const mesesDisponíveis = months.map((x, i) => ({ nome: x, id: i + 1 }));
const camposSelecaoConfig = ['previsao_custo_disponivel', 'planejado_disponivel', 'execucao_disponivel'];

const initialValues = computed(() => ({
  orcamento_config: singlePdm.value.orcamento_config,
}));

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

async function iniciar() {
  await PdMStore.getById(route.params.pdm_id);
  anosOrcamento.value = singlePdm.value.orcamento_config;

  resetForm({
    values: initialValues.value,
  });
}

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    await PdMStore.updatePermissoesOrcamento(singlePdm.value.id, valoresControlados);
    alertStore.success('Dados salvos com sucesso!');

    router.push({
      name: route.meta.rotaDeEscape,
    });
  } catch (error) {
    alertStore.error(error);
  }
});

iniciar();
</script>

<template>
  <Dashboard>
    <MigalhasDePao class="mb1" />

    <div class="flex spacebetween center mb2">
      <TituloDaPagina />

      <hr class="ml2 f1">

      <CheckClose :formulario-sujo="formularioSujo" />
    </div>

    <template v-if="!(singlePdm?.loading || singlePdm?.error)">
      <form @submit="onSubmit">
        <FieldArray
          v-slot="{ fields }"
          name="orcamento_config"
        >
          <div
            v-for="(field, idx) in fields"
            :key="field.key"
            class="mb2"
          >
            <h4>{{ field.value.ano_referencia }}</h4>

            <Field
              :name="`orcamento_config[${idx}].id`"
              type="hidden"
            />

            <div
              v-for="campo in camposSelecaoConfig"
              :key="`${field.value.ano_referencia}--${campo}`"
              class="mb05"
            >
              <LabelFromYup
                v-slot="{ label }"
                :name="`orcamento_config[${idx}].${campo}`"
                :classe-label="false"
                :schema="schema.fields.orcamento_config.innerType"
              >
                <Field
                  v-slot="{ value, handleChange, field: fieldCheckbox }"
                  :name="`orcamento_config[${idx}].${campo}`"
                  type="checkbox"
                >
                  <input
                    :id="fieldCheckbox.name"
                    class="inputcheckbox"
                    type="checkbox"
                    :checked="value"
                    @input="ev => handleChange(ev.target.checked)"
                  >
                </Field>

                <span>{{ label }}</span>
              </labelfromyup>
            </div>

            <div class="f1 mt1 mb2">
              <LabelFromYup
                :schema="schema.fields.orcamento_config.innerType"
                name="execucao_disponivel_meses"
              />

              <Field
                v-slot="{ value, handleChange }"
                :name="`orcamento_config[${idx}].execucao_disponivel_meses`"
              >
                <AutocompleteField
                  name="execucao_disponivel_meses"
                  :controlador="{ busca: '', participantes: value }"
                  :v-model="handleChange"
                  :grupo="mesesDisponíveis"
                  label="nome"
                />
              </Field>

              <ErrorMessage
                :name="`orcamento_config[${idx}].execucao_disponivel_meses`"
                class="error-msg"
              />
            </div>
          </div>
        </FieldArray>

        <div class="flex spacebetween center mb2">
          <hr class="mr2 f1">
          <button class="btn">
            Salvar
          </button>
          <hr class="ml2 f1">
        </div>
      </Form>
    </template>

    <template v-if="singlePdm?.loading">
      <span class="spinner">Carregando</span>
    </template>

    <template v-if="singlePdm?.error || error">
      <div class="error p1">
        <div class="error-msg">
          {{ singlePdm.error ?? error }}
        </div>
      </div>
    </template>
  </Dashboard>
</template>
