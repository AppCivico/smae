<script lang="ts" setup>
import type { AssociarContratoCompartilhadoDto } from '@back/pp/contrato/dto/associar-contrato-compartilhado.dto';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  useForm,
} from 'vee-validate';
import {
  computed,
  onMounted,
  onUnmounted,
} from 'vue';
import { useRoute } from 'vue-router';
import { array, number, object } from 'yup';

import AutocompleteField from '@/components/AutocompleteField2.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useContratosStore } from '@/stores/contratos.store';
import { useObrasStore } from '@/stores/obras.store';

const emit = defineEmits(['bemSucedido']);

const route = useRoute();

const alertStore = useAlertStore();
const contratosStore = useContratosStore(route.meta?.entidadeMãe || '');
const obrasStore = useObrasStore();

const { emFoco: obraEmFoco } = storeToRefs(obrasStore);
const {
  chamadasPendentes,
  listaDeContratosCompartilhadosDisponiveis,
  erro,
} = storeToRefs(contratosStore);

const schema = object({
  contrato_ids: array()
    .of(
      number()
        .integer()
        .min(1),
    )
    .label('Contratos')
    .required()
    .min(1),
});

const {
  errors,
  handleSubmit,
  isSubmitting,
  controlledValues: carga,
} = useForm({
  initialValues: {
    contrato_ids: [],
  },
  validationSchema: schema,
});

const nomeDeQuemRecebeOVinculo = computed(() => ((obraEmFoco.value && 'nome' in obraEmFoco.value)
  ? (obraEmFoco.value as { nome: string }).nome
  : ''));

const onSubmit = handleSubmit.withControlled(async (cargaControlada) => {
  try {
    const tituloDaObra = nomeDeQuemRecebeOVinculo.value || undefined;

    const msg = tituloDaObra
      ? `Contrato associado à obra ${tituloDaObra}!`
      : 'Contrato associado com sucesso!';

    const resposta = await contratosStore.associarContratoCompartilhado(
      cargaControlada as AssociarContratoCompartilhadoDto,
    );

    if (resposta) {
      alertStore.success(msg);

      emit('bemSucedido');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

onMounted(() => {
  contratosStore.buscarContratosCompartilhadosDisponiveis();
});

onUnmounted(() => {
  contratosStore.listaDeContratosCompartilhadosDisponiveis.splice(0);
});
</script>
<template>
  <LoadingComponent
    v-if="chamadasPendentes.contratosCompartilhadosDisponiveis"
  />

  <ErrorComponent
    v-else-if="erro"
    :erro="erro"
  />

  <form
    :aria-busy="chamadasPendentes.contratosCompartilhadosDisponiveis"
    @submit.prevent="isSubmitting ? null : onSubmit()"
  >
    <p>
      Escolha contratos para associar à obra <strong>{{ nomeDeQuemRecebeOVinculo }}</strong>.
    </p>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="contrato_ids"
          :schema="schema"
        />
        <AutocompleteField
          id="contrato_ids"
          :disabled="false"
          class="inputtext light mb1"
          :class="{
            error: errors.contrato_ids,
          }"
          :aria-busy="chamadasPendentes.contratosCompartilhadosDisponiveis"
          name="contrato_ids"
          :controlador="{ participantes: carga?.contrato_ids || [], busca: '' }"
          :grupo="listaDeContratosCompartilhadosDisponiveis"
          label="numero"
        />
        <ErrorMessage
          name="contrato_ids"
          class="error-msg"
        />
      </div>
    </div>

    <SmaeFieldsetSubmit
      :erros="errors"
      :esta-carregando="chamadasPendentes.associarContratoCompartilhado"
    />
  </form>
</template>
