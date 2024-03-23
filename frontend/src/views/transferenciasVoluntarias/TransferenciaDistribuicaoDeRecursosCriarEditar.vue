<script setup>
import { transferenciaDistribuicaoDeRecursos as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { ref } from 'vue';

const distribuicaoRecursos = useDistribuicaoRecursosStore();
const ÓrgãosStore = useOrgansStore();

const { chamadasPendentes, erro, lista } = storeToRefs(distribuicaoRecursos);
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);

const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const mostrarDistribuicaoRegistroForm = ref(false);
const registrosSei = ref([{ id: 0, valor: '' }]);

async function onSubmit(values) {
  try {
    let r;
    const msg = props.transferenciaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.transferenciaId) {
      r = await distribuicaoRecursos.salvarItem(values, props.transferenciaId);
    } else {
      r = await distribuicaoRecursos.salvarItem(values);
    }
    if (r) {
      alertStore.success(msg);
      distribuicaoRecursos.buscarTudo(props.transferenciaId);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function iniciar() {
  if (props.transferenciaId) {
    distribuicaoRecursos.buscarTudo(props.transferenciaId);
  }
  ÓrgãosStore.getAll();
}
iniciar();

function registrarNovaDistribuicaoRecursos() {
  mostrarDistribuicaoRegistroForm.value = true;
}

function adicionarLinha() {
  registrosSei.value.push({ id: registrosSei.value.length, valor: '' });
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>Formulário de registro</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <div class="flex spacebetween center mb2">
    <h3 class="title">
      Distribuição de Recursos
    </h3>
    <hr class="ml2 f1">
  </div>

  <div class="mb2">
    <table class="tablemain mb1">
      <col>
      <col>
      <col>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <thead>
        <tr>
          <th>
            Gestor municipal
          </th>
          <th>
            Valor total
          </th>
          <th>
            empenho
          </th>
          <th>
            data de vigência
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in lista"
          :key="item.id"
        >
          <td>{{ item.orgao_gestor.sigla }}</td>
          <td>{{ item.valor_total }}</td>
          <td>{{ item.empenho? 'Sim' : 'Não' }}</td>
          <td>{{ dateToField(item.vigencia) }}</td>
          <td>
            <button
              class="like-a__text"
              arial-label="excluir"
              title="excluir"
              type="button"
              @click="excluirItem('distribuição de recurso', item.id)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </td>
          <td>
            <button
              class="tprimary"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
            </button>
          </td>
        </tr>
      </tbody>
      <tbody>
        <tr v-if="!lista.length">
          <td colspan="5">
            Nenhum Registro de Distribuição de Recursos encontrado.
          </td>
        </tr>
      </tbody>
    </table>
    <button
      class="like-a__text addlink"
      @click="registrarNovaDistribuicaoRecursos"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg> Registrar nova distribuição de recurso
    </button>
  </div>
  <Form
    v-if="mostrarDistribuicaoRegistroForm"
    v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="itemParaEdição"
    @submit="onSubmit"
  >
    <div class="flex spacebetween center mb1">
      <h3 class="title">
        Registro Distribuição de Recursos
      </h3>
      <hr class="ml2 f1">
    </div>

    <div class="f1 mb2">
      <LabelFromYup
        name="orgao_gestor_id"
        :schema="schema"
      />
      <Field
        name="orgao_gestor_id"
        as="select"
        class="inputtext light mb1"
        :class="{
          error: errors.orgao_gestor_id,
          loading: ÓrgãosStore.chamadasPendentes?.lista,
        }"
        :disabled="!órgãosComoLista?.length"
      >
        <option :value="0">
          Selecionar
        </option>
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
        name="orgao_gestor_id"
        class="error-msg"
      />
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="objeto"
          :schema="schema"
        />
        <Field
          name="objeto"
          as="textarea"
          class="inputtext light mb1"
          rows="5"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="objeto"
        />
      </div>
    </div>

    <div class=" g2 mb2">
      <div class="halfInput">
        <LabelFromYup
          name="valor"
          :schema="schema"
        />
        <Field
          name="valor"
          type="text"
          class="inputtext light mb2"
          placeholder="R$ 000.000.000.000,00"
        />
        <ErrorMessage
          class="error-msg mb2"
          name="valor"
        />
      </div>
      <div class="halfInput">
        <LabelFromYup
          name="valor_contrapartida"
          :schema="schema"
        />
        <Field
          name="valor_contrapartida"
          type="text"
          class="inputtext light mb2"
          placeholder="R$ 000.000.000.000,00"
        />
        <ErrorMessage
          class="error-msg mb2"
          name="valor_contrapartida"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="valor_total"
          :schema="schema"
        />
        <Field
          name="valor_total"
          type="text"
          class="inputtext light mb1"
          placeholder="R$ 000.000.000.000,00"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="valor_total"
        />
      </div>
      <div class="f1">
        <label class="label">Empenho <span class="tvermelho">*</span></label>
        <Field
          name="empenho"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.empenho }"
        >
          <option value="">
            Selecionar
          </option>
          <option :value="true">
            Sim
          </option>
          <option :value="false ">
            Não
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.empenho }}
        </div>
      </div>
    </div>

    <div class="mb1">
      <div class="f1 mb2">
        <LabelFromYup
          name="programa_orcamentario_municipal"
          :schema="schema"
        />
        <Field
          name="programa_orcamentario_municipal"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="programa_orcamentario_municipal"
        />
      </div>
      <div class="f1 mb2">
        <LabelFromYup
          name="programa_orcamentario_estadual"
          :schema="schema"
        />
        <Field
          name="programa_orcamentario_estadual"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="programa_orcamentario_estadual"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="dotacao"
          :schema="schema"
        />
        <Field
          name="dotacao"
          type="text"
          class="inputtext light mb1"
          placeholder="16.24.12.306.3016.2.873.33903900.00"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="dotacao"
        />
      </div>
      <div class="f1">
        <div
          v-for="(registro, index) in registrosSei"
          :key="index"
          class="flex g2"
        >
          <div class="f1">
            <LabelFromYup
              name="registros_sei"
              :schema="schema"
            />
            <Field
              v-model="registro.valor"
              :name="'registros_sei_' + registro.id"
              type="text"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb1"
              :name="'registros_sei_' + registro.id"
            />
          </div>
        </div>
        <button
          class="like-a__text addlink mb1"
          type="button"
          @click="adicionarLinha"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg> adicionar novo número sei
        </button>
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="proposta"
          :schema="schema"
        />
        <Field
          name="proposta"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="proposta"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="convenio"
          :schema="schema"
        />
        <Field
          name="convenio"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="convenio"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="contrato"
          :schema="schema"
        />
        <Field
          name="contrato"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="contrato"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="assinatura_termo_aceite"
          :schema="schema"
        />
        <Field
          name="assinatura_termo_aceite"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.assinatura_termo_aceite }"
          maxlength="10"
          @update:model-value="values.assinatura_termo_aceite === ''
            ? values.assinatura_termo_aceite = null
            : null"
        />
        <ErrorMessage
          name="assinatura_termo_aceite"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="assinatura_municipio"
          :schema="schema"
        />
        <Field
          name="assinatura_municipio"
          type="date"
          class="inputtext light"
          :class="{ 'error': errors.assinatura_municipio }"
          maxlength="10"
          @update:model-value="values.assinatura_municipio === ''
            ? values.assinatura_municipio = null
            : null"
        />
        <ErrorMessage
          name="assinatura_municipio"
          class="error-msg"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="assinatura_municipio"
          :schema="schema"
        />
        <Field
          name="assinatura_municipio"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.assinatura_municipio }"
          maxlength="10"
          @update:model-value="values.assinatura_municipio === ''
            ? values.assinatura_municipio = null
            : null"
        />
        <ErrorMessage
          name="assinatura_municipio"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb3">
      <div class="f1 mb1">
        <LabelFromYup
          name="vigencia"
          :schema="schema"
        />
        <Field
          name="vigencia"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.vigencia }"
          maxlength="10"
          @update:model-value="values.vigencia === ''
            ? values.vigencia = null
            : null"
        />
        <ErrorMessage
          name="vigencia"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="conclusao_suspensiva"
          :schema="schema"
        />
        <Field
          name="conclusao_suspensiva"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.conclusao_suspensiva }"
          maxlength="10"
          @update:model-value="values.conclusao_suspensiva === ''
            ? values.conclusao_suspensiva = null
            : null"
        />
        <ErrorMessage
          name="conclusao_suspensiva"
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
  </Form>

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
