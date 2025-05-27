<script setup>
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import SmallModal from '@/components/SmallModal.vue';
import { aditivoDeContrato as schema } from '@/consts/formSchemas';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import { dateToShortDate } from '@/helpers/dateToDate';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useObrasStore } from '@/stores/obras.store';
import { useContratosStore } from '@/stores/contratos.store.ts';
import { useTipoDeAditivosStore } from '@/stores/tipoDeAditivos.store';
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

  <table class="tablemain mb2">
    <col class="col--minimum">
    <col>
    <col class="col--data">
    <col class="col--minimum">
    <col class="col--minimum">
    <col class="col--data">
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">

    <thead>
      <tr>
        <th>Número</th>
        <th>Tipo</th>
        <th class="cell--data">
          Data
        </th>
        <th class="cell--number">
          Valor reajustado
        </th>
        <th class="cell--number">
          Percentual medido
        </th>
        <th class="cell--data">
          Término atualizado
        </th>
        <th />
        <th />
      </tr>
    </thead>

    <tbody v-if="Array.isArray(contratoEmFoco?.aditivos)">
      <tr
        v-for="aditivo in contratoEmFoco.aditivos"
        :key="aditivo.id"
      >
        <th>
          {{ aditivo.numero }}
        </th>
        <td>
          {{ aditivo.tipo?.nome || aditivo?.tipo }}
        </td>
        <td class="cell--data">
          {{ aditivo.data ? dateToShortDate(aditivo.data) : '' }}
        </td>
        <td class="cell--number">
          {{ aditivo.valor ? `R$ ${dinheiro(aditivo.valor)}` : '' }}
        </td>
        <td class="cell--number">
          {{ aditivo.percentual_medido ? `${aditivo.percentual_medido}%` : '-' }}
        </td>
        <td class="cell--data">
          {{ aditivo.data_termino_atualizada
            ? dateToShortDate(aditivo.data_termino_atualizada)
            : '-' }}
        </td>
        <td>
          <button
            v-if="!permissoesDoItemEmFoco.apenas_leitura
              || permissoesDoItemEmFoco.sou_responsavel"
            class="block like-a__text tipinfo"
            type="button"
            @click="abrirDialogo(aditivo.id);"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg><div>Editar aditivo</div>
          </button>
        </td>
        <td>
          <button
            v-if="!permissoesDoItemEmFoco.apenas_leitura
              || permissoesDoItemEmFoco.sou_responsavel"
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirAditivo(aditivo.id, aditivo.numero)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
      </tr>
    </tbody>
  </table>

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
      ><use xlink:href="#i_+" /></svg>Adicionar aditivo
    </button>
  </p>

  <SmallModal v-if="exibirDialogo">
    <div class="flex spacebetween center mb2">
      <h2>Aditivo</h2>
      <hr class="ml2 f1">
      <CheckClose
        :formulario-sujo="formularioSujo"
        :apenas-emitir="true"
        @close="exibirDialogo = false"
      />
    </div>

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
            name="valor"
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
            name="valor"
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
            name="valor"
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
            name="valor"
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
