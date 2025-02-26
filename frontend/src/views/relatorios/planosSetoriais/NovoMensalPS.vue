<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import {
  ErrorMessage, Field, Form, useIsFormDirty,
} from 'vee-validate';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { useAlertStore } from '@/stores/alert.store';
import { usePlanosSimplificadosStore } from '@/stores/planosMetasSimplificados.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import { useTagsStore } from '@/stores/tags.store';
import { relatórioMensalPS as schema } from '@/consts/formSchemas';
import months from '@/consts/months';
import nulificadorTotal from '@/helpers/nulificadorTotal';

const route = useRoute();
const router = useRouter();

const TagsStore = useTagsStore();
const relatoriosStore = useRelatoriosStore();

const { filtradasPorPdM, Tags } = storeToRefs(TagsStore);
const alertStore = useAlertStore();

const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe);
const { lista: listaDePlanosDisponiveis } = storeToRefs(planosSetoriaisStore);

const planosMetasSimplificadosStore = usePlanosSimplificadosStore();
const { chamadasPendentes, planosPorId } = storeToRefs(planosMetasSimplificadosStore);

const formularioSujo = useIsFormDirty();

const { loading } = storeToRefs(relatoriosStore);

const initialValues = ref({
  fonte: 'PSMonitoramentoMensal',
  parametros: {
    metas: [],
    plano_setorial_id: null,
    mes: null,
    ano: new Date().getFullYear(),
    tags: [],
    listar_variaveis_regionalizadas: false,
  },
});

async function onSubmit(values) {
  const carga = nulificadorTotal(values);

  try {
    const r = await relatoriosStore.insert(carga);
    const msg = 'Relatório em processamento, acompanhe na tela de listagem';

    if (r === true) {
      alertStore.success(msg);
      router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (!Tags.value.length) {
  TagsStore.getAll();
}

if (!listaDePlanosDisponiveis.value.length) {
  planosSetoriaisStore.buscarTudo();
}
</script>
<template>
  <MigalhasDePao class="mb1" />

  <header class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose :formulario-sujo="formularioSujo" />
  </header>

  <Form
    v-slot="{ errors, isSubmitting, resetField, values }"
    :validation-schema="schema"
    :initial-values="initialValues"
    @submit="onSubmit"
  >
    <Field
      name="fonte"
      type="hidden"
    />

    <div class="flex column g1 mb2">
      <div class="flex g2">
        <div class="f1">
          <label class="label">
            Plano Setorial&nbsp;<span class="tvermelho">*</span>
          </label>
          <Field
            name="parametros.plano_setorial_id"
            as="select"
            class="inputtext light"
            :class="{
              loading: loading,
              error: errors['parametros.plano_setorial_id']
            }"
            :disabled="loading"
            @update:model-value="() => {
              resetField('parametros.metas', { value: [] });
              resetField('parametros.tags', { value: [] });
            }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in listaDePlanosDisponiveis"
              :key="item.id"
              :value="item.id"
            >
              {{ item.nome }}
            </option>
          </Field>

          <ErrorMessage name="parametros.plano_setorial_id" />
        </div>

        <div class="f1">
          <label
            for="mes"
            class="label"
          >
            Mês <span class="tvermelho">*</span>
          </label>
          <Field
            name="parametros.mes"
            as="select"
            class="inputtext light"
            :class="{ 'error': errors['parametros.mes'] }"
            :disabled="loading"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item, k in months"
              :key="k"
              :value="k + 1"
            >
              {{ item }}
            </option>
          </Field>

          <ErrorMessage name="parametros.mes" />
        </div>
        <div class="f1">
          <label
            for="ano"
            class="label"
          >
            ano <span class="tvermelho">*</span>
          </label>
          <Field
            id="ano"
            placeholder="2003"
            name="parametros.ano"
            type="number"
            class="inputtext light"
            :class="{ 'error': errors['parametro.ano'] }"
            min="2003"
          />

          <ErrorMessage name="parametros.ano" />
        </div>

        <div class="f1">
          <LabelFromYup
            name="eh_publico"
            :schema="schema"
            required
          />
          <Field
            name="eh_publico"
            as="select"
            class="inputtext light"
            :class="{
              error: errors['eh_publico'],
              loading: chamadasPendentes.planosSimplificados
            }"
            :disabled="chamadasPendentes.planosSimplificados"
          >
            <option :value="null">
              Selecionar
            </option>
            <option :value="true">
              Sim
            </option>
            <option :value="false">
              Não
            </option>
          </Field>
          <div
            v-if="errors['eh_publico']"
            class="error-msg"
          >
            {{ errors['eh_publico'] }}
          </div>
        </div>
      </div>

      <div class="f1">
        <label class="block">
          <Field
            name="parametros.listar_variaveis_regionalizadas"
            type="checkbox"
            :value="true"
            :unchecked-value="false"
            class="inputcheckbox"
          />
          <span :class="{ 'error': errors['parametros.listar_variaveis_regionalizadas'] }">
            Listar variáveis regionalizadas em todos os níveis
          </span>
        </label>
      </div>

      <ErrorMessage name="parametros.listar_variaveis_regionalizadas" />
    </div>

    <div class="mb2">
      <LabelFromYup
        name="meta"
        :schema="schema.fields.parametros"
      />

      <AutocompleteField
        name="parametros.metas"
        :controlador="{ busca: '', participantes: values.parametros.metas || [] }"
        label="titulo"
        :grupo="planosPorId[values.parametros.plano_setorial_id]?.metas || []"
        :class="{
          error: errors['parametros.meta'],
        }"
        :aria-busy="chamadasPendentes.planosSimplificados"
      />

      <ErrorMessage name="parametros.meta" />
    </div>
    <div class="mb2">
      <LabelFromYup
        name="tags"
        :schema="schema.fields.parametros"
      />
      <AutocompleteField
        name="parametros.tags"
        :controlador="{ busca: '', participantes: values.parametros.tags || [] }"
        :grupo="filtradasPorPdM(values.parametros.plano_setorial_id)"
        label="descricao"
        :class="{
          error: errors['parametros.tags'],
          loading: filtradasPorPdM(values.parametros.plano_setorial_id)?.loading,
        }"
      />

      <ErrorMessage name="parametros.tags" />
    </div>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        type="submit"
        class="btn big"
        :disabled="loading || isSubmitting"
      >
        Criar relatório
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
