<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm,
} from 'vee-validate';
import { useRouter } from 'vue-router';

import { ConsultaGeralVinculacaoRegistro as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';
import { useTransferenciasVinculosStore } from '@/stores/transferenciasVinculos.store';

const router = useRouter();
const alertStore = useAlertStore();
const entidadesProximasStore = useEntidadesProximasStore();
const vinculosStore = useTransferenciasVinculosStore();

const { distribuicaoSelecionadaId } = storeToRefs(entidadesProximasStore);
const { tiposDeVinculo, chamadasPendentes } = storeToRefs(vinculosStore);

if (tiposDeVinculo.value.length === 0) {
  vinculosStore.buscarTiposDeVinculo();
}

const { handleSubmit } = useForm({ validationSchema: schema });

const onSubmit = handleSubmit.withControlled(async (values) => {
  try {
    const params = {
      ...values,
      distribuicao_id: distribuicaoSelecionadaId.value,
    };

    await vinculosStore.salvarItem(params);

    alertStore.success('Vinculação realizada com sucesso!');
    router.push({ name: 'consultaGeralVinculacao' });
  } catch (erro) {
    alertStore.error(erro);
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
