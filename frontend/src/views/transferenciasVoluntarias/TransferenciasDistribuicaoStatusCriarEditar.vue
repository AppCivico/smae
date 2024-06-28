<template>
  <SmallModal>
    <!-- props.transferenciaWorkflowId: {{ props.transferenciaWorkflowId }} -->
    <!-- fluxoProjetoEmFoco: <pre> {{ fluxoProjetoEmFoco }}</pre> -->
    <div class="flex spacebetween center mb2">
      <h2>Status</h2>
      <hr class="ml2 f1">
      <CheckClose
        :apenas-emitir="true"
        @close="emit('fecharModal')"
      />
    </div>
    <form
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
            >
              <option value="">
                Selecionar
              </option>
              <option
                v-for="status in fluxoProjetoEmFoco?.statuses_distribuicao "
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
        <hr class="mr2 f1">
        <FormErrorsList :errors="errors" />
      </div>
    </form>
  </SmallModal>
</template>

<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { statusDistribuicao as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { useStatusStore } from '@/stores/statusDistribuicao.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import { vMaska } from 'maska';
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
  nextTick,
  onUnmounted,
  ref,
  watch,
} from 'vue';

const distribuicaoRecursos = useDistribuicaoRecursosStore();
// const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();
const ÓrgãosStore = useOrgansStore();
const fluxosProjetosStore = useFluxosProjetosStore();
const statusStore = useStatusStore();

const {
  chamadasPendentes, erro, lista, itemParaEdição, emFoco: distribuiçãoEmFoco,
} = storeToRefs(distribuicaoRecursos);
// const { emFoco: transferenciasVoluntariaEmFoco } = storeToRefs(TransferenciasVoluntarias);
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
const { emFoco: fluxoProjetoEmFoco } = storeToRefs(fluxosProjetosStore);

const props = defineProps({
  transferenciaWorkflowId: {
    type: Number,
    default: 0,
  },

});

const emit = defineEmits(['fecharModal']);

const alertStore = useAlertStore();

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});

const formulárioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (controlledValues) => {
  // necessário por causa de 🤬
  const cargaManipulada = nulificadorTotal(controlledValues);
  console.log('onSubmit, controlledValues: ', controlledValues);
  console.log('cargaManipulada: ', cargaManipulada);
  // try {
  //   let r;
  //   const msg = itemParaEdição.value.id
  //     ? 'Dados salvos com sucesso!'
  //     : 'Item adicionado com sucesso!';

  //   if (itemParaEdição.value.id) {
  //     r = await distribuicaoRecursos.salvarItem(cargaManipulada, itemParaEdição.value.id);
  //   } else {
  //     r = await distribuicaoRecursos.salvarItem(cargaManipulada);
  //   }
  //   if (r) {
  //     alertStore.success(msg);

  //     mostrarDistribuicaoRegistroForm.value = false;

  //     if (itemParaEdição.value.id) {
  //       distribuiçãoEmFoco.value = null;
  //     }

  //     distribuicaoRecursos.buscarTudo({ transferencia_id: props.transferenciaId });
  //   }
  // } catch (error) {
  //   alertStore.error(error);
  // }
});

fluxosProjetosStore.buscarItem(props.transferenciaWorkflowId);
</script>

<style>

</style>
