<script setup>
import CheckClose from '@/components/CheckClose.vue';
import { acompanhamento as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import truncate from '@/helpers/truncate';
import { useAcompanhamentosStore } from '@/stores/acompanhamentos.store.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  FieldArray,
  Form
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const acompanhamentosStore = useAcompanhamentosStore();
const alertStore = useAlertStore();
const riscosStore = useRiscosStore();
const router = useRouter();
const route = useRoute();

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdição,
} = storeToRefs(acompanhamentosStore);

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
  acompanhamentoId: {
    type: Number,
    default: 0,
  },
});

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.acompanhamentoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.acompanhamentoId
      ? await acompanhamentosStore.salvarItem(carga, props.acompanhamentoId)
      : await acompanhamentosStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      await router.push({ name: 'acompanhamentosListar' });
      acompanhamentosStore.$reset();
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function excluirAcompanhamento(id) {
  useAlertStore().confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await useAcompanhamentosStore().excluirItem(id)) {
      useAcompanhamentosStore().$reset();
      useAcompanhamentosStore().buscarTudo();
      useAlertStore().success('Acompanhamento removido.');

      const rotaDeEscape = route.meta?.rotaDeEscape;

      if (rotaDeEscape) {
        router.push(typeof rotaDeEscape === 'string' ? { name: rotaDeEscape } : rotaDeEscape);
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
    <MenuDeMudançaDeStatusDeAcompanhamento
      v-if="emFoco?.id"
    />

    <CheckClose />
  </div>

  <Form
    v-if="!acompanhamentoId || emFoco"
    v-slot="{ errors, isSubmitting }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdição"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1 mb1">
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
        />
        <ErrorMessage
          class="error-msg mb1"
          name="data_registro"
        />
      </div>
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
          class="inputtext light mb1"
          :class="{
            error: errors.participantes,
            loading: chamadasPendentes.validaçãoDeDependências
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
          name="detalhamento"
          :schema="schema"
        />
        <Field
          id="detalhamento"
          name="detalhamento"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="500"
          :class="{ 'error': errors.detalhamento }"
        />
        <ErrorMessage
          name="detalhamento"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="encaminhamento"
          :schema="schema"
        />
        <Field
          id="encaminhamento"
          name="encaminhamento"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="500"
          :class="{ 'error': errors.encaminhamento }"
        />
        <ErrorMessage
          name="encaminhamento"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="prazo_encaminhamento"
          :schema="schema"
        />
        <Field
          id="prazo_encaminhamento"
          name="prazo_encaminhamento"
          type="date"
          required
          class="inputtext light mb1"
          :class="{ 'error': errors.prazo_encaminhamento }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="prazo_encaminhamento"
        />
      </div>
      <div class="f2 mb1">
        <LabelFromYup
          name="responsavel"
          :schema="schema"
        />
        <Field
          id="responsavel"
          name="responsavel"
          required
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors.responsavel,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
        />
        <ErrorMessage
          name="responsavel"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="prazo_realizado"
          :schema="schema"
        />
        <Field
          id="prazo_realizado"
          name="prazo_realizado"
          type="date"
          required
          class="inputtext light mb1"
          :class="{ 'error': errors.prazo_realizado }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="prazo_realizado"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
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
          maxlength="500"
          :class="{ 'error': errors.observacao }"
        />
        <ErrorMessage
          name="observacao"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
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
          maxlength="500"
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
        <Field
          id="pontos_atencao"
          name="pontos_atencao"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="500"
          :class="{ 'error': errors.pontos_atencao }"
        />
        <ErrorMessage
          name="pontos_atencao"
          class="error-msg"
        />
      </div>
    </div>

    <div class="g2 mb2">
      <FieldArray
        v-slot="{ fields, push, remove }"
        name="risco"
      >
        <div
          v-for="(field, idx) in fields"
          :key="`risco--${field.key}`"
          class="flex g2"
        >
          <div class="f1 mb1">
            <LabelFromYup
              name="risco"
              :schema="schema"
            />
            <Field
              :id="`risco[${idx}]`"
              :name="`risco[${idx}]`"

              maxlength="2"
              class="inputtext light mb1"
              as="select"
              :disabled="riscosStore?.chamadasPendentes?.lista"
              :class="{
                error: errors[`risco[${idx}]`],
                loading: riscosStore?.chamadasPendentes?.lista
              }"
            >
              <option value="">
                Selecionar
              </option>
              <option
                v-for="item in riscosStore?.lista || []"
                :key="item.id"
                :value="item.id"
                :title="item.descricao"
              >
                {{ truncate(item.descricao, 36) }}
              </option>
            </Field>
            <ErrorMessage
              class="error-msg mb1"
              :name="`risco[${idx}]`"
            />
          </div>
          <button
            class="like-a__text addlink"
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

        <button
          class="like-a__text addlink"
          type="button"
          :disabled="fields.length == riscosStore?.lista?.length"
          @click="push(null)"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg>Adicionar risco associado
        </button>
      </FieldArray>
    </div>

    <template v-if="Object.keys(errors).length">
      <p>Please correct the following errors</p>
      <ul>
        <li
          v-for="(message, field) in errors"
          :key="field"
        >
          <a :href="'#' + field">
            {{ message }}
          </a>
        </li>
      </ul>
    </template>

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

  <button
    v-if="emFoco?.id"
    class="btn amarelo big"
    @click="excluirAcompanhamento(emFoco.id)"
  >
    Remover item
  </button>

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
