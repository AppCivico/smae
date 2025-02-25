<script setup>
import LabelFromYup from '@/components/LabelFromYup.vue';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { relatórioDeTransferênciasVoluntárias as schema } from '@/consts/formSchemas';
import interfacesDeTransferências from '@/consts/interfacesDeTransferências';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const alertStore = useAlertStore();
const ÓrgãosStore = useOrgansStore();
const partidosStore = usePartidosStore();
const relatoriosStore = useRelatoriosStore();
const ParlamentaresStore = useParlamentaresStore();

const route = useRoute();
const router = useRouter();

const valoresIniciais = {
  fonte: 'Transferencias',
  parametros: {
    ano: null,
    esfera: null,
    gestor_contrato: null,
    interface: null,
    objeto: null,
    orgao_concedente_id: null,
    partido_id: null,
    secretaria_concedente: null,
    tipo: 'Geral',
    orgao_gestor_id: null,
    parlamentar_id: null,
  },
};

const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
const { lista: partidoComoLista } = storeToRefs(partidosStore);
const { lista: parlamentarComoLista } = storeToRefs(ParlamentaresStore);

const {
  errors, handleSubmit, isSubmitting, setFieldValue, values,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: schema,
});

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

const formularioSujo = useIsFormDirty();

ÓrgãosStore.getAll();
partidosStore.buscarTudo();
ParlamentaresStore.buscarTudo({ ipp: 500, possui_mandatos: true });

</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <CheckClose
      :formulario-sujo="formularioSujo"
    />
  </div>

  <pre v-scrollLockDebug>values:{{ values }}</pre>

  <form
    :disabled="isSubmitting"
    @submit.prevent="onSubmit"
  >
    <Field
      name="fonte"
      type="hidden"
      value="Transferencias"
    />
    <div class="flex flexwrap g2 mb2">
      <!-- ESFERA -->
      <div class="f1">
        <LabelFromYup
          name="esfera"
          :schema="schema.fields.parametros"
        />
        <Field
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
      </div>

      <!-- INTERFACE -->
      <div class="f1">
        <LabelFromYup
          name="interface"
          :schema="schema.fields.parametros"
        />

        <Field
          name="parametros.interface"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.interface'] }"
          @change="!$event.target.value ? setFieldValue('parametros.interface',null) : null"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in Object.values(interfacesDeTransferências)"
            :key="item.nome"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors['parametros.interface'] }}
        </div>
      </div>

      <!-- ANO -->
      <div class="f1">
        <LabelFromYup
          name="ano"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.ano"
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.ano'],
          }"
          @change="!$event.target.value ? setFieldValue('parametros.ano',null) : null"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="parametros.ano"
        />
      </div>
    </div> <!-- Primeira linha da tela - Fim -->

    <div class="flex flexwrap g2 mb2">
      <!-- Segunda linha da tela - Início -->

      <!-- GESTOR MUNICIPAL -->
      <div class="f1 mb2">
        <LabelFromYup
          name="orgao_gestor_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.orgao_gestor_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.orgao_gestor_id'],
            loading: ÓrgãosStore.organs?.loading,
          }"
          :disabled="!órgãosComoLista?.length"
          @change="!$event.target.value ? setFieldValue('parametros.orgao_gestor_id',null) : null"
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
          name="parametros.orgao_gestor_id"
          class="error-msg"
        />
      </div>

      <!-- PARTIDO -->
      <div class="f1 mb1">
        <LabelFromYup
          name="partido_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.partido_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.partido_id'] ,
            loading: partidosStore.chamadasPendentes?.lista,
          }"
          :disabled="!partidoComoLista?.length"
          @change="!$event.target.value ? setFieldValue('parametros.partido_id',null) : null"
        >
          <option value="">
            Selecionar
          </option>

          <option
            v-for="item in partidoComoLista"
            :key="item"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="parametros.partido_id"
          class="error-msg"
        />
      </div>

      <!-- PARLAMENTAR -->
      <div class="f1">
        <LabelFromYup
          name="parlamentar_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.parlamentar_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.parlamentar_id'] ,
            loading: ParlamentaresStore.chamadasPendentes?.lista,
          }"
          :disabled="!parlamentarComoLista?.length"
          @change="!$event.target.value ? setFieldValue('parametros.parlamentar_id',null) : null"
        >
          <option value="">
            Selecionar
          </option>

          <option
            v-for="item in parlamentarComoLista"
            :key="item"
            :value="item.id"
          >
            {{ item.nome_popular }}
          </option>
        </Field>
        <ErrorMessage
          name="parametros.parlamentar_id"
          class="error-msg"
        />
      </div>
    </div> <!-- Segunda linha da tela - Fim -->

    <div class="flex flexwrap g2 mb2">
      <!-- Terceira linha da tela - Início -->

      <!-- ÓRGÃO CONCEDENTE -->
      <div class="f1 mb2">
        <LabelFromYup
          name="orgao_concedente_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.orgao_concedente_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.orgao_concedente_id'] ,
            loading: ÓrgãosStore.organs?.loading,
          }"
          :disabled="!órgãosComoLista?.length"
          @change="!$event.target.value ?
            setFieldValue('parametros.orgao_concedente_id',null) : null"
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
          name="parametros.orgao_concedente_id"
          class="error-msg"
        />
      </div>

      <!-- SECRETARIA CONCEDENTE -->
      <div class="f1 mb1">
        <LabelFromYup
          name="secretaria_concedente"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.secretaria_concedente"
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.secretaria_concedente'] ,
          }"
          @change="!$event.target.value
            ? setFieldValue('parametros.secretaria_concedente',null)
            : null"
        />
        <ErrorMessage
          name="parametros.secretaria_concedente"
          class="error-msg"
        />
      </div>

      <!-- GESTOR DO CONTRATO -->
      <div class="f1">
        <LabelFromYup
          name="gestor_contrato"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.gestor_contrato"
          class="inputtext light mb1"
          rows="5"
          :class="{
            error: errors['parametros.gestor_contrato'],
          }"
          @change="!$event.target.value ? setFieldValue('parametros.gestor_contrato',null) : null"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="parametros.gestor_contrato"
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
          :class="{
            error: errors['eh_publico'],
            loading: ÓrgãosStore.organs?.loading
          }"
          :disabled="ÓrgãosStore.organs?.loading"
        >
          <option>
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
    </div> <!-- Terceira linha da tela - Fim -->

    <div class="flex flexwrap g2 mb2">
      <!-- Quarta linha da tela - Início -->

      <!-- OBJETO -->
      <div class="f1">
        <LabelFromYup
          name="objeto"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.objeto"
          as="textarea"
          class="inputtext light mb1"
          rows="5"
          :class="{
            error: errors['parametros.objeto'],
          }"
          @change="!$event.target.value ? setFieldValue('parametros.objeto',null) : null"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="parametros.objeto"
        />
      </div>
    </div> <!-- Quarta linha da tela - Fim -->

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
