<script setup>
import SmaeText from '@/components/camposDeFormulario/SmaeText';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { planoDeAção as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePlanosDeAçãoStore } from '@/stores/planosDeAcao.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  Form,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const ÓrgãosStore = useOrgansStore();
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);

const alertStore = useAlertStore();

const route = useRoute();
const router = useRouter();

const projetosStore = useProjetosStore();

const planosDeAçãoStore = usePlanosDeAçãoStore();
const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdicao,
} = storeToRefs(planosDeAçãoStore);

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
  planoId: {
    type: Number,
    default: 0,
  },
  riscoId: {
    type: Number,
    default: 0,
  },
});

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.planoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.planoId
      ? await planosDeAçãoStore.salvarItem(carga, props.planoId)
      : await planosDeAçãoStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      planosDeAçãoStore.$reset();
      planosDeAçãoStore.buscarTudo();
      router.push({ name: 'planosDeAçãoListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function excluirPlanoDeAção(id) {
  useAlertStore().confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await planosDeAçãoStore.excluirItem(id)) {
      planosDeAçãoStore.$reset();
      planosDeAçãoStore.buscarTudo();
      useAlertStore().success('Risco removido.');

      const rotaDeEscape = route.meta?.rotaDeEscape;

      if (rotaDeEscape) {
        router.push(typeof rotaDeEscape === 'string' ? { name: rotaDeEscape } : rotaDeEscape);
      }
    }
  }, 'Remover');
}

async function iniciar() {
  ÓrgãosStore.getAll();
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="planoId"
        class="t12 uc w700 tamarelo"
      >
        {{ $route?.meta?.título || 'Editar plano de ação' }}
      </div>
      {{ planoId ? 'Plano de ação' : 'Novo plano de ação' }}
    </h1>
    <hr class="ml2 f1">

    <CheckClose />
  </div>

  <Form
    v-if="!planoId || emFoco"
    v-slot="{ errors, isSubmitting, setFieldValue, values }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdicao"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <Field
      name="projeto_risco_id"
      type="hidden"
    />

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="contramedida"
          :schema="schema"
        />

        <SmaeText
          name="contramedida"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          :schema="schema"
          :model-value="values.contramedida"
          anular-vazio
          :class="{ 'error': errors.contramedida }"
        />
        <ErrorMessage
          name="contramedida"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <legend class="label mt2 mb1">
        Responsável
      </legend>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="orgao_id"
          :schema="schema"
          class="tc300"
        />
        <Field
          name="orgao_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.orgao_id,
            loading: projetosStore.chamadasPendentes?.emFoco,
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
          name="orgao_id"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="responsavel"
          :schema="schema"
          class="tc300"
        />
        <Field
          name="responsavel"
          type="text"
          class="inputtext light mb1"
          maxlength="60"
          :class="{ 'error': errors.responsavel }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="responsavel"
        />
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="contato_do_responsavel"
          :schema="schema"
          class="tc300"
        >
          Meio de contato
        </LabelFromYup>
        <Field
          name="contato_do_responsavel"
          type="text"
          class="inputtext light mb1"
          :class="{ 'error': errors.contato_do_responsavel }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="contato_do_responsavel"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="prazo_contramedida"
          :schema="schema"
        />
        <Field
          name="prazo_contramedida"
          required
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors.prazo_contramedida,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          maxlength="10"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('prazo_contramedida', $v || null); }"
        />
        <ErrorMessage
          name="prazo_contramedida"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="data_termino"
          :schema="schema"
        />
        <Field
          name="data_termino"
          required
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors.data_termino,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          maxlength="10"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('data_termino', $v || null); }"
        />
        <ErrorMessage
          name="data_termino"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="custo"
          :schema="schema"
        />
        <MaskedFloatInput
          name="custo"
          :value="values.custo"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="custo"
        />
      </div>

      <div class="f05 mb1">
        <LabelFromYup
          name="custo_percentual"
          :schema="schema"
        />
        <MaskedFloatInput
          name="custo_percentual"
          :value="values.custo_percentual"
          max="100"
          min="0"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="custo_percentual"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="medidas_de_contingencia"
          :schema="schema"
        />
        <SmaeText
          name="medidas_de_contingencia"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          :schema="schema"
          :model-value="values.medidas_de_contingencia"
          anular-vazio
          :class="{ 'error': errors.medidas_de_contingencia }"
        />
        <ErrorMessage
          name="medidas_de_contingencia"
          class="error-msg"
        />
      </div>
    </div>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting
          || Object.keys(errors)?.length
          || chamadasPendentes.validaçãoDeDependências
        "
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
    @click="excluirPlanoDeAção(emFoco.id)"
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
