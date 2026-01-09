<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import SmaeDateInput from '@/components/camposDeFormulario/SmaeDateInput.vue';
import SmaeNumberInput from '@/components/camposDeFormulario/SmaeNumberInput.vue';
import { termoEncerramento as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { usePortfolioStore } from '@/stores/portfolios.store';
import { useProjetosStore } from '@/stores/projetos.store';
import { useTermoEncerramentoStore } from '@/stores/termoEncerramento.store';
import { useTipoEncerramentoStore } from '@/stores/tipoEncerramento.store';

type Props = {
  termoEncerramentoId?: number;
};

const props = defineProps<Props>();

const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();
const { sistemaEscolhido } = useAuthStore();

const termoEncerramentoStore = useTermoEncerramentoStore(sistemaEscolhido);
const { emFoco } = storeToRefs(termoEncerramentoStore);

const projetosStore = useProjetosStore();
const { lista: listaProjetos } = storeToRefs(projetosStore);

const portfoliosStore = usePortfolioStore();
const { lista: listaPortfolios } = storeToRefs(portfoliosStore);

const tipoEncerramentoStore = useTipoEncerramentoStore(sistemaEscolhido);
const { lista: listaJustificativas } = storeToRefs(tipoEncerramentoStore);

const {
  handleSubmit, resetForm, values, setFieldValue,
} = useForm({
  validationSchema: schema,
});

const projetoSelecionado = computed(() => {
  if (!values.projeto_id) return null;
  return listaProjetos.value.find((p) => p.id === values.projeto_id);
});

const onSubmit = handleSubmit.withControlled(async (formValues) => {
  try {
    const params = {
      ...formValues,
      projeto_id: Number(formValues.projeto_id) || null,
      portfolio_id: formValues.portfolio_id ? Number(formValues.portfolio_id) : null,
      justificativa_encerramento_id: formValues.justificativa_encerramento_id
        ? Number(formValues.justificativa_encerramento_id)
        : null,
      responsavel_encerramento_id: formValues.responsavel_encerramento_id
        ? Number(formValues.responsavel_encerramento_id)
        : null,
    };

    if (props.termoEncerramentoId) {
      await termoEncerramentoStore.salvarItem(params, props.termoEncerramentoId);
      alertStore.success('Termo de encerramento atualizado com sucesso!');
    } else {
      await termoEncerramentoStore.salvarItem(params);
      alertStore.success('Termo de encerramento criado com sucesso!');
    }

    if (route.meta.rotaDeEscape) {
      router.push({ name: route.meta.rotaDeEscape as string });
    }
  } catch (erro) {
    alertStore.error('Erro ao salvar termo de encerramento');
  }
});

watch(emFoco, (novoValor) => {
  if (novoValor) {
    resetForm({ values: novoValor });
  }
}, { immediate: true });

watch(() => values.projeto_id, async (novoProjeto) => {
  if (novoProjeto && projetoSelecionado.value) {
    // Preencher automaticamente campos do projeto
    const projeto = projetoSelecionado.value as any;
    if (projeto.orgao_responsavel) {
      setFieldValue('orgao_responsavel', projeto.orgao_responsavel.descricao || '');
    }
    if (projeto.portfolio?.id) {
      setFieldValue('portfolio_id', projeto.portfolio.id);
    }
  }
});

onMounted(async () => {
  // Carregar listas necessárias
  await Promise.all([
    projetosStore.buscarTudo(),
    portfoliosStore.buscarTudo(),
    tipoEncerramentoStore.buscarTudo(),
  ]);

  // Carregar item para edição se houver ID
  if (props.termoEncerramentoId) {
    await termoEncerramentoStore.buscarItem(props.termoEncerramentoId);
  }
});
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ termoEncerramentoId ? 'Editar' : 'Novo' }} Termo de Encerramento</h1>
  </div>

  <form
    class="flex column g2"
    @submit="onSubmit"
  >
    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="projeto_id"
          :schema="schema"
        />
        <Field
          name="projeto_id"
          as="select"
          class="inputtext light"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in listaProjetos"
            :key="item.id"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg"
          name="projeto_id"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="orgao_responsavel"
          :schema="schema"
        />
        <Field
          name="orgao_responsavel"
          type="text"
          class="inputtext light"
        />
        <ErrorMessage
          class="error-msg"
          name="orgao_responsavel"
        />
      </div>
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="portfolio_id"
          :schema="schema"
        />
        <Field
          name="portfolio_id"
          as="select"
          class="inputtext light"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in listaPortfolios"
            :key="item.id"
            :value="item.id"
          >
            {{ item.titulo }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg"
          name="portfolio_id"
        />
      </div>
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="objeto"
          :schema="schema"
        />
        <Field
          name="objeto"
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
          name="data_inicio_planejado"
          :schema="schema"
        />
        <Field
          v-slot="{ field, handleChange, value }"
          name="data_inicio_planejado"
        >
          <SmaeDateInput
            :model-value="value"
            :name="field.name"
            converter-para="string"
            @update:model-value="handleChange"
          />
        </Field>
        <ErrorMessage
          class="error-msg"
          name="data_inicio_planejado"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="data_termino_planejado"
          :schema="schema"
        />
        <Field
          v-slot="{ field, handleChange, value }"
          name="data_termino_planejado"
        >
          <SmaeDateInput
            :model-value="value"
            :name="field.name"
            converter-para="string"
            @update:model-value="handleChange"
          />
        </Field>
        <ErrorMessage
          class="error-msg"
          name="data_termino_planejado"
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
          name="custo_planejado"
          :schema="schema"
        />
        <Field
          v-slot="{ field, handleChange, value }"
          name="custo_planejado"
        >
          <SmaeNumberInput
            :model-value="value"
            :name="field.name"
            converter-para="number"
            @update:model-value="handleChange"
          />
        </Field>
        <ErrorMessage
          class="error-msg"
          name="custo_planejado"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="valor_executado_real"
          :schema="schema"
        />
        <Field
          v-slot="{ field, handleChange, value }"
          name="valor_executado_real"
        >
          <SmaeNumberInput
            :model-value="value"
            :name="field.name"
            converter-para="number"
            @update:model-value="handleChange"
          />
        </Field>
        <ErrorMessage
          class="error-msg"
          name="valor_executado_real"
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
          <option value="Concluído">
            Concluído
          </option>
          <option value="Cancelado">
            Cancelado
          </option>
          <option value="Suspenso">
            Suspenso
          </option>
        </Field>
        <ErrorMessage
          class="error-msg"
          name="status_final"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="etapa_projeto"
          :schema="schema"
        />
        <Field
          name="etapa_projeto"
          type="text"
          class="inputtext light"
        />
        <ErrorMessage
          class="error-msg"
          name="etapa_projeto"
        />
      </div>
    </div>

    <div class="flex g2 flexwrap">
      <div class="f1">
        <SmaeLabel
          name="justificativa_encerramento_id"
          :schema="schema"
        />
        <Field
          name="justificativa_encerramento_id"
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
          name="justificativa_encerramento_id"
        />
      </div>

      <div class="f1">
        <SmaeLabel
          name="responsavel_encerramento_id"
          :schema="schema"
        />
        <Field
          name="responsavel_encerramento_id"
          as="select"
          class="inputtext light"
        >
          <option value="">
            Selecionar
          </option>
          <!-- TODO: Integrar com lista de responsáveis -->
        </Field>
        <ErrorMessage
          class="error-msg"
          name="responsavel_encerramento_id"
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
