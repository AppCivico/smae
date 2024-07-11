<script setup>
// eslint-disable-next-line import/no-extraneous-dependencies
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { contratoDeObras as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useContratosStore } from '@/stores/contratos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  watch, onMounted, ref,
} from 'vue';

import { useRoute, useRouter } from 'vue-router';

const alertStore = useAlertStore();
const contratosStore = useContratosStore();
const tarefasStore = useTarefasStore();
const router = useRouter();
const route = useRoute();
const processosSei = ref({ participantes: [], busca: '' });
const fontesRecurso = ref({ participantes: [], busca: '' });

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdição,
  listaDeDependencias,
} = storeToRefs(contratosStore);

const {
  tarefasComHierarquia,
} = storeToRefs(tarefasStore);

const props = defineProps({
  obraId: {
    type: Number,
    default: 0,
  },
  processoId: {
    type: Number,
    default: 0,
  },
});

const {
  errors, handleSubmit, isSubmitting, resetForm, values: carga,
} = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    const msg = props.processoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.processoId
      ? await contratosStore.salvarItem(carga, props.processoId)
      : await contratosStore.salvarItem(carga);

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
});

function excluirProcesso(id) {
  useAlertStore().confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await useContratosStore().excluirItem(id)) {
      useAlertStore().success('Processo removido.');

      const rotaDeEscape = route.meta?.rotaDeEscape;

      if (rotaDeEscape) {
        router.push({ name: rotaDeEscape });
      }
    }
  }, 'Remover');
}

function iniciar() {
  if (!tarefasComHierarquia.value.length) {
    tarefasStore.buscarTudo();
  }
}

const formulárioSujo = useIsFormDirty();

iniciar();

watch(itemParaEdição, (novosValores) => {
  resetForm({ values: novosValores });
});

resetForm();
onMounted(async () => {
  await contratosStore.buscarDependencias();
  if (props.processoId) {
    fontesRecurso.value.participantes = carga.fontes_recurso.map((fonteRecurso) => fonteRecurso.id);
  }
  if (!carga.contrato_exclusivo) {
    carga.contrato_exclusivo = false;
  }
  if (!carga.prazo_unidade) {
    carga.prazo_unidade = 'Dias';
  }
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="processoId"
        class="t12 uc w700 tamarelo"
      >
        {{ 'Editar contrato' }}
      </div>
      {{ emFoco?.descricao || (processoId ? 'Edição de Contrato' : 'Cadastro de Contrato') }}
    </h1>

    <hr class="ml2 f1">

    <CheckClose :formulário-sujo="formulárioSujo" />
  </div>

  <form
    v-if="!processoId || emFoco"
    :disabled="chamadasPendentes.emFoco"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="numero"
          :schema="schema"
        />
        <Field
          name="numero"
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors.numero,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          placeholder=""
        />
        <ErrorMessage
          name="numero"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="contrato_exclusivo"
          :schema="schema"
        />
        <Field
          id="contrato_exclusivo"
          name="contrato_exclusivo"
          type="checkbox"
          :value="true"
          :unchecked-value="false"
          class="inputcheckbox"
        />
        <ErrorMessage
          name="contrato_exclusivo"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="processos_sei"
          :schema="schema"
        />
        <AutocompleteField
          id="processos_sei"
          :disabled="false"
          class="inputtext light mb1"
          :class="{
            error: errors.processos_sei,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          name="processos_sei"
          :controlador="processosSei"
          :grupo="listaDeDependencias?.processos_sei"
          label="processo_sei"
          @change="(valor) => { }"
        />
        <ErrorMessage
          name="processos_sei"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="status"
          :schema="schema"
        />
        <Field
          name="status"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.status }"
          :aria-busy="chamadasPendentes.validaçãoDeDependências"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in listaDeDependencias?.status_de_contrato"
            :key="item.id"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="status"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="modalidade_contratacao_id"
          :schema="schema"
        />
        <Field
          name="modalidade_contratacao_id"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.modalidade_contratacao_id }"
          :aria-busy="chamadasPendentes.validaçãoDeDependências"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in listaDeDependencias?.modalidades_de_contratacao"
            :key="item.id"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="modalidade_contratacao_id"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="fontes_recurso_ids"
          :schema="schema"
        />
        <AutocompleteField
          id="fontes_recurso_ids"
          :disabled="false"
          class="inputtext light mb1"
          :class="{
            error: errors.fontes_recurso_ids,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          name="fontes_recurso_ids"
          :controlador="fontesRecurso"
          :grupo="listaDeDependencias?.fontes_recurso"
          label="fonte_recurso_cod_sof"
          @change="(valor) => { }"
        />
        <ErrorMessage
          name="fontes_recurso_ids"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="orgao_id"
          :schema="schema"
        />
        <Field
          name="orgao_id"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.orgao_id }"
          :aria-busy="chamadasPendentes.validaçãoDeDependências"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in listaDeDependencias?.orgaos"
            :key="item.id"
            :value="item.id"
          >
            {{ item.descricao }}
          </option>
        </Field>
        <ErrorMessage
          name="orgao_id"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="objeto_resumo"
          :schema="schema"
        />
        <Field
          name="objeto_resumo"
          as="textarea"
          rows="10"
          class="inputtext light mb1"
          :class="{
            error: errors.objeto_resumo,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          placeholder=""
        />
        <ErrorMessage
          name="objeto_resumo"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="objeto_detalhado"
          :schema="schema"
        />
        <Field
          name="objeto_detalhado"
          as="textarea"
          rows="20"
          class="inputtext light mb1"
          :class="{
            error: errors.objeto_detalhado,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          placeholder=""
        />
        <ErrorMessage
          name="objeto_detalhado"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="contratante"
          :schema="schema"
        />
        <Field
          name="contratante"
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors.contratante,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          placeholder=""
        />
        <ErrorMessage
          name="contratante"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="empresa_contratada"
          :schema="schema"
        />
        <Field
          name="empresa_contratada"
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors.empresa_contratada,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          placeholder=""
        />
        <ErrorMessage
          name="empresa_contratada"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="cnpj_contratada"
          :schema="schema"
        />
        <Field
          name="cnpj_contratada"
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors.cnpj_contratada,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          placeholder=""
        />
        <ErrorMessage
          name="cnpj_contratada"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="data_assinatura"
          :schema="schema"
        />
        <Field
          name="data_assinatura"
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors.data_assinatura,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          placeholder=""
        />
        <ErrorMessage
          name="data_assinatura"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="prazo_numero"
          :schema="schema"
        />
        <div class="flex g2">
          <Field
            name="prazo_numero"
            type="number"
            class="inputtext light mb1"
            placeholder="Número"
            :class="{
              error: errors.prazo_numero,
              loading: chamadasPendentes.validaçãoDeDependências
            }"
          />
          <Field
            name="prazo_unidade"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.prazo_unidade }"
            :aria-busy="chamadasPendentes.validaçãoDeDependências"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in listaDeDependencias?.unidades_de_prazo"
              :key="item.id"
              :value="item.id"
            >
              {{ item.nome }}
            </option>
          </Field>
        </div>
        <ErrorMessage
          name="prazo_unidade"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="data_base_mes"
          :schema="schema"
        />
        <div class="flex g2">
          <Field
            name="data_base_mes"
            type="text"
            class="inputtext light mb1"
            placeholder="Mês"
            :class="{
              error: errors.data_base_mes,
              loading: chamadasPendentes.validaçãoDeDependências
            }"
          />
          <Field
            name="data_base_ano"
            type="text"
            class="inputtext light mb1"
            :class="{
              error: errors.data_base_ano,
              loading: chamadasPendentes.validaçãoDeDependências
            }"
            placeholder="Ano"
          />
        </div>
        <ErrorMessage
          name="data_base_ano"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="data_inicio"
          :schema="schema"
        />
        <Field
          name="data_inicio"
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors.data_inicio,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          placeholder=""
        />
        <ErrorMessage
          name="data_inicio"
          class="error-msg"
        />
      </div>
    </div>

    <div
      class="flex g2 mb1"
      style="width: 49.2%"
    >
      <div
        class="f1 mb1"
      >
        <LabelFromYup
          name="valor"
          :schema="schema"
        />
        <Field
          name="valor"
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors.valor,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          placeholder=""
        />
        <ErrorMessage
          name="valor"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="observacoes"
          :schema="schema"
        />
        <Field
          name="observacoes"
          as="textarea"
          rows="15"
          class="inputtext light mb1"
          :class="{
            error: errors.observacoes,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          placeholder=""
        />
        <ErrorMessage
          name="observacoes"
          class="error-msg"
        />
      </div>
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
  </form>

  <div
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </div>

  <button
    v-if="emFoco?.id"
    class="btn amarelo big"
    @click="excluirProcesso(emFoco.id)"
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
