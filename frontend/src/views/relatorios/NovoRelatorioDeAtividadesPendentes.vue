<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LabelFromYup from '@/components/LabelFromYup.vue';
import truncate from '@/helpers/truncate';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { relatórioAtividadesPendentes as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { useOrgansStore } from '@/stores/organs.store';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';

const TipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const { lista: tipoTransferenciaComoLista } = storeToRefs(TipoDeTransferenciaStore);

const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();
const ÓrgãosStore = useOrgansStore();

const route = useRoute();
const router = useRouter();

const valoresIniciais = {
  fonte: 'CasaCivilAtvPendentes',
  parametros: {
    tipo_id: null,
    data_inicio: null,
    data_termino: null,
    orgao_id: null,
  },
  salvar_arquivo: false,
};

const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
TipoDeTransferenciaStore.buscarTudo();

const {
  errors, handleSubmit, isSubmitting, setFieldValue, values,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: schema,
});

const tiposDisponíveis = computed(() => (values.parametros.esfera
  ? tipoTransferenciaComoLista.value.filter((x) => x.esfera === values.parametros.esfera)
  : []));

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    const msg = 'Dados salvos com sucesso!';

    if (await relatoriosStore.insert(valoresControlados)) {
      alertStore.success(msg);
      if (valoresControlados.salvar_arquivo && route.meta?.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

ÓrgãosStore.getAll();
const formularioSujo = useIsFormDirty();

</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <CheckClose
      :formulario-sujo="formularioSujo"
    />
  </div>

  <!--<pre>values:{{ values }}</pre>
  <pre>tiposDisponíveis: {{ tiposDisponíveis }}</pre>
  /<pre>Lista: {{ tipoTransferenciaComoLista }}</pre>
-->
  <form
    :disabled="isSubmitting"
    @submit.prevent="onSubmit"
  >
    <Field
      name="fonte"
      type="hidden"
      value="CasaCivilAtvPendentes"
    />
    <div class="flex flexwrap g2 mb2">
      <div class="f1">
        <LabelFromYup
          name="parametros.esfera"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.esfera"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.esfera'] }"
          @change="setFieldValue('parametros.tipo_id', null);"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in Object.values(esferasDeTransferencia)"
            :key="item.valor"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors['esfera'] }}
        </div>
      </div>

      <div class="f1">
        <LabelFromYup
          name="orgao_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.orgao_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.orgao_id'] ,
            loading: ÓrgãosStore.organs?.loading,
          }"
          :disabled="!órgãosComoLista?.length"
          @change="!$event.target.value ?
            setFieldValue('parametros._id',null) : null"
        >
          <option value="">
            Selecionar
          </option>

          <option
            v-for="item in órgãosComoLista"
            :key="item"
            :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null"
          >
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </Field>
        <ErrorMessage
          name="parametros.orgao_id"
          class="error-msg"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="parametros.data_inicio"
          :schema="schema"
        />
        <Field
          name="parametros.data_inicio"
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.data_inicio'],
          }"
          @change="!$event.target.value ? setFieldValue('parametros.data_inicio',null) : null"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="parametros.data_inicio"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="parametros.data_termino"
          :schema="schema"
        />
        <Field
          name="parametros.data_termino"
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.data_termino'],
          }"
          @change="!$event.target.value ? setFieldValue('parametros.data_termino',null) : null"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="parametros.data_termino"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="parametros.tipo_id"
          :schema="schema"
        />
        <Field
          name="parametros.tipo_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.tipo_id,
            loading: TipoDeTransferenciaStore.chamadasPendentes?.lista,
          }"
          :disabled="!tiposDisponíveis.length"
        >
          <option value="">
            Selecionar
          </option>

          <option
            v-for="item in tiposDisponíveis"
            :key="item"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="parametros.tipo_id"
          class="error-msg"
        />
      </div>
    </div>

    <div class="mb2">
      <div class="pl2">
        <label class="block">
          <Field
            name="salvar_arquivo"
            type="checkbox"
            :value="true"
            :unchecked-value="false"
            class="inputcheckbox"
          />
          <span :class="{ 'error': errors.salvar_arquivo }">Salvar relatório no sistema</span>
        </label>
      </div>
      <div
        v-if="errors['salvar_arquivo']"
        class="error-msg"
      >
        {{ errors['salvar_arquivo'] }}
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
        {{ values.salvar_arquivo ? "baixar e salvar" : "apenas baixar" }}
      </button>
      <hr class="ml2 f1">
    </div>
  </form>
</template>
