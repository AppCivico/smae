<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { nota as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useTipoDeNotasStore } from '@/stores/tipoNotas.store';
import { useUsersStore } from '@/stores/users.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import {
  ErrorMessage, Field, FieldArray, useForm,
} from 'vee-validate';

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
};

const props = defineProps({
  transferenciaId: {
    type: [String, Number],
    default: 0,
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
  lista: listaNotas,
  erro,
  chamadasPendentes,
  emFoco,
  itemParaEdição,
} = storeToRefs(blocoStore);

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});

const tipoStore = useTipoDeNotasStore();
const { lista: listaTipo } = storeToRefs(tipoStore);

const statusSelecionado = ref('');
// eslint-disable-next-line prefer-const
let exibeForm = ref(false);
const tipoNotaId = ref(null);

const blocosToken = computed(
  () => transferênciaEmFoco?.value?.bloco_nota_token,
);

const camposPermitidos = computed(() => ({
  email: listaTipo.value
    .find((tipo) => tipo.id === tipoNotaId.value && tipo.permite_email),
  revisao: listaTipo.value
    .find((tipo) => tipo.id === tipoNotaId.value && tipo.permite_revisao),
  enderecamento: listaTipo.value
    .find((tipo) => tipo.id === tipoNotaId.value && tipo.permite_enderecamento),
}));

const podeEditarDisponivel = computed(() => listaNotas.value.some((item) => item.pode_editar));

async function iniciar() {
  if (props.transferenciaId !== transferênciaEmFoco?.value?.id) {
    await TransferenciasVoluntarias.buscarItem(props.transferenciaId);
  }
  blocoStore.buscarTudo(blocosToken.value);
}

async function excluirNota(id) {
  useAlertStore().confirmAction(
    'Deseja mesmo remover a nota?',
    async () => {
      if (await blocoStore.excluirItem(id)) {
        blocoStore.$reset();
        blocoStore.buscarTudo(blocosToken.value);
        useAlertStore().success('Nota removida.');
      }
    },
    'Remover',
  );
}

function editarNota(id) {
  exibeForm.value = true;
  blocoStore.buscarItem(id);
}

function fecharModal() {
  emFoco.value = null;
  exibeForm.value = false;
}

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const valoresAuxiliares = {
    ...values,
    bloco_token: blocosToken.value,
    id: itemParaEdição.value.id_jwt ? itemParaEdição.value.id_jwt : undefined,
  };
  try {
    const msg = 'Dados salvos com sucesso!';
    const resposta = await blocoStore.salvarItem(valoresAuxiliares);
    if (resposta) {
      alertStore.success(msg);
      blocoStore.$reset();
      blocoStore.buscarTudo(blocosToken.value);
      resetForm({ values: itemParaEdição.value });
      exibeForm.value = false;
    }
  } catch (error) {
    alertStore.error(error);
  }
});

watch(statusSelecionado, (novoValor) => {
  blocoStore.buscarTudo(blocosToken.value, { status: novoValor });
});

ÓrgãosStore.getAll();
tipoStore.buscarTudo();
UserStore.buscarPessoasSimplificadas();
iniciar();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h2>Notas</h2>
    <hr class="ml2 f1">
    <button
      class="btn ml2"
      @click="exibeForm = true"
    >
      Nova nota
    </button>
  </div>
  <SmallModal v-if="exibeForm">
    <div class="flex spacebetween center mb2">
      <h2 v-if="itemParaEdição.id_jwt">
        Editar nota
      </h2>
      <h2 v-else>
        Nova nota
      </h2>
      <hr class="ml2 f1">
      <CheckClose
        :apenas-emitir="true"
        @close="fecharModal()"
      />
    </div>
    <div class="mb4">
      <form @submit.prevent="onSubmit">
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
              placeholder="dd/mm/aaaa"
            />
          </div>
          <div class="f1">
            <LabelFromYup
              name="tipo_nota_id"
              :schema="schema"
            />
            <Field
              v-model="tipoNotaId"
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
              placeholder="dd/mm/aaaa"
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
                  :schema="schema.fields.enderecamentos.innerType"
                />
                <Field
                  :name="`enderecamentos[${idx}].orgao_enderecado_id`"
                  as="select"
                  class="inputtext light mb1"
                  :class="{
                    error: errors[`enderecamentos[${idx}].orgao_enderecado_id`],
                    loading: organs?.loading
                  }"
                  :disabled="!órgãosComoLista?.length"
                  @change="setFieldValue(`enderecamentos[${idx}].pessoa_enderecado_id`, null)"
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
                  :schema="schema.fields.enderecamentos.innerType"
                />
                <Field
                  :name="`enderecamentos[${idx}].pessoa_enderecado_id`"
                  as="select"
                  class="inputtext light mb1"
                  :class="{
                    error: errors[`enderecamentos[${idx}].pessoa_enderecado_id`],
                    loading: pessoasSimplificadas?.loading
                  }"
                  :disabled="
                    !pessoasSimplificadasPorÓrgão[values.enderecamentos?.[idx]?.orgao_enderecado_id]?.length
                  "
                >
                  <option value="" />
                  <option
                    v-for="item in pessoasSimplificadasPorÓrgão[values.enderecamentos?.[idx]?.orgao_enderecado_id]"
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
                arial-label="excluir"
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
              @click="push({
                orgao_enderecado_id: null,
                pessoa_enderecado_id: null,
              })"
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
  </SmallModal>

  <div class="mb1">
    <label class="label">Filtrar por status</label>
    <select
      v-model="statusSelecionado"
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
    </select>
  </div>

  <table class="tablemain mb1 tbody-zebra">
    <col>
    <col>
    <col>
    <col>
    <col
      v-if="podeEditarDisponivel"
      class="col--botão-de-ação"
    >
    <col
      v-if="podeEditarDisponivel"
      class="col--botão-de-ação"
    >
    <thead>
      <tr>
        <th>Status</th>
        <th>Tipo</th>
        <th>Data</th>
        <th>Rever Em</th>
        <th v-if="podeEditarDisponivel" />
        <th v-if="podeEditarDisponivel" />
      </tr>
    </thead>
    <tbody
      v-for="(item, key) in listaNotas"
      :key="key"
    >
      <tr>
        <td class="cell--nowrap">
          {{ status[item.status]?.text || item.status }}
        </td>
        <td>
          {{ listaTipo.find((tipo) => tipo.id === item.tipo_nota_id)?.codigo }}
        </td>
        <td>
          {{
            item.data_nota
              ? new Date(item.data_nota).toLocaleDateString("pt-BR")
              : " - "
          }}
        </td>
        <td>
          {{
            item.rever_em
              ? new Date( item.rever_em).toLocaleDateString("pt-BR")
              : " - "
          }}
        </td>
        <td v-if="item.pode_editar">
          <button
            class="like-a__text"
            arial-label="Excluir"
            title="Excluir"
            @click="excluirNota(item.id_jwt)"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_remove" />
            </svg>
          </button>
        </td>
        <td v-if="item.pode_editar">
          <button
            arial-label="Editar"
            title="Editar"
            class="like-a__text"
            @click="editarNota(item.id_jwt)"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_edit" />
            </svg>
          </button>
        </td>
      </tr>
      <tr>
        <td :colspan="item.pode_editar ? 6 : 4">
          {{ item.nota }}
        </td>
      </tr>

      <tr v-if="chamadasPendentes.lista">
        <td colspan="6">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="6">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!listaNotas.length">
        <td colspan="6">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
