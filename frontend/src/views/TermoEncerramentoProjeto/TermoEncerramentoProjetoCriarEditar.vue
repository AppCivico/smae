<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import {
  onMounted, ref, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import SmaeDateInput from '@/components/camposDeFormulario/SmaeDateInput.vue';
import SmaeNumberInput from '@/components/camposDeFormulario/SmaeNumberInput.vue';
import InputImageProfile from '@/components/InputImageProfile.vue';
import { termoEncerramento as schema } from '@/consts/formSchemas';
import { ModuloSistema } from '@/consts/modulosDoSistema';
import { useAlertStore } from '@/stores/alert.store';
import { useTermoEncerramentoStore } from '@/stores/termoEncerramento.store';
import { useTipoEncerramentoStore } from '@/stores/tipoEncerramento.store';

type Props = {
  escopoId: number;
};

const props = defineProps<Props>();

const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();

type ModulosAceitos = ModuloSistema.MDO | ModuloSistema.Projetos;

const termoEncerramentoStore = useTermoEncerramentoStore(route.meta.entidadeMãe as ModulosAceitos);
const tipoEncerramentoStore = useTipoEncerramentoStore(route.meta.entidadeMãe as ModulosAceitos);

const { itemParaEdicao } = storeToRefs(termoEncerramentoStore);
const { lista: listaJustificativas } = storeToRefs(tipoEncerramentoStore);

const {
  handleSubmit, resetForm,
} = useForm({
  validationSchema: schema,
});

const iconeAtualizado = ref<boolean>(false);

async function handleIconeChange(file: unknown) {
  if (!file || typeof file !== 'object' || file.constructor.name !== 'File') {
    return file;
  }

  iconeAtualizado.value = true;
  const uploadToken = await termoEncerramentoStore.uploadIcone(file as File);
  return uploadToken;
}

const onSubmit = handleSubmit.withControlled(async (formValues) => {
  try {
    await termoEncerramentoStore.salvarItem(formValues, props.escopoId);
    alertStore.success('Termo de encerramento atualizado com sucesso!');

    router.push({ name: route.meta.rotaDeEscape as string });
  } catch (erro) {
    alertStore.error('Erro ao salvar termo de encerramento');
  }
});

watch(itemParaEdicao, (novoValor) => {
  if (novoValor) {
    resetForm({ values: novoValor });
  }
}, { immediate: true });

onMounted(async () => {
  tipoEncerramentoStore.buscarTudo();

  termoEncerramentoStore.buscarItem(props.escopoId);
});
</script>

<template>
  <CabecalhoDePagina />

  <form
    class="flex column g2"
    @submit="onSubmit"
  >
    <Field
      v-slot="{ handleChange, value }"
      name="icone"
    >
      <InputImageProfile
        :model-value="iconeAtualizado ? undefined : value"
        @update:model-value="async (file) => {
          const token = await handleIconeChange(file);
          handleChange(token);
        }"
      />
    </Field>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="nome_projeto"
          :schema="schema"
        />

        <Field
          name="nome_projeto"
          disabled
          class="inputtext light"
        />

        <ErrorMessage
          class="error-msg"
          name="nome_projeto"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="orgao_responsavel_nome"
          :schema="schema"
        />

        <Field
          name="orgao_responsavel_nome"
          disabled
          type="text"
          class="inputtext light"
        />

        <ErrorMessage
          class="error-msg"
          name="orgao_responsavel_nome"
        />
      </div>
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="portfolios_nomes"
          :schema="schema"
        />

        <Field
          name="portfolios_nomes"
          disabled
          class="inputtext light"
        />

        <ErrorMessage
          class="error-msg"
          name="portfolios_nomes"
        />
      </div>

      <div class="f1" />
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="objeto"
          :schema="schema"
        />

        <Field
          name="objeto"
          disabled
          as="textarea"
          class="inputtext light"
          rows="5"
        />

        <ErrorMessage
          class="error-msg"
          name="objeto"
        />
      </div>
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="previsao_inicio"
          :schema="schema"
        />

        <Field
          v-slot="{ field, handleChange, value }"
          name="previsao_inicio"
        >
          <SmaeDateInput
            class="inputtext light"
            :model-value="value"
            :name="field.name"
            converter-para="string"
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          class="error-msg"
          name="previsao_inicio"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="previsao_termino"
          :schema="schema"
        />

        <Field
          v-slot="{ field, handleChange, value }"
          name="previsao_termino"
        >
          <SmaeDateInput
            class="inputtext light"
            :model-value="value"
            :name="field.name"
            converter-para="string"
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          class="error-msg"
          name="previsao_termino"
        />
      </div>
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="data_inicio_real"
          :schema="schema"
        />

        <Field
          v-slot="{ field, handleChange, value }"
          name="data_inicio_real"
        >
          <SmaeDateInput
            class="inputtext light"
            :model-value="value"
            :name="field.name"
            converter-para="string"
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          class="error-msg"
          name="data_inicio_real"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="data_encerramento"
          :schema="schema"
        />

        <Field
          v-slot="{ field, handleChange, value }"
          name="data_encerramento"
        >
          <SmaeDateInput
            class="inputtext light"
            :model-value="value"
            :name="field.name"
            converter-para="string"
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          class="error-msg"
          name="data_encerramento"
        />
      </div>
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="previsao_custo"
          :schema="schema"
        />

        <Field
          v-slot="{ field, handleChange, value }"
          name="previsao_custo"
        >
          <SmaeNumberInput
            class="inputtext light"
            :model-value="value"
            :name="field.name"
            converter-para="number"
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          class="error-msg"
          name="previsao_custo"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="valor_executado_total"
          :schema="schema"
        />

        <Field
          v-slot="{ field, handleChange, value }"
          name="valor_executado_total"
        >
          <SmaeNumberInput
            class="inputtext light"
            :model-value="value"
            :name="field.name"
            converter-para="number"
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          class="error-msg"
          name="valor_executado_total"
        />
      </div>
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="status_final"
          :schema="schema"
        />

        <Field
          name="status_final"
          as="select"
          class="inputtext light"
        >
          <option value="">
            Selecionar
          </option>

          <option
            v-for="status in [
              'Concluído',
              'Cancelado',
              'Suspenso',
            ]"
            :key="`status--${status}`"
            :value="status"
          >
            {{ status }}
          </option>
        </Field>

        <ErrorMessage
          class="error-msg"
          name="status_final"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="etapa_nome"
          :schema="schema"
        />

        <Field
          name="etapa_nome"
          type="text"
          class="inputtext light"
        />
        <ErrorMessage
          class="error-msg"
          name="etapa_nome"
        />
      </div>
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="justificativa_id"
          :schema="schema"
        />

        <Field
          name="justificativa_id"
          as="select"
          class="inputtext light"
        >
          <option value="">
            Selecionar
          </option>

          <option
            v-for="item in listaJustificativas"
            :key="item.id"
            :value="item.id"
          >
            {{ item.descricao }}
          </option>
        </Field>

        <ErrorMessage
          class="error-msg"
          name="justificativa_id"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="responsavel_encerramento_nome"
          :schema="schema"
        />

        <Field
          name="responsavel_encerramento_nome"
          class="inputtext light"
        />

        <ErrorMessage
          class="error-msg"
          name="responsavel_encerramento_nome"
        />
      </div>
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="data_encerramento"
          :schema="schema"
        />

        <Field
          v-slot="{ field, handleChange, value }"
          name="data_encerramento"
        >
          <SmaeDateInput
            class="inputtext light"
            :model-value="value"
            :name="field.name"
            converter-para="string"
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          class="error-msg"
          name="data_encerramento"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="assinatura"
          :schema="schema"
        />

        <Field
          name="assinatura"
          type="text"
          class="inputtext light"
        />
        <ErrorMessage
          class="error-msg"
          name="assinatura"
        />
      </div>
    </div>

    <SmaeFieldsetSubmit />
  </form>
</template>
