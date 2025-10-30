<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  FieldArray,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import SmaeText from '@/components/camposDeFormulario/SmaeText/SmaeText.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { contratoDeObras } from '@/consts/formSchemas';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useContratosStore } from '@/stores/contratos.store.ts';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import TituloDaPagina from '@/components/TituloDaPagina.vue';

const router = useRouter();
const route = useRoute();

const alertStore = useAlertStore();
const contratosStore = useContratosStore(route.meta.entidadeMãe);
const tarefasStore = useTarefasStore();
const DotaçãoStore = useDotaçãoStore();

const fontesRecurso = ref({ participantes: [], busca: '' });

const { DotaçãoSegmentos } = storeToRefs(DotaçãoStore);

const schema = computed(() => contratoDeObras(route.meta.entidadeMãe));

function BuscarDotaçãoParaAno(valorOuEvento) {
  const ano = valorOuEvento.target?.value || valorOuEvento;
  if (!DotaçãoSegmentos?.value?.[ano]) {
    DotaçãoStore.getDotaçãoSegmentos(ano);
  }
}

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdicao,
  listaDeDependencias,
} = storeToRefs(contratosStore);

const {
  tarefasComHierarquia,
} = storeToRefs(tarefasStore);

const {
  errors, handleSubmit, isSubmitting, setFieldValue, resetForm, values: carga,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    const msg = route.params.contratoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = route.params?.contratoId
      ? await contratosStore.salvarItem(carga, route.params.contratoId)
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

function iniciar() {
  if (!tarefasComHierarquia.value.length) {
    tarefasStore.buscarTudo();
  }
}

const formularioSujo = useIsFormDirty();

iniciar();

watch(itemParaEdicao, (novosValores) => {
  resetForm({ values: novosValores });
}, { immediate: true });

onMounted(async () => {
  await contratosStore.buscarDependencias();

  if (emFoco.value?.id) {
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
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose :formulario-sujo="formularioSujo" />
  </div>

  <form
    v-if="!contratoId || emFoco"
    :disabled="chamadasPendentes.emFoco"
    :aria-busy="chamadasPendentes.emFoco"
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
          :controlador="{ participantes: carga?.processos_sei || [], busca: '' }"
          :grupo="listaDeDependencias?.processos_sei"
          label="processo_sei"
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

    <div class="mb2">
      <legend class="label mt2 mb1">
        {{ schema.fields.fontes_recurso.spec.label }}
      </legend>

      <FieldArray
        v-slot="{ fields, push, remove }"
        name="fontes_recurso"
      >
        <div
          v-for="(field, idx) in fields"
          :key="`fonteRecursos--${field.key}`"
          class="flex flexwrap g2 mb1"
        >
          <Field
            :name="`fontes_recurso[${idx}].id`"
            type="hidden"
          />

          <div class="f1 mb1">
            <LabelFromYup
              name="fonte_recurso_ano"
              :for="`fontes_recurso[${idx}].fonte_recurso_ano`"
              class="tc300"
              :schema="schema.fields.fontes_recurso.innerType"
            />

            <Field
              :name="`fontes_recurso[${idx}].fonte_recurso_ano`"
              type="number"
              class="inputtext light mb1"
              min="2003"
              max="3000"
              step="1"
              @change="BuscarDotaçãoParaAno"
              @update:model-value="($v) => {
                setFieldValue(`fontes_recurso[${idx}].fonte_recurso_ano`, Number($v) || null);
              }"
            />
            <ErrorMessage
              class="error-msg mb1"
              :name="`fontes_recurso[${idx}].fonte_recurso_ano`"
            />
          </div>

          <div class="f1 mb1">
            <LabelFromYup
              name="fonte_recurso_cod_sof"
              :for="`fontes_recurso[${idx}].fonte_recurso_cod_sof`"
              class="tc300"
              :schema="schema.fields.fontes_recurso.innerType"
            />

            <Field
              :name="`fontes_recurso[${idx}].fonte_recurso_cod_sof`"
              maxlength="2"
              class="inputtext light mb1"
              as="select"
            >
              <option value="">
                Selecionar
              </option>
              <option
                v-for="item in
                  DotaçãoSegmentos?.[fields[idx].value.fonte_recurso_ano]?.fonte_recursos || []"
                :key="item.codigo"
                :value="item.codigo"
                :title="item.descricao?.length > 36 ? item.descricao : null"
              >
                {{ item.codigo }} - {{ truncate(item.descricao, 36) }}
              </option>
            </Field>
            <ErrorMessage
              class="error-msg mb1"
              :name="`fontes_recurso[${idx}].fonte_recurso_cod_sof`"
            />
          </div>

          <button
            class="like-a__text addlink"
            aria-label="excluir"
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
          @click="push({
            fonte_recurso_cod_sof: '',
            fonte_recurso_ano: null,
            valor_nominal: null,
            valor_percentual: null,
          })"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg>Adicionar fonte de recursos
        </button>
      </FieldArray>
    </div>

    <div class="flex g2 mb1">
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
        <SmaeText
          v-model="carga.objeto_resumo"
          name="objeto_resumo"
          as="textarea"
          rows="10"
          class="inputtext light mb1"
          maxlength="2048"
          anular-vazio
          :class="{
            error: errors.objeto_resumo,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
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
        <SmaeText
          v-model="carga.objeto_detalhado"
          name="objeto_detalhado"
          as="textarea"
          rows="20"
          class="inputtext light mb1"
          maxlength="2048"
          anular-vazio
          :class="{
            error: errors.v,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
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
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors.data_assinatura,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
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
            @update:model-value="($v) => { setFieldValue('prazo_numero', Number($v) || null); }"
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
            type="number"
            class="inputtext light mb1"
            min="1"
            max="12"
            placeholder="Mês"
            :class="{
              error: errors.data_base_mes,
              loading: chamadasPendentes.validaçãoDeDependências
            }"
            @update:model-value="($v) => { setFieldValue('data_base_mes', Number($v) || null); }"
          />
          <Field
            name="data_base_ano"
            type="number"
            min="2003"
            class="inputtext light mb1"
            :class="{
              error: errors.data_base_ano,
              loading: chamadasPendentes.validaçãoDeDependências
            }"
            placeholder="Ano"
            @update:model-value="($v) => { setFieldValue('data_base_ano', Number($v) || null); }"
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
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors.data_inicio,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
        />
        <ErrorMessage
          name="data_inicio"
          class="error-msg"
        />
      </div>
    </div>

    <div
      class="flex g2 mb1"
    >
      <div class="f1 mb1">
        <LabelFromYup
          name="data_termino"
          :schema="schema"
        />
        <Field
          name="data_termino"
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors.data_termino,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
        />
        <ErrorMessage
          name="data_termino"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
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

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="observacoes"
          :schema="schema"
        />
        <SmaeText
          v-model="carga.observacoes"
          name="observacoes"
          as="textarea"
          rows="15"
          class="inputtext light mb1"
          maxlength="2048"
          anular-vazio
          :class="{
            error: errors.observacoes,
            loading: chamadasPendentes.observacoes
          }"
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

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
