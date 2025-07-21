<script setup>
import { ref } from 'vue';
import * as Yup from 'yup';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { Field, Form } from 'vee-validate';
import {
  useAlertStore,
  useAtividadesStore, useCronogramasStore,
  useIniciativasStore,
  useMetasStore,
} from '@/stores';
import { router } from '@/router';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';

const alertStore = useAlertStore();
const route = useRoute();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const { atividade_id } = route.params;
const { cronograma_id } = route.params;

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
MetasStore.getById(meta_id);

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}${iniciativa_id ? `/iniciativas/${iniciativa_id}` : ''}${atividade_id ? `/atividades/${atividade_id}` : ''}`;
const parentVar = atividade_id ?? iniciativa_id ?? meta_id ?? false;
const parentField = atividade_id
  ? 'atividade_id'
  : iniciativa_id
    ? 'iniciativa_id'
    : meta_id
      ? 'meta_id'
      : false;
const parentLabel = ref(atividade_id ? '-' : iniciativa_id ? '-' : meta_id ? 'Meta' : false);
(async () => {
  await MetasStore.getPdM();
  if (atividade_id) parentLabel.value = activePdm.value.rotulo_atividade;
  else if (iniciativa_id) parentLabel.value = activePdm.value.rotulo_iniciativa;
})();

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
if (iniciativa_id) IniciativasStore.getById(meta_id, iniciativa_id);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);
if (atividade_id) AtividadesStore.getById(iniciativa_id, atividade_id);

const parentItem = atividade_id
  ? singleAtividade
  : iniciativa_id
    ? singleIniciativa
    : meta_id
      ? singleMeta
      : false;

const CronogramasStore = useCronogramasStore();
const { singleCronograma } = storeToRefs(CronogramasStore);

const schema = Yup.object().shape({
  descricao: Yup.string().required('Preencha o código'), //  : "string",
  observacao: Yup.string().nullable(), //  : "string",
  regionalizavel: Yup.string().nullable(),
  nivel_regionalizacao: Yup.string().nullable().when('regionalizavel', (regionalizavel, field) => (regionalizavel == '1'
    ? field.required('Selecione o nível')
    : field)),
});

let title = 'Adicionar Cronograma';
const regionalizavel = ref(singleCronograma.value.regionalizavel);

if (cronograma_id) {
  title = 'Editar Cronograma';
  CronogramasStore.getById(parentVar, parentField, cronograma_id);
}

async function onSubmit(values) {
  try {
    let msg;
    let r;
    values.regionalizavel = !!values.regionalizavel;
    values.nivel_regionalizacao = values.regionalizavel
      ? Number(values.nivel_regionalizacao)
      : null;

    // Parent
    values[parentField] = Number(parentVar);

    if (cronograma_id) {
      if (singleCronograma.value.id) {
        r = await CronogramasStore.update(singleCronograma.value.id, values);
        CronogramasStore.clear();
        msg = 'Dados salvos com sucesso!';
      }
    } else {
      r = await CronogramasStore.insert(values);
      CronogramasStore.clear();
      msg = 'Item adicionado com sucesso!';
    }
    if (r) {
      if (route.meta.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      } else if (route.meta.entidadeMãe === 'pdm') {
        router.push(`${parentlink}/cronograma`);
      } else {
        throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
      }
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}
async function checkDelete(id) {
  if (id) {
    if (singleCronograma.value.id) {
      alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
        if (await CronogramasStore.delete(id)) {
          CronogramasStore.clear();

          if (route.meta.rotaDeEscape) {
            router.push({ name: route.meta.rotaDeEscape });
          } else if (route.meta.entidadeMãe === 'pdm') {
            await router.push(`${parentlink}/cronograma`);
          } else {
            throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
          }
          alertStore.success('Cronograma removido.');
        }
      }, 'Remover');
    }
  }
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    alertStore.$reset();
    if (route.meta.rotaDeEscape) {
      router.push({
        name: route.meta.rotaDeEscape,

      });
    } else if (route.meta.entidadeMãe === 'pdm') {
      router.push({
        path: `${parentlink}/cronograma`,

      });
    } else {
      throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
    }
  });
}
</script>

<template>
  <MigalhasDeMetas class="mb1" />

  <div class="flex spacebetween center">
    <TítuloDePágina
      :ícone="activePdm?.logo"
    >
      {{ title }}
    </TítuloDePágina>
    <hr class="ml2 f1">
    <button
      class="btn round ml2"
      @click="checkClose"
    >
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>
  </div>
  <div
    v-if="parentItem"
    class="t24 mb2"
  >
    {{ parentLabel }} {{ parentItem.codigo }} {{ parentItem.titulo }}
  </div>

  <template v-if="!(singleCronograma?.loading || singleCronograma?.error)">
    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      :initial-values="cronograma_id ? singleCronograma : {}"
      @submit="onSubmit"
    >
      <div class="f1">
        <label class="label">Descrição <span class="tvermelho">*</span></label>

        <SmaeText
          name="descricao"
          as="textarea"
          anular-vazio
          :rows="3"
          :maxlength="1000"
          class="inputtext light mb1"
          :class="{ error: errors.descricao }"
        />

        <div class="error-msg">
          {{ errors.descricao }}
        </div>
      </div>
      <div class="f2">
        <label class="label">Observação</label>

        <SmaeText
          name="observacao"
          as="textarea"
          anular-vazio
          :rows="3"
          :maxlength="1000"
          class="inputtext light mb1"
          :class="{ error: errors.observacao }"
        />

        <div class="error-msg">
          {{ errors.observacao }}
        </div>
      </div>

      <hr class="mt2 mb2">

      <div
        v-if="!cronograma_id"
        class=""
      >
        <div class="mb1">
          <label class="block">
            <Field
              v-model="regionalizavel"
              name="regionalizavel"
              type="checkbox"
              value="1"
              class="inputcheckbox"
            /><span :class="{ 'error': errors.regionalizavel }">Cronograma regionalizável</span>
          </label>
          <div class="error-msg">
            {{ errors.regionalizavel }}
          </div>
        </div>
        <div
          v-if="regionalizavel"
          class=""
        >
          <label class="label">Nível de regionalização <span class="tvermelho">*</span></label>
          <Field
            v-model="nivel_regionalizacao"
            name="nivel_regionalizacao"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.nivel_regionalizacao }"
          >
            <option value="">
              Selecione
            </option>
            <option value="2">
              Região
            </option>
            <option value="3">
              Subprefeitura
            </option>
            <option value="4">
              Distrito
            </option>
          </Field>
          <div class="error-msg">
            {{ errors.nivel_regionalizacao }}
          </div>
        </div>
      </div>
      <div
        v-else
        class=""
      >
        <div class="mb1">
          <label class="flex center">
            <Field
              v-slot="{ field }"
              name="regionalizavel"
              type="checkbox"
              :value="true"
            >
              <input
                type="checkbox"
                name="regionalizavel"
                v-bind="field"
                :value="true"
                class="inputcheckbox"
                disabled
              >
              <span>Cronograma regionalizável</span>
            </Field>
            <div class="tipinfo ml1"><svg
              width="20"
              height="20"
            ><use xlink:href="#i_i" /></svg><div>Não é permitida a troca da regionalização</div></div>
          </label>
          <div class="error-msg">
            {{ errors.regionalizavel }}
          </div>
        </div>

        <div v-if="singleCronograma.nivel_regionalizacao">
          <label class="label">Nível de regionalização <span class="tvermelho">*</span></label>
          <Field
            v-model="nivel_regionalizacao"
            name="nivel_regionalizacao"
            disabled
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.nivel_regionalizacao }"
          >
            <option value="">
              Selecione
            </option>
            <option value="2">
              Região
            </option>
            <option value="3">
              Subprefeitura
            </option>
            <option value="4">
              Distrito
            </option>
          </Field>
          <div class="error-msg">
            {{ errors.nivel_regionalizacao }}
          </div>
        </div>
      </div>

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </Form>
  </template>
  <template v-if="singleCronograma?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="singleCronograma?.error">
    <div class="error p1">
      <div class="error-msg">
        {{ singleCronograma.error }}
      </div>
    </div>
  </template>
  <template v-if="(!cronograma_id && singleCronograma.length)">
    <div class="error p1">
      <div class="error-msg">
        Somente um indicador por meta
      </div>
    </div>
    <div class="tc">
      <SmaeLink
        :to="`${parentlink}`"
        class="btn big mt1 mb1"
      >
        <span>Voltar</span>
      </SmaeLink>
    </div>
  </template>

  <template v-if="cronograma_id && singleCronograma.id && cronograma_id == singleCronograma.id">
    <hr class="mt2 mb2">
    <button
      class="btn amarelo big"
      @click="checkDelete(singleCronograma.id)"
    >
      Remover item
    </button>
  </template>
</template>
