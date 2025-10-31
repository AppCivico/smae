<script setup>
import { nota as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useTipoDeNotasStore } from '@/stores/tipoNotas.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { useUsersStore } from '@/stores/users.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, FieldArray, useForm,
} from 'vee-validate';
import {
  computed,
  defineOptions,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ inheritAttrs: false });

const router = useRouter();
const route = useRoute();
const alertStore = useAlertStore();

const status = {
  Programado: {
    value: 'Programado',
    text: 'Programado',
  },
  Em_Curso: {
    value: 'Em_Curso',
    text: 'Em curso',
  },
  Suspenso: {
    value: 'Suspenso',
    text: 'Suspenso',
  },
  Cancelado: {
    value: 'Cancelado',
    text: 'Cancelado',
  },
  Encerrado: {
    value: 'Encerrado',
    text: 'Encerrado',
  },
};

const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
  notaId: {
    type: String,
    default: '',
  },
});
const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();
const { emFoco: transferênciaEmFoco } = storeToRefs(TransferenciasVoluntarias);

const ÓrgãosStore = useOrgansStore();
const { organs, órgãosComoLista } = storeToRefs(ÓrgãosStore);

const UserStore = useUsersStore();
const { pessoasSimplificadas, pessoasSimplificadasPorÓrgão } = storeToRefs(UserStore);

const blocoStore = useBlocoDeNotasStore();
const {
  itemParaEdicao,
  emFoco,
} = storeToRefs(blocoStore);

const {
  errors, handleSubmit, isSubmitting, setFieldValue, resetForm, values,
} = useForm({
  initialValues: itemParaEdicao.value,
  validationSchema: schema,
});

const tipoStore = useTipoDeNotasStore();
const { lista: listaTipo } = storeToRefs(tipoStore);

const statusSelecionado = ref('');

const blocosToken = computed(() => transferênciaEmFoco?.value?.bloco_nota_token);

const camposPermitidos = computed(() => ({
  email: listaTipo.value.find(
    (tipo) => tipo.id === values.tipo_nota_id && tipo.permite_email,
  ),
  revisao: listaTipo.value.find(
    (tipo) => tipo.id === values.tipo_nota_id && tipo.permite_revisao,
  ),
  enderecamento: listaTipo.value.find(
    (tipo) => tipo.id === values.tipo_nota_id && tipo.permite_enderecamento,
  ),
}));

const onSubmit = handleSubmit.withControlled(async (controlledValues) => {
  try {
    const msg = 'Dados salvos com sucesso!';
    const resposta = await blocoStore.salvarItem(controlledValues, props.notaId);
    if (resposta) {
      alertStore.success(msg);
      blocoStore.$reset();
      router.push({ name: 'notasListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function iniciar() {
  if (Number(props.transferenciaId) !== transferênciaEmFoco.id) {
    TransferenciasVoluntarias.buscarItem(props.transferenciaId);
  }

  ÓrgãosStore.getAll();
  tipoStore.buscarTudo();
  UserStore.buscarPessoasSimplificadas();

  if (props.notaId !== emFoco.value?.id_jwt) {
    emFoco.value = null;

    if (props.notaId) {
      blocoStore.buscarItem(props.notaId);
    }
  }
}

iniciar();

watch(statusSelecionado, (novoValor) => {
  blocoStore.buscarTudo(blocosToken.value, { status: novoValor });
});

watch(itemParaEdicao, (novosValores) => {
  resetForm({
    values: novosValores,
  });
});

watch(blocosToken, (novoValor) => {
  resetForm({
    values: {
      ...itemParaEdicao.value,
      bloco_token: novoValor,
    },
  });
});
</script>
<template>
  <div class="spacebetween">&nbsp; </div>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || "Nota" }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <div class="mb4">
    <form @submit.prevent="onSubmit">
      <Field
        v-if="!props.notaId"
        name="bloco_token"
        type="hidden"
        :value="blocosToken"
      />
      <div class="flex mb2 flexwrap g2">
        <div class="f1">
          <LabelFromYup
            name="status"
            :schema="schema"
          />
          <Field
            name="status"
            as="select"
            class="inputtext light mb1"
          >
            <option value>
              Selecionar
            </option>
            <option
              v-for="(item, key) in Object.values(status)"
              :key="key"
              :value="item.value"
            >
              {{ item.text }}
            </option>
          </Field>
          <ErrorMessage
            name="status"
            class="error-msg"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="data_nota"
            :schema="schema"
          />
          <Field
            name="data_nota"
            type="date"
            class="inputtext light"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('data_nota', $v || null); }"
          />
          <ErrorMessage
            name="data_nota"
            class="error-msg"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="tipo_nota_id"
            :schema="schema"
          />
          <Field
            :disabled="itemParaEdicao.id_jwt"
            name="tipo_nota_id"
            as="select"
            class="inputtext light mb1"
          >
            <option value>
              Selecionar
            </option>
            <option
              v-for="(tipo, key) in listaTipo"
              :key="key"
              :value="tipo.id"
            >
              {{ tipo.codigo }}
            </option>
          </Field>
          <ErrorMessage
            name="tipo_nota_id"
            class="error-msg"
          />
        </div>
      </div>
      <div class="flex mb1">
        <div
          v-if="camposPermitidos.email"
          class="f1"
        >
          <LabelFromYup
            name="dispara_email"
            :schema="schema"
          />
          <Field
            name="dispara_email"
            type="checkbox"
            class="inputcheckbox"
            :value="true"
            :unchecked-value="false"
          />
        </div>
        <Field
          v-else
          name="dispara_email"
          type="hidden"
        />
        <div
          v-if="camposPermitidos.revisao"
          class="f1"
        >
          <LabelFromYup
            name="rever_em"
            :schema="schema"
          />
          <Field
            name="rever_em"
            type="date"
            class="inputtext light"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('rever_em', $v || null); }"
          />
          <ErrorMessage
            name="rever_em"
            class="error-msg"
          />
        </div>
      </div>

      <div
        v-if="camposPermitidos.enderecamento"
        class="mb2"
      >
        <LabelFromYup
          class="label mt2 mb1"
          as="legend"
          name="enderecamentos"
          :schema="schema"
        />

        <FieldArray
          v-slot="{ fields, push, remove }"
          name="enderecamentos"
        >
          <div
            v-for="(field, idx) in fields"
            :key="field.key"
            class="flex g2 mb1"
          >
            <div class="f1">
              <LabelFromYup
                name="orgao_enderecado_id"
                class="tc300"
                :schema="schema.fields.enderecamentos.innerType"
              />
              <Field
                :name="`enderecamentos[${idx}].orgao_enderecado_id`"
                as="select"
                class="inputtext light mb1"
                :class="{
                  error: errors[`enderecamentos[${idx}].orgao_enderecado_id`],
                  loading: organs?.loading,
                }"
                :disabled="!órgãosComoLista?.length"
                @change="
                  setFieldValue(
                    `enderecamentos[${idx}].pessoa_enderecado_id`,
                    null
                  )
                "
              >
                <option value="" />
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
                class="error-msg mb2"
                :name="`enderecamentos[${idx}].orgao_enderecado_id`"
              />
            </div>

            <div class="f1">
              <LabelFromYup
                name="pessoa_enderecado_id"
                class="tc300"
                :schema="schema.fields.enderecamentos.innerType"
              />
              <Field
                :name="`enderecamentos[${idx}].pessoa_enderecado_id`"
                as="select"
                class="inputtext light mb1"
                :class="{
                  error: errors[`enderecamentos[${idx}].pessoa_enderecado_id`],
                  loading: pessoasSimplificadas?.loading,
                }"
                :disabled="
                  !pessoasSimplificadasPorÓrgão[
                    values.enderecamentos?.[idx]?.orgao_enderecado_id
                  ]?.length
                "
              >
                <option value="" />
                <option
                  v-for="item in pessoasSimplificadasPorÓrgão[
                    values.enderecamentos?.[idx]?.orgao_enderecado_id
                  ]"
                  :key="item"
                  :value="item.id"
                >
                  {{ item.nome_exibicao }}
                </option>
              </Field>
              <ErrorMessage
                class="error-msg mb2"
                :name="`enderecamentos[${idx}].pessoa_enderecado_id`"
              />
            </div>

            <button
              class="like-a__text addlink"
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
            @click="
              push({
                orgao_enderecado_id: null,
                pessoa_enderecado_id: null,
              })
            "
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg>
            Adicionar endereçamento
          </button>
        </FieldArray>
      </div>

      <div class="mb2">
        <LabelFromYup
          name="nota"
          :schema="schema"
        />
        <Field
          name="nota"
          type="textarea"
          class="inputtext light mb1"
          as="textarea"
          rows="10"
        />
        <ErrorMessage
          name="nota"
          class="error-msg"
        />
      </div>
      <FormErrorsList
        :errors="errors"
        class="mb1"
      />
      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting || Object.keys(errors)?.length"
          :title="
            Object.keys(errors)?.length
              ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
              : null
          "
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </form>
  </div>
</template>
