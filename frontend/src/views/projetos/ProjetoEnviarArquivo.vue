<script setup>
import CheckClose from '@/components/CheckClose.vue';
import LabelFromYup from '@/components/LabelFromYup.vue';
import { arquivo as schema } from '@/consts/formSchemas';
import requestS from '@/helpers/requestS.ts';
import {
  useAlertStore,
  useDocumentTypesStore,
} from '@/stores';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const route = useRoute();
const router = useRouter();
const projetosStore = useProjetosStore();
const alertStore = useAlertStore();
const documentTypesStore = useDocumentTypesStore();
const { tempDocumentTypes } = storeToRefs(documentTypesStore);
documentTypesStore.clear();
documentTypesStore.filterDocumentTypes();

const { chamadasPendentes, erro, diretóriosConsolidados } = storeToRefs(projetosStore);

const curfile = reactive({});
const diretorioCaminho = ref('');

async function onSubmit(values) {
  const carga = values;

  try {
    curfile.loading = true;
    carga.tipo = 'DOCUMENTO';
    const formData = new FormData();
    Object.entries(carga).forEach((x) => {
      formData.append(x[0], x[1]);
    });

    const u = await requestS.upload(`${baseUrl}/upload`, formData);
    if (u.upload_token) {
      if (await projetosStore.enviarArquivo({
        upload_token: u.upload_token,
        diretorio_caminho: diretorioCaminho.value,
      })) {
        alertStore.success('Item adicionado com sucesso!');

        const rotaDeEscape = route.meta?.rotaDeEscape;
        curfile.loading = false;

        projetosStore.buscarDiretórios();
        projetosStore.buscarArquivos();

        if (rotaDeEscape) {
          router.push(typeof rotaDeEscape === 'string' ? { name: rotaDeEscape } : rotaDeEscape);
        }
      }
    } else {
      curfile.loading = false;
    }
  } catch (error) {
    alertStore.error(error);
    curfile.loading = false;
  }
}

function addFile(e) {
  const { files } = e.target;
  curfile.name = files[0].name;
  [curfile.file] = files;
}
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h2>{{ $route.meta.título || 'Adicionar arquivo' }}</h2>
    <hr class="ml2 f1">

    <CheckClose />
  </div>
  <template v-if="!(chamadasPendentes?.arquivos?.loading || erro) && !curfile?.loading">
    <Form
      v-slot="{ errors, isSubmitting, values }"
      :validation-schema="schema"
      :initial-values="{
        diretorio_caminho: route.query?.diretorio_caminho
      }"
      @submit="onSubmit"
    >
      <div class="flex g2">
        <div class="f1">
          <LabelFromYup
            name="descricao"
            :schema="schema"
          />
          <Field
            name="descricao"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.descricao }"
          />
          <div class="error-msg">
            {{ errors.descricao }}
          </div>
        </div>
        <div class="f1">
          <LabelFromYup
            name="tipo_documento_id"
            :schema="schema"
          />
          <Field
            name="tipo_documento_id"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.tipo_documento_id }"
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
          <div class="error-msg">
            {{ errors.tipo_documento_id }}
          </div>
        </div>
      </div>

      <div class="flex g2 mb2">
        <div class="f1">
          <LabelFromYup
            name="diretorio_caminho"
            :schema="schema"
          />
          <Field
            v-model="diretorioCaminho"
            name="diretorio_caminho"
            class="inputtext light mb1"
            list="diretóriosConsolidados"
            autocomplete="off"
            :class="{ 'error': errors.diretorio_caminho }"
            @update:model-value="() => values.diretorio_caminho =
              values.diretorio_caminho.trim()"
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

        <div class="f1">
          <LabelFromYup
            name="arquivo"
            :schema="schema"
          />
          <label
            v-if="!curfile.name"
            class="addlink"
            :class="{ 'error': errors.arquivo }"
          ><svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg><span>Selecionar arquivo</span><input
            type="file"
            :onchange="addFile"
            style="display:none;"
          ></label>

          <div v-else-if="curfile.name">
            <span>{{ curfile?.name?.slice(0, 30) }}</span> <a
              class="addlink"
              @click="curfile.name = ''"
            ><svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg></a>
          </div>
          <Field
            v-model="curfile.file"
            name="arquivo"
            type="hidden"
          />
          <div class="error-msg">
            {{ errors.arquivo }}
          </div>
        </div>
      </div>
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
    </Form>
  </template>
  <template v-if="chamadasPendentes?.arquivos">
    <span class="spinner">Carregando</span>
  </template>
  <template v-else-if="curfile?.loading">
    <span class="spinner">Enviando o arquivo</span>
  </template>
  <template v-if="erro">
    <div class="error p1">
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>
  </template>
</template>
