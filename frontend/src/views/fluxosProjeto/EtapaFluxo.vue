<!-- não finalizado -->
<script setup>
import { ErrorMessage, Field, useForm, useIsFormDirty} from 'vee-validate';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store.js';
import { useFluxosEtapasProjetosStore } from '@/stores/fluxosEtapasProjeto.store.js';
import { fasesFluxo as schema } from '@/consts/formSchemas';
import SmallModal from '@/components/SmallModal.vue';
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const alertStore = useAlertStore();
const { errors, isSubmitting, handleSubmit, values } = useForm({validationSchema: schema,});
const etapasProjetosStore = useEtapasProjetosStore();
const fluxosEtapasProjetos = useFluxosEtapasProjetosStore();
const erro = ref(null);
const { lista } = storeToRefs(etapasProjetosStore);

const emit = defineEmits(['close']);
const props = defineProps({
  apenasEmitir: {
    type: Boolean,
    default: false,
  },
  fluxoId: {
    type: Number,
    default: 0,
  },
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    const msg = props.fluxoId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";

    const resposta =  await fluxosEtapasProjetos.salvarItem(valoresControlados, props.fluxoId)
    if (resposta) {
      alertStore.success(msg);
      fluxosEtapasProjetos.$reset();
      fluxosEtapasProjetos.buscarTudo();
      router.push({ name: "fluxosCriar" });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const formulárioSujo = useIsFormDirty();

function iniciar() {
  etapasProjetosStore.buscarTudo()
}

iniciar();
</script>

<template>
  <SmallModal @close="emit('close')">
    <div class="flex spacebetween center mb2">
      <TítuloDePágina>Adicionar etapa</TítuloDePágina>
      <hr class="ml2 f1">
      <CheckClose
        :apenas-emitir="props.apenasEmitir"
        :formulário-sujo="formulárioSujo"
        @close="emit('close')"
      />
    </div>

    <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit"
    >
      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="workflow_etapa_de_id"
            :schema="schema"
          />
          <Field
            name="workflow_etapa_de_id"
            as="select"
            class="inputtext light mb1"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in lista"
              :key="item"
              :value="item.id"
            >
              {{ item.descricao }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="workflow_etapa_de_id"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="workflow_etapa_para_id"
            :schema="schema"
          />
          <Field
            name="workflow_etapa_para_id"
            as="select"
            class="inputtext light mb1"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in lista"
              :key="item"
              :value="item.id"
            >
              {{ item.descricao }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="workflow_etapa_para_id"
          />
        </div>
      </div>
      <div>
        <div class="mb1">
          <LabelFromYup
            name="ordem"
            :schema="schema"
          >
          </LabelFromYup>
          <Field
            name="ordem"
            type="number"
            class="inputtext light mb1"
            min="1"
            max="10"
            step="1"
            @update:model-value="values.ordem = Number(values.ordem)"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="ordem"
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
      v-if="erro"
      class="error p1"
    >
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>
  </SmallModal>
</template>
