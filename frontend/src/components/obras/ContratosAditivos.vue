<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  computed,
  ref,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';

import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import SmallModal from '@/components/SmallModal.vue';
import { aditivoDeContrato as schema } from '@/consts/formSchemas';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import { dateToShortDate } from '@/helpers/dateToDate';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useContratosStore } from '@/stores/contratos.store.ts';
import { useObrasStore } from '@/stores/obras.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTipoDeAditivosStore } from '@/stores/tipoDeAditivos.store';

const emit = defineEmits(['salvo', 'excluido']);

const route = useRoute();

const aditivosStore = useTipoDeAditivosStore();
const alertStore = useAlertStore();
const contratosStore = useContratosStore(route.meta.entidadeMãe);

const {
  chamadasPendentes,
  emFoco: contratoEmFoco,
  erro,
} = storeToRefs(contratosStore);

const { permissõesDaObraEmFoco } = storeToRefs(useObrasStore());
const { permissõesDoProjetoEmFoco } = storeToRefs(useProjetosStore());

const permissoesDoItemEmFoco = computed(() => (route.meta.entidadeMãe === 'obras'
  ? permissõesDaObraEmFoco.value
  : permissõesDoProjetoEmFoco.value));

const {
  lista: listaDeTiposDeAditivos,
  chamadasPendentes: chamadasPendentesDeTiposDeAditivos,
  erros: errosDeTiposDeAditivos,
  tipoDeAditivoPorId,
} = storeToRefs(aditivosStore);

const aditivoId = ref(0);
const exibirDialogo = ref(false);

const itemParaEdicao = computed(() => {
  const aditivoEmFoco = aditivoId.value && contratoEmFoco.value
    ? contratoEmFoco.value?.aditivos?.find((item) => item.id === aditivoId.value)
    : null;

  return {
    ...aditivoEmFoco,
    numero: aditivoEmFoco?.numero || null,
    contrato_id: contratoEmFoco.value?.id,
    data_termino_atualizada: aditivoEmFoco?.data_termino_atualizada
      ? dateTimeToDate(aditivoEmFoco.data_termino_atualizada)
      : null,
    data: aditivoEmFoco?.data
      ? dateTimeToDate(aditivoEmFoco.data)
      : null,
    tipo_aditivo_id: aditivoEmFoco?.tipo?.id || null,
  };
});

const {
  errors, handleSubmit, isSubmitting, setFieldValue, resetForm, values: carga,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    const msg = aditivoId.value
      ? 'Aditivo salvo!'
      : 'Aditivo adicionado!';

    const resposta = await contratosStore.salvarAditivo(
      carga,
      aditivoId.value,
      contratoEmFoco.value.id,
    );

    if (resposta) {
      alertStore.success(msg);
      exibirDialogo.value = false;
      emit('salvo');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const formularioSujo = useIsFormDirty();

function abrirDialogo(id = 0) {
  aditivoId.value = id;
  exibirDialogo.value = true;
  resetForm({
    values: itemParaEdicao.value,
  });
}

async function excluirAditivo(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await contratosStore.excluirAditivo(id)) {
        alertStore.success(`"${descricao}" removido.`);
        emit('excluido');
      }
    },
    'Remover',
  );
}

watch(exibirDialogo, (novoValor) => {
  if (novoValor) {
    if (!listaDeTiposDeAditivos.value.length) {
      aditivosStore.buscarTudo();
    }
  }
}, { once: true });

const colunas = [
  {
    chave: 'numero',
    label: 'Número',
    ehCabecalho: true,
    atributosDaColuna: { class: 'col--minimum' },
  },
  {
    chave: 'tipo',
    label: 'Tipo',
  },
  {
    chave: 'tipo.tipo',
    label: 'Aditivo/Reajuste',
    atributosDaColuna: { class: 'col--minimum' },
  },
  {
    chave: 'data',
    label: 'Data',
    formatador: (v) => (v ? dateToShortDate(v) : ''),
    atributosDaColuna: { class: 'col--data' },
    atributosDaCelula: { class: 'cell--data' },
    atributosDoCabecalhoDeColuna: { class: 'cell--data' },
  },
  {
    chave: 'valor',
    label: 'Valor',
    formatador: (v) => (v ? `R$ ${dinheiro(v)}` : ''),
    atributosDaColuna: { class: 'col--minimum' },
    atributosDaCelula: { class: 'cell--number' },
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
  },
  {
    chave: 'percentual_medido',
    label: 'Percentual medido',
    formatador: (v) => (v ? `${v}%` : '-'),
    atributosDaColuna: { class: 'col--minimum' },
    atributosDaCelula: { class: 'cell--number' },
    atributosDoCabecalhoDeColuna: { class: 'cell--number' },
  },
  {
    chave: 'data_termino_atualizada',
    label: 'Término atualizado',
    formatador: (v) => (v ? dateToShortDate(v) : '-'),
    atributosDaColuna: { class: 'col--data' },
    atributosDaCelula: { class: 'cell--data' },
    atributosDoCabecalhoDeColuna: { class: 'cell--data' },
  },
];

const dadosDaTabela = computed(() => (Array.isArray(contratoEmFoco.value?.aditivos)
  ? contratoEmFoco.value.aditivos
  : []));

function limparCamposRelacionados(tipo_aditivo_id) {
  const tipoDeAditivo = listaDeTiposDeAditivos.value.find(
    (item) => item.id === tipo_aditivo_id,
  ) || {};

  if (!tipoDeAditivo.habilita_valor) {
    setFieldValue('percentual_medido', null);
    setFieldValue('valor', null);
  }

  if (!tipoDeAditivo.habilita_valor_data_termino) {
    setFieldValue('data_termino_atualizada', null);
  }
}
</script>
<template>
  <LoadingComponent v-if="chamadasPendentes.aditivo">
    Carregando aditivos
  </LoadingComponent>

  <SmaeTable
    :colunas="colunas"
    :dados="dadosDaTabela"
    :atributos-da-tabela="{ class: 'mb2' }"
    titulo="Aditivos e Reajustes"
    rolagem-horizontal
  >
    <template #celula:tipo="{ linha }">
      {{ linha.tipo?.nome || linha.tipo }}
    </template>

    <template #acoes="{ linha }">
      <button
        v-if="!permissoesDoItemEmFoco.apenas_leitura
          || permissoesDoItemEmFoco.sou_responsavel"
        class="block like-a__text tipinfo"
        type="button"
        @click="abrirDialogo(linha.id)"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_edit" /></svg>
        <div>Editar aditivo</div>
      </button>

      <button
        v-if="!permissoesDoItemEmFoco.apenas_leitura
          || permissoesDoItemEmFoco.sou_responsavel"
        class="like-a__text"
        aria-label="excluir"
        title="excluir"
        @click="excluirAditivo(linha.id, linha.numero)"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_waste" /></svg>
      </button>
    </template>
  </SmaeTable>

  <p>
    <button
      v-if="!permissoesDoItemEmFoco.apenas_leitura
        || permissoesDoItemEmFoco.sou_responsavel"
      class="like-a__text addlink"
      type="button"
      @click="abrirDialogo(0)"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg>Adicionar aditivo/reajuste
    </button>
  </p>

  <SmallModal v-if="exibirDialogo">
    <CabecalhoDePagina>
      <template #titulo>
        Aditivo/Ajuste
      </template>

      <template #acoes>
        <CheckClose
          :formulario-sujo="formularioSujo"
          :apenas-emitir="true"
          @close="exibirDialogo = false"
        />
      </template>
    </CabecalhoDePagina>

    <pre v-ScrollLockDebug>carga:{{ carga }}</pre>

    <form
      :aria-busy="chamadasPendentes.aditivo"
      @submit.prevent="onSubmit"
    >
      <Field
        v-if="contratoEmFoco?.id"
        name="contrato_id"
        type="hidden"
        :value="contratoEmFoco.id"
      />

      <div class="flex mb2 flexwrap g2">
        <div class="f1 fb100">
          <LabelFromYup
            name="numero"
            :schema="schema"
          />
          <Field
            name="numero"
            type="text"
            minlength="1"
            maxlength="500"
            class="inputtext light"
          />
          <ErrorMessage
            name="numero"
            class="error-msg"
          />
        </div>
        <div class="f1 fb15em">
          <LabelFromYup
            name="data"
            :schema="schema"
          />
          <Field
            name="data"
            type="date"
            class="inputtext light"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('data', $v || null); }"
          />
          <ErrorMessage
            name="data"
            class="error-msg"
          />
        </div>
        <div class="f1 fb20em">
          <LabelFromYup
            name="tipo_aditivo_id"
            :schema="schema"
          />
          <Field
            name="tipo_aditivo_id"
            as="select"
            class="inputtext light mb1"
            :aria-busy="chamadasPendentesDeTiposDeAditivos.lista"
            @change="ev => limparCamposRelacionados(Number(ev.target.value))"
          >
            <option value>
              Selecionar
            </option>
            <option
              v-for="item in listaDeTiposDeAditivos"
              :key="item.id"
              :value="item.id"
            >
              {{ item.nome }}
            </option>
          </Field>
          <ErrorMessage
            name="tipo_aditivo_id"
            class="error-msg"
          />
          <ErrorComponent
            :erro="errosDeTiposDeAditivos.lista"
          />
        </div>
        <div
          v-if="tipoDeAditivoPorId[carga.tipo_aditivo_id]?.habilita_valor_data_termino"
          class="f1 fb15em"
        >
          <LabelFromYup
            name="data_termino_atualizada"
            :schema="schema"
          />
          <Field
            name="data_termino_atualizada"
            type="date"
            class="inputtext light"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => {
              setFieldValue('data_termino_atualizada', $v || null);
            }"
          />
          <ErrorMessage
            name="data_termino_atualizada"
            class="error-msg"
          />
        </div>
        <div
          v-if="tipoDeAditivoPorId[carga.tipo_aditivo_id]?.habilita_valor"
          class="f1 fb10em"
        >
          <LabelFromYup
            name="percentual_medido"
            :schema="schema"
          />
          <Field
            name="percentual_medido"
            type="number"
            class="inputtext light"
            min="0"
            max="100"
            @update:model-value="($v) => {
              setFieldValue('percentual_medido', Number($v) || null);
            }"
          />
          <ErrorMessage
            name="percentual_medido"
            class="error-msg"
          />
        </div>
        <div
          v-if="tipoDeAditivoPorId[carga.tipo_aditivo_id]?.habilita_valor"
          class="f1 fb20em mb1"
        >
          <LabelFromYup
            name="valor"
            :schema="schema"
          />
          <MaskedFloatInput
            name="valor"
            :value="carga.valor"
            :class="{
              error: errors.valor,
            }"
            class="inputtext light mb1"
            converter-para="string"
            permitir-negativo
          />
          <ErrorMessage
            name="valor"
            class="error-msg"
          />
        </div>
      </div>

      <FormErrorsList
        :errors="errors"
        class="mb1"
      />

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="Object.keys(errors)?.length"
          :title="Object.keys(errors)?.length
            ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
            : null"
          :aria-busy="isSubmitting"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </form>
  </SmallModal>
</template>
