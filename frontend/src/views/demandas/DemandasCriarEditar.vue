<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
} from 'vee-validate';
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import AutocompleteField2 from '@/components/AutocompleteField2.vue';
import BuscadorGeolocalizacaoIndex from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoIndex.vue';
import CampoDeArquivo from '@/components/CampoDeArquivo.vue';
import SmaeText from '@/components/camposDeFormulario/SmaeText/SmaeText.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { CadastroDemanda as schema } from '@/consts/formSchemas/demanda';
import { useAlertStore } from '@/stores/alert.store';
import { useAreasTematicasStore } from '@/stores/areasTematicas.store';
import { useDemandasStore } from '@/stores/demandas.store';
import { useOrgansStore } from '@/stores/organs.store';

const router = useRouter();
const alertStore = useAlertStore();
const organsStore = useOrgansStore();
const demandasStore = useDemandasStore();
const areasTematicasStore = useAreasTematicasStore();

const { organs: listaOrgaos } = storeToRefs(organsStore);
const { lista: listaAreasTematicas } = storeToRefs(areasTematicasStore);
const { emFoco, erro } = storeToRefs(demandasStore);

const props = defineProps({
  demandaId: {
    type: Number,
    default: 0,
  },
});

const {
  errors,
  handleSubmit,
  isSubmitting,
  resetForm,
  values,
  setFieldValue,
} = useForm({
  validationSchema: schema,
});

const areaTematicaSelecionada = computed(() => listaAreasTematicas.value
  ?.find((a) => a.id === values.area_tematica_id));

const acoesDaAreaTematica = computed(() => areaTematicaSelecionada.value?.acoes || []);

const onSubmit = handleSubmit(async (carga) => {
  try {
    const msg = props.demandaId
      ? 'Dados salvos com sucesso!'
      : 'Demanda adicionada com sucesso!';

    const r = await demandasStore.salvarItem(carga, props.demandaId);

    if (r) {
      alertStore.success(msg);
      demandasStore.$reset();
      router.push({ name: 'demandas.listar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function adicionarLocalizacao(endereco) {
  const localizacoes = [...(values.localizacoes || []), endereco];
  setFieldValue('localizacoes', localizacoes);
}

function removerLocalizacao(idx) {
  const localizacoes = [...(values.localizacoes || [])];
  localizacoes.splice(idx, 1);
  setFieldValue('localizacoes', localizacoes);
}

function adicionarArquivo() {
  const arquivos = [...(values.arquivos || []), { autoriza_divulgacao: false }];
  setFieldValue('arquivos', arquivos);
}

function removerArquivo(idx) {
  const arquivos = [...(values.arquivos || [])];
  arquivos.splice(idx, 1);
  setFieldValue('arquivos', arquivos);
}

function toggleAcao(acaoId) {
  const acaoIds = [...(values.acao_ids || [])];
  const index = acaoIds.indexOf(acaoId);
  if (index === -1) {
    acaoIds.push(acaoId);
  } else {
    acaoIds.splice(index, 1);
  }
  setFieldValue('acao_ids', acaoIds);
}

onMounted(() => {
  if (props.demandaId) {
    demandasStore.buscarItem(props.demandaId);
  }

  Promise.all([
    areasTematicasStore.buscarTudo(),
    organsStore.getAll(),
  ]).then();
});

watch(emFoco, (novosValores) => {
  resetForm({ values: novosValores });
});

watch(() => values.area_tematica_id, () => {
  setFieldValue('acao_ids', []);
});
</script>

<template>
  <CabecalhoDePagina />

  <form
    class="flex column g2"
    @submit.prevent="onSubmit"
  >
    <!-- Recurso Financeiro -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Recurso Financeiro
      </legend>

      <div class="flex g2 flexwrap">
        <div class="f1 fb30">
          <SmaeLabel
            name="valor"
            :schema="schema"
          />

          <Field
            v-slot="{ field, handleChange, value }"
            name="valor"
          >
            <MaskedFloatInput
              class="inputtext light"
              :class="{ error: errors.valor }"
              :value="value"
              :name="field.name"
              converter-para="string"
              @update:model-value="handleChange"
            />
          </Field>
          <ErrorMessage
            name="valor"
            class="error-msg"
          />
        </div>

        <div class="f1 fb30">
          <SmaeLabel
            name="finalidade"
            :schema="schema"
          />

          <Field
            name="finalidade"
            as="select"
            class="inputtext light"
            :class="{ error: errors.finalidade }"
          >
            <option :value="null">
              Selecionar
            </option>

            <option
              v-for="finalidade in ['Custeio', 'Investimento']"
              :key="`demanda-finalidade--${finalidade}`"
              :value="finalidade"
            >
              {{ finalidade }}
            </option>
          </Field>

          <ErrorMessage
            name="finalidade"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <!-- Contato do Proponente -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Contato do Proponente
      </legend>

      <div class="flex g2 flexwrap mb1">
        <div class="f1 fb40">
          <SmaeLabel
            name="orgao_id"
            :schema="schema"
          />

          <Field
            v-slot="{ handleChange, value }"
            name="orgao_id"
            :class="{ error: errors.orgao_id }"
          >
            <AutocompleteField2
              :model-value="value"
              :controlador="{
                busca: '',
                participantes: value || []
              }"
              label="sigla"
              :grupo="listaOrgaos || []"
              :numero-maximo-de-participantes="1"
              @change="handleChange"
            />
          </Field>

          <ErrorMessage
            name="orgao_id"
            class="error-msg"
          />
        </div>

        <div class="f1 fb40">
          <SmaeLabel
            name="unidade_responsavel"
            :schema="schema"
          />

          <Field
            name="unidade_responsavel"
            type="text"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.unidade_responsavel }"
          />

          <ErrorMessage
            name="unidade_responsavel"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2 flexwrap mb1">
        <div class="f1 fb40">
          <SmaeLabel
            name="nome_responsavel"
            :schema="schema"
          />

          <Field
            name="nome_responsavel"
            type="text"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.nome_responsavel }"
          />

          <ErrorMessage
            name="nome_responsavel"
            class="error-msg"
          />
        </div>

        <div class="f1 fb40">
          <SmaeLabel
            name="cargo_responsavel"
            :schema="schema"
          />

          <Field
            name="cargo_responsavel"
            type="text"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.cargo_responsavel }"
          />

          <ErrorMessage
            name="cargo_responsavel"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2 flexwrap">
        <div class="f1 fb40">
          <SmaeLabel
            name="email_responsavel"
            :schema="schema"
          />

          <Field
            name="email_responsavel"
            type="email"
            class="inputtext light"
            maxlength="250"
            :class="{ error: errors.email_responsavel }"
          />

          <ErrorMessage
            name="email_responsavel"
            class="error-msg"
          />
        </div>

        <div class="f1 fb40">
          <SmaeLabel
            name="telefone_responsavel"
            :schema="schema"
          />

          <Field
            name="telefone_responsavel"
            type="tel"
            class="inputtext light"
            maxlength="20"
            :class="{ error: errors.telefone_responsavel }"
          />

          <ErrorMessage
            name="telefone_responsavel"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <!-- Demanda -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Demanda
      </legend>

      <div class="mb1">
        <SmaeLabel
          name="nome_projeto"
          :schema="schema"
        />

        <Field
          name="nome_projeto"
          type="text"
          class="inputtext light"
          maxlength="250"
          :class="{ error: errors.nome_projeto }"
        />

        <ErrorMessage
          name="nome_projeto"
          class="error-msg"
        />
      </div>

      <div class="mb1">
        <SmaeLabel
          name="descricao"
          :schema="schema"
        />

        <Field
          v-slot="{ handleChange, value, field}"
          name="descricao"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ error: errors[field.name] }"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          name="descricao"
          class="error-msg"
        />
      </div>

      <div class="mb1">
        <SmaeLabel
          name="justificativa"
          :schema="schema"
        />

        <Field
          v-slot="{ handleChange, value, field}"
          name="justificativa"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ error: errors[field.name] }"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          name="justificativa"
          class="error-msg"
        />
      </div>

      <div class="mb1">
        <SmaeLabel
          name="localizacoes"
          :schema="schema"
        />

        <div
          v-if="values.localizacoes?.length"
          class="mb1"
        >
          <ul class="lista-de-localizacoes">
            <li
              v-for="(loc, idx) in values.localizacoes"
              :key="idx"
              class="flex g1 center mb05"
            >
              <span class="f1">
                {{ loc.endereco || loc.descricao || `Localização ${idx + 1}` }}
              </span>

              <button
                type="button"
                class="like-a__text"
                title="Remover"
                @click="removerLocalizacao(idx)"
              >
                <svg
                  width="20"
                  height="20"
                >
                  <use xlink:href="#i_remove" />
                </svg>
              </button>
            </li>
          </ul>
        </div>

        <button
          type="button"
          class="like-a__text addlink"
          @click="$refs.modalLocalizacao?.showModal()"
        >
          <svg
            width="20"
            height="20"
          >
            <use xlink:href="#i_+" />
          </svg>
          <span>Adicionar endereço</span>
        </button>

        <ErrorMessage
          name="localizacoes"
          class="error-msg"
        />

        <dialog
          ref="modalLocalizacao"
          class="modal-localizacao"
        >
          <header class="flex spacebetween center mb2">
            <h3>Buscar Localização</h3>
            <button
              type="button"
              class="like-a__text"
              @click="$refs.modalLocalizacao?.close()"
            >
              <svg
                width="20"
                height="20"
              >
                <use xlink:href="#i_x" />
              </svg>
            </button>
          </header>
          <BuscadorGeolocalizacaoIndex
            :localizacoes="values.localizacoes || []"
            @selecao="adicionarLocalizacao($event); $refs.modalLocalizacao?.close()"
          />
        </dialog>
      </div>

      <div class="mb1">
        <SmaeLabel
          name="arquivos"
          :schema="schema"
        />

        <div class="flex column g1">
          <div
            v-for="(arquivo, idx) in values.arquivos"
            :key="`arquivos--${idx}`"
            class="flex g1 center"
          >
            <div class="f1">
              <CampoDeArquivo
                :id="`arquivos-${idx}`"
                v-model="values.arquivos[idx]"
                :name="`arquivos[${idx}]`"
                tipo="DOCUMENTO"
              />
            </div>
            <button
              type="button"
              class="like-a__text"
              title="Remover"
              @click="removerArquivo(idx)"
            >
              <svg
                width="20"
                height="20"
              >
                <use xlink:href="#i_remove" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            class="like-a__text addlink"
            @click="adicionarArquivo"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_+" />
            </svg>
            <span>Adicionar arquivo</span>
          </button>
        </div>
      </div>
    </fieldset>

    <!-- Área Temática -->
    <fieldset class="p0 mb2">
      <legend class="t16 w700 tc300 mb1">
        Área Temática
      </legend>

      <div class="mb1">
        <SmaeLabel
          name="area_tematica_id"
          :schema="schema"
        />

        <Field
          name="area_tematica_id"
          as="select"
          class="inputtext light"
          :class="{ error: errors.area_tematica_id }"
          @update:model-value="setFieldValue('area_tematica_id', Number($event))"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="area in listaAreasTematicas"
            :key="area.id"
            :value="area.id"
          >
            {{ area.nome }}
          </option>
        </Field>

        <ErrorMessage
          name="area_tematica_id"
          class="error-msg"
        />
      </div>

      <div
        v-if="acoesDaAreaTematica.length"
        class="mb1"
      >
        <SmaeLabel
          name="acao_ids"
          :schema="schema"
        />

        <div class="flex column g05 start">
          <label
            v-for="acao in acoesDaAreaTematica"
            :key="acao.id"
            class="flex g1 center"
          >
            <input
              type="checkbox"
              :checked="values.acao_ids?.includes(acao.id)"
              @change="toggleAcao(acao.id)"
            >
            <span>{{ acao.nome }}</span>
          </label>
        </div>

        <ErrorMessage
          name="acao_ids"
          class="error-msg"
        />
      </div>

      <div class="mb1">
        <SmaeLabel
          name="observacao"
          :schema="schema"
        />

        <Field
          v-slot="{ handleChange, value, field}"
          name="observacao"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :class="{ error: errors[field.name] }"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          name="observacao"
          class="error-msg"
        />
      </div>
    </fieldset>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center g2 flexwrap">
      <hr class="f1">
      <button
        type="submit"
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Salvar
      </button>
      <hr class="f1">
    </div>
  </form>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>

<style scoped>
.modal-localizacao {
  width: 90vw;
  max-width: 1000px;
  padding: 2rem;
  border: 1px solid var(--c300);
  border-radius: 8px;
}

.modal-localizacao::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

.lista-de-localizacoes {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lista-de-localizacoes li {
  padding: 0.5rem;
  background: var(--c50);
  border-radius: 4px;
}
</style>
