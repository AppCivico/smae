<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm,
} from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { relatórioAtividadesPendentes as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
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
    tipo_id: [],
    data_inicio: null,
    data_termino: null,
    orgao_id: [],
  },
  eh_publico: null,
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
    const msg = 'Relatório em processamento, acompanhe na tela de listagem';

    if (await relatoriosStore.insert(valoresControlados)) {
      alertStore.success(msg);
      router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

ÓrgãosStore.getAll();
</script>
<template>
  <CabecalhoDePagina :formulario-sujo="false" />

  <p class="texto--explicativo">
    Relação das atividades pendentes nos cronogramas das transferências.
  </p>

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

    <div class="flex flexwrap g2 mb2">
      <div class="f1">
        <LabelFromYup
          name="parametros.orgao_id"
          :schema="schema.fields.parametros"
        />

        <AutocompleteField
          name="parametros.orgao_id"
          :controlador="{ busca: '', participantes: values.parametros.orgao_id || [] }"
          label="sigla"
          :grupo="órgãosComoLista"
          :class="{
            error: errors['parametros.orgao_id'],
            loading: ÓrgãosStore.organs?.loading,
          }"
        />

        <div
          v-if="errors['parametros.orgao_id']"
          class="error-msg"
        >
          {{ errors['parametros.orgao_id'] }}
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
          @change="setFieldValue('parametros.tipo_id', []);"
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
          name="parametros.tipo_id"
          :schema="schema.fields.parametros"
        />

        <AutocompleteField
          name="parametros.tipo_id"
          :controlador="{ busca: '', participantes: values.parametros.tipo_id || [] }"
          label="nome"
          :grupo="tiposDisponíveis"
          :class="{
            error: errors['parametros.tipo_id'],
            loading: TipoDeTransferenciaStore.chamadasPendentes?.lista,
          }"
        />

        <div
          v-if="errors['parametros.tipo_id']"
          class="error-msg"
        >
          {{ errors['parametros.tipo_id'] }}
        </div>
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
        Criar relatório
      </button>
      <hr class="ml2 f1">
    </div>
  </form>
</template>
