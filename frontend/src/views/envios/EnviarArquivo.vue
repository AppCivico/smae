<script setup>
import SmallModal from '@/components/SmallModal.vue';
import requestS from '@/helpers/requestS.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useImportaçõesStore } from '@/stores/importacoes.store.ts';
import { usePdMStore } from '@/stores/pdm.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { defineOptions, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  mixed,
  number,
  object,
} from 'yup';

defineOptions({ inheritAttrs: false });

const emit = defineEmits(['enviado']);
const route = useRoute();
const router = useRouter();
const importaçõesStore = useImportaçõesStore();
const PdMStore = usePdMStore();
const PlanosSetoriaisStore = usePlanosSetoriaisStore();
const alertStore = useAlertStore();

const authStore = useAuthStore();

const {
  sistemaCorrente,
} = storeToRefs(authStore);

const baseUrl = `${import.meta.env.VITE_API_URL}`;
const curfile = reactive({});
const erro = ref(null);

let schema = object()
  .shape({
    arquivo: mixed()
      .label('Arquivo')
      .required('Selecione um arquivo'),
  });

function onSubmit(values) {
  const carga = values;

  try {
    curfile.loading = true;
    const formData = new FormData();
    Object.entries(carga).forEach((x) => {
      formData.append(x[0], x[1]);
    });

    requestS.upload(`${baseUrl}/upload`, formData)
      .then(async ({ upload_token: uploadToken }) => {
        if (uploadToken) {
          const enviarArquivo = await importaçõesStore.associarArquivo({
            ...values,
            upload: uploadToken,
          });

          if (!enviarArquivo) {
            throw new Error('Erro ao associar o arquivo');
          }

          emit('enviado');

          alertStore.success('Item adicionado com sucesso!');
          curfile.value = {};
          if (route.meta.rotaDeEscape) {
            router.push({
              name: route.meta.rotaDeEscape,
              query: Object.assign(
                structuredClone(route.query),
                {
                  pdm_id: values.pdm_id || route.query.pdm_id || undefined,
                },
              ),
            });
          }
        } else {
          alertStore.error('`upload_token` ausente da resposta');
          erro.value = '`upload_token` ausente da resposta';
        }
      })
      .finally(() => {
        curfile.loading = false;
      });
  } catch (error) {
    alertStore.error(error);
    curfile.loading = false;
    erro.value = error;
  }
}

function addFile(e) {
  const { files } = e.target;
  curfile.name = files[0].name;
  [curfile.file] = files;
}

switch (route.meta.entidadeMãe || sistemaCorrente.value) {
  case 'programaDeMetas': // entidadeMãe
  case 'ProgramaDeMetas': // sistemaCorrente
  case 'planoSetorial': // entidadeMãe
  case 'PlanoSetorial': // sistemaCorrente
    schema = schema.shape({
      pdm_id: number()
        .label('PdM/Plano setorial')
        .required(),
    });
    if (!PlanosSetoriaisStore.lista.length) {
      PlanosSetoriaisStore.buscarTudo();
    }
    break;

  case 'pdm':
    schema = schema.shape({
      pdm_id: number()
        .label('PdM')
        .required(),
    });
    if (!PdMStore.PdM?.length) {
      PdMStore.getAll();
    }
    break;

  case 'portfolio':
  case 'mdo':
    schema = schema.shape({
      portfolio_id: number()
        .label('Portfólio')
        .required(),
    });
    if (!importaçõesStore.portfoliosPermitidos?.length) {
      importaçõesStore.buscarPortfolios();
    }
    break;

  default:
    break;
}
</script>
<template>
  <SmallModal>
    <div class="flex spacebetween center mb2">
      <h2>Enviar arquivo</h2>
      <hr class="ml2 f1">

      <CheckClose />
    </div>

    <template v-if="!curfile?.loading">
      <Form
        v-slot="{ errors, isSubmitting }"
        :validation-schema="schema"
        @submit="onSubmit"
      >
        <Field
          name="tipo"
          value="IMPORTACAO_ORCAMENTO"
          type="hidden"
        />
        <div
          v-if="schema?.fields?.pdm_id"
          class="flex g2 mb1"
        >
          <div class="f1">
            <LabelFromYup
              for="pdm_id"
              name="pdm_id"
              :schema="schema"
            />
            <Field
              id="pdm_id"
              name="pdm_id"
              as="select"
              class="inputtext light mb1"
              :class="{ 'error': errors['pdm_id'] }"
              :aria-busy="PlanosSetoriaisStore.chamadasPendentes.lista"
              :aria-disabled="PlanosSetoriaisStore.chamadasPendentes.lista"
              :disabled="$route.meta.entidadeMãe === 'pdm' && PdMStore.PdM?.loading"
            >
              <option :value="null">
                Selecionar
              </option>
              <template v-if="$route.meta.entidadeMãe === 'pdm'">
                <option
                  v-for="item in PdMStore.PdM"
                  :key="item.id"
                  :value="item.id"
                  :selected="item.id == $route.query.pdm_id"
                  :disabled="!item.ativo"
                >
                  {{ item.nome }}
                </option>
              </template>
              <template v-else>
                <option
                  v-for="item in PlanosSetoriaisStore.lista"
                  :key="item.id"
                  :value="item.id"
                  :selected="item.id == $route.query.pdm_id"
                  :disabled="!item.ativo"
                >
                  {{ item.nome }}
                </option>
              </template>
            </Field>
            <div class="error-msg">
              {{ errors['pdm_id'] }}
            </div>
            <ErrorMessage
              class="error-msg mb1"
              name="pdm_idarquivo"
            />
          </div>
        </div>

        <div
          v-if="schema?.fields?.portfolio_id"
          class="flex g2"
        >
          <div class="f1">
            <LabelFromYup
              for="portfolio_id"
              name="portfolio_id"
              :schema="schema"
            />
            <Field
              id="portfolio_id"
              name="portfolio_id"
              as="select"
              class="inputtext light mb1"
              :aria-busy="importaçõesStore.chamadasPendentes.portfoliosPermitidos"
              :aria-disabled="importaçõesStore.chamadasPendentes.portfoliosPermitidos"
            >
              <option :value="null">
                Selecionar
              </option>
              <option
                v-for="item in importaçõesStore.portfoliosPermitidos"
                :key="item.id"
                :value="item.id"
                :selected="item.id == $route.query.portfolio_id"
              >
                {{ item.id }} - {{ item.titulo }}
              </option>
            </Field>
            <ErrorMessage
              class="error-msg mb1"
              name="portfolio_id"
            />
          </div>

          <Field
            name="tipo_projeto"
            type="hidden"
            :value="$route.meta.entidadeMãe === 'mdo'
              ? 'MDO'
              : 'PP'"
          />
        </div>

        <div class="flex g2 mb2">
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
    <template v-else-if="curfile?.loading">
      <span class="spinner">Enviando o arquivo</span>
    </template>
    <template v-else-if="importaçõesStore.chamadasPendentes.arquivos">
      <span class="spinner">Associando o arquivo</span>
    </template>
    <template v-if="erro">
      <div class="error p1">
        <div class="error-msg">
          {{ erro }}
        </div>
      </div>
    </template>
  </SmallModal>
</template>
