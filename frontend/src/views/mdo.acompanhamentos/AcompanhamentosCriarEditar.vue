<script setup>
import SmaeText from '@/components/camposDeFormulario/SmaeText/SmaeText.vue';
import ErrorComponent from '@/components/ErrorComponent.vue';
import { acompanhamento as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useAcompanhamentosStore } from '@/stores/acompanhamentos.store.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useTiposDeAcompanhamentoStore } from '@/stores/tiposDeAcompanhamento.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  FieldArray,
  Form,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const acompanhamentosStore = useAcompanhamentosStore();
const alertStore = useAlertStore();
const tiposDeAcompanhamentoStore = useTiposDeAcompanhamentoStore();

const router = useRouter();
const route = useRoute();

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdicao,
} = storeToRefs(acompanhamentosStore);

const {
  chamadasPendentes: tiposPendentes,
  erro: erroEmTipos,
  lista: listaDeTipos,
} = storeToRefs(tiposDeAcompanhamentoStore);

const props = defineProps({
  obraId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
  acompanhamentoId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
});

async function onSubmit(_, { controlledValues }) {
  const carga = controlledValues;

  if (!carga.cronograma_paralisado) {
    carga.cronograma_paralisado = false;
  }
  try {
    const msg = props.acompanhamentoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.acompanhamentoId
      ? await acompanhamentosStore.salvarItem(carga, props.acompanhamentoId)
      : await acompanhamentosStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      const rotaDeEscape = route.meta?.rotaDeEscape;

      if (rotaDeEscape) {
        router.push({ name: rotaDeEscape });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function excluirAcompanhamento(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await useAcompanhamentosStore().excluirItem(id)) {
      alertStore.success('Acompanhamento removido.');

      const rotaDeEscape = route.meta?.rotaDeEscape;

      if (rotaDeEscape) {
        router.push({ name: rotaDeEscape });
      }
    }
  }, 'Remover');
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="acompanhamentoId"
        class="t12 uc w700 tamarelo"
      >
        {{ 'Editar acompanhamento' }}
      </div>
      {{ emFoco?.data_registro
        ? dateToField(emFoco?.data_registro)
        : (acompanhamentoId ? 'Acompanhamento' : 'Novo registro de acompanhamento')
      }}
    </h1>

    <hr class="ml2 f1">

    <CheckClose />
  </div>

  <Form
    v-if="!acompanhamentoId || emFoco"
    v-slot="{ errors, isSubmitting, setFieldValue, values }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdicao"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex flexwrap g2 mb1">
      <div class="f1 mb1 fb15em">
        <LabelFromYup
          name="data_registro"
          :schema="schema"
        />
        <Field
          id="data_registro"
          name="data_registro"
          type="date"
          required
          class="inputtext light mb1"
          :class="{ 'error': errors.data_registro }"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('data_registro', $v || null); }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="data_registro"
        />
      </div>

      <div class="f1 mb1 fb15em">
        <LabelFromYup
          name="acompanhamento_tipo_id"
          :schema="schema"
        />
        <Field
          id="acompanhamento_tipo_id"
          name="acompanhamento_tipo_id"
          :arial-label="schema.fields.acompanhamento_tipo_id.spec.label"
          maxlength="2"
          class="inputtext light mb1"
          as="select"
          :disabled="!listaDeTipos.length"
          :aria-busy="tiposPendentes.lista"
          :class="{
            error: errors['acompanhamento_tipo_id'],
          }"
        >
          <option :value="null" />
          <option
            v-for="item in listaDeTipos || []"
            :key="item.id"
            :value="item.id"
            :title="item.nome"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="acompanhamento_tipo_id"
          class="error-msg"
        />
        <ErrorComponent v-if="erroEmTipos">
          {{ erroEmTipos }}
        </ErrorComponent>
      </div>

      <div class="f1 mb1 mt1 fb10em">
        <label class="block mt1">
          <Field
            name="apresentar_no_relatorio"
            type="checkbox"
            :value="true"
            class="inputcheckbox"
          />
          <span :class="{ 'error': errors.apresentar_no_relatorio }">
            {{ schema.fields.apresentar_no_relatorio.spec.label }}
          </span>
        </label>
      </div>

      <div class="f1 mb1 mt1 fb10em">
        <label class="block mt1">
          <Field
            name="cronograma_paralisado"
            type="checkbox"
            :value="true"
            class="inputcheckbox"
          />
          <span :class="{ 'error': errors.cronograma_paralisado }">
            {{ schema.fields.cronograma_paralisado.spec.label }}
          </span>
        </label>
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <LabelFromYup
          name="participantes"
          :schema="schema"
        />
        <Field
          id="participantes"
          name="participantes"
          required
          type="text"
          maxlength="2048"
          class="inputtext light mb1"
          :class="{
            error: errors.participantes,
          }"
        />
        <ErrorMessage
          name="participantes"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="pauta"
          :schema="schema"
        />
        <SmaeText
          name="pauta"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          :schema="schema"
          :model-value="values.pauta"
          anular-vazio
          :class="{ 'error': errors.pauta }"
        />
        <ErrorMessage
          name="pauta"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="detalhamento"
          :schema="schema"
        />
        <SmaeText
          name="detalhamento"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          :schema="schema"
          :model-value="values.detalhamento"
          anular-vazio
          :class="{ 'error': errors.detalhamento }"
        />
        <ErrorMessage
          name="detalhamento"
          class="error-msg"
        />
      </div>
    </div>

    <div
      v-if="!acompanhamentoId || emFoco?.observacao"
      class="flex g2"
    >
      <div
        v-show="emFoco?.observacao || acompanhamentoId"
        class="f1 mb1"
      >
        <LabelFromYup
          name="observacao"
          :schema="schema"
        />
        <Field
          id="observacao"
          name="observacao"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          :class="{ 'error': errors.observacao }"
        />
        <ErrorMessage
          name="observacao"
          class="error-msg"
        />
      </div>
    </div>

    <div
      v-if="!acompanhamentoId || emFoco?.detalhamento_status"
      class="flex g2"
    >
      <div
        v-show="emFoco?.detalhamento_status || acompanhamentoId"
        class="f1 mb1"
      >
        <LabelFromYup
          name="detalhamento_status"
          :schema="schema"
        />
        <Field
          id="detalhamento_status"
          name="detalhamento_status"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          :class="{ 'error': errors.detalhamento_status }"
        />
        <ErrorMessage
          name="detalhamento_status"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="pontos_atencao"
          :schema="schema"
        />
        <SmaeText
          name="pontos_atencao"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          :schema="schema"
          :model-value="values.pontos_atencao"
          anular-vazio
          :class="{ 'error': errors.pontos_atencao }"
        />
        <ErrorMessage
          name="pontos_atencao"
          class="error-msg"
        />
      </div>
    </div>

    <div class="g2 mb2">
      <legend class="label mt2 mb1">
        {{ schema.fields.acompanhamentos.spec.label }}
      </legend>

      <FieldArray
        v-slot="{ fields, push, remove, handleChange }"
        name="acompanhamentos"
      >
        <div
          v-for="(field, idx) in fields"
          :key="`acompanhamentos--${field.key}`"
          class="mb2"
        >
          <Field
            :name="`acompanhamentos[${idx}].id`"
            type="hidden"
          />
          <div class="flex g2 mb1">
            <div class="f1 mb1">
              <label
                :for="`acompanhamentos[${idx}].encaminhamento`"
                class="tc300"
              >
                <template v-if="field.value?.numero_identificador">
                  {{ schema.fields.acompanhamentos.innerType.fields.encaminhamento.spec.label }}
                  {{ field.value.numero_identificador }}
                </template>
                <template v-else>
                  Novo
                  {{ schema.fields.acompanhamentos.innerType.fields.encaminhamento.spec.label }}
                </template>
              &nbsp;<span
                v-if="schema.fields.acompanhamentos.innerType.fields.encaminhamento.spec.presence
                    === 'required'"
                class="tvermelho"
              >*</span>
              </label>
              <SmaeText
                :name="`acompanhamentos[${idx}].encaminhamento`"
                as="textarea"
                rows="5"
                class="inputtext light mb1"
                :max-length="2048"
                :schema="schema"
                :model-value="fields[idx]?.value?.encaminhamento"
                anular-vazio
                :class="{ 'error': errors[`acompanhamentos[${idx}].encaminhamento`] }"
                @update:model-value="handleChange"
              />
              <ErrorMessage
                :name="`acompanhamentos[${idx}].encaminhamento`"
                class="error-msg"
              />
            </div>
          </div>

          <div class="flex g2 mb1">
            <div class="f2 mb1">
              <LabelFromYup
                name="responsavel"
                :for="`acompanhamentos[${idx}].responsavel`"
                class="tc300"
                :schema="schema.fields.acompanhamentos.innerType"
              />
              <Field
                :id="`acompanhamentos[${idx}].responsavel`"
                :name="`acompanhamentos[${idx}].responsavel`"
                required
                type="text"
                class="inputtext light mb1"
                :class="{
                  error: errors[`acompanhamentos[${idx}].responsavel`],
                }"
              />
              <ErrorMessage
                :name="`acompanhamentos[${idx}].responsavel`"
                class="error-msg"
              />
            </div>
            <div class="f1 mb1">
              <LabelFromYup
                name="prazo_encaminhamento"
                :for="`acompanhamentos[${idx}].prazo_encaminhamento`"
                class="tc300"
                :schema="schema.fields.acompanhamentos.innerType"
              />
              <Field
                :id="`acompanhamentos[${idx}].prazo_encaminhamento`"
                :name="`acompanhamentos[${idx}].prazo_encaminhamento`"
                type="date"
                required
                class="inputtext light mb1"
                :class="{ 'error': errors[`acompanhamentos[${idx}].prazo_encaminhamento`] }"
                @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
                @update:model-value="($v) => {
                  setFieldValue(`acompanhamentos[${idx}].prazo_encaminhamento`, $v || null);
                }"
              />
              <ErrorMessage
                class="error-msg mb1"
                :name="`acompanhamentos[${idx}].prazo_encaminhamento`"
              />
            </div>
            <div class="f1 mb1">
              <LabelFromYup
                name="prazo_realizado"
                :for="`acompanhamentos[${idx}].prazo_realizado`"
                class="tc300"
                :schema="schema.fields.acompanhamentos.innerType"
              />
              <Field
                :id="`acompanhamentos[${idx}].prazo_realizado`"
                :name="`acompanhamentos[${idx}].prazo_realizado`"
                type="date"
                required
                class="inputtext light mb1"
                :class="{ 'error': errors[`acompanhamentos[${idx}].prazo_realizado`] }"
                @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
                @update:model-value="($v) => {
                  setFieldValue(`acompanhamentos[${idx}].prazo_realizado`, $v || null);
                }"
              />
              <ErrorMessage
                class="error-msg mb1"
                :name="`acompanhamentos[${idx}].prazo_realizado`"
              />
            </div>

            <button
              class="like-a__text addlink mb2"
              arial-label="excluir"
              title="excluir"
              type="button"
              @click="remove(idx)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </div>
        </div>

        <button
          class="like-a__text addlink"
          type="button"
          @click="push(null)"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg>Adicionar encaminhamento
        </button>
      </FieldArray>
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
  </Form>

  <div
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </div>

  <button
    v-if="emFoco?.id"
    class="btn amarelo big"
    @click="excluirAcompanhamento(emFoco.id)"
  >
    Remover item
  </button>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
