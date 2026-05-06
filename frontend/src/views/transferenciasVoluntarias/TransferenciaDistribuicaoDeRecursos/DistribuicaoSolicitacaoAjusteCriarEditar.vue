<script setup>
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
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { distribuicaoSolicitacaoAjuste as schema } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import prepararRotaDeEscape from '@/helpers/prepararRotaDeEscape';
import { useAlertStore } from '@/stores/alert.store';
import { useDistribuicaoSolicitacaoAjusteStore } from '@/stores/distribuicaoSolicitacaoAjuste.store.ts';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';

import { useDistribuicaoSolicitacaoAjustePermissoes } from './useDistribuicaoSolicitacaoAjustePermissoes.composable';

const { ehCriador } = useDistribuicaoSolicitacaoAjustePermissoes();

const alertStore = useAlertStore();

const ajusteStore = useDistribuicaoSolicitacaoAjusteStore();
const distribuicaoRecursosStore = useDistribuicaoRecursosStore();

const router = useRouter();
const route = useRoute();

const {
  chamadasPendentes,
  emFoco,
  erros,
  itemParaEdicao,
} = storeToRefs(ajusteStore);

const podeCriar = computed(() => !route.params.ajusteId && ehCriador.value);
const podeSalvar = computed(() => !!emFoco.value?.pode_editar);
const podeAprovar = computed(() => !!emFoco.value?.pode_aprovar);
const modoLeitura = computed(() => !podeSalvar.value && !podeCriar.value);

const itemParaEdicaoInicial = computed(() => ({
  ...distribuicaoRecursosStore.itemParaEdicao,
  ...itemParaEdicao.value,
}));

const {
  errors,
  handleSubmit,
  isSubmitting,
  resetForm,
  values,
} = useForm({
  initialValues: itemParaEdicaoInicial,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const salvar = handleSubmit.withControlled(async (controlledValues) => {
  const carga = nulificadorTotal({ dotacoes: [], ...controlledValues });
  carga.distribuicao_recurso_id = Number(route.params.recursoId);

  if (isSubmitting.value) return;

  try {
    const r = await ajusteStore.salvarItem(
      carga,
      route.params.ajusteId ? Number(route.params.ajusteId) : 0,
    );

    if (r) {
      alertStore.success('Dados salvos com sucesso!');
      router.push(prepararRotaDeEscape(route));
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const submeterItem = handleSubmit.withControlled(async (controlledValues) => {
  const carga = nulificadorTotal({ dotacoes: [], ...controlledValues });
  carga.distribuicao_recurso_id = Number(route.params.recursoId);

  if (isSubmitting.value) return;

  try {
    const r = await ajusteStore.salvarItem(
      carga,
      route.params.ajusteId ? Number(route.params.ajusteId) : 0,
    );

    if (r) {
      const ajusteId = route.params.ajusteId ? Number(route.params.ajusteId) : r?.id;
      const s = await ajusteStore.solicitarAprovacao(ajusteId);
      if (s) {
        alertStore.success('Alteração enviada para validação com sucesso!');
        router.push(prepararRotaDeEscape(route));
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

async function aprovar() {
  try {
    const r = await ajusteStore.aplicarDecisao(Number(route.params.ajusteId), 'Aprovada');
    if (r) {
      alertStore.success('Alteração aprovada com sucesso!');
      router.push(prepararRotaDeEscape(route));
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function reprovar() {
  alertStore.confirmAction('Deseja reprovar esta alteração?', async () => {
    const r = await ajusteStore.aplicarDecisao(Number(route.params.ajusteId), 'Recusada');
    if (r) {
      alertStore.success('Alteração reprovada.');
      router.push(prepararRotaDeEscape(route));
    }
  }, 'Reprovar');
}

watch(itemParaEdicao, () => {
  resetForm({ values: itemParaEdicaoInicial.value });
});

onMounted(() => {
  if (route.params.ajusteId) {
    ajusteStore.buscarItem(Number(route.params.ajusteId));
  }
});
</script>

<template>
  <CabecalhoDePagina :formulario-sujo="formularioSujo" />

  <LoadingComponent v-if="chamadasPendentes?.emFoco" />

  <ErrorComponent :erro="erros.emFoco" />

  <form @submit.prevent="!isSubmitting && podeSalvar ? salvar() : null">
    <fieldset :disabled="modoLeitura">
      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="nome"
            :schema="schema"
          />
          <Field
            name="nome"
            class="inputtext light mb1"
            :class="{ error: errors.nome }"
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

      <div class="flex g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="informacoes_complementares"
            :schema="schema"
          />
          <SmaeText
            name="informacoes_complementares"
            as="textarea"
            class="inputtext light mb1"
            anular-vazio
            rows="5"
            :schema="schema"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="informacoes_complementares"
          />
        </div>
      </div>
    </fieldset>

    <fieldset :disabled="modoLeitura">
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
            <option :value="false">
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
            :disabled="!values.empenho || modoLeitura"
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
            :disabled="!values.empenho || modoLeitura"
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

    <fieldset :disabled="modoLeitura">
      <div class="mb1">
        <LabelFromYup
          name="dotacoes"
          :schema="schema"
          as="legend"
          class="label mb1"
        />

        <p
          v-if="!values.dotacoes?.length && modoLeitura"
          class="mb1"
        >
          Não há dotações cadastradas para esta distribuição de recursos.
        </p>

        <FieldArray
          v-slot="{ fields, push, remove }"
          name="dotacoes"
        >
          <div
            v-for="(field, idx) in fields"
            :key="field.key"
            class="flex flexwrap gx2 mb1"
          >
            <Field
              :name="`dotacoes[${idx}]`"
              type="text"
              class="inputtext light f1"
              placeholder="00.00.00.000.0000.0.000.00000000.00"
              maxlength="250"
            />

            <button
              v-if="!modoLeitura"
              class="like-a__text addlink"
              aria-label="excluir"
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

            <ErrorMessage
              class="error-msg fb100"
              :name="`dotacoes[${idx}]`"
            />
          </div>

          <button
            v-if="!modoLeitura"
            class="like-a__text addlink mb1"
            type="button"
            @click="push('')"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_+" />
            </svg>Adicionar dotação
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

    <SmaeFieldsetSubmit
      v-if="podeSalvar || podeAprovar"
      :erros="errors"
    >
      <template v-if="podeSalvar">
        <button
          class="btn big"
          type="submit"
          :aria-busy="isSubmitting"
          :aria-disabled="!!Object.keys(errors).length"
        >
          Salvar
        </button>

        <button
          class="btn big bgnone tcprimary outline"
          type="button"
          :aria-busy="isSubmitting"
          :aria-disabled="!!Object.keys(errors).length"
          @click="submeterItem()"
        >
          Salvar e encaminhar para validação
        </button>
      </template>

      <template v-if="podeAprovar">
        <button
          class="btn big bgnone tvermelho outline"
          type="button"
          :aria-busy="chamadasPendentes.emFoco"
          @click="reprovar"
        >
          Reprovar
        </button>

        <button
          class="btn big"
          type="button"
          :aria-busy="chamadasPendentes.emFoco"
          @click="aprovar"
        >
          Aprovar
        </button>
      </template>
    </SmaeFieldsetSubmit>
  </form>
</template>
