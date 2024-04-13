<!-- não finalizado -->
<script setup>
import { useFluxosFasesProjetosStore } from '@/stores/fluxosFasesProjeto.store.js';
import  responsabilidadeEtapaFluxo  from '@/consts/responsabilidadeEtapaFluxo.js';
import { useFasesProjetosStore } from '@/stores/fasesProjeto.store.js';
import { etapasFluxo as schema } from '@/consts/formSchemas';
import { ErrorMessage, Field, useForm} from 'vee-validate';
import { useSituacaoStore } from '@/stores/situacao.store';
import SmallModal from "@/components/SmallModal.vue";
import { useAlertStore } from '@/stores/alert.store';
import { useRouter } from "vue-router";
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

const emits = defineEmits(['close']);
const props = defineProps({
  relacionamentoId: {
    type: Number,
    default: 0,
  },
  fluxoId: {
    type: Number,
    default: 0,
  },
});

const fluxosFasesProjetosStore = useFluxosFasesProjetosStore();
const fasesProjetosStore = useFasesProjetosStore();
const situacaoProjetosStore = useSituacaoStore();
const alertStore = useAlertStore();
const router = useRouter();
const erro = ref(null);

const { lista: listaFase } = storeToRefs(fasesProjetosStore);
const { lista: listaSituacao } = storeToRefs(situacaoProjetosStore);
const { lista } = storeToRefs(fluxosFasesProjetosStore);

const itemParaEdição = computed(() => {
  const fase = lista.value.find((x) => (x.id === Number(props.relacionamentoId)));

  return {
    ...fase,
    fase_id: fase?.fase?.id,
    responsabilidade: fase?.responsabilidade || '',
    situacao: fase?.situacao?.map((x)=> x.id) || null,
  };
});

const { errors, isSubmitting, values, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: itemParaEdição
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    const msg = props.relacionamentoId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";

    const resposta =  await fluxosFasesProjetosStore.salvarItem(valoresControlados, props.relacionamentoId)
    if (resposta) {
      alertStore.success(msg);
      fluxosFasesProjetosStore.$reset();
      fluxosFasesProjetosStore.buscarTudo();
      emits('close');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function iniciar() {
  fasesProjetosStore.buscarTudo();
  situacaoProjetosStore.buscarTudo();

  if (props.relacionamentoId) {
    fluxosFasesProjetosStore.buscarTudo();
  }
}
iniciar();
</script>
<template>
  <SmallModal
    @close="$emit('close')"
  >
    <div class="flex spacebetween center mb2">
      <h2>
        <template v-if="relacionamentoId">
          Editar
        </template>
        <template v-else>
          Adicionar
        </template>
        fase
      </h2>
      <hr class="ml2 f1" />
      <CheckClose
        :apenas-emitir="true"
        @close="$emit('close')"
      />
    </div>

    <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit"
    >
      <Field
        name="fluxo_id"
        type="hidden"
        class="inputtext light mb1"
        :value="fluxoId"
      />

      <div class="flex flexwrap g2">
        <div class="f1">
          <LabelFromYup
            name="fase_id"
            :schema="schema"
          />
          <Field
            name="fase_id"
            as="select"
            class="inputtext light mb1"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in listaFase"
              :key="item"
              :value="item.id"
            >
              {{ item.fase }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="fase_id"
          />
        </div>
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
      <div>
        <div class="f1">
          <LabelFromYup
            name="responsabilidade"
            :schema="schema"
          />
          <Field
            name="responsabilidade"
            as="select"
            class="inputtext light mb2"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in Object.values(responsabilidadeEtapaFluxo)"
              :key="item.valor"
              :value="item.valor"
            >
              {{ item.nome }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="responsabilidade"
          />
        </div>
        <div class="f1 mb1">
          <div class="label mb1">Situações da fase</div>
          <label
            v-for="item in listaSituacao"
            :key="item.id"
            class="block mb1"
            >
              <Field
                name="situacao"
                class="inputcheckbox"
                type="checkbox"
                :class="{ 'error': errors.item }"
                :value="item.id"
              />
              <span>
                {{ item.situacao }}
              </span>
            </label>
            <div class="error-msg">
              {{ errors.situacao }}
            </div>
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
    <div v-if="erro" class="error p1">
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>
  </SmallModal>
</template>
