<script setup>
import LabelFromYup from '@/components/LabelFromYup.vue';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { relatórioDeTribunalDeContas as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const TipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const { lista: tipoTransferenciaComoLista } = storeToRefs(TipoDeTransferenciaStore);

const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();

const route = useRoute();
const router = useRouter();

const valoresIniciais = {
  fonte: 'TribunalDeContas',
  parametros: {
    esfera: null,
    ano_inicio: null,
    ano_fim: null,
    tipo_id: null,
    tipo: 'Geral',
  },
  eh_publico: null,
};

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
    const msg = 'Relatório em processamento, acompanhe na tela de listagem';

    // Converte os valores dos anos de string para number, atendendo o que a API espera
    valoresControlados.parametros
      .ano_inicio = parseInt(valoresControlados.parametros.ano_inicio, 10);
    valoresControlados.parametros
      .ano_fim = parseInt(valoresControlados.parametros.ano_fim, 10);

    if (await relatoriosStore.insert(valoresControlados)) {
      alertStore.success(msg);
      router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

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
      value="TribunalDeContas"
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

      <!--
        <LabelFromYup
          name="esfera"
          :schema="parametros"
        />
        <Field
          v-model="esferaSelecionada"
          name="parametros.esfera"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.esfera'] }"
          @change="!$event.target.value ? setFieldValue('parametros.esfera',null) : null"
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
          {{ errors['parametros.esfera'] }}
        </div>

    -->

      <div class="f1">
        <LabelFromYup
          name="parametros.ano_inicio"
          :schema="schema"
        />
        <Field
          name="parametros.ano_inicio"
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.ano_inicio'],
          }"
          @change="!$event.target.value ? setFieldValue('parametros.ano_inicio',null) : null"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="parametros.ano_inicio"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="parametros.ano_fim"
          :schema="schema"
        />
        <Field
          name="parametros.ano_fim"
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.ano_fim'],
          }"
          @change="!$event.target.value ? setFieldValue('parametros.ano_fim',null) : null"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="parametros.ano_fim"
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

    <Field
      name="parametros.tipo"
      type="hidden"
      value="Geral"
      class="inputcheckbox"
      :class="{ 'error': errors['parametros.tipo'] }"
    />

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
        Criar relatório
      </button>
      <hr class="ml2 f1">
    </div>
  </form>
</template>
