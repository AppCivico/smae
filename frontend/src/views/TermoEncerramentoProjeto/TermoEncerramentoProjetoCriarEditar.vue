<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import SmaeDateInput from '@/components/camposDeFormulario/SmaeDateInput.vue';
import SmaeNumberInput from '@/components/camposDeFormulario/SmaeNumberInput.vue';
import InputImageProfile from '@/components/InputImageProfile/InputImageProfile.vue';
import { termoEncerramento as schema } from '@/consts/formSchemas';
import { ModuloSistema } from '@/consts/modulosDoSistema';
import projectStatuses from '@/consts/projectStatuses';
import { useAlertStore } from '@/stores/alert.store';
import { usePortfolioStore } from '@/stores/portfolios.store';
import { useProjetosStore } from '@/stores/projetos.store';
import { useTermoEncerramentoStore } from '@/stores/termoEncerramento.store';
import { useTipoEncerramentoStore } from '@/stores/tipoEncerramento.store';

type Props = {
  escopoId: number;
};
const props = defineProps<Props>();

const route = useRoute();
const router = useRouter();

const alertStore = useAlertStore();

// @ts-expect-error - VITE_API_URL está definido no ambiente
const baseUrl = `${import.meta.env.VITE_API_URL}`;

type ModulosAceitos = ModuloSistema.MDO | ModuloSistema.Projetos;

const termoEncerramentoStore = useTermoEncerramentoStore(route.meta.entidadeMãe as ModulosAceitos);
const tipoEncerramentoStore = useTipoEncerramentoStore(route.meta.entidadeMãe as ModulosAceitos);

const projetosStore = useProjetosStore();
const portfoliosStore = usePortfolioStore();

const { itemParaEdicao } = storeToRefs(termoEncerramentoStore);
const { lista: listaJustificativas } = storeToRefs(tipoEncerramentoStore);

const {
  handleSubmit, resetForm, setFieldValue, values,
} = useForm({
  validationSchema: schema,
});

const iconeAtualizado = ref<boolean>(false);

const classeAlinhamentoIcone = computed(() => {
  const alinhamentoIcone = {
    Esquerda: 'justifyleft',
    Centro: 'justifycenter',
    Direita: 'justifyright',
  };

  return alinhamentoIcone[values.posicao_logotipo as keyof typeof alinhamentoIcone]
    || alinhamentoIcone.Esquerda;
});

const habilitarInfoAdicional = computed(() => {
  if (!values.justificativa_id) {
    return false;
  }

  const justificativaSelecionada = listaJustificativas.value.find(
    (j) => j.id === values.justificativa_id,
  );
  return justificativaSelecionada?.habilitar_info_adicional || false;
});

async function handleIconeChange(file: unknown) {
  if (!file || typeof file !== 'object' || file.constructor.name !== 'File') {
    return file;
  }

  iconeAtualizado.value = true;
  const uploadToken = await termoEncerramentoStore.uploadIcone(file as File);
  return uploadToken;
}

async function verificarIcone(termoEncerramento: typeof itemParaEdicao.value) {
  if (!termoEncerramento || termoEncerramento.icone) return;

  const projetoId = termoEncerramento.projeto_id;

  if (projetosStore.emFoco?.id !== projetoId) {
    await projetosStore.buscarItem(projetoId);
  }

  const projeto = projetosStore.emFoco;
  if (!projeto) return;

  if (portfoliosStore.emFoco?.id !== projeto.portfolio_id) {
    await portfoliosStore.buscarItem(projeto.portfolio_id);
  }

  const portfolio = portfoliosStore.emFoco;

  if (portfolio?.icone_impressao) {
    setFieldValue('icone', `${baseUrl}/download/${portfolio.icone_impressao.download_token}`);
  }
}

const onSubmit = handleSubmit.withControlled(async (formValues) => {
  try {
    if (!iconeAtualizado.value) {
      delete formValues.icone;
    }

    await termoEncerramentoStore.salvarItem(formValues, props.escopoId);
    alertStore.success('Termo de encerramento atualizado com sucesso!');

    router.push({ name: route.meta.rotaDeEscape as string });
  } catch (erro) {
    alertStore.error('Erro ao salvar termo de encerramento');
  }
});

watch(itemParaEdicao, (novoValor) => {
  if (!novoValor) {
    return;
  }

  resetForm({ values: novoValor });
  verificarIcone(novoValor);
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
    <div
      class="flex"
      :class="classeAlinhamentoIcone"
    >
      <Field
        v-slot="{ handleChange, value }"
        name="icone"
      >
        <InputImageProfile
          :model-value="iconeAtualizado ? undefined : value"
          label-botao="carregar ícone"
          @update:model-value="async (file) => {
            const token = await handleIconeChange(file);
            handleChange(token);
          }"
        />
      </Field>
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="posicao_logotipo"
          :schema="schema"
        />

        <Field
          name="posicao_logotipo"
          as="select"
          class="inputtext light"
        >
          <option value="">
            Selecionar
          </option>

          <option
            v-for="posicao in [
              'Esquerda',
              'Centro',
              'Direita',
            ]"
            :key="`posicao--${posicao}`"
            :value="posicao"
          >
            {{ posicao }}
          </option>
        </Field>

        <ErrorMessage
          class="error-msg"
          name="posicao_logotipo"
        />
      </div>

      <div class="f1" />
    </div>

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
          name="data_termino_real"
          :schema="schema"
        />

        <Field
          v-slot="{ field, handleChange, value }"
          name="data_termino_real"
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
          name="data_termino_real"
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
          disabled
        >
          <option value="">
            Selecionar
          </option>

          <option
            v-for="(status) in projectStatuses"
            :key="`status--${status.valor}`"
            :value="status.nome"
          >
            {{ status.nome }}
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
          disabled
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

      <div class="f1" />
    </div>

    <div
      v-if="habilitarInfoAdicional"
      class="flex g2 flexwrap"
    >
      <div class="f1">
        <SmaeLabel
          name="justificativa_complemento"
          :schema="schema"
        />

        <Field
          v-slot="{ field, handleChange, value }"
          name="justificativa_complemento"
        >
          <SmaeText
            as="textarea"
            rows="5"
            class="inputtext light mb1"
            :schema="schema"
            :name="field.name"
            :model-value="value"
            anular-vazio
            @update:model-value="handleChange"
          />
        </Field>

        <ErrorMessage
          class="error-msg"
          name="justificativa_complemento"
        />
      </div>
    </div>

    <div class="flex g2 flexwrap">
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

      <div class="f1" />
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
