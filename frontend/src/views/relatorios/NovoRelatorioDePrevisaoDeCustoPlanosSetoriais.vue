<script setup>
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { relatórioDePrevisãoDeCustoPlanosSetoriais as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import { usePdMStore } from '@/stores/pdm.store';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import { useTagsStore } from '@/stores/tags.store';

const alertStore = useAlertStore();
const PdMStore = usePdMStore();
const relatoriosStore = useRelatoriosStore();
const route = useRoute();
const router = useRouter();
const projetosStore = useProjetosStore();
const TagsStore = useTagsStore();
const { filtradasPorPdM } = storeToRefs(TagsStore);
const { loading } = storeToRefs(relatoriosStore);

const {
  chamadasPendentes,
  pdmsPorId,
  metaSimplificada,
} = storeToRefs(projetosStore);

const iniciativasPorId = computed(() => (Array.isArray(metaSimplificada.value?.iniciativas)
  ? metaSimplificada.value.iniciativas.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {})
  : {}));

const currentYear = new Date().getFullYear();

const initialValues = computed(() => ({
  fonte: 'PSPrevisaoCusto',
  parametros: {
    ano: currentYear,
    iniciativa_id: null,
    atividade_id: null,
    pdm_id: null,
    meta_id: null,
    tags: [],
  },
  eh_publico: null,
}));

async function buscarMetaSimplificada(valorOuEvento) {
  const idDaMeta = valorOuEvento.target?.value || valorOuEvento;

  if (idDaMeta) {
    await projetosStore.buscarMetaSimplificada({ meta_ids: idDaMeta });
  }
}

async function onSubmit(values) {
  const carga = values;
  try {
    switch (true) {
      case !!carga.atividade_id:
        delete carga.iniciativa_id;
        delete carga.meta_id;
        break;

      case !!carga.iniciativa_id:
        delete carga.meta_id;
        delete carga.atividade_id;
        break;

      case !!carga.meta_id:
        delete carga.atividade_id;
        delete carga.iniciativa_id;
        break;

      default:
        break;
    }

    const r = await relatoriosStore.insert(carga);
    const msg = 'Relatório em processamento, acompanhe na tela de listagem';

    if (r === true) {
      alertStore.success(msg);
      await router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function iniciar() {
  projetosStore.buscarPdms({ apenas_pdm: false });
  PdMStore.getAll({ apenas_pdm: false }).then(() => {
    const currentPdM = PdMStore.PdM.find((x) => !!x.ativo);
    if (currentPdM?.id) {
      loading.value = false;
      initialValues.value.parametros.pdm_id = currentPdM.id;
    }
  });
}

iniciar();
</script>

<template>
  <CabecalhoDePagina :formulario-sujo="false" />

  <p class="texto--explicativo">
    Será gerada uma planilha contendo os registros de previsão de custo
    registrados nas metas
  </p>

  <Form
    v-slot="{ errors, isSubmitting, resetField, setFieldValue, values }"
    :validation-schema="schema"
    :initial-values="initialValues"
    @submit="onSubmit"
  >
    <div class="flex g2 mb2">
      <div class="f1">
        <LabelFromYup
          name="pdm_id"
          :schema="schema.fields.parametros"
        >
          {{ $route.meta.tituloSingular }}
          <span class="tvermelho">*</span>
        </LabelFromYup>
        <Field
          v-model="initialValues.parametros.pdm_id"
          name="parametros.pdm_id"
          as="select"
          class="inputtext light
            mb1"
          :class="{ 'error': errors['parametros.pdm_id'] }"
          :disabled="loading"
          @update:model-value="resetField('parametros.metas', { value: [] })"
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
        <div
          v-if="errors['parametros.pdm_id']"
          class="error-msg"
        >
          {{ errors['parametros.pdm_id'] }}
        </div>
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="meta_id"
          :schema="schema.fields.parametros"
        />

        <Field
          name="parametros.meta_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.meta_id'],
          }"
          :disabled="!pdmsPorId[values.parametros.pdm_id]?.metas?.length"
          @change="buscarMetaSimplificada($event); setFieldValue('parametros.iniciativa_id', null)"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in pdmsPorId[values.parametros.pdm_id]?.metas"
            :key="item.id"
            :value="item.id"
            :title="item.titulo"
          >
            {{ item.codigo }} - {{ truncate(item.titulo, 36) }}
          </option>
        </Field>
        <div
          v-if="errors['parametros.meta_id']"
          class="error-msg"
        >
          {{ errors['parametros.meta_id'] }}
        </div>
      </div>
    </div>

    <div
      class="flex g2"
    >
      <div class="f1 mb1">
        <LabelFromYup
          name="iniciativa_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.iniciativa_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.iniciativa_id'],
            loading: chamadasPendentes.metaSimplificada
          }"
          :disabled="!metaSimplificada.iniciativas?.length"
          @change="setFieldValue('parametros.atividade_id', null)"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in metaSimplificada.iniciativas"
            :key="item.id"
            :value="item.id"
            :title="item.titulo"
          >
            {{ item.codigo }} - {{ truncate(item.titulo, 36) }}
          </option>
        </Field>
        <div
          v-if="errors['parametros.iniciativa_id']"
          class="error-msg"
        >
          {{ errors['parametros.iniciativa_id'] }}
        </div>
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="atividade_id"
          :schema="schema.fields.parametros"
        />

        <Field
          name="parametros.atividade_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.atividade_id'],
            loading: chamadasPendentes.metaSimplificada
          }"
          :disabled="!iniciativasPorId[values.parametros.iniciativa_id]?.atividades.length"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in iniciativasPorId[values.parametros.iniciativa_id]?.atividades"
            :key="item.id"
            :value="item.id"
            :title="item.titulo"
          >
            {{ item.codigo }} - {{ truncate(item.titulo, 36) }}
          </option>
        </Field>
        <div
          v-if="errors['parametros.atividade_id']"
          class="error-msg"
        >
          {{ errors['parametros.atividade_id'] }}
        </div>
      </div>
    </div>

    <div
      class="flex g2 mb2"
    >
      <div class="f1">
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
      <div class="f1">
        <LabelFromYup
          name="ano"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.ano"
          type="text"
          class="inputtext light mb2"
          maxlength="4"
          :class="{ 'error': errors['parametros.ano'] }"
        />
        <div
          v-if="errors['parametros.ano']"
          class="error-msg"
        >
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
          :class="{
            error: errors['eh_publico'],
            loading: loading
          }"
          :disabled="loading"
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

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        type="submit"
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
      >
        Criar relatório
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
