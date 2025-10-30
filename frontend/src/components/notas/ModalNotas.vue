<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { nota as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useTipoDeNotasStore } from '@/stores/tipoNotas.store';
import { useUsersStore } from '@/stores/users.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, FieldArray, useForm,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';

const ÓrgãosStore = useOrgansStore();
const { organs, órgãosComoLista } = storeToRefs(ÓrgãosStore);

const UserStore = useUsersStore();
const { pessoasSimplificadas, pessoasSimplificadasPorÓrgão } = storeToRefs(UserStore);

const alertStore = useAlertStore();
const status = {
  Programado: {
    value: 'Programado',
    text: 'Programado',
  },
  Em_Curso:{
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

const blocoStore = useBlocoDeNotasStore();
const {
  lista: listaNotas,
  erro,
  chamadasPendentes,
  emFoco,
  itemParaEdicao,
} = storeToRefs(blocoStore);

const tipoStore = useTipoDeNotasStore();
const { lista: listaTipo, erro: erroTipo } = storeToRefs(tipoStore);

const exibeModalNotas = ref(false);
const exibeForm = ref(false);
const tipoNotaId = ref(null);
const statusSelecionado = ref('');

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  initialValues: itemParaEdicao.value,
  validationSchema: schema,
});

const props = defineProps({
  blocosToken: {
    type: String,
    required: true,
  },
});

const camposPermitidos = computed(() => ({
  email: listaTipo.value
    .find((tipo) => tipo.id === tipoNotaId.value && tipo.permite_email),
  revisao: listaTipo.value
    .find((tipo) => tipo.id === tipoNotaId.value && tipo.permite_revisao),
  enderecamento: listaTipo.value
    .find((tipo) => tipo.id === tipoNotaId.value && tipo.permite_enderecamento),
}));

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const valoresAuxiliares = {
    ...values,
    bloco_token: props.blocosToken,
    id: itemParaEdicao.value.id_jwt ? itemParaEdicao.value.id_jwt : undefined,
  };
  try {
    const msg = 'Dados salvos com sucesso!';
    const resposta = await blocoStore.salvarItem(valoresAuxiliares);
    if (resposta) {
      alertStore.success(msg);
      blocoStore.$reset();
      blocoStore.buscarTudo(props.blocosToken);
      resetForm({ values: itemParaEdicao.value });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

async function excluirNota(id) {
  useAlertStore().confirmAction(
    'Deseja mesmo remover a nota?',
    async () => {
      if (await blocoStore.excluirItem(id)) {
        blocoStore.$reset();
        blocoStore.buscarTudo(props.blocosToken);
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

function fecharForm() {
  emFoco.value = null;
  exibeForm.value = false;
}

watch(() => props.blocosToken, () => {
  if (props.blocosToken) {
    blocoStore.buscarTudo(props.blocosToken);
  }
}, { immediate: true });

watch (statusSelecionado, (novoValor) => {
  blocoStore.buscarTudo(props.blocosToken, {status: novoValor});
})

tipoStore.buscarTudo();
ÓrgãosStore.getAll();

// PRA-FAZER: Buscar só na primeira abertura do formulário
ÓrgãosStore.getAll();
UserStore.buscarPessoasSimplificadas();

// deveria funcionar
watch(itemParaEdicao, (novosValores) => {
  resetForm({ values: novosValores });
});
</script>

<template>
  <!-- em desenvolvimento -->
  <button
    class="flex center g1 like-a__text"
    @click="exibeModalNotas = true"
  >
    <svg
      width="16"
      height="20"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 0.186053C10.293 0.332053 10.625 0.603053 10.996 0.999053L15.003 5.00505C15.43
          5.38505 15.703 5.71705 15.822 6.00205C15.941 6.28705 16 6.62005 16 7.00205V18.0021C16
          19.3351 15.333 20.0021 14 20.0021H2.002C0.667 20.0031 0 19.3361 0 18.0021V2.00205C0
          0.669053 0.667 0.00205337 2 0.00205337H8.996C9.054 0.00205337 9.56 -0.0329466 10
          0.186053ZM2 18.0021H14.001L14 8.00205H10C9.46957 8.00205 8.96086 7.79134 8.58579
          7.41627C8.21071 7.04119 8 6.53249 8 6.00205V2.00205H2V18.0021ZM10 3.00205V6.00205H13L10
          3.00205ZM5 12.0021C4.333 12.0021 4 11.6691 4 11.0021C4 10.3351 4.334 10.0021 5.001
          10.0021H11C11.667 10.0021 12 10.3351 12 11.0021C12 11.6691 11.667 12.0021 11
          12.0021H5ZM5 8.00205C4.333 8.00205 4 7.66905 4 7.00205C4 6.33505 4.334 6.00205 5.001
          6.00205H6C6.667 6.00205 7 6.33505 7 7.00205C7 7.66905 6.667 8.00205 6 8.00205H5ZM5
          16.0021C4.333 16.0021 4 15.6691 4 15.0021C4 14.3351 4.333 14.0021 5 14.0021H11C11.667
          14.0021 12 14.3351 12 15.0021C12 15.6691 11.667 16.0021 11 16.0021H5Z"
        fill="#3B5881"
      />
    </svg>
    Notas
  </button>
  <SmallModal v-if="exibeModalNotas">
    <div class="flex spacebetween center mb2">
      <h2>Notas</h2>
      <hr class="ml2 f1">
      <CheckClose
        :apenas-emitir="true"
        @close="
          exibeModalNotas = false;
          fecharForm();
        "
      />
    </div>
    <button
      v-if="!exibeForm"
      class="like-a__text addlink mb2"
      @click="exibeForm = true"
    >
      <svg
        width="20"
        height="20"
      >
        <use xlink:href="#i_+" />
      </svg>
      Adicionar nova nota
    </button>
    <button
      v-else
      class="like-a__text addlink mb2"
      @click.prevent="fecharForm()"
    >
      Cancelar
    </button>
    <div
      v-if="exibeForm"
      class="mb4"
    >
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
              @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
              @update:model-value="($v) => { setFieldValue('data_nota', $v || null); }"
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
              @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
              @update:model-value="($v) => { setFieldValue('data_nota', $v || null); }"
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
                  class="tc300"
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
                  :disabled="!pessoasSimplificadasPorÓrgão[
                    values.enderecamentos?.[idx]?.orgao_enderecado_id
                  ]?.length"
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
              @click="push({
                orgao_enderecado_id: null,
                pessoa_enderecado_id: null,
              })"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_+" /></svg>Adicionar endereçamento
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
    <div class="mb1">
      <label class="label">Filtrar por status</label>
      <select
        class="inputtext light mb1"
        v-model="statusSelecionado"
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
    <table class="tablemain mb1">
      <col>
      <col>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <thead>
        <tr>
          <th>Nota</th>
          <th>Status</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, key) in listaNotas"
          :key="key"
        >
          <td>
            {{ item.nota }}
          </td>
          <td class="cell--nowrap">
            {{ status[item.status]?.text || item.status }}
          </td>
          <td>
            {{
              listaTipo.find((tipo) => tipo.id === item.tipo_nota_id)?.codigo
            }}
          </td>
          <td>
            <button
              class="like-a__text"
              aria-label="Excluir"
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
          <td>
            <button
              aria-label="Editar"
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
        <tr v-if="chamadasPendentes.listaNotas">
          <td colspan="10">
            Carregando
          </td>
        </tr>
        <tr v-else-if="erro">
          <td colspan="10">
            Erro: {{ erro }}
          </td>
        </tr>
        <tr v-else-if="!listaNotas.length">
          <td colspan="10">
            Nenhum resultado encontrado.
          </td>
        </tr>
      </tbody>
    </table>
  </SmallModal>
</template>
