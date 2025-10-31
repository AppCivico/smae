<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { tipoDeVinculoEditar as schema } from '@/consts/formSchemas';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useTransferenciasVinculosStore } from '@/stores/transferenciasVinculos.store';

const props = defineProps({
  transferenciaId: {
    type: Number,
    required: true,
  },
  vinculoId: {
    type: Number,
    required: true,
  },
});

const router = useRouter();
const alertStore = useAlertStore();
const vinculosStore = useTransferenciasVinculosStore();

const {
  linhasEndereco, linhasDotacao, tiposDeVinculo, chamadasPendentes,
} = storeToRefs(vinculosStore);

const vinculoAtual = computed(() => {
  const vinculoEndereco = linhasEndereco.value.find((v) => v.id === props.vinculoId);
  if (vinculoEndereco) return vinculoEndereco;

  const vinculoDotacao = linhasDotacao.value.find((v) => v.id === props.vinculoId);
  return vinculoDotacao || null;
});

const itemParaEdicao = computed(() => ({
  tipo_vinculo_id: vinculoAtual.value?.tipo_vinculo?.id || null,
  observacao: vinculoAtual.value?.observacao || '',
}));

if (tiposDeVinculo.value.length === 0) {
  vinculosStore.buscarTiposDeVinculo();
}

const {
  errors, handleSubmit, isSubmitting, resetForm,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit(async (vals) => {
  try {
    const resposta = await vinculosStore.salvarItem(vals, props.vinculoId);

    if (resposta) {
      alertStore.success('Dados salvos com sucesso!');
      const campoVinculo = vinculoAtual.value?.campo_vinculo;
      await vinculosStore.buscarVinculos({
        transferencia_id: props.transferenciaId,
        campo_vinculo: campoVinculo,
      });
      await router.push({
        name: 'TransferenciasVoluntariasVinculos',
      });
    }
  } catch (erro) {
    alertStore.error(erro);
  }
});

watch(itemParaEdicao, (novoValor) => {
  resetForm({ values: novoValor });
});

function obterObjetoVinculado() {
  return vinculoAtual.value?.projeto
    || vinculoAtual.value?.meta
    || vinculoAtual.value?.iniciativa
    || vinculoAtual.value?.atividade
    || null;
}

function obterPortfolioOuModulo() {
  if (vinculoAtual.value?.projeto?.portfolio) {
    return `Portfolio: ${vinculoAtual.value.projeto.portfolio.nome}`;
  }
  if (vinculoAtual.value?.projeto) {
    return 'Projeto';
  }
  if (vinculoAtual.value?.iniciativa) {
    return 'Iniciativa';
  }
  if (vinculoAtual.value?.atividade) {
    return 'Atividade';
  }
  if (vinculoAtual.value?.meta) {
    return 'PDM/Meta';
  }
  return '-';
}
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h2>Editar Vínculo</h2>
    <hr class="ml2 f1">
    <CheckClose :formulario-sujo="formularioSujo" />
  </div>

  <LoadingComponent v-if="chamadasPendentes.lista" />

  <div
    v-else-if="!vinculoAtual"
    class="error p1"
  >
    <div class="error-msg">
      <p class="w700">
        Vínculo não encontrado
      </p>
      <p class="t14">
        O vínculo solicitado não foi encontrado ou não está mais disponível.
      </p>
    </div>
  </div>

  <template v-else>
    <div class="mb2">
      <h3 class="w700 tc600 t16 mb1">
        Dados da Distribuição
      </h3>
      <div class="flex g2 flexwrap">
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            Órgão Responsável
          </dt>
          <dd>
            {{ vinculoAtual.distribuicao_recurso?.orgao?.sigla }}
            -
            {{ vinculoAtual.distribuicao_recurso?.orgao?.descricao }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            Nome da Distribuição
          </dt>
          <dd>
            {{ vinculoAtual.distribuicao_recurso?.nome || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            Valor
          </dt>
          <dd>
            {{
              vinculoAtual.distribuicao_recurso?.valor
                ? `R$ ${dinheiro(vinculoAtual.distribuicao_recurso.valor)}`
                : '-'
            }}
          </dd>
        </dl>
      </div>

      <h3 class="w700 tc600 t16 mb1 mt2">
        Objeto Vinculado
      </h3>
      <div class="flex g2 flexwrap">
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            {{ obterPortfolioOuModulo() }}
          </dt>
          <dd>
            {{ obterObjetoVinculado()?.nome || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            Órgão
          </dt>
          <dd>
            {{ obterObjetoVinculado()?.orgao?.sigla || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            Status
          </dt>
          <dd>
            {{ obterObjetoVinculado()?.status || '-' }}
          </dd>
        </dl>
      </div>

      <div class="flex g2 flexwrap mt1">
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            {{ vinculoAtual.campo_vinculo === 'Endereco' ? 'Endereço' : 'Dotação' }}
          </dt>
          <dd>
            {{ vinculoAtual.valor_vinculo || '-' }}
          </dd>
        </dl>
      </div>

      <hr class="mt2 mb2">
    </div>

    <form @submit.prevent="onSubmit">
      <div class="flex g2 mb1">
        <div class="f1 mb1">
          <LabelFromYup
            name="tipo_vinculo_id"
            :schema="schema"
          />
          <Field
            name="tipo_vinculo_id"
            as="select"
            class="inputtext light mb1"
            :aria-busy="chamadasPendentes.tiposDeVinculo"
            :class="{ 'error': errors.tipo_vinculo_id }"
            @mousedown="chamadasPendentes.tiposDeVinculo && $event.preventDefault()"
            @keydown="chamadasPendentes.tiposDeVinculo && $event.preventDefault()"
            @focus="chamadasPendentes.tiposDeVinculo && $event.target.blur()"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="tipo in tiposDeVinculo"
              :key="tipo.id"
              :value="tipo.id"
            >
              {{ tipo.nome }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="tipo_vinculo_id"
          />
        </div>
      </div>

      <div class="flex g2 mb1">
        <div class="f1 mb1">
          <LabelFromYup
            name="observacao"
            :schema="schema"
          />
          <Field
            name="observacao"
            as="textarea"
            rows="4"
            class="inputtext light mb1"
            :class="{ 'error': errors.observacao }"
          />
          <ErrorMessage
            class="error-msg"
            name="observacao"
          />
        </div>
      </div>

      <FormErrorsList :errors="errors" />

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </form>
  </template>
</template>
