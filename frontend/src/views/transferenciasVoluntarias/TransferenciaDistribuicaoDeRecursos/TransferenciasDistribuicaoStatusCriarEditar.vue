<template>
  <SmallModal>
    <div class="flex spacebetween center mb2">
      <h2>Status</h2>
      <hr class="ml2 f1">
      <CheckClose
        :formulario-sujo="formularioSujo"
        :apenas-emitir="true"
        @close="emit('fecharModal')"
      />
    </div>

    <form
      :aria-busy="montando || chamadasPendentes.emFoco"
      @submit.prevent="onSubmit"
    >
      <div>
        <div class="flex flexwrap g2 mb3">
          <div class="f1">
            <LabelFromYup
              name="status_id"
              :schema="schema"
            />
            <Field
              name="status_id"
              as="select"
              class="inputtext light mb1"
              :class="{ error: errors.status_id }"
              :disabled="itemParaEdicao.id"
              :aria-busy="fluxoPendente.lista || statusPendente.lista"
            >
              <option value="">
                Selecionar
              </option>
              <option
                v-for="status in statusesDisponiveis"
                :key="status.id"
                :value="status.id"
              >
                {{ status.nome }}
              </option>
            </Field>
          </div>
          <div class="f1">
            <LabelFromYup
              name="data_troca"
              :schema="schema"
            />
            <Field
              name="data_troca"
              type="date"
              class="inputtext light mb1"
              :class="{ error: errors.assinatura_termo_aceite }"
              maxlength="10"
              @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
              @update:model-value="($v) => { setFieldValue('data_troca', $v || null); }"
            />
            <ErrorMessage
              name="data_troca"
              class="error-msg"
            />
          </div>
        </div>
        <div class="flex flexwrap g2 mb3">
          <div class="f1">
            <LabelFromYup
              name="orgao_responsavel_id"
              :schema="schema"
            />
            <Field
              name="orgao_responsavel_id"
              as="select"
              class="inputtext light mb1"
              :class="{ error: errors.empenho }"
            >
              <option value="">
                Selecionar
              </option>
              <option
                v-for="órgão in órgãosComoLista"
                :key="órgão.id"
                :value="órgão.id"
              >
                {{ órgão.descricao }}
              </option>
            </Field>
            <div class="error-msg">
              {{ errors.empenho }}
            </div>
          </div>
          <div class="f1">
            <LabelFromYup
              name="nome_responsavel"
              :schema="schema"
            />
            <Field
              name="nome_responsavel"
              type="text"
              class="inputtext light mb1"
            />
            <ErrorMessage
              class="error-msg mb1"
              name="contrato"
            />
          </div>
        </div>
        <div>
          <LabelFromYup
            name="motivo"
            :schema="schema"
          />
          <Field
            name="motivo"
            type="text"
            class="inputtext light mb1"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="motivo"
          />
        </div>
      </div>

      <ErrorComponent :erro="erro" />

      <div class="flex spacebetween center mb2">
        <FormErrorsList :errors="errors" />
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
        <hr class="mr2 f1">
      </div>
    </form>
  </SmallModal>
</template>

<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { statusDistribuicao as schema } from '@/consts/formSchemas';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import { useAlertStore } from '@/stores/alert.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useStatusDistribuicaoStore } from '@/stores/statusDistribuicao.store';
import { useStatusDistribuicaoWorflowStore } from '@/stores/statusDistribuicaoWorkflow.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';

const formularioSujo = useIsFormDirty();

const ÓrgãosStore = useOrgansStore();
const fluxosProjetosStore = useFluxosProjetosStore();
const statusDistribuicaoStore = useStatusDistribuicaoStore();
const statusDistribuicaoWorflowStore = useStatusDistribuicaoWorflowStore();

const {
  chamadasPendentes, erro,
} = storeToRefs(statusDistribuicaoStore);
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
const {
  emFoco: fluxoProjetoEmFoco,
  chamadasPendentes: fluxoPendente,
} = storeToRefs(fluxosProjetosStore);
const {
  listaBase: statusBase,
  chamadasPendentes: statusPendente,
} = storeToRefs(statusDistribuicaoWorflowStore);

const props = defineProps({
  transferenciaWorkflowId: {
    type: Number,
    required: true,
  },
  distribuicaoId: {
    type: Number,
    required: true,
  },
  statusEmFoco: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['fecharModal', 'salvouStatus']);

const alertStore = useAlertStore();

const montando = ref(false);

const itemParaEdicao = computed(() => ({
  ...props.statusEmFoco,
  status_id: props.statusEmFoco?.status_base
    ? props.statusEmFoco.status_base.id
    : props.statusEmFoco?.status_customizado.id,
  data_troca: dateTimeToDate(props.statusEmFoco?.data_troca) || null,
  orgao_responsavel_id: props.statusEmFoco?.orgao_responsavel?.id,
}));

const statusesDisponiveis = computed(() => (props.transferenciaWorkflowId
  ? fluxoProjetoEmFoco.value?.statuses_distribuicao
  : statusBase.value));

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue,
} = useForm({
  initialValues: itemParaEdicao.value,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async (controlledValues) => {
  const cargaManipulada = {
    ...controlledValues,
    ...(controlledValues.status_id < 1000000
      ? { status_base_id: controlledValues.status_id, status_id: null }
      : { status_id: controlledValues.status_id, status_base_id: null }),
  };

  try {
    let response;
    const msg = props.statusEmFoco?.id
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.statusEmFoco?.id) {
      response = await statusDistribuicaoStore.salvarItem(
        cargaManipulada,
        props.distribuicaoId,
        props.statusEmFoco.id,
      );
    } else {
      response = await statusDistribuicaoStore.salvarItem(
        cargaManipulada,
        props.distribuicaoId,
      );
    }
    if (response) {
      alertStore.success(msg);
      statusDistribuicaoStore.$reset();
      emit('salvouStatus');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

watch(props.statusEmFoco, (novosValores) => {
  resetForm({ values: novosValores });
});

function iniciar() {
  const promessas = [];
  montando.value = true;

  if (!props.transferenciaWorkflowId) {
    if (!statusBase.value.length) {
      promessas.push(statusDistribuicaoWorflowStore.buscarTudo());
    }
  } else if (fluxoProjetoEmFoco.value?.id !== props.transferenciaWorkflowId) {
    promessas.push(fluxosProjetosStore.buscarItem(props.transferenciaWorkflowId));
  }

  if (!órgãosComoLista.value.length) {
    promessas.push(ÓrgãosStore.getAll());
  }

  if (promessas.length) {
    Promise.allSettled(promessas)
      .finally(() => {
        montando.value = false;
      });
  } else {
    montando.value = false;
  }
}

iniciar();
</script>
