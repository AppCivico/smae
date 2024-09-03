<script setup>
import MapaCampo from '@/components/geo/MapaCampo.vue';
import { etapaDeMonitoramento as schema } from '@/consts/formSchemas';
import fieldToDate from '@/helpers/fieldToDate';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useCiclosStore } from '@/stores/ciclos.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { computed, defineOptions, watch } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({ inheritAttrs: false });
const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const { meta_id } = route.params;
const { cron_id } = route.params;
const { etapa_id } = route.params;

const CiclosStore = useCiclosStore();
const { SingleEtapa } = storeToRefs(CiclosStore);
CiclosStore.getEtapaById(cron_id, etapa_id);

const geolocalizaçãoPorToken = computed(() => (
  SingleEtapa.value?.loading
    || SingleEtapa.value?.error
    || !SingleEtapa.value?.id
    ? {}
    : SingleEtapa.value?.geolocalizacao?.reduce((acc, cur) => {
      acc[cur.token] = cur;
      return acc;
    }, {})
));

const valoresIniciais = computed(() => (SingleEtapa.value?.loading
  || SingleEtapa.value?.error
  || !SingleEtapa.value?.id
  ? {
    endereco_obrigatorio: false,
  }
  : {
    ...SingleEtapa.value,
    geolocalizacao: SingleEtapa.value?.geolocalizacao?.map((x) => x.token) || [],
  }));

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: schema,
});

const onSubmit = handleSubmit(async () => {
  try {
    let msg;
    let r;

    if (values.inicio_real) {
      values.inicio_real = fieldToDate(values.inicio_real);
    } else {
      values.inicio_real = null;
    }
    if (values.termino_real) {
      values.termino_real = fieldToDate(values.termino_real);
    } else {
      values.termino_real = null;
    }

    values.percentual_execucao = Number(values.percentual_execucao) ?? null;

    r = await CiclosStore.updateEtapa(SingleEtapa.value.id, values);
    msg = 'Dados salvos com sucesso!';

    if (r == true) {
      CiclosStore.clear();
      CiclosStore.getMetaByIdCron(meta_id);
      CiclosStore.getCronogramasActiveByParent(meta_id, 'meta_id');
      await router.push({ name: route.meta.rotaDeEscape });
      alertStore.success(msg);
      editModalStore.clear();
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function maskDate(el) {
  const kC = event.keyCode;
  let data = el.target.value.replace(/[^0-9/]/g, '');
  if (kC != 8 && kC != 46) {
    if (data.length == 2) {
      el.target.value = data += '/';
    } else if (data.length == 5) {
      el.target.value = data += '/';
    } else {
      el.target.value = data;
    }
  }
}

const formularioSujo = useIsFormDirty();

watch(valoresIniciais, (novoValor) => {
  resetForm({ values: novoValor });
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <div class="t48">
      <strong>Atualizar</strong><br>{{ SingleEtapa?.titulo }}
    </div>
    <hr class="ml2 f1">

    <CheckClose
      :formulario-sujo="formularioSujo"
    />
  </div>
  <template
    v-if="!(SingleEtapa?.loading || SingleEtapa?.error) &&
      SingleEtapa?.id"
  >
    <form
      @submit.prevent="onSubmit"
    >
      <div class="flex g2 mb2">
        <div class="f1">
          <label class="label tc300">Início Previsto</label>
          <div class="t13">
            {{ SingleEtapa.inicio_previsto }}
          </div>
        </div>
        <div class="f1">
          <label class="label tc300">Término Previsto</label>
          <div class="t13">
            {{ SingleEtapa.termino_previsto }}
          </div>
        </div>
      </div>
      <div class="flex g2">
        <div class="f1">
          <label class="label">Início Real <span class="tvermelho">*</span></label>
          <Field
            name="inicio_real"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.inicio_real }"
            maxlength="10"
            placeholder="dd/mm/aaaa"
            @keyup="maskDate"
          />
          <div class="error-msg">
            {{ errors.inicio_real }}
          </div>
        </div>
        <div class="f1">
          <label class="label">Término real </label>
          <Field
            name="termino_real"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.termino_real }"
            maxlength="10"
            placeholder="dd/mm/aaaa"
            @keyup="maskDate"
            @change="($e) => {
              if (!SingleEtapa.n_filhos_imediatos) {
                setFieldValue('percentual_execucao', $e.target.value
                  ? 100
                  : valoresIniciais.percentual_execucao
                );
              }
            }"
          />
          <div class="error-msg">
            {{ errors.termino_real }}
          </div>
        </div>
        <div class="f1">
          <label class="label">Execução %</label>
          <Field
            :disabled="values.n_filhos_imediatos"
            name="percentual_execucao"
            type="number"
            step="1"
            min="0"
            max="100"
            class="inputtext light mb1"
            :value="etapa_id ? SingleEtapa?.percentual_execucao : percentual_execucao"
            :class="{ 'error': errors.percentual_execucao }"
          />
          <div class="error-msg">
            {{ errors.percentual_execucao }}
          </div>
        </div>
      </div>

      <div class="mb1">
        <Field
          id="endereco_obrigatorio"
          name="endereco_obrigatorio"
          type="checkbox"
          :value="true"
          :unchecked-value="false"
          class="inputcheckbox"
        />
        <label
          for="endereco_obrigatorio"
          :class="{ 'error': errors.endereco_obrigatorio }"
        >
          Endereço obrigatório
        </label>
        <div class="error-msg">
          {{ errors.endereco_obrigatorio }}
        </div>
      </div>

      <div
        class="mb1"
      >
        <legend class="label mt2 mb1legend">
          Localização&nbsp;<span
            v-if="values.endereco_obrigatorio && values.termino_real"
            class="tvermelho"
          >*</span>
        </legend>

        <MapaCampo
          v-model="values.geolocalizacao"
          name="geolocalizacao"
          :geolocalização-por-token="geolocalizaçãoPorToken"
        />

        <ErrorMessage
          name="geolocalizacao"
          class="error-msg"
        />
      </div>

      <dl
        v-if="SingleEtapa?.variavel"
      >
        <dt class="label">
          Variável vinculada
        </dt>
        <dd>
          {{ SingleEtapa.variavel?.codigo }} - {{ SingleEtapa.variavel?.titulo }}
        </dd>
      </dl>

      <FormErrorsList :errors="errors" />

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting || Object.keys(errors)?.length"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </form>
  </template>
  <template v-else-if="SingleEtapa?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-else-if="SingleEtapa?.error||error">
    <div class="error p1">
      <div class="error-msg">
        {{ SingleEtapa.error??error }}
      </div>
    </div>
  </template>
  <template v-else>
    <span>Etapa não encontrada</span>
  </template>
</template>
