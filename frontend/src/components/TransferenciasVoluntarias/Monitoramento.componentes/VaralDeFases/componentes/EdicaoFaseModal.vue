<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import SmaeDialog from '@/components/SmaeDialog.vue';
import schema from '@/consts/formSchemas/transferenciaEdicaoDeFase';
import { useUsersStore } from '@/stores/users.store';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store';

import {
  DIALOGO_EDICAO_FASE,
  montarPropsDaFase,
  obterFases,
} from '../varalDeFases.helpers';

const route = useRoute();

const userStore = useUsersStore();
const workflowAndamentoStore = useWorkflowAndamentoStore();

const { pessoasSimplificadas } = storeToRefs(userStore);
const { chamadasPendentes, etapaEmFoco } = storeToRefs(workflowAndamentoStore);

// Não é limpo no `watch(fase)`, porque a busca após uma finalização
// que falhou recria a fase e apagaria a mensagem
const erroAoSalvar = ref<string>('');

const fase = computed(() => {
  if (route.query.dialogo !== DIALOGO_EDICAO_FASE) {
    return null;
  }

  const faseId = Number(route.query.fase_id);
  const encontrada = obterFases(etapaEmFoco.value).find((x) => x.fase.id === faseId);

  return encontrada ? montarPropsDaFase(encontrada) : null;
});

const ehOutroOrgao = computed(() => fase.value?.responsavel?.id === 'OutroOrgao');

const { handleSubmit, resetForm, values } = useForm({
  validationSchema: schema,
});

const pessoasDisponiveis = computed(() => {
  if (!Array.isArray(pessoasSimplificadas.value)) {
    return [];
  }

  return !values.orgao_responsavel_id
    ? pessoasSimplificadas.value
    : pessoasSimplificadas.value
      .filter((x) => x.orgao_id === Number(values.orgao_responsavel_id));
});

// Também cobre a recarga da página com o diálogo aberto,
// quando os dados da etapa chegam depois da montagem
watch(fase, (dados) => {
  if (!dados) {
    return;
  }

  resetForm({
    values: {
      fase_id: dados.id,
      orgao_responsavel_id: ehOutroOrgao.value
        ? null
        : dados.responsavel?.id,
      pessoa_responsavel_id: dados.pessoaResponsavel?.id,
      situacao_id: dados.situacao?.id,
    },
  });
}, { immediate: true });

function abrirDialogo() {
  erroAoSalvar.value = '';
  userStore.buscarPessoasSimplificadas();
}

const salvar = (fecharDialogo: () => void, finalizar = false) => handleSubmit
  .withControlled(async (valores) => {
    erroAoSalvar.value = '';

    try {
      await workflowAndamentoStore.editarFase(valores);
    } catch {
      erroAoSalvar.value = 'Não foi possível salvar a fase. Tente novamente.';
      return;
    }

    if (finalizar) {
      try {
        await workflowAndamentoStore.encerrarFase(valores.fase_id);
      } catch {
        // A edição já foi gravada, então atualizamos o varal e mantemos o
        // diálogo aberto para que só a finalização seja tentada de novo
        erroAoSalvar.value = 'As alterações foram salvas, mas não foi possível finalizar a fase.';
        workflowAndamentoStore.buscar();
        return;
      }
    }

    fecharDialogo();
    workflowAndamentoStore.buscar();
  });
</script>

<template>
  <SmaeDialog
    :id="DIALOGO_EDICAO_FASE"
    :titulo="fase?.titulo"
    :parametros-associados="['fase_id']"
    @dialogo-aberto="abrirDialogo"
  >
    <template #default="{ fecharDialogo }">
      <p v-if="!fase">
        Fase não encontrada.
      </p>

      <form
        v-else
        :aria-busy="chamadasPendentes.fase"
        @submit.prevent="salvar(fecharDialogo)()"
      >
        <Field
          name="fase_id"
          hidden
        />

        <Field
          name="orgao_responsavel_id"
          hidden
        />

        <div class="flex g2 mb1">
          <div class="f1 mb1">
            <SmaeLabel
              id="edicao-fase-orgao-rotulo"
              :schema="schema"
              name="orgao_responsavel_id"
            />

            <input
              class="inputtext"
              aria-labelledby="edicao-fase-orgao-rotulo"
              :value="fase.responsavel?.sigla"
              disabled
            >
          </div>
        </div>

        <div class="flex g2 mb1">
          <div class="f1 mb1">
            <LabelFromYup
              name="situacao_id"
              :schema="schema"
            />

            <Field
              name="situacao_id"
              as="select"
              class="inputtext light mb1"
            >
              <option value="" />
              <option
                v-for="item in fase.situacoes"
                :key="item.id"
                :value="item.id"
              >
                {{ item.situacao }}
              </option>
            </Field>

            <ErrorMessage
              class="error-msg mb2"
              name="situacao_id"
            />
          </div>

          <div
            v-if="!ehOutroOrgao"
            class="f1 mb1"
          >
            <LabelFromYup
              name="pessoa_responsavel_id"
              :schema="schema"
            />

            <Field
              name="pessoa_responsavel_id"
              as="select"
              class="inputtext light mb1"
            >
              <option value="" />
              <option
                v-for="item in pessoasDisponiveis"
                :key="item.id"
                :value="item.id"
              >
                {{ item.nome_exibicao }}
              </option>
            </Field>

            <ErrorMessage
              class="error-msg mb2"
              name="pessoa_responsavel_id"
            />
          </div>
        </div>

        <ErrorComponent
          v-if="erroAoSalvar"
          class="mb1"
          role="alert"
        >
          {{ erroAoSalvar }}
        </ErrorComponent>

        <div class="flex g1 justifycenter">
          <button
            class="btn outline bgnone"
            type="button"
            :disabled="chamadasPendentes.fase"
            :aria-disabled="chamadasPendentes.fase"
            @click="salvar(fecharDialogo, true)()"
          >
            Salvar e Finalizar
          </button>

          <button
            class="btn"
            type="submit"
            :disabled="chamadasPendentes.fase"
            :aria-disabled="chamadasPendentes.fase"
          >
            Salvar
          </button>
        </div>
      </form>
    </template>
  </SmaeDialog>
</template>
