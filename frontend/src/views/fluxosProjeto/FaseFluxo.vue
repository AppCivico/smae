<!-- não finalizado -->
<script setup>
import responsabilidadeEtapaFluxo from '@/consts/responsabilidadeEtapaFluxo';
import { ErrorMessage, Field, useForm, useIsFormDirty} from 'vee-validate';
import { useFasesProjetosStore } from '@/stores/fasesProjeto.store.js';
import { useFluxosFasesProjetosStore } from '@/stores/fluxosFasesProjeto.store.js';
import { etapasFluxo as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import SmallModal from '@/components/SmallModal.vue';
import tiposSituacao from '@/consts/tiposSituacao';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const { errors, isSubmitting } = useForm({validationSchema: schema,});
const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();
const fasesProjetosStore = useFasesProjetosStore();
const fluxoFasesProjetosStore = useFluxosFasesProjetosStore();
const erro = ref(null);
const { lista } = storeToRefs(fasesProjetosStore);

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

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.fluxoId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";

    const resposta =  await fluxoFasesProjetosStore.salvarItem(carga, props.fluxoId)
    if (resposta) {
      alertStore.success(msg);
      fluxoFasesProjetosStore.$reset();
      fluxoFasesProjetosStore.buscarTudo();
      router.push({ name: "fluxosListar" });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

const formulárioSujo = useIsFormDirty();

function iniciar() {
  fasesProjetosStore.buscarTudo()
}

iniciar();
</script>

<template>
  <SmallModal @close="emit('close')">
    <div class="flex spacebetween center mb2">
      <TítuloDePágina>Adicionar fase</TítuloDePágina>
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
              v-for="item in lista"
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
            class="inputtext light mb1"
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
        <div class="f1">
          <div class="label mb1">
            Situações da fase
          </div>
          <label
            v-for="item in Object.values(tiposSituacao)"
            :key="item.id"
            class="block mb1"
            >
              <Field
                name="tipo_situacao"
                class="inputcheckbox"
                type="checkbox"
                :class="{ 'error': errors.item }"
                :value="item.value"
              />
              <span>
                {{ item.label }}
              </span>
            </label>
            <div class="error-msg">
              {{ errors.tipo_situacao }}
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
