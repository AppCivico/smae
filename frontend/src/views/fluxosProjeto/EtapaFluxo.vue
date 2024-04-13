<!-- não finalizado -->
<script setup>
import { useFluxosEtapasProjetosStore } from '@/stores/fluxosEtapasProjeto.store.js';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store.js';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import { ErrorMessage, Field, useForm} from 'vee-validate';
import { fasesFluxo as schema } from '@/consts/formSchemas';
import SmallModal from "@/components/SmallModal.vue";
import { useAlertStore } from '@/stores/alert.store';
import { useRouter } from "vue-router";
import { storeToRefs } from 'pinia';
import { ref, computed } from 'vue';

const etapasProjetosStore = useEtapasProjetosStore();
const fluxosEtapasProjetos = useFluxosEtapasProjetosStore();
const fluxosProjetoStore = useFluxosProjetosStore();

const { lista: batata } = storeToRefs(fluxosEtapasProjetos);
const { lista } = storeToRefs(etapasProjetosStore);
const { emFoco } = storeToRefs(fluxosProjetoStore);
const alertStore = useAlertStore();
const exibeModalEtapa = ref(true);
const router = useRouter();
const erro = ref(null);

const itemParaEdição = computed(() => batata.value.find((x) => {
   return x.id === Number(params.etapaId);
 }) || {
  id: 0,
  ordem: '',
  workflow_etapa_de_id:"",
  workflow_etapa_para_id:""
});

const { errors, isSubmitting, handleSubmit, values }
= useForm({
    validationSchema: schema,
    initialValues: itemParaEdição
});

const props = defineProps({
  etapaId: {
    type: Number,
    default: 0,
  },
  fluxoId: {
    type: Number,
    default: 0,
  },
  ordem:{
    type: Number,
    required: true,
  },
  workflow_etapa_de_id:{
    type: Number,
    required: true,
  },
  workflow_etapa_para_id:{
    type: Number,
    required: true,
  }
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    const msg = props.etapaId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";
    const resposta =  await fluxosEtapasProjetos.salvarItem(valoresControlados, props.etapaId)
    if (resposta) {
      alertStore.success(msg);
      fluxosEtapasProjetos.$reset();
      fluxosEtapasProjetos.buscarTudo();
      router.push({ name: "fluxosListar" });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function iniciar() {
  etapasProjetosStore.buscarTudo()
}
iniciar();

</script>
<template>
  <SmallModal>
    <div class="flex spacebetween center mb2">
      <h2>Adicionar etapa</h2>
      <hr class="ml2 f1" />
      <CheckClose @close="exibeModalEtapa = false"/>
    </div>
    <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit"
        >
       <div>
        <LabelFromYup
          :name="emFoco.id"
          :schema="schema"
        />
        <Field
          name="workflow_id"
          type="hidden"
          class="inputtext light mb1"
          :value="emFoco.id"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="nome"
        />
      </div>
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

