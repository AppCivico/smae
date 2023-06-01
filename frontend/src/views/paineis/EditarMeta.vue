<script setup>
import { router } from '@/router';
import {
  useAlertStore,
  useEditModalStore,
  usePaineisStore,
} from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import * as Yup from 'yup';

const route = useRoute();
const { painel_id } = route.params;
const { conteudo_id } = route.params;
const alertStore = useAlertStore();
const editModalStore = useEditModalStore();

const PaineisStore = usePaineisStore();
const { singlePainel } = storeToRefs(PaineisStore);
const metaConteudo = ref({ loading: true });
const periodo = ref();
(async () => {
  if (singlePainel.value.id != painel_id) await PaineisStore.getById(painel_id);
  const c = singlePainel.value.painel_conteudo.find((x) => x.id == conteudo_id);
  if (c) {
    c.mostrar_planejado = c.mostrar_planejado ? '1' : false;
    c.mostrar_acumulado = c.mostrar_acumulado ? '1' : false;
    c.mostrar_acumulado_periodo = c.mostrar_acumulado_periodo ? '1' : false;
    c.periodo_inicio = dateToField(c.periodo_inicio);
    c.periodo_fim = dateToField(c.periodo_fim);
    periodo.value = c.periodo;
    metaConteudo.value = c;
  } else {
    metaConteudo.value = { error: 'Item não encontrado' };
  }
})();

const regx = /^$|^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;

const schema = Yup.object().shape({
  periodicidade: Yup.string().required('Selecione a periodicidade'),
  periodo: Yup.string().required('Selecione o período'),

  periodo_valor: Yup.string().nullable().when('periodo', (periodo, field) => (['EntreDatas', 'Todos'].indexOf(periodo) == -1 ? field.required('Preencha um valor') : field)),
  periodo_inicio: Yup.string().nullable()
    .when('periodo', (periodo, field) => (periodo == 'EntreDatas' ? field.required('Preencha o início') : field))
    .matches(regx, 'Formato inválido'),
  periodo_fim: Yup.string().nullable()
    .when('periodo', (periodo, field) => (periodo == 'EntreDatas' ? field.required('Preencha o fim') : field))
    .matches(regx, 'Formato inválido'),

  mostrar_planejado: Yup.boolean().nullable(),
  mostrar_acumulado: Yup.boolean().nullable(),
  mostrar_acumulado_periodo: Yup.boolean().nullable(),
});

async function onSubmit(values) {
  try {
    let msg;
    let r;

    if (values.periodo == 'EntreDatas') {
      values.periodo_valor = null;
      values.periodo_inicio = fieldToDate(values.periodo_inicio);
      values.periodo_fim = fieldToDate(values.periodo_fim);
    } else if (values.periodo == 'Todos') {
      values.periodo_valor = null;
      values.periodo_inicio = null;
      values.periodo_fim = null;
    } else {
      values.periodo_valor = Number(values.periodo_valor);
      values.periodo_inicio = null;
      values.periodo_fim = null;
    }

    values.mostrar_planejado = !!values.mostrar_planejado;
    values.mostrar_acumulado = !!values.mostrar_acumulado;
    values.mostrar_acumulado_periodo = !!values.mostrar_acumulado_periodo;

    r = await PaineisStore.visualizacaoMeta(painel_id, conteudo_id, values);
    msg = 'Dados salvos com sucesso!';
    if (r == true) {
      PaineisStore.clear();
      PaineisStore.getById(painel_id);
      await router.push(`/paineis/${painel_id}`);
      editModalStore.clear();
      alertStore.success(msg);
    } else {
      throw r;
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    router.go(-1);
    editModalStore.clear();
    alertStore.clear();
  });
}
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
function dateToField(d) {
  const dd = d ? new Date(d) : false;
  return (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }) : '';
}
function fieldToDate(d) {
  if (d) {
    const x = d.split('/');
    return (x.length == 3) ? new Date(Date.UTC(x[2], x[1] - 1, x[0])).toISOString().substring(0, 10) : null;
  }
  return null;
}

</script>
<template>
  <h2>Configurar Visualização</h2>
  <template v-if="metaConteudo.id">
    <p class="w700 mb2">
      Meta {{ metaConteudo.meta.codigo }} {{ metaConteudo.meta.titulo }}
    </p>

    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      :initial-values="metaConteudo"
      @submit="onSubmit"
    >
      <div class="mb1">
        <label class="label">
          Periodicidade<span class="tvermelho">*</span>
        </label>
        <Field
          name="periodicidade"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.periodicidade }"
        >
          <option value="">
            Selecionar
          </option>
          <option value="Mensal">
            Mensal
          </option>
          <option value="Bimestral">
            Bimestral
          </option>
          <option value="Trimestral">
            Trimestral
          </option>
          <option value="Quadrimestral">
            Quadrimestral
          </option>
          <option value="Semestral">
            Semestral
          </option>
          <option value="Anual">
            Anual
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.periodicidade }}
        </div>
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
          <label class="label">
            Período<span class="tvermelho">*</span>
          </label>
          <Field
            v-model="periodo"
            name="periodo"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.periodo }"
          >
            <option value="">
              Selecionar
            </option>
            <option value="Todos">
              Todos
            </option>
            <option value="Corrente">
              Mês Corrente
            </option>
            <option value="Anteriores">
              Meses Anteriores
            </option>
            <option value="EntreDatas">
              Entre datas
            </option>
          </Field>
          <div class="error-msg">
            {{ errors.periodo }}
          </div>
        </div>
        <div
          v-if="['EntreDatas', 'Todos'].indexOf(periodo) == -1"
          class="f1"
        >
          <label class="label">Meses<span class="tvermelho">*</span></label>
          <Field
            name="periodo_valor"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.periodo_valor }"
          />
          <div class="error-msg">
            {{ errors.periodo_valor }}
          </div>
        </div>
        <div
          v-if="periodo == 'EntreDatas'"
          class="f1"
        >
          <label class="label">Início<span class="tvermelho">*</span></label>
          <Field
            name="periodo_inicio"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.periodo_inicio }"
            @keyup="maskDate"
          />
          <div class="error-msg">
            {{ errors.periodo_inicio }}
          </div>
        </div>
        <div
          v-if="periodo == 'EntreDatas'"
          class="f1"
        >
          <label class="label">Fim<span class="tvermelho">*</span></label>
          <Field
            name="periodo_fim"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.periodo_fim }"
            @keyup="maskDate"
          />
          <div class="error-msg">
            {{ errors.periodo_fim }}
          </div>
        </div>
      </div>

      <div class="mb2">
        <label class="mr2"><Field
          name="mostrar_planejado"
          type="checkbox"
          value="1"
          class="inputcheckbox"
        /><span>Exibir planejado</span></label>
        <label class="mr2"><Field
          name="mostrar_acumulado"
          type="checkbox"
          value="1"
          class="inputcheckbox"
        /><span>Exibir acumulado</span></label>
        <label class="mr2"><Field
          name="mostrar_acumulado_periodo"
          type="checkbox"
          value="1"
          class="inputcheckbox"
        /><span>Somente acumulado do período</span></label>
      </div>

      <div class="flex spacebetween center">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar painel
        </button>
        <hr class="ml2 f1">
      </div>
    </Form>
  </template>
  <template v-else-if="metaConteudo.loading">
    <div class="p1">
      <span>Carregando</span> <svg
        class="ml1 ib"
        width="20"
        height="20"
      ><use xlink:href="#i_spin" /></svg>
    </div>
  </template>
  <template v-else-if="metaConteudo.error">
    <div class="error p1">
      <p class="error-msg">
        Error: {{ metaConteudo.error }}
      </p>
    </div>
  </template>
  <template v-else>
    <div class="error p1">
      <p class="error-msg">
        Nenhum item encontrado.
      </p>
    </div>
  </template>
</template>
