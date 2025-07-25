<script setup>
import Big from 'big.js';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import {
  ErrorMessage, Field, FieldArray, useForm,
} from 'vee-validate';
import { computed, nextTick, watch } from 'vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { registroDeTransferencia as schema } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import SmaeTooltip from '@/components/SmaeTooltip/SmaeTooltip.vue';

const tooltip = {
  dadosBancariosAceite: 'Indica o código numérico dos dados bancários para execução da emenda parlamentar oriunda de Transferência Especial.',
  dadosBancariosFim: 'Indica o código numérico dos dados bancários para execução da emenda parlamentar oriunda de Transferência Especial, aberto pela Secretaria Municipal responsável pela execução.',
};

const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();
const {
  chamadasPendentes, erro, itemParaEdicao, emFoco: transferenciaEmFoco,
} = storeToRefs(TransferenciasVoluntarias);

const ParlamentaresStore = useParlamentaresStore();
const {
  lista: parlamentarComoLista,
  parlamentaresPorId,
  paginação: paginaçãoDeParlamentares,
} = storeToRefs(ParlamentaresStore);

const partidoStore = usePartidosStore();
const { lista: partidoComoLista } = storeToRefs(partidoStore);

const router = useRouter();
const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

const {
  errors, isSubmitting, setFieldValue, values, handleSubmit, resetForm,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const alertStore = useAlertStore();

const onSubmit = handleSubmit.withControlled(async (controlledValues) => {
  // necessário por causa de 🤬
  const cargaManipulada = nulificadorTotal(controlledValues);

  try {
    let id;
    if (props.transferenciaId) {
      id = await TransferenciasVoluntarias.salvarItem(cargaManipulada, props.transferenciaId, true);
    }
    if (id) {
      alertStore.success('Dados salvos com sucesso!');
      TransferenciasVoluntarias.buscarItem(props.transferenciaId);
      if (transferenciaEmFoco.value?.pendente_preenchimento_valores) {
        router.push({ name: 'TransferenciaDistribuicaoDeRecursos.Lista' });
      } else {
        router.push({
          name: 'RegistroDeTransferenciaEditar',
          params: {
            transferenciaId: id.id,
          },
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const isSomaCorreta = computed(() => {
  const soma = Big(values.valor || 0).plus(values.valor_contrapartida || 0);
  return soma.eq(Big(values.valor_total || 0));
});

const calcularValorCusteio = (fieldName) => {
  const valor = Big(values.valor || 0);
  const custeio = Big(values.custeio || 0);
  const percentagemCusteio = Big(values.pct_custeio || 0);

  if (fieldName === 'pct_custeio' || fieldName === 'valor') {
    const valorArredondado = valor
      .times(percentagemCusteio).div(100).round(2, Big.roundHalfUp);
    setFieldValue('custeio', valorArredondado.toString());
  } else if (fieldName === 'custeio') {
    const porcentagemCusteio = valor.eq(0)
      ? Big(0)
      : custeio.div(valor).times(100);
    setFieldValue('pct_custeio', porcentagemCusteio.toFixed(2));
    setFieldValue('pct_investimento', Big(100).minus(porcentagemCusteio).toFixed(2));
  }
};

const calcularValorInvestimento = (fieldName) => {
  const valor = Big(values.valor || 0);
  const investimento = Big(values.investimento || 0);
  const custeio = Big(values.custeio || 0);
  const percentagemInvestimento = Big(values.pct_investimento || 0);

  if (fieldName === 'pct_investimento' || fieldName === 'valor') {
    const investimentoCalculado = custeio.gt(0)
      ? valor.minus(custeio)
      : valor.times(percentagemInvestimento).div(100);

    const investimentoFinal = investimentoCalculado.round(2, Big.roundHalfUp);
    setFieldValue('investimento', investimentoFinal.toString());

    // manter coerência das porcentagens
    const pct = valor.eq(0)
      ? Big(0)
      : investimentoFinal.div(valor).times(100);
    setFieldValue('pct_investimento', pct.toFixed(2));
    setFieldValue('pct_custeio', Big(100).minus(pct).toFixed(2));
  } else if (fieldName === 'investimento') {
    const porcentagemInvestimento = valor.eq(0)
      ? Big(0)
      : investimento.div(valor).times(100);
    setFieldValue('pct_investimento', porcentagemInvestimento.toFixed(2));
    setFieldValue('pct_custeio', Big(100).minus(porcentagemInvestimento).toFixed(2));
  }
};

const updateValorTotal = (fieldName, newValue) => {
  const valor = fieldName === 'valor'
    ? Big(newValue || 0)
    : Big(values.valor || 0);

  const valorContraPartida = fieldName === 'valor_contrapartida'
    ? Big(newValue || 0)
    : Big(values.valor_contrapartida || 0);

  const valorArredondado = valor.plus(valorContraPartida);

  setFieldValue('valor_total', valorArredondado.toFixed(2));
  calcularValorCusteio(fieldName);
  calcularValorInvestimento(fieldName);
};

TransferenciasVoluntarias.buscarItem(props.transferenciaId);
ParlamentaresStore.buscarTudo({ ipp: 500, possui_mandatos: true });
partidoStore.buscarTudo();

watch(itemParaEdicao, async (novosValores) => {
  resetForm({ values: novosValores });

  await nextTick();
  calcularValorCusteio('custeio');
  calcularValorInvestimento('investimento');
}, { immediate: true });
</script>
<template>
  <pre v-scrollLockDebug>
    transferenciaEmFoco:{{ transferenciaEmFoco?.pendente_preenchimento_valores }}
  </pre>
  <div class="flex spacebetween center mt2">
    <h1>Recursos Financeiros</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <form
    @submit.prevent="onSubmit"
  >
    <fieldset>
      <div class="flex g2">
        <div class="f1">
          <LabelFromYup
            name="valor"
            :schema="schema"
          />
          <MaskedFloatInput
            name="valor"
            type="text"
            class="inputtext light mb1"
            converter-para="string"
            :value="values.valor"
            @update:model-value="(newValue) =>
              updateValorTotal('valor', newValue, setFieldValue)"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="valor"
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
            :class="{ error: errors.empenho }"
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
          <ErrorMessage
            class="error-msg mb1"
            name="empenho"
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="padding-sm mb2 flex">
      <LabelFromYup as="legend">
        Custeio
      </LabelFromYup>
      <div class="flex f1 g2 center">
        <div class="fb20em">
          <LabelFromYup
            name="pct_custeio"
            :schema="schema"
          />
          <MaskedFloatInput
            name="pct_custeio"
            type="text"
            class="inputtext light"
            :value="values.pct_custeio"
            converter-para="string"
            :max="100"
            maxlength="6"
            @update:model-value="(newValue) => {
              setFieldValue('pct_custeio', newValue);
              calcularValorCusteio('pct_custeio');
            }"
          />
        </div>
        <small
          class="addlink mt2 fb3em text-center"
          style="cursor: default;"
        >OU</small>
        <div class="fb50em">
          <LabelFromYup
            name="investimento"
            :schema="schema"
          />
          <MaskedFloatInput
            name="custeio"
            type="text"
            class="inputtext light"
            :value="values.custeio"
            converter-para="string"
            @update:model-value="(newValue) => {
              updateValorTotal('custeio', newValue, setFieldValue);
              calcularValorCusteio('custeio')
            }"
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="padding-sm mb2 flex">
      <LabelFromYup as="legend">
        Investimento
      </LabelFromYup>
      <div class="flex f1 g2 center">
        <div class="fb20em">
          <LabelFromYup
            name="pct_investimento"
            :schema="schema"
          />
          <MaskedFloatInput
            name="pct_investimento"
            type="text"
            class="inputtext light"
            :value="values.pct_investimento"
            converter-para="string"
            :max="100"
            maxlength="6"
            @update:model-value="(newValue) => {
              setFieldValue('pct_investimento', newValue);
              calcularValorInvestimento('pct_investimento');
            }"
          />
        </div>
        <small
          class="addlink mt2 fb3em text-center"
          style="cursor: default;"
        >OU</small>
        <div class="fb50em">
          <LabelFromYup
            name="investimento"
            :schema="schema"
          />
          <MaskedFloatInput
            name="investimento"
            type="text"
            class="inputtext light"
            :value="values.investimento"
            converter-para="string"
            @update:model-value="(newValue) => {
              updateValorTotal('investimento', newValue, setFieldValue);
              calcularValorInvestimento('investimento')
            }"
          />
        </div>
      </div>
    </fieldset>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="valor_contrapartida"
          :schema="schema"
        />
        <MaskedFloatInput
          name="valor_contrapartida"
          type="text"
          class="inputtext light mb1"
          :value="values.valor_contrapartida"
          converter-para="string"
          @update:model-value="(newValue) =>
            updateValorTotal('valor_contrapartida', newValue, setFieldValue)"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="valor_contrapartida"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="dotacao"
          :schema="schema"
        />
        <Field
          name="dotacao"
          type="text"
          class="inputtext light mb1"
          placeholder="00.00.00.000.0000.0.000.00000000.00"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="dotacao"
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
        <div
          v-if="!isSomaCorreta"
          class="tamarelo"
        >
          A soma dos valores não corresponde ao valor total.
        </div>
      </div>
      <div class="f1">
        <LabelFromYup
          name="ordenador_despesa"
          :schema="schema"
        />
        <Field
          name="ordenador_despesa"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="ordenador_despesa"
        />
      </div>
    </div>

    <div class="flex spacebetween center mb1">
      <h3 class="title">
        Parlamentares
      </h3>
      <hr class="ml2 f1">
    </div>

    <!-- Esse FieldArray é desnecessário -->
    <FieldArray
      v-slot="{ fields }"
      name="parlamentares"
    >
      <div
        v-for="(field, idx) in fields"
        :key="`parlamentares--${field.key}`"
        class="mb2"
      >
        <Field
          :name="`parlamentares[${idx}].id`"
          type="hidden"
        />

        <div class="flex g2">
          <div class="f1">
            <LabelFromYup
              name="parlamentar_id"
              :schema="schema.fields.parlamentares.innerType"
              :for="`parlamentares[${idx}].parlamentar.nome_popular`"
            />
            <input
              :name="`parlamentares[${idx}].parlamentar.nome_popular`"
              class="inputtext light mb1"
              type="text"
              aria-readonly="true"
              readonly
              :value="values.parlamentares?.[idx]?.parlamentar?.nome_popular"
            >
          </div>
          <div class="f1">
            <LabelFromYup
              name="valor"
              :schema="schema.fields.parlamentares.innerType"
              :for="`parlamentares[${idx}].valor`"
            />
            <MaskedFloatInput
              :name="`parlamentares[${idx}].valor`"
              type="text"
              class="inputtext light mb1"
              converter-para="string"
              :value="values.parlamentares?.[idx]?.valor"
            />
          </div>
        </div>
        <div>
          <LabelFromYup
            name="objeto"
            :schema="schema.fields.parlamentares.innerType"
            :for="`parlamentares[${idx}].objeto`"
          />
          <SmaeText
            :model-value="values.parlamentares[idx].objeto"
            :name="`parlamentares[${idx}].objeto`"
            class="inputtext light mb1"
            as="textarea"
            rows="10"
            :schema="schema"
            maxlength="1000"
            anular-vazio
          />
        </div>
      </div>
    </FieldArray>

    <div class="flex spacebetween center mb1">
      <h3 class="title">
        Dados Bancários de Aceite

        <SmaeTooltip :texto="tooltip.dadosBancariosAceite" />
      </h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="banco_aceite"
          :schema="schema"
        />
        <Field
          name="banco_aceite"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="banco_aceite"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="agencia_aceite"
          :schema="schema"
        />
        <Field
          name="agencia_aceite"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="agencia_aceite"
        />
      </div>
    </div>
    <div class="f1 mb2">
      <LabelFromYup
        name="conta_aceite"
        :schema="schema"
      />
      <Field
        name="conta_aceite"
        type="text"
        class="inputtext light mb1"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="conta_aceite"
      />
    </div>

    <div class="flex spacebetween center mb1">
      <h3 class="title">
        Dados Bancários Secretaria Fim

        <SmaeTooltip :texto="tooltip.dadosBancariosFim" />
      </h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="banco_fim"
          :schema="schema"
        />
        <Field
          name="banco_fim"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="banco_fim"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="agencia_fim"
          :schema="schema"
        />
        <Field
          name="agencia_fim"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="agencia_fim"
        />
      </div>
    </div>
    <div class="g2 mb1">
      <div class="f1 mb2">
        <LabelFromYup
          name="conta_fim"
          :schema="schema"
        />
        <Field
          name="conta_fim"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="conta_fim"
        />
      </div>
      <div class="f1 mb3">
        <LabelFromYup
          name="gestor_contrato"
          :schema="schema"
        />
        <Field
          name="gestor_contrato"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="gestor_contrato"
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
