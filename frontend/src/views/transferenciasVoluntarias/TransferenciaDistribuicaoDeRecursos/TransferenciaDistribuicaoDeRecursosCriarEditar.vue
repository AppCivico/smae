<script setup>
import Big from 'big.js';
import { vMaska } from 'maska';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  FieldArray,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FormErrorsList from '@/components/FormErrorsList.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { transferenciaDistribuicaoDeRecursos as schema } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

const alertStore = useAlertStore();
const ÓrgãosStore = useOrgansStore();
const distribuicaoRecursos = useDistribuicaoRecursosStore();
const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();

const router = useRouter();
const route = useRoute();

const {
  itemParaEdicao: transferenciaAtual,
} = storeToRefs(TransferenciasVoluntarias);

const {
  chamadasPendentes, erro, itemParaEdicao,
} = storeToRefs(distribuicaoRecursos);

const { órgãosComoLista } = storeToRefs(ÓrgãosStore);

const camposModificados = ref(false);

const porcentagens = ref({
  custeio: 0,
  investimento: 0,
});

const itemParaEdicaoFormatado = computed(() => {
  if (!itemParaEdicao.value.id) {
    return {
      valor_contrapartida: Big(0).toFixed(2),
      parlamentares: transferenciaAtual.value.parlamentares?.map((item) => ({
        ...item,
        nome: item.parlamentar?.nome_popular,
      })),
    };
  }

  return {
    ...itemParaEdicao.value,
    parlamentares: itemParaEdicao.value.parlamentares?.map((item) => ({
      ...item,
      nome: item.parlamentar?.nome_popular,
    })),
  };
});

const {
  errors,
  handleSubmit,
  isSubmitting,
  resetForm,
  setFieldValue,
  values,
} = useForm({
  initialValues: itemParaEdicaoFormatado,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

function voltarTela() {
  router.push({
    name: route.meta.rotaDeEscape,
    params: structuredClone(route.params),
  });
}

const onSubmit = handleSubmit.withControlled(async (controlledValues) => {
  // necessário por causa de 🤬
  const cargaManipulada = nulificadorTotal(controlledValues);

  try {
    cargaManipulada.pct_custeio = porcentagens.value.custeio;
    cargaManipulada.pct_investimento = porcentagens.value.investimento;
    cargaManipulada.transferencia_id = Number(route.params.transferenciaId);

    let r;
    const msg = itemParaEdicao.value.id
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (itemParaEdicao.value.id) {
      r = await distribuicaoRecursos.salvarItem(cargaManipulada, itemParaEdicao.value.id);
    } else {
      r = await distribuicaoRecursos.salvarItem(cargaManipulada);
    }

    if (r) {
      alertStore.success(msg);

      voltarTela();
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const isSomaCorreta = computed(() => {
  if (!route.params.transferenciaId || !camposModificados.value) return true;
  const soma = (parseFloat(values.valor) || 0) + (parseFloat(values.valor_contrapartida) || 0);

  return soma === parseFloat(values.valor_total);
});

function calcularValorCusteio(fieldName) {
  const valor = Big(values.valor || 0);
  const custeio = Big(values.custeio || 0);
  const percentagemCusteio = Big(values.percentagem_custeio || 0);

  if (fieldName === 'percentagem_custeio' || fieldName === 'valor') {
    const valorArredondado = valor
      .times(percentagemCusteio).div(100).round(2, Big.roundHalfUp);
    setFieldValue('custeio', valorArredondado.toString());
  } else if (fieldName === 'custeio') {
    const porcentagemCusteio = valor.eq(0)
      ? 0
      : custeio
        .div(valor)
        .times(100);
    setFieldValue('percentagem_custeio', porcentagemCusteio.toFixed(2));
    setFieldValue('percentagem_investimento', Big(100).minus(porcentagemCusteio).toFixed(2));
  }
}

function calcularValorInvestimento(fieldName) {
  const valor = Big(values.valor || 0);
  const investimento = Big(values.investimento || 0);
  const custeio = Big(values.custeio || 0);
  const percentagemInvestimento = Big(values.percentagem_investimento || 0);

  if (fieldName === 'percentagem_investimento' || fieldName === 'valor') {
    let valorArredondado = valor
      .times(percentagemInvestimento)
      .div(100)
      .round(2, Big.roundHalfUp);

    if (custeio.gt(0)) {
      valorArredondado = valor.minus(custeio);
    }
    const valorFinal = valorArredondado.round(2, Big.roundHalfUp);
    setFieldValue('investimento', valorFinal.toString());
  } else if (fieldName === 'investimento') {
    const porcentagemInvestimento = valor.eq(0)
      ? 0
      : investimento
        .div(valor)
        .times(100);
    setFieldValue('percentagem_investimento', porcentagemInvestimento.toFixed(2));
    setFieldValue('percentagem_custeio', Big(100)
      .minus(porcentagemInvestimento)
      .toFixed(2));
  }
}

function atualizarValorTotal(fieldName, newValue) {
  camposModificados.value = true;
  const valor = fieldName === 'valor' ? parseFloat(newValue) || 0 : parseFloat(values.valor) || 0;
  const valorContraPartida = fieldName === 'valor_contrapartida' ? parseFloat(newValue) || 0 : parseFloat(values.valor_contrapartida) || 0;
  const total = Big(valor + valorContraPartida).toFixed(2);
  setFieldValue('valor_total', total);

  calcularValorCusteio(fieldName);
  calcularValorInvestimento(fieldName);
}

function ajusteBruto(campoValorBruto) {
  const valor = Big(values.valor || 0);

  const valorPercentual = valor.eq(0)
    ? Big(0)
    : Big(values[campoValorBruto] || 0)
      .div(valor)
      .times(100);

  if (valorPercentual.gte(100)) {
    setFieldValue(campoValorBruto, values.valor);
    porcentagens.value[campoValorBruto] = 100;
    return;
  }

  porcentagens.value[campoValorBruto] = valorPercentual.round(2, Big.roundHalfUp).toNumber();
}

function ajustePercentual(campoValorBruto) {
  const valorBruto = Big(values.valor || 0)
    .times(porcentagens.value[campoValorBruto] || 0)
    .div(100);

  if (valorBruto.gte(Big(values.valor || 0))) {
    setFieldValue(campoValorBruto, values.valor.toString());
    porcentagens.value[campoValorBruto] = 100;

    return;
  }

  setFieldValue(campoValorBruto, valorBruto.toFixed(2));
}

watch(itemParaEdicao, async () => {
  resetForm({
    values: itemParaEdicaoFormatado.value,
  });

  calcularValorCusteio('custeio');
  calcularValorInvestimento('investimento');

  ajusteBruto('custeio');
  ajusteBruto('investimento');
});

watch(() => values.vigencia, (novoValor) => {
  if (
    itemParaEdicao.value?.vigencia
    && !itemParaEdicao.value?.justificativa_aditamento
    && novoValor !== itemParaEdicao.value?.vigencia
  ) {
    setFieldValue('justificativa_aditamento', '');
  } else {
    setFieldValue('justificativa_aditamento', itemParaEdicao.value?.justificativa_aditamento);
  }
});

watch(() => values.empenho, () => {
  if (values.empenho === false) {
    setFieldValue('data_empenho', null);
  }
});

watch(() => itemParaEdicaoFormatado.value, () => {
  resetForm({ values: itemParaEdicaoFormatado.value });
});

onMounted(async () => {
  if (!órgãosComoLista.value.length) {
    ÓrgãosStore.getAll();
  }
});
</script>

<template>
  <CabecalhoDePagina :formulario-sujo="formularioSujo" />

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

  <form @submit.prevent="!isSubmitting ? onSubmit() : null">
    <fieldset>
      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="orgao_gestor_id"
            :schema="schema"
          />

          <Field
            name="orgao_gestor_id"
            as="select"
            class="inputtext light mb1"
            :class="{
              error: errors?.orgao_gestor_id,
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
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="nome"
            :schema="schema"
          />
          <Field
            name="nome"
            class="inputtext light mb1"
            :class="{
              error: errors.nome,
            }"
          />
          <ErrorMessage
            name="nome"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="objeto"
            :schema="schema"
          />

          <SmaeText
            name="objeto"
            :model-value="values.objeto"
            as="textarea"
            class="inputtext light mb1"
            anular-vazio
            rows="5"
            maxlength="1000"
          />

          <ErrorMessage
            class="error-msg mb1"
            name="objeto"
          />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap g2 mb1">
        <div class="f1 fb15em">
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
            @update:model-value="(newValue) => {
              atualizarValorTotal('valor', newValue);
            }"
          />

          <ErrorMessage
            class="error-msg mb2"
            name="valor"
          />
        </div>

        <div class="f1 fb15em">
          <div class="flex center g1">
            <div>
              <label
                class="label"
                for="custeio_porcentagem"
              >
                Custeio (%)
              </label>

              <MaskedFloatInput
                id="custeio_porcentagem"
                v-model="porcentagens.custeio"
                type="text"
                class="inputtext light"
                maxlength="6"
                :max="100"
                :value="porcentagens.custeio"
                converter-para="string"
                @update:model-value="(newValue) => {
                  atualizarValorTotal('custeio_porcentagem', newValue);
                }"
                @input="ajustePercentual('custeio')"
              />
            </div>

            <small
              class="addlink text-center mt2"
              style="cursor: default;"
            >
              OU
            </small>

            <div>
              <LabelFromYup
                name="custeio"
                :schema="schema"
              />

              <MaskedFloatInput
                name="custeio"
                type="text"
                class="inputtext light"
                :value="values.custeio"
                converter-para="string"
                @update:model-value="(newValue) => {
                  atualizarValorTotal('custeio', newValue);
                }"
                @input="ajusteBruto('custeio')"
              />
            </div>
          </div>
        </div>

        <div class="f1 fb15em">
          <div class="flex center g1">
            <div>
              <label
                class="label"
                for="investimento_porcentagem"
              >
                Investimento (%)
              </label>

              <MaskedFloatInput
                id="investimento_porcentagem"
                v-model="porcentagens.investimento"
                type="text"
                class="inputtext light"
                maxlength="6"
                :max="100"
                :value="porcentagens.investimento"
                converter-para="string"
                @update:model-value="(newValue) => {
                  atualizarValorTotal('investimento_porcentagem', newValue);
                }"
                @input="ajustePercentual('investimento')"
              />
            </div>

            <small
              class="addlink text-center mt2"
              style="cursor: default;"
            >
              OU
            </small>

            <div>
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
                  atualizarValorTotal('investimento', newValue);
                }"
                @input="ajusteBruto('investimento')"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex mb1">
        <div class="f1">
          <LabelFromYup
            name="valor_contrapartida"
            :schema="schema"
          />

          <MaskedFloatInput
            name="valor_contrapartida"
            type="text"
            class="inputtext light mb2"
            :value="values.valor_contrapartida || 0"
            converter-para="string"
            @update:model-value="(newValue) => {
              atualizarValorTotal('valor_contrapartida', newValue);
            }"
          />

          <ErrorMessage
            class="error-msg mb2"
            name="valor_contrapartida"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1 fb10em">
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
            v-if="!$route.params.transferenciaId || !isSomaCorreta"
            class="tamarelo"
          >
            A soma dos valores não corresponde ao valor total.
          </div>
        </div>
      </div>

      <div
        v-if="values.parlamentares?.length !== 0"
        class="mb1"
      >
        <LabelFromYup
          :schema="schema"
          name="parlamentares"
          as="legend"
          class="label mb1"
        />

        <FieldArray
          v-slot="{ fields }"
          name="parlamentares"
        >
          <div
            v-for="(field, idx) in fields"
            :key="field.key"
            class="flex flexwrap justifyright g2 mt1"
          >
            <Field
              :name="`parlamentares[${idx}].parlamentar_id`"
              type="hidden"
              class="inputtext light"
            />
            <Field
              v-if="itemParaEdicao.id"
              :name="`parlamentares[${idx}].id`"
              type="hidden"
              class="inputtext light"
            />

            <div class="f1 fb15em">
              <LabelFromYup
                name="nome"
                :schema="schema.fields.parlamentares.innerType"
                class="tc300"
              />

              <Field
                v-maska
                :name="`parlamentares[${idx}].nome`"
                type="text"
                class="inputtext light"
                disabled
              />

              <ErrorMessage
                class="error-msg mb1"
                :name="`parlamentares[${idx}].nome`"
              />
            </div>

            <div class="f1 fb15em">
              <LabelFromYup
                name="valor"
                :schema="schema.fields.parlamentares.innerType"
                class="tc300"
              />

              <MaskedFloatInput
                :name="`parlamentares[${idx}].valor`"
                type="text"
                class="inputtext light"
                :value="values.parlamentares[idx].valor"
                converter-para="string"
                @update:model-value="(newValue) => {
                  atualizarValorTotal(`parlamentares[${idx}].valor`, newValue);
                }"
              />

              <ErrorMessage
                class="error-msg mb1"
                :name="`parlamentares[${idx}].valor`"
              />
            </div>

            <button
              class="like-a__text addlink align-start mt2"
              arial-label="limpar"
              title="limpar"
              type="button"
              @click="values.parlamentares[idx].valor = '0'"
            >
              limpar
            </button>
          </div>
        </FieldArray>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="programa_orcamentario_municipal"
            :schema="schema"
          />

          <Field
            name="programa_orcamentario_municipal"
            type="text"
            class="inputtext light mb1"
          />

          <ErrorMessage
            class="error-msg mb1"
            name="programa_orcamentario_municipal"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1">
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
            name="distribuicao_banco"
            :schema="schema"
          />
          <Field
            name="distribuicao_banco"
            type="text"
            class="inputtext light mb1"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="distribuicao_banco"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="distribuicao_agencia"
            :schema="schema"
          />
          <Field
            name="distribuicao_agencia"
            type="text"
            class="inputtext light mb1"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="distribuicao_agencia"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="distribuicao_conta"
            :schema="schema"
          />
          <Field
            name="distribuicao_conta"
            type="text"
            class="inputtext light mb1"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="distribuicao_conta"
          />
        </div>
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="finalidade"
            :schema="schema"
          />

          <Field
            name="finalidade"
            type="text"
            class="inputtext light mb1"
          />

          <ErrorMessage
            class="error-msg mb1"
            name="finalidade"
          />
        </div>

        <div class="f1">
          <LabelFromYup
            name="rubrica_de_receita"
            :schema="schema"
          />

          <Field
            name="rubrica_de_receita"
            type="text"
            class="inputtext light mb1"
          />

          <ErrorMessage
            class="error-msg mb1"
            name="rubrica_de_receita"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
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

        <div class="f1">
          <LabelFromYup
            name="data_empenho"
            :schema="schema"
          />

          <Field
            name="data_empenho"
            type="date"
            :disabled="!values.empenho"
            class="inputtext light mb1"
            :class="{ error: errors.data_empenho }"
            maxlength="10"
          />

          <ErrorMessage
            name="data_empenho"
            class="error-msg"
          />
        </div>

        <div class="f1">
          <LabelFromYup
            name="valor_empenho"
            :schema="schema"
          />

          <MaskedFloatInput
            name="valor_empenho"
            type="text"
            class="inputtext light mb2"
            :value="values.valor_empenho"
            converter-para="string"
            :disabled="!values.empenho"
          />

          <ErrorMessage
            name="valor_empenho"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2 mb1">
        <div class="f1">
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

        <div class="f1">
          <LabelFromYup
            name="valor_liquidado"
            :schema="schema"
          />
          <MaskedFloatInput
            name="valor_liquidado"
            type="text"
            class="inputtext light mb2"
            :value="values.valor_liquidado"
            converter-para="string"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="valor_liquidado"
          />
        </div>
      </div>
    </fieldset>

    <fieldset>
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
            placeholder="00.00.00.000.0000.0.000.00000000.00"
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
          <div
            v-for="(field, idx) in fields"
            :key="field.key"
            class="flex flexwrap justifyright g2 mb1"
          >
            <Field
              :name="`registros_sei[${idx}].id`"
              type="hidden"
              class="inputtext light"
            />

            <div class="f1">
              <LabelFromYup
                name="processo_sei"
                :schema="schema.fields.registros_sei.innerType"
                class="tc300"
              />

              <Field
                v-maska
                :name="`registros_sei[${idx}].processo_sei`"
                type="text"
                class="inputtext light"
                maxlength="40"
                data-maska="####.####/#######-#"
              />

              <ErrorMessage
                class="error-msg mb1"
                :name="`registros_sei[${idx}].processo_sei`"
              />
            </div>

            <div class="f1">
              <LabelFromYup
                name="nome"
                :schema="schema.fields.registros_sei.innerType"
                class="tc300"
              />

              <Field
                :name="`registros_sei[${idx}].nome`"
                type="text"
                class="inputtext light"
                maxlength="1024"
              />

              <ErrorMessage
                class="error-msg mb1"
                :name="`registros_sei[${idx}].nome`"
              />
            </div>

            <button
              class="like-a__text addlink mt1"
              arial-label="excluir"
              title="excluir"
              type="button"
              @click="remove(idx)"
            >
              <svg
                width="20"
                height="20"
              >
                <use xlink:href="#i_remove" />
              </svg>
            </button>
          </div>

          <button
            class="like-a__text addlink mb1"
            type="button"
            @click="push({ nome: '', processo_sei: '' })"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_+" />
            </svg>Adicionar registro
          </button>
        </FieldArray>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="proposta"
            :schema="schema"
          />

          <Field
            name="proposta"
            type="text"
            class="inputtext light mb1"
          />

          <ErrorMessage
            class="error-msg mb1"
            name="proposta"
          />
        </div>

        <div class="f1">
          <LabelFromYup
            name="convenio"
            :schema="schema"
          />

          <Field
            name="convenio"
            type="text"
            class="inputtext light mb1"
          />

          <ErrorMessage
            class="error-msg mb1"
            name="convenio"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1">
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

        <div class="f1">
          <LabelFromYup
            name="assinatura_termo_aceite"
            :schema="schema"
          />

          <Field
            name="assinatura_termo_aceite"
            type="date"
            class="inputtext light mb1"
            :class="{ error: errors.assinatura_termo_aceite }"
            maxlength="10"
          />

          <ErrorMessage
            name="assinatura_termo_aceite"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="assinatura_estado"
            :schema="schema"
          />

          <Field
            name="assinatura_estado"
            type="date"
            class="inputtext light"
            :class="{ error: errors.assinatura_estado }"
            maxlength="10"
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
            :class="{ error: errors.assinatura_municipio }"
            maxlength="10"
          />

          <ErrorMessage
            name="assinatura_municipio"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1 fb10em">
          <LabelFromYup
            name="vigencia"
            :schema="schema"
          />

          <Field
            name="vigencia"
            type="date"
            class="inputtext light mb1"
            :class="{ error: errors.vigencia }"
            maxlength="10"
          />

          <ErrorMessage
            name="vigencia"
            class="error-msg"
          />
        </div>

        <div
          v-if="values.justificativa_aditamento !== undefined
            && values.justificativa_aditamento !== null"
          class="f1 fb40"
        >
          <LabelFromYup
            name="justificativa_aditamento"
            :schema="schema"
            :required="true"
          />
          <Field
            name="justificativa_aditamento"
            type="text"
            class="inputtext light mb1"
            :class="{ error: errors.justificativa_aditamento }"
            maxlength="250"
          />
          <ErrorMessage
            name="justificativa_aditamento"
            class="error-msg"
          />
        </div>

        <div class="f1 fb10em">
          <LabelFromYup
            name="conclusao_suspensiva"
            :schema="schema"
          />

          <Field
            name="conclusao_suspensiva"
            type="date"
            class="inputtext light mb1"
            :class="{ error: errors.conclusao_suspensiva }"
            maxlength="10"
          />

          <ErrorMessage
            name="conclusao_suspensiva"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">

      <button
        class="btn big"
        :aria-busy="isSubmitting"
        :aria-disabled="Object.keys(errors)?.length"
        type="submit"
      >
        Salvar
      </button>

      <hr class="ml2 f1">
    </div>
  </form>
</template>
