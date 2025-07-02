<script setup>
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import SmallModal from '@/components/SmallModal.vue';
import { etapasFluxo as schema } from '@/consts/formSchemas';
import responsabilidadeEtapaFluxo from '@/consts/responsabilidadeEtapaFluxo';
import { useAlertStore } from '@/stores/alert.store';
import { useFasesProjetosStore } from '@/stores/fasesProjeto.store';
import { useFluxosFasesProjetosStore } from '@/stores/fluxosFasesProjeto.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import { useSituacaoStore } from '@/stores/situacao.store';

const emits = defineEmits(['close', 'saved']);
const props = defineProps({
  relacionamentoId: {
    type: Number,
    default: 0,
  },
  etapaId: {
    type: Number,
    default: 0,
  },
  ordem: {
    type: Number,
    required: true,
  },
});

const fluxosFasesProjetosStore = useFluxosFasesProjetosStore();
const fasesProjetosStore = useFasesProjetosStore();
const situacaoProjetosStore = useSituacaoStore();
const fluxosProjetoStore = useFluxosProjetosStore();
const alertStore = useAlertStore();
const erro = ref(null);

const { emFoco } = storeToRefs(fluxosProjetoStore);
const { lista: listaFase } = storeToRefs(fasesProjetosStore);
const { lista: listaSituacao } = storeToRefs(situacaoProjetosStore);
const { lista } = storeToRefs(fluxosFasesProjetosStore);

const proximaOrdemDisponivel = computed(() => {
  if (!emFoco.value?.fluxo || emFoco.value.fluxo.length === 0) {
    return 1;
  }

  let maxOrdem = 0;
  const etapaAtual = emFoco.value.fluxo.find((etapa) => etapa.id === props.etapaId);

  if (etapaAtual && etapaAtual.fases && etapaAtual.fases.length > 0) {
    etapaAtual.fases.forEach((fase) => {
      if (fase.ordem > maxOrdem) {
        maxOrdem = fase.ordem;
      }
    });
  }

  return maxOrdem + 1;
});

const itemParaEdicao = computed(() => {
  const fase = lista.value.find((x) => (x.id === Number(props.relacionamentoId)));

  return {
    ...fase,
    ordem: fase?.ordem || proximaOrdemDisponivel.value,
    fase_id: fase?.fase?.id,
    responsabilidade: fase?.responsabilidade || 'Propria',
    situacao: fase?.situacao?.map((x) => x.id) || null,
  };
});

const {
  errors, isSubmitting, values, handleSubmit,
} = useForm({
  validationSchema: schema,
  initialValues: itemParaEdicao,
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    const msg = props.relacionamentoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = await fluxosFasesProjetosStore
      .salvarItem(valoresControlados, props.relacionamentoId);
    if (resposta) {
      alertStore.success(msg);
      fluxosFasesProjetosStore.$reset();
      fluxosFasesProjetosStore.buscarTudo();
      emits('saved');
      emits('close');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

// eslint-disable-next-line vue/no-side-effects-in-computed-properties
const listaOrdenada = computed(() => listaFase.value.sort((a, b) => a.fase.localeCompare(b.fase)));

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
      <hr class="ml2 f1">
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
        :value="etapaId"
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
              v-for="item in listaOrdenada"
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
          />
          <Field
            name="ordem"
            type="number"
            class="inputtext light mb1"
            min="1"
            max="1000"
            step="1"
            @update:model-value="values.ordem = Number(values.ordem)"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="ordem"
          />
        </div>
      </div>
      <div class="flex flexwrap center g2">
        <div class="mb1">
          <LabelFromYup
            name="responsabilidade"
            :schema="schema"
          />
          <Field
            name="responsabilidade"
            class="inputtext light mb1"
            as="select"
          >
            <option
              v-for="item in Object.values(responsabilidadeEtapaFluxo)"
              :key="item.valor"
              :value="item.valor"
            >
              {{ item.nome }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg mb1"
            name="responsabilidade"
          />
        </div>
        <div class="mb1">
          <LabelFromYup
            name="duracao"
            :schema="schema"
          />
          <Field
            name="duracao"
            type="number"
            class="inputtext light mb1"
            min="1"
            max="1000"
            step="1"
            @update:model-value="values.duracao = Number(values.duracao)"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="duracao"
          />
        </div>
        <div class="flex">
          <Field
            name="marco"
            type="checkbox"
            :value="true"
            :unchecked-value="false"
            class="inputcheckbox mr1"
          />
          <LabelFromYup
            name="marco"
            :schema="schema"
          />
          <ErrorMessage
            class="error-msg"
            name="marco"
          />
        </div>
      </div>
      <div>
        <div class="f1 mb1">
          <div class="label mb1">
            Situações da fase
          </div>
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
