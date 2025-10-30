<script setup>
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { transferenciaDistribuicaoDeRecursos as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
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
  nextTick,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import TransferenciasDistribuicaoStatusCriarEditar from './TransferenciasDistribuicaoStatusCriarEditar.vue';

const distribuicaoRecursos = useDistribuicaoRecursosStore();
const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();
const ÓrgãosStore = useOrgansStore();
const partidoStore = usePartidosStore();
const ParlamentaresStore = useParlamentaresStore();

const {
  chamadasPendentes, erro, lista, itemParaEdição, emFoco: distribuiçãoEmFoco,
} = storeToRefs(distribuicaoRecursos);
const { emFoco: transferenciasVoluntariaEmFoco } = storeToRefs(TransferenciasVoluntarias);
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);

const {
  lista: parlamentarComoLista,
  parlamentaresPorId,
  paginação: paginaçãoDeParlamentares,
} = storeToRefs(ParlamentaresStore);
const { lista: partidoComoLista } = storeToRefs(partidoStore);

const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const mostrarDistribuicaoRegistroForm = ref(false);
const camposModificados = ref(false);
const exibirModalStatus = ref(false);
const statusEmFoco = ref(null);

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});

const formulárioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (controlledValues) => {
  // necessário por causa de 🤬
  const cargaManipulada = nulificadorTotal(controlledValues);

  try {
    let r;
    const msg = itemParaEdição.value.id
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (itemParaEdição.value.id) {
      r = await distribuicaoRecursos.salvarItem(cargaManipulada, itemParaEdição.value.id);
    } else {
      r = await distribuicaoRecursos.salvarItem(cargaManipulada);
    }
    if (r) {
      alertStore.success(msg);

      mostrarDistribuicaoRegistroForm.value = false;

      if (itemParaEdição.value.id) {
        distribuiçãoEmFoco.value = null;
      }

      distribuicaoRecursos.buscarTudo({ transferencia_id: props.transferenciaId });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const calcularValorCusteio = (fieldName) => {
  const valor = parseFloat(values.valor) || 0;
  const custeio = parseFloat(values.custeio) || 0;
  const percentagemCusteio = parseFloat(values.percentagem_custeio) || 0;
  if (fieldName === 'percentagem_custeio' || fieldName === 'valor') {
    const valorArredondado = new Big(valor)
      .times(percentagemCusteio).div(100).round(2, Big.roundHalfUp);
    setFieldValue('custeio', valorArredondado.toString());
  } else if (fieldName === 'custeio') {
    const porcentagemCusteio = ((custeio / valor) * 100);
    setFieldValue('percentagem_custeio', porcentagemCusteio.toFixed(2));
    setFieldValue('percentagem_investimento', (100 - porcentagemCusteio).toFixed(2));
  }
};

const calcularValorInvestimento = (fieldName) => {
  const valor = parseFloat(values.valor) || 0;
  const investimento = parseFloat(values.investimento) || 0;
  const custeio = parseFloat(values.custeio) || 0;
  const percentagemInvestimento = parseFloat(values.percentagem_investimento) || 0;
  if (fieldName === 'percentagem_investimento' || fieldName === 'valor') {
    const valorArredondado = new Big(valor)
      .times(percentagemInvestimento).div(100).round(2);
    let valorArredondadoConvertido = parseFloat(valorArredondado.toString());
    if (custeio > 0) {
      valorArredondadoConvertido = valor - custeio;
    }
    const valorFinal = new Big(valorArredondadoConvertido).round(2, Big.roundHalfUp);
    setFieldValue('investimento', valorFinal.toString());
  } else if (fieldName === 'investimento') {
    const porcentagemInvestimento = ((investimento / valor) * 100);
    setFieldValue('percentagem_investimento', porcentagemInvestimento.toFixed(2));
    setFieldValue('percentagem_custeio', (100 - porcentagemInvestimento).toFixed(2));
  }
};

async function editarDistribuicaoRecursos(id) {
  await distribuicaoRecursos.buscarItem(id);
  mostrarDistribuicaoRegistroForm.value = true;
  calcularValorCusteio('custeio');
  calcularValorInvestimento('investimento');
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

async function registrarNovaDistribuicaoRecursos() {
  if (mostrarDistribuicaoRegistroForm.value) {
    mostrarDistribuicaoRegistroForm.value = false;
  } else {
    distribuiçãoEmFoco.value = null;
    // aguardando o watcher causado pela linha anterior
    await nextTick();
    resetForm({
      values: {
        objeto: transferenciasVoluntariaEmFoco.value.objeto,
        nome: truncate(transferenciasVoluntariaEmFoco.value.objeto, 100),
      },
    });
    mostrarDistribuicaoRegistroForm.value = true;
  }
}

async function iniciar() {
  distribuicaoRecursos.buscarTudo({ transferencia_id: props.transferenciaId });

  if (transferenciasVoluntariaEmFoco.value?.id !== Number(props.transferenciaId)) {
    await TransferenciasVoluntarias.buscarItem(props.transferenciaId);
  }
  ParlamentaresStore.buscarTudo({ ipp: 500, possui_mandatos: true });
  partidoStore.buscarTudo();
  ÓrgãosStore.getAll();
}

async function handleSalvouStatus() {
  exibirModalStatus.value = false;
  await distribuicaoRecursos.buscarItem(distribuiçãoEmFoco.value.id);
}

function abrirModalStatus(status = null) {
  statusEmFoco.value = status;
  exibirModalStatus.value = true;
}

iniciar();

watch(itemParaEdição, (novosValores) => {
  resetForm({
    values: {
      ...novosValores,
      parlamentares: novosValores.parlamentares?.length
        ? novosValores.parlamentares
        : transferenciasVoluntariaEmFoco.value?.parlamentares.map((x) => ({
          valor: x.valor,
          parlamentar_id: x.parlamentar_id,
        })),
    },
  });
  calcularValorCusteio('custeio');
  calcularValorInvestimento('investimento');
});

watch(() => values.vigencia, (novoValor) => {
  if (
    itemParaEdição.value?.vigencia
    && !itemParaEdição.value?.justificativa_aditamento
    && novoValor !== itemParaEdição.value?.vigencia
  ) {
    setFieldValue('justificativa_aditamento', '');
  }
});

onUnmounted(() => {
  distribuicaoRecursos.$reset();
});

const atualizarValorTotal = (fieldName, newValue) => {
  camposModificados.value = true;
  const valor = fieldName === 'valor' ? parseFloat(newValue) || 0 : parseFloat(values.valor) || 0;
  const valorContraPartida = fieldName === 'valor_contrapartida' ? parseFloat(newValue) || 0 : parseFloat(values.valor_contrapartida) || 0;
  const total = (valor + valorContraPartida).toFixed(2);
  setFieldValue('valor_total', total);
  calcularValorCusteio(fieldName);
  calcularValorInvestimento(fieldName);
};

const isSomaCorreta = computed(() => {
  if (!props.transferenciaId || !camposModificados.value) return true;
  const soma = (parseFloat(values.valor) || 0) + (parseFloat(values.valor_contrapartida) || 0);

  return soma === parseFloat(values.valor_total);
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
    <div
      role="region"
      aria-label="Distribuições de recursos já cadastradas"
      tabindex="0"
      class="mb1"
    >
      <table class="tablemain mb1">
        <col>
        <col class="col--number">
        <col class="col--data">
        <col>
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
            <th class="cell--data">
              Data de vigência
            </th>
            <th>
              Nome
            </th>
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in lista"
            :key="item.id"
          >
            <td>{{ item.orgao_gestor.sigla }}</td>
            <td class="cell--number">
              {{ item.valor_total
                ? dinheiro(item.valor_total)
                : '-' }}
            </td>
            <td class="cell--data">
              {{ dateToField(item.vigencia) }}
            </td>
            <td>{{ item.nome || '-' }}</td>
            <td>
              <button
                class="like-a__text"
                aria-label="editar"
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
            <td>
              <button
                class="like-a__text"
                aria-label="excluir"
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
    </div>

    <button
      class="like-a__text addlink"
      @click="registrarNovaDistribuicaoRecursos"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg> Registrar nova distribuição de recurso x
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

    <div class="flex g2 mb1">
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
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb2">
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
        <Field
          name="objeto"
          as="textarea"
          class="inputtext light mb1"
          rows="5"
          maxlength="1000"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="objeto"
        />
      </div>
    </div>

    <div class="mb2">
      <fieldset>
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
            @update:model-value="(newValue) => {
              atualizarValorTotal('valor', newValue, setFieldValue);
            }"
          />
          <ErrorMessage
            class="error-msg mb2"
            name="valor"
          />
        </div>
      </fieldset>

      <fieldset class="padding-sm mb2 flex">
        <LabelFromYup as="legend">
          Custeio
        </LabelFromYup>
        <div class="flex f1 g2 center">
          <div class="fb20em">
            <LabelFromYup
              name="percentagem_custeio"
              :schema="schema"
            />
            <MaskedFloatInput
              name="percentagem_custeio"
              type="text"
              class="inputtext light"
              :value="values.percentagem_custeio"
              :max="100"
              maxlength="6"
              converter-para="string"
              @update:model-value="(newValue) => {
                atualizarValorTotal('percentagem_custeio', newValue, setFieldValue);
              }"
            />
          </div>
          <small
            class="addlink mt2 text-center"
            style="cursor: default;"
          >OU</small>
          <div class="fb50em">
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
                atualizarValorTotal('custeio', newValue, setFieldValue);
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
              name="percentagem_investimento"
              :schema="schema"
            />
            <MaskedFloatInput
              name="percentagem_investimento"
              type="text"
              class="inputtext light"
              :value="values.percentagem_investimento"
              converter-para="string"
              :max="100"
              maxlength="6"
              @update:model-value="(newValue) => {
                atualizarValorTotal('percentagem_investimento', newValue, setFieldValue);
              }"
            />
          </div>
          <small
            class="addlink mt2 text-center"
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
                atualizarValorTotal('investimento', newValue, setFieldValue);
              }"
            />
          </div>
        </div>
      </fieldset>

      <div class="halfInput">
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
            atualizarValorTotal('valor_contrapartida', newValue, setFieldValue);
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
          v-if="!props.transferenciaId || !isSomaCorreta"
          class="tamarelo"
        >
          A soma dos valores não corresponde ao valor total.
        </div>
      </div>
      <div class="f1 fb5em">
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
        <div class="error-msg">
          {{ errors.empenho }}
        </div>
      </div>
      <div
        v-if="values.empenho"
        class="f1 fb10em mb1"
      >
        <LabelFromYup
          name="data_empenho"
          :schema="schema"
        />
        <Field
          name="data_empenho"
          type="date"
          class="inputtext light mb1"
          :class="{ error: errors.data_empenho }"
          maxlength="10"
          @change="($event) => {
            if ($event?.target?.value === '') setFieldValue('data_empenho', null);
          }"
        />
        <ErrorMessage
          name="conclusao_suspensiva"
          class="error-msg"
        />
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
          placeholder="00.00.00.000.0000.0.000.00000000.00"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="dotacao"
        />
      </div>
    </div>

    <div class="mb2">
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
          class="flex flexwrap justifyright g2 mb2"
        >
          <Field
            :name="`registros_sei[${idx}].id`"
            type="hidden"
            class="inputtext light"
          />
          <div
            class="f1 fb15em"
          >
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

          <div
            class="f1 fb15em"
          >
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
            aria-label="excluir"
            title="excluir"
            @click="remove(idx)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </div>

        <button
          class="like-a__text addlink"
          type="button"
          @click="push({ nome: '', processo_sei: '' })"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg>Adicionar registro
        </button>
      </FieldArray>
    </div>

    <div class="flex flexwrap g2">
      <div class="f1 fb10em mb1">
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
      <div class="f1 fb10em mb1">
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

    <div class="flex flexwrap g2">
      <div class="f1 fb10em mb1">
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
      <div class="f1 fb10em mb1">
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
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('assinatura_termo_aceite', $v || null); }"
        />
        <ErrorMessage
          name="assinatura_termo_aceite"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex flexwrap g2 mb1">
      <div class="f1 fb10em">
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
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('assinatura_estado', $v || null); }"
        />
        <ErrorMessage
          name="assinatura_estado"
          class="error-msg"
        />
      </div>
      <div class="f1 fb10em">
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
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('assinatura_municipio', $v || null); }"
        />
        <ErrorMessage
          name="assinatura_municipio"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex flexwrap g2 mb3">
      <div class="f1 fb10em mb1">
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
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('vigencia', $v || null); }"
        />
        <ErrorMessage
          name="vigencia"
          class="error-msg"
        />
      </div>
      <div
        v-if="values.justificativa_aditamento
          || values.justificativa_aditamento === ''"
        class="f1 fb25em mb1"
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
      <div class="f1 fb10em mb1">
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
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('conclusao_suspensiva', $v || null); }"
        />
        <ErrorMessage
          name="conclusao_suspensiva"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex spacebetween center mb1">
      <h3 class="title">
        Parlamentares
      </h3>
      <hr class="ml2 f1">
    </div>

    <div class="mb1">
      <div
        v-for="(parlamentar, idx) in transferenciasVoluntariaEmFoco.parlamentares"
        :key="`parlamentares--${parlamentar.id}`"
        class="mb2"
      >
        <Field
          :name="`parlamentares[${idx}].id`"
          type="hidden"
        />

        <Field
          :name="`parlamentares[${idx}].parlamentar_id`"
          type="hidden"
          :value="parlamentar.parlamentar_id"
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
              :value="parlamentar?.parlamentar?.nome_popular"
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
  <details
    v-if="distribuiçãoEmFoco?.aditamentos.length"
    class="mb1"
  >
    <summary
      class="label mb0"
      style="line-height: 1.5rem;"
    >
      Visualizar histórico de aditamentos
    </summary>
    <table class="tablemain">
      <col>
      <col>
      <thead>
        <tr>
          <th>DATA</th>
          <th>justificativa para aditamento</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in distribuiçãoEmFoco.aditamentos"
          :key="item.id"
        >
          <td> {{ item.data_vigencia ? item.data_vigencia.split('T')[0].split('-').reverse().join('/') : '' }}</td>
          <td>{{ item.justificativa }}</td>
        </tr>
      </tbody>
    </table>
  </details>

  <details
    v-if="distribuiçãoEmFoco?.historico_status.length"
    class="mb1"
  >
    <summary
      class="label mb0"
      style="line-height: 1.5rem;"
    >
      Visualizar histórico de status
    </summary>
    <table class="tablemain">
      <col>
      <col>
      <col>
      <col>
      <col>
      <col>
      <col>
      <thead>
        <tr>
          <th>DATA</th>
          <th>STATUS</th>
          <th>ÓRGÃO</th>
          <th>RESPONSÁVEL</th>
          <th>MOTIVO</th>
          <th>TOTAL DE DIAS NO STATUS</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in distribuiçãoEmFoco.historico_status"
          :key="item.id"
        >
          <td>{{ item.data_troca ? item.data_troca.split('T')[0].split('-').reverse().join('/') : '' }}</td>
          <td>{{ item.status_base?.nome || item.status_customizado?.nome }}</td>
          <td>{{ item.orgao_responsavel?.sigla }}</td>
          <td>{{ item.nome_responsavel }}</td>
          <td>{{ item.motivo }}</td>
          <td>{{ item.dias_no_status }}</td>
          <td>
            <button
              v-if="item.id === distribuiçãoEmFoco.historico_status[0].id"
              class="like-a__text"
              aria-label="editar"
              title="editar"
              type="button"
              @click="abrirModalStatus(item)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </details>
  <button
    v-if="distribuiçãoEmFoco"
    class="like-a__text addlink"
    type="button"
    @click="abrirModalStatus(null)"
  >
    <svg
      width="20"
      height="20"
    ><use xlink:href="#i_+" /></svg>Adicionar status
  </button>
  <TransferenciasDistribuicaoStatusCriarEditar
    v-if="exibirModalStatus"
    :transferencia-workflow-id="transferenciasVoluntariaEmFoco?.workflow_id"
    :distribuicao-id="distribuiçãoEmFoco?.id"
    :status-em-foco="statusEmFoco"
    @fechar-modal="exibirModalStatus = false"
    @salvou-status="handleSalvouStatus"
  />
</template>
