<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { relatórioMensal as schema } from '@/consts/formSchemas';
import months from '@/consts/months';
import { useAlertStore } from '@/stores/alert.store';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import { useMetasStore } from '@/stores/metas.store';
import { usePaineisStore } from '@/stores/paineis.store';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import { usePdMStore } from '@/stores/pdm.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import { useTagsStore } from '@/stores/tags.store';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CheckClose from '../../components/CheckClose.vue';

const TagsStore = useTagsStore();
const { filtradasPorPdM } = storeToRefs(TagsStore);
const alertStore = useAlertStore();
const PdMStore = usePdMStore();
const PainéisStore = usePaineisStore();
const MetasStore = useMetasStore();
const relatoriosStore = useRelatoriosStore();
const route = useRoute();
const router = useRouter();
const { loading } = storeToRefs(relatoriosStore);

const initialValues = ref({
  fonte: 'MonitoramentoMensal',
  parametros: {
    tipo: 'Analitico',
    metas_ids: [],
    pdm_id: null,
    ano: 2003,
    tags: [],
    paineis: [],
  },
});

async function onSubmit(values) {
  const carga = values;
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

onMounted(async () => {
  // esperando porque já chama o PdMStore.getAll() e pode travar a execução
  // direta mais à frente.
  await TagsStore.getAll();

  if (!MetasStore.activePdm.id) {
    await MetasStore.getPdM();
  }

  PdMStore.getAll().then(() => {
    const currentPdM = PdMStore.PdM.find((x) => !!x.ativo);
    if (currentPdM?.id) {
      loading.value = false;
      initialValues.value.parametros.pdm_id = currentPdM.id;
    }
  });

  PainéisStore.getAll();
  MetasStore.getAll();

  watch(() => initialValues.value.parametros.pdm_id, (newId, oldId) => {
    if (newId !== oldId) {
      MetasStore.getfilteredMetasByPdM(newId);
    }
  });
});
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título || $route.name }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting, resetField, values }"
    :validation-schema="schema"
    :initial-values="initialValues"
    @submit="onSubmit"
  >
    <div class="flex g2 mb2">
      <div class="f1">
        <label class="label">
          <abbr title="Programa de metas">PdM</abbr>
          <span class="tvermelho">*</span>
        </label>
        <Field
          v-model="initialValues.parametros.pdm_id"
          name="parametros.pdm_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            loading: loading,
            error: errors['parametros.pdm_id']
          }"
          :disabled="loading"
          @update:model-value="resetField('parametros.tags', { value: [] })"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in PdMStore.PdM"
            :key="item.id"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors['parametros.pdm_id'] }}
        </div>
      </div>

      <div class="f1">
        <label
          for="mes"
          class="label"
        >
          mês <span class="tvermelho">*</span>
        </label>
        <Field
          name="parametros.mes"
          as="select"
          class="inputtext light mb1"
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
        <div class="error-msg">
          {{ errors['parametros.mes'] }}
        </div>
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
          class="inputtext light mb1"
          :class="{ 'error': errors['parametro.ano'] }"
          min="2003"
        />
        <div class="error-msg">
          {{ errors['parametros.ano'] }}
        </div>
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
        >
          <option
            value=""
            disabled
          >
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
    <div class="mb2">
      <LabelFromYup
        name="meta"
        :schema="schema.fields.parametros"
      />

      <AutocompleteField
        name="parametros.metas_ids"
        :controlador="{ busca: '', participantes: values.parametros.metas_ids || [] }"
        label="titulo"
        :grupo="MetasStore.Metas"
        :class="{
          error: errors['parametros.meta'],
          loading: MetasStore.Metas?.loading,
        }"
      />

      <div
        v-if="errors['parametros.tags']"
        class="error-msg"
      >
        {{ errors['parametros.tags'] }}
      </div>
    </div>
    <div class="mb2">
      <LabelFromYup
        name="tags"
        :schema="schema.fields.parametros"
      />
      <AutocompleteField
        name="parametros.tags"
        :controlador="{ busca: '', participantes: values.parametros.tags || [] }"
        :grupo="filtradasPorPdM(values.parametros.pdm_id)"
        label="descricao"
        :class="{
          error: errors['parametros.tags'],
          loading: filtradasPorPdM(values.parametros.pdm_id)?.loading,
        }"
      />

      <div
        v-if="errors['parametros.tags']"
        class="error-msg"
      >
        {{ errors['parametros.tags'] }}
      </div>
    </div>

    <div class="mb2">
      <LabelFromYup
        name="paineis"
        :schema="schema.fields.parametros"
      />
      <AutocompleteField
        name="parametros.paineis"
        :controlador="{ busca: '', participantes: values.parametros.paineis || [] }"
        :grupo="PainéisStore.Paineis"
        label="nome"
        :class="{
          error: errors['parametros.paineis'],
          loading: PainéisStore.Paineis?.loading,
        }"
      />

      <div
        v-if="errors['parametros.paineis']"
        class="error-msg"
      >
        {{ errors['parametros.paineis'] }}
      </div>
    </div>

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        type="submit"
        class="btn big"
        :disabled="loading ||
          isSubmitting"
      >
        Criar relatório
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
