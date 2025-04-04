<script setup>
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import { arquivo as schemaDoFormulário } from '@/consts/formSchemas';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import requestS from '@/helpers/requestS.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useDocumentTypesStore } from '@/stores/documentTypes.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import {
  computed,
  reactive,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const route = useRoute();
const router = useRouter();
const transferenciasStore = useTransferenciasVoluntariasStore();
const alertStore = useAlertStore();
const documentTypesStore = useDocumentTypesStore();
const { tempDocumentTypes } = storeToRefs(documentTypesStore);
documentTypesStore.clear();
documentTypesStore.filterDocumentTypes();

const {
  arquivosPorId, chamadasPendentes, erro, diretóriosConsolidados,
} = storeToRefs(transferenciasStore);

const curfile = reactive({});

const arquivo = computed(() => arquivosPorId.value?.[route.params?.arquivoId]);
const éEdição = !!route.params?.arquivoId;
const schema = computed(() => schemaDoFormulário(éEdição));
const arquivoParaEdição = computed(() => ({
  arquivo_id: arquivo.value?.arquivo.id,
  upload_token: arquivo.value?.arquivo.download_token,
  descricao: arquivo.value?.descricao || '',
  data: dateTimeToDate(arquivo.value?.data) || null,
  diretorio_caminho:
    arquivo.value?.arquivo.diretorio_caminho || route.query?.diretorio_caminho,
}));

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  validationSchema: schema.value,
  initialValues: arquivoParaEdição,
});
// PRA-FAZER: simplificar o gerenciamento de valores
const onSubmit = handleSubmit.withControlled(async () => {
  const carga = { ...values };
  try {
    curfile.loading = true;

    if (!éEdição) {
      carga.tipo = 'DOCUMENTO';
      const formData = new FormData();
      Object.entries(carga).forEach((x) => {
        formData.append(x[0], x[1]);
      });
      const u = await requestS.upload(`${baseUrl}/upload`, formData);

      carga.upload_token = u.upload_token;
    }

    if (
      await transferenciasStore.associarArquivo(carga, route.params?.arquivoId)
    ) {
      alertStore.success(
        éEdição ? 'Arquivo atualizado!' : 'Arquivo associado!',
      );

      const rotaDeEscape = route.meta?.rotaDeEscape;
      curfile.loading = false;

      transferenciasStore.buscarArquivos();

      if (rotaDeEscape) {
        router.push(
          typeof rotaDeEscape === 'string'
            ? { name: rotaDeEscape }
            : rotaDeEscape,
        );
      }
    }

    curfile.loading = false;
  } catch (error) {
    alertStore.error(error);
    curfile.loading = false;
  }
});

function addFile(e) {
  const { files } = e.target;
  curfile.name = files[0].name;
  [curfile.file] = files;
}

const formularioSujo = useIsFormDirty();

watch(arquivoParaEdição, (novosValores) => {
  resetForm({ values: novosValores });
});
</script>

<template>
  <div class="flex spacebetween center mb2">
    <TituloDaPagina />
    <hr class="ml2 f1">
    <CheckClose :formulario-sujo="formularioSujo" />
  </div>

  <form
    v-if="!(chamadasPendentes?.arquivos?.loading || erro) && !curfile?.loading"
    @submit.prevent="onSubmit"
  >
    <div class="flex g2">
      <div class="f1">
        <LabelFromYup
          name="descricao"
          :schema="schema"
        />
        <Field
          name="descricao"
          as="textarea"
          class="inputtext light mb1"
          :class="{ 'error': errors.descricao }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="descricao"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1">
        <LabelFromYup
          name="data"
          :schema="schema"
        />
        <Field
          name="data"
          type="date"
          class="inputtext light mb1"
          maxlength="10"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
        />

        <ErrorMessage
          class="error-msg mb1"
          name="data"
        />
      </div>

      <div
        v-if="!values.arquivo_id"
        class="f1"
      >
        <LabelFromYup
          name="tipo_documento_id"
          :schema="schema"
        >
          {{ schema.fields.tipo_documento_id.spec.label }}
          <span class="tvermelho">*</span>
        </LabelFromYup>
        <Field
          name="tipo_documento_id"
          as="select"
          :disabled="!!values.arquivo_id"
          class="inputtext light mb1"
          :class="{ error: errors.tipo_documento_id }"
        >
          <option value="">
            Selecione
          </option>
          <option
            v-for="d in tempDocumentTypes"
            :key="d.id"
            :value="d.id"
          >
            {{ d.titulo }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb1"
          name="tipo_documento_id"
        />
      </div>
    </div>

    <div class="flex g2 mb2">
      <div class="f1">
        <LabelFromYup
          :schema="schema"
          name="diretorio_caminho"
        >
          {{ schema.fields.diretorio_caminho.spec.label }}
          <small class="t13 tc500 lc">(níveis representados por <code>/</code>)</small>
        </LabelFromYup>
        <Field
          id="diretorio_caminho"
          name="diretorio_caminho"
          class="inputtext light mb1"
          list="diretóriosConsolidados"
          autocomplete="off"
          :class="{ 'error': errors.diretorio_caminho }"
        />
        <ErrorMessage
          class="error-msg"
          name="diretorio_caminho"
        />
      </div>

      <datalist id="diretóriosConsolidados">
        <option
          v-for="diretório in diretóriosConsolidados"
          :key="diretório"
          :value="diretório"
        />
      </datalist>
      <div
        v-if="!values.arquivo_id"
        class="f1"
      >
        <LabelFromYup
          name="arquivo"
          :schema="schema"
        >
          {{ schema.fields.arquivo.spec.label }}
          <span class="tvermelho">*</span>
        </LabelFromYup>
        <label
          v-if="!curfile.name"
          class="addlink"
          :class="{ error: errors.arquivo }"
          tabindex="0"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg>
          <span>Selecionar arquivo</span>
          <input
            type="file"
            :onchange="addFile"
            :disabled="!!values.arquivo_id"
            style="display: none"
          >
        </label>

        <div v-else-if="curfile.name">
          <span>{{ curfile?.name?.slice(0, 30) }}</span>456
          <a
            class="addlink"
            @click="curfile.name = ''"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </a>
        </div>
        <Field
          v-model="curfile.file"
          name="arquivo"
          type="hidden"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="arquivo"
        />
      </div>
    </div>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="
          Object.keys(errors)?.length
            ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
            : null
        "
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>

  <LoadingComponent v-if="chamadasPendentes?.arquivos" />

  <LoadingComponent v-else-if="curfile?.loading">
    Enviando o arquivo
  </LoadingComponent>

  <ErrorComponent
    v-if="erro"
  >
    {{ erro }}
  </ErrorComponent>
</template>
