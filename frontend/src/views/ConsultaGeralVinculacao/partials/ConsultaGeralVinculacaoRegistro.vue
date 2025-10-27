<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm,
} from 'vee-validate';
import { onMounted } from 'vue';
import type { InferType } from 'yup';

import { ConsultaGeralVinculacaoRegistro as schema } from '@/consts/formSchemas';
import { useTransferenciasVinculosStore } from '@/stores/transferenciasVinculos.store';

export type VinculacaoFormulario = InferType<typeof schema>;

interface Emits {
  (e: 'registrar', dados: VinculacaoFormulario): void;
}

const emit = defineEmits<Emits>();

const vinculosStore = useTransferenciasVinculosStore();

const { tiposDeVinculo, chamadasPendentes } = storeToRefs(vinculosStore);

const { handleSubmit, values } = useForm({ validationSchema: schema });

const onSubmit = handleSubmit.withControlled(async (dadosControlados) => {
  emit('registrar', dadosControlados as VinculacaoFormulario);
});

onMounted(() => {
  if (tiposDeVinculo.value.length === 0) {
    vinculosStore.buscarTiposDeVinculo();
  }
});
</script>

<template>
  <form @submit="onSubmit">
    <div class="flex g2 mb1">
      <div class="f1">
        <SmaeLabel
          name="tipo_vinculo_id"
          :schema="schema"
        />

        <Field
          name="tipo_vinculo_id"
          as="select"
          class="inputtext light mb1"
          :aria-busy="chamadasPendentes.tiposDeVinculo"
        >
          <option value="">
            Selecionar
          </option>

          <option
            v-for="tipo in tiposDeVinculo"
            :key="`tipo-vinculo--${tipo.id}`"
            :value="tipo.id"
          >
            {{ tipo.nome }}
          </option>
        </Field>

        <ErrorMessage
          class="error-msg mb1"
          name="tipo_vinculo_id"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <SmaeLabel
          name="observacao"
          :schema="schema"
        />

        <SmaeText
          v-model="values.observacao"
          name="observacao"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          anular-vazio
        />

        <ErrorMessage
          class="error-msg mb1"
          name="observacao"
        />
      </div>
    </div>

    <div class="flex justifycenter mb2">
      <button
        class="btn big"
        type="submit"
      >
        Vincular
      </button>
    </div>
  </form>
</template>
