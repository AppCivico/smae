<script setup>
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { transferenciaDistribuicaoDeRecursos as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, FieldArray, useForm, useIsFormDirty,
} from 'vee-validate';
import { onUnmounted, ref, watch } from 'vue';

const distribuicaoRecursos = useDistribuicaoRecursosStore();
const ÓrgãosStore = useOrgansStore();

const {
  chamadasPendentes, erro, lista, itemParaEdição, emFoco,
} = storeToRefs(distribuicaoRecursos);
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);

const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const mostrarDistribuicaoRegistroForm = ref(false);

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});

const formulárioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (controlledValues) => {
  try {
    let r;
    const msg = itemParaEdição.value.id
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (itemParaEdição.value.id) {
      r = await distribuicaoRecursos.salvarItem(controlledValues, itemParaEdição.value.id);
    } else {
      r = await distribuicaoRecursos.salvarItem(controlledValues);
    }
    if (r) {
      alertStore.success(msg);

      mostrarDistribuicaoRegistroForm.value = false;

      if (itemParaEdição.value.id) {
        emFoco.value = null;
      }

      distribuicaoRecursos.buscarTudo({ transferencia_id: props.transferenciaId });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

async function editarDistribuicaoRecursos(id) {
  await distribuicaoRecursos.buscarItem(id);
  mostrarDistribuicaoRegistroForm.value = true;
}

async function excluirDistribuição(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await distribuicaoRecursos.excluirItem(id)) {
      distribuicaoRecursos.$reset();
      distribuicaoRecursos.buscarTudo({ transferencia_id: props.transferenciaId });
      alertStore.success('Distribuição removida.');
    }
  }, 'Remover');
}

function registrarNovaDistribuicaoRecursos() {
  if (mostrarDistribuicaoRegistroForm.value) {
    mostrarDistribuicaoRegistroForm.value = false;
  } else {
    emFoco.value = null;
    resetForm({ values: {} });
    mostrarDistribuicaoRegistroForm.value = true;
  }
}

function iniciar() {
  distribuicaoRecursos.buscarTudo({ transferencia_id: props.transferenciaId });

  ÓrgãosStore.getAll();
}

iniciar();

watch(itemParaEdição, (novosValores) => {
  resetForm({ values: novosValores });
});

onUnmounted(() => {
  distribuicaoRecursos.$reset();
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <CheckClose
      :formulário-sujo="formulárioSujo"
    />
  </div>

  <div class="flex spacebetween center mb2">
    <h3 class="title">
      Distribuição de Recursos
    </h3>
    <hr class="ml2 f1">
  </div>

  <div class="mb2">
    <table class="tablemain mb1">
      <col>
      <col class="col--number">
      <col>
      <col class="col--data">
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <thead>
        <tr>
          <th>
            Gestor municipal
          </th>
          <th class="cell--number">
            Valor total
          </th>
          <th>
            empenho
          </th>
          <th>
            data de vigência
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in lista"
          :key="item.id"
        >
          <td>{{ item.orgao_gestor.sigla }}</td>
          <td class="cell--number">
            {{
              item.valor_total
                ? dinheiro(item.valor_total )
                : '-'
            }}
          </td>
          <td>{{ item.empenho? 'Sim' : 'Não' }}</td>
          <td>{{ dateToField(item.vigencia) }}</td>
          <td>
            <button
              class="like-a__text"
              arial-label="excluir"
              title="excluir"
              type="button"
              @click="excluirDistribuição(item.id)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </td>
          <td>
            <button
              class="like-a__text"
              arial-label="editar"
              title="editar"
              type="button"
              @click="editarDistribuicaoRecursos(item.id)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
            </button>
          </td>
        </tr>

        <tr v-if="chamadasPendentes.lista">
          <td
            colspan="6"
            class="loading"
          >
            carregando
          </td>
        </tr>

        <tr v-else-if="!lista.length">
          <td colspan="6">
            Nenhum Registro de Distribuição de Recursos encontrado.
          </td>
        </tr>
      </tbody>
    </table>
    <button
      class="like-a__text addlink"
      @click="registrarNovaDistribuicaoRecursos"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg> Registrar nova distribuição de recurso
    </button>
  </div>

  <form
    v-if="mostrarDistribuicaoRegistroForm"
    @submit.prevent="onSubmit"
  >
    <Field
      v-if="!itemParaEdição.id"
      type="hidden"
      name="transferencia_id"
      :value="props.transferenciaId"
    />

    <div class="flex spacebetween center mb1">
      <h3 class="title">
        Registro Distribuição de Recursos
      </h3>
      <hr class="ml2 f1">
    </div>

    <div class="f1 mb2">
      <LabelFromYup
        name="orgao_gestor_id"
        :schema="schema"
      />
      <Field
        name="orgao_gestor_id"
        as="select"
        class="inputtext light mb1"
        :class="{
          error: errors.orgao_gestor_id,
          loading: ÓrgãosStore.chamadasPendentes?.lista,
        }"
        :disabled="!órgãosComoLista?.length"
      >
        <option :value="0">
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
        name="orgao_gestor_id"
        class="error-msg"
      />
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="objeto"
          :schema="schema"
        />
        <Field
          name="objeto"
          as="textarea"
          class="inputtext light mb1"
          rows="5"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="objeto"
        />
      </div>
    </div>

    <div class=" g2 mb2">
      <div class="halfInput">
        <LabelFromYup
          name="valor"
          :schema="schema"
        />
        <MaskedFloatInput
          name="valor"
          type="text"
          class="inputtext light mb2"
          :value="values.valor"
          converter-para="string"
        />
        <ErrorMessage
          class="error-msg mb2"
          name="valor"
        />
      </div>
      <div class="halfInput">
        <LabelFromYup
          name="valor_contrapartida"
          :schema="schema"
        />
        <MaskedFloatInput
          name="valor_contrapartida"
          type="text"
          class="inputtext light mb2"
          :value="values.valor_contrapartida"
          converter-para="string"
        />
        <ErrorMessage
          class="error-msg mb2"
          name="valor_contrapartida"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="valor_total"
          :schema="schema"
        />
        <MaskedFloatInput
          name="valor_total"
          type="text"
          class="inputtext light mb1"
          :value="values.valor_total"
          converter-para="string"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="valor_total"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="empenho"
          :schema="schema"
        />
        <Field
          name="empenho"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.empenho }"
        >
          <option value="">
            Selecionar
          </option>
          <option :value="true">
            Sim
          </option>
          <option :value="false ">
            Não
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.empenho }}
        </div>
      </div>
    </div>

    <div class="mb1">
      <div class="f1 mb2">
        <LabelFromYup
          name="programa_orcamentario_municipal"
          :schema="schema"
        />
        <Field
          name="programa_orcamentario_municipal"
          type="text"
          class="inputtext light mb1"
          @change="($event) => {
            if ($event?.target?.value === '') {
              setFieldValue('programa_orcamentario_municipal', null);
            }
          }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="programa_orcamentario_municipal"
        />
      </div>
      <div class="f1 mb2">
        <LabelFromYup
          name="programa_orcamentario_estadual"
          :schema="schema"
        />
        <Field
          name="programa_orcamentario_estadual"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="programa_orcamentario_estadual"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="dotacao"
          :schema="schema"
        />
        <Field
          name="dotacao"
          type="text"
          class="inputtext light mb1"
          placeholder="16.24.12.306.3016.2.873.33903900.00"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="dotacao"
        />
      </div>
    </div>

    <div class="mb1">
      <LabelFromYup
        :schema="schema"
        name="registros_sei"
        as="legend"
        class="label mb1"
      />
      <FieldArray
        v-slot="{ fields, push, remove }"
        name="registros_sei"
      >
        <div class="g2 registros-sei">
          <div
            v-for="(field, idx) in fields"
            :key="field.key"
            class="mb1 registros-sei__item"
          >
            <Field
              :name="`registros_sei[${idx}].id`"
              type="hidden"
              class="inputtext light"
            />
            <div class="flex g1 center">
              <Field
                :name="`registros_sei[${idx}].processo_sei`"
                type="text"
                class="inputtext light"
                maxlength="40"
              />

              <button
                class="like-a__text addlink"
                arial-label="excluir"
                title="excluir"
                @click="remove(idx)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg>
              </button>
            </div>

            <ErrorMessage
              class="error-msg mb1"
              :name="`registros_sei[${idx}]`"
            />
          </div>
        </div>

        <button
          class="like-a__text addlink flb100"
          type="button"
          @click="push({processo_sei: ''})"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg>Adicionar registro
        </button>
      </FieldArray>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="proposta"
          :schema="schema"
        />
        <Field
          name="proposta"
          type="text"
          class="inputtext light mb1"
          @change="($event) => {
            if ($event?.target?.value === '') setFieldValue('proposta', null);
          }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="proposta"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="convenio"
          :schema="schema"
        />
        <Field
          name="convenio"
          type="text"
          class="inputtext light mb1"
          @change="($event) => {
            if ($event?.target?.value === '') setFieldValue('convenio', null);
          }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="convenio"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="contrato"
          :schema="schema"
        />
        <Field
          name="contrato"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="contrato"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="assinatura_termo_aceite"
          :schema="schema"
        />
        <Field
          name="assinatura_termo_aceite"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.assinatura_termo_aceite }"
          maxlength="10"
          @change="($event) => {
            if ($event?.target?.value === '') setFieldValue('assinatura_termo_aceite', null);
          }"
        />
        <ErrorMessage
          name="assinatura_termo_aceite"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="assinatura_estado"
          :schema="schema"
        />
        <Field
          name="assinatura_estado"
          type="date"
          class="inputtext light"
          :class="{ 'error': errors.assinatura_estado }"
          maxlength="10"
          @change="($event) => {
            if ($event?.target?.value === '') setFieldValue('assinatura_estado', null);
          }"
        />
        <ErrorMessage
          name="assinatura_estado"
          class="error-msg"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="assinatura_municipio"
          :schema="schema"
        />
        <Field
          name="assinatura_municipio"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.assinatura_municipio }"
          maxlength="10"
          @change="($event) => {
            if ($event?.target?.value === '') setFieldValue('assinatura_municipio', null);
          }"
        />
        <ErrorMessage
          name="assinatura_municipio"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb3">
      <div class="f1 mb1">
        <LabelFromYup
          name="vigencia"
          :schema="schema"
        />
        <Field
          name="vigencia"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.vigencia }"
          maxlength="10"
          @change="($event) => {
            if ($event?.target?.value === '') setFieldValue('vigencia', null);
          }"
        />
        <ErrorMessage
          name="vigencia"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="conclusao_suspensiva"
          :schema="schema"
        />
        <Field
          name="conclusao_suspensiva"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.conclusao_suspensiva }"
          maxlength="10"
          @change="($event) => {
            if ($event?.target?.value === '') setFieldValue('conclusao_suspensiva', null);
          }"
        />
        <ErrorMessage
          name="conclusao_suspensiva"
          class="error-msg"
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
  </form>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
<style lang="less">
.registros-sei {
  display: grid;
  grid-template-columns: repeat( auto-fit, minmax(20em, 1fr) );
}

.registros-sei__item {
}
</style>
