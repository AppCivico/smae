<script setup>
import { router } from '@/router';
import {
  useAlertStore,
  useAtividadesStore, useCronogramasStore,
  useEditModalStore,
  useEtapasStore,
  useIniciativasStore,
  useMetasStore,
} from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import * as Yup from 'yup';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const props = defineProps(['props']);
const recorte = ref(props?.props?.recorte);

const route = useRoute();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const { atividade_id } = route.params;
const { cronograma_id } = route.params;
const { etapa_id } = route.params;
const currentEdit = route.path.slice(0, route.path.indexOf('/cronograma') + 11);
if (!cronograma_id) router.push(currentEdit);

const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);

const parentVar = atividade_id ?? iniciativa_id ?? meta_id ?? false;
const parentField = atividade_id ? 'atividade_id' : iniciativa_id ? 'iniciativa_id' : meta_id ? 'meta_id' : false;
const parentLabel = ref(recorte.value);
const subtitle = ref(`A partir de ${parentLabel.value}`);
(async () => {
  await MetasStore.getPdM();
  if (recorte.value == 'atividade') { parentLabel.value = activePdm.value.rotulo_atividade; } else if (recorte.value == 'iniciativa') { parentLabel.value = activePdm.value.rotulo_iniciativa; }
  subtitle.value = `A partir de ${parentLabel.value}`;
})();

const IniciativasStore = useIniciativasStore();
const { Iniciativas } = storeToRefs(IniciativasStore);
if (!iniciativa_id) IniciativasStore.getAll(meta_id);

const AtividadesStore = useAtividadesStore();
const { Atividades } = storeToRefs(AtividadesStore);
if (iniciativa_id) AtividadesStore.getAll(iniciativa_id);

const CronogramasStore = useCronogramasStore();
const EtapasStore = useEtapasStore();
const { Etapas, singleMonitoramento } = storeToRefs(EtapasStore);
EtapasStore.clearEdit();

const cronograma_sel = ref({});
const etapa_sel = ref({});
const level_ini = ref(0);
const level_ati = ref(0);
if (iniciativa_id) { level_ini.value = iniciativa_id; }

let title = 'Monitorar etapa';
const inativo = ref(singleMonitoramento.value.inativo);
const virtualParent = ref({
  ponderador: 1,
});
if (etapa_id) {
  title = 'Editar monitoramento de etapa';
  subtitle.value = '';
  (async () => {
    if (!singleMonitoramento.value.id) await EtapasStore.getMonitoramento(cronograma_id, etapa_id);
    subtitle.value = singleMonitoramento.value?.etapa?.titulo;
    inativo.value = singleMonitoramento.value.inativo ? '1' : false;
  })();
}

const schema = Yup.object().shape({
  inativo: Yup.string().nullable(),
  ordem: Yup.string().nullable(),
});

async function onSubmit(values) {
  try {
    let msg;
    let r;
    let rota;

    const newvalues = {
      cronograma_id: Number(cronograma_id),
      etapa_id: values.etapa_id ? Number(values.etapa_id) : Number(etapa_sel.value),
      inativo: !!values.inativo,
      ordem: Number(values.ordem) ?? null,
    };

    if (!newvalues.cronograma_id) throw 'Nenhum cronograma encontrado';
    if (!newvalues.etapa_id) throw 'Selecione uma etapa';

    r = await EtapasStore.monitorar(newvalues);
    msg = 'Monitorando etapa';
    rota = currentEdit;
    if (r) {
      EtapasStore.clear();
      CronogramasStore.clear();
      (async () => {
        await EtapasStore.getAll(cronograma_id);
        CronogramasStore.getById(parentVar, parentField, cronograma_id);
      })();
      alertStore.success(msg);
      editModalStore.clear();

      if (route.meta.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      } else if (route.meta.entidadeMãe === 'pdm') {
        if (rota) router.push(rota);
      } else {
        throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    editModalStore.clear();
    alertStore.clear();
    router.go(-1);
  });
}
async function lastlevel() {
  (async () => {
    if (level_ini.value) {
      if (recorte.value == 'atividade') {
        if (!Atividades.value[level_ini.value]) AtividadesStore.getAll(level_ini.value);
        if (level_ati.value) {
          cronograma_sel.value = await CronogramasStore.getItemByParent(level_ati.value, 'atividade_id');
          await CronogramasStore.getEtapasItemsByCron(cronograma_sel.value?.id);
        }
      } else {
        cronograma_sel.value = await CronogramasStore.getItemByParent(level_ini.value, 'iniciativa_id');
        await CronogramasStore.getEtapasItemsByCron(cronograma_sel.value?.id);
      }
    }
  })();
}
lastlevel();
</script>
<template>
  <div class="flex spacebetween center">
    <h2>{{ title }}</h2>
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
  <h3 v-if="subtitle">
    {{ subtitle }}
  </h3>
  <div class="mb2" />
  <template v-if="etapa_id">
    <template v-if="!(singleMonitoramento?.loading || singleMonitoramento?.error)">
      <Form
        v-slot="{ errors, isSubmitting }"
        :validation-schema="schema"
        :initial-values="etapa_id ? singleMonitoramento : virtualParent"
        @submit="onSubmit"
      >
        <div class="mb2">
          <label class="block">
            <Field
              v-model="inativo"
              name="inativo"
              type="checkbox"
              value="1"
              class="inputcheckbox"
            />
            <span :class="{ 'error': errors.inativo }">Inativar monitoramento</span>
          </label>
          <div class="error-msg">
            {{ errors.inativo }}
          </div>
        </div>

        <div class="flex g2">
          <div class="f1">
            <label class="label">Ordem</label>
            <Field
              name="ordem"
              type="number"
              class="inputtext light mb1"
              :class="{ 'error': errors.ordem }"
            />
            <div class="error-msg">
              {{ errors.ordem }}
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
    <template v-if="singleMonitoramento?.loading">
      <span class="spinner">Carregando</span>
    </template>
    <template v-if="singleMonitoramento?.error || error">
      <div class="error p1">
        <div class="error-msg">
          {{ singleMonitoramento.error ?? error }}
        </div>
      </div>
    </template>
  </template>
  <template v-else>
    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      @submit="onSubmit"
    >
      <input
        type="hidden"
        name="cronograma_id"
        :value="cronograma_id"
      >

      <label class="label">Iniciativa <span class="tvermelho">*</span></label>
      <select
        v-if="!iniciativa_id"
        v-model="level_ini"
        class="inputtext light mb1"
        placeholder="Test"
        @change="lastlevel"
      >
        <option value="0">
          Selecione
        </option>
        <option
          v-for="r in Iniciativas[meta_id]"
          :key="r.id"
          :value="r.id"
        >
          {{ r.titulo }}
        </option>
      </select>

      <template v-if="recorte == 'atividade'">
        <label class="label">Atividade <span class="tvermelho">*</span></label>
        <select
          v-if="level_ini"
          v-model="level_ati"
          class="inputtext light mb1"
          placeholder="Test"
          @change="lastlevel"
        >
          <option value="0">
            Selecione
          </option>
          <option
            v-for="r in Atividades[level_ini]"
            :key="r.id"
            :value="r.id"
          >
            {{ r.titulo }}
          </option>
        </select>
        <input
          v-else
          class="inputtext light mb1"
          type="text"
          disabled
          :value="'Selecionar ' + activePdm.rotulo_atividade"
        >
      </template>

      <div class="flex g2">
        <div class="f2">
          <label class="label">Etapa <span class="tvermelho">*</span></label>
          <select
            v-if="Etapas[cronograma_sel.id]"
            v-model="etapa_sel"
            class="inputtext light mb1"
            :class="{ 'error': errors.etapa_id }"
            name="etapa_id"
          >
            <option value="">
              Selecione
            </option>
            <option
              v-for="r in Etapas[cronograma_sel.id]"
              :key="r?.etapa?.id"
              :value="r?.etapa?.id"
            >
              {{ r?.etapa?.titulo }}
            </option>
          </select>
          <input
            v-else
            class="inputtext light mb1"
            type="text"
            disabled
            :value="'Selecionar ' + recorte"
          >
          <div class="error-msg">
            {{ errors.etapa_id }}
          </div>
        </div>

        <div class="f1">
          <label class="label">Ordem <span class="tvermelho">*</span></label>
          <Field
            name="ordem"
            type="number"
            class="inputtext light mb1"
            :class="{ 'error': errors.ordem }"
          />
          <div class="error-msg">
            {{ errors.ordem }}
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
</template>
