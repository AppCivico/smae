<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { storeToRefs } from 'pinia';
import { differenceInDays } from 'date-fns';
import { useRoute } from 'vue-router';
import {
  EdicaoTransferenciaFase,
  EdicaoTransferenciaFaseTarefa,
} from '@/consts/formSchemas';

import { useUsersStore } from '@/stores/users.store';
import { useTarefasStore } from '@/stores/tarefas.store';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store';
import SmallModal from '@/components/SmallModal.vue';
import type { DadosTarefa, FaseTipo } from './VaralDeFaseItem.vue';

const route = useRoute();

const userStore = useUsersStore();
const tarefaStore = useTarefasStore();
const workflowAndamentoStore = useWorkflowAndamentoStore();

const { pessoasSimplificadas } = storeToRefs(userStore);

const carregando = ref<boolean>(false);
const exibirModalFase = ref<boolean>(false);
const tipoFase = ref<FaseTipo | undefined>(undefined);
const situacoes = ref<any[]>([]);

const schema = computed(() => {
  if (!tipoFase.value) {
    return undefined;
  }

  if (tipoFase.value === 'fase') {
    return EdicaoTransferenciaFase;
  }

  return EdicaoTransferenciaFaseTarefa;
});

const {
  handleSubmit, resetForm, values, controlledValues, errors, validate,
} = useForm({
  validationSchema: () => schema.value,
});

type EdicaoDados = {
  id: number,
  secundario: boolean,
  orgao_responsavel?: {
    id: string,
    sigla: string,
    descricao: string,
  }
  pessoa_responsavel?: {
    id: number,
    nome_exibicao: string,
  }
  situacao?: {
    id: number,
    situacao: string,
    tipo_situacao: string
  },
  situacoes?: any[]
  tipo: FaseTipo,
  dadosTarefa?: DadosTarefa,
};
function abrirModalFase(dadosEdicao: EdicaoDados) {
  exibirModalFase.value = true;

  tipoFase.value = dadosEdicao.tipo;
  situacoes.value = dadosEdicao.situacoes || [];

  resetForm({
    values: {
      id: dadosEdicao.id,
      orgao_id: dadosEdicao.orgao_responsavel?.id,
      orgao_responsavel_nome: dadosEdicao.orgao_responsavel?.sigla,
      situacao_id: dadosEdicao.situacao?.id,
      pessoa_responsavel_id: dadosEdicao.pessoa_responsavel?.id,
      fase_mae_id: dadosEdicao.dadosTarefa?.faseMaeId,
      inicio_real: dadosEdicao.dadosTarefa?.inicioReal,
    },
  });
}

export type EdicaoTarefaComCronogramaModalExposed = {
  abrirModalFase: typeof abrirModalFase
};

defineExpose<EdicaoTarefaComCronogramaModalExposed>({
  abrirModalFase,
});

const pessoasDisponíveis = computed(() => {
  if (!Array.isArray(pessoasSimplificadas.value)) {
    return [];
  }

  return !values.orgao_id
    ? pessoasSimplificadas.value
    : pessoasSimplificadas.value.filter((x) => x.orgao_id === Number(values.orgao_id));
});

async function salvarEFinaliarFase() {
  const { valid } = await validate();
  if (!valid) {
    return;
  }

  try {
    carregando.value = true;

    await workflowAndamentoStore.editarFase({
      transferencia_id: route.params.transferenciaId,
      fase_id: values.id,
      situacao_id: controlledValues.situacao_id || undefined,
      orgao_responsavel_id: controlledValues.orgao_id,
      pessoa_responsavel_id: controlledValues.pessoa_responsavel_id || undefined,
    });

    await workflowAndamentoStore.encerrarFase(
      values.id,
      route.params.transferenciaId,
    );
  } finally {
    exibirModalFase.value = false;
    carregando.value = false;
  }

  workflowAndamentoStore.buscar();
}

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  carregando.value = true;

  try {
    if (tipoFase.value === 'fase') {
      await workflowAndamentoStore.editarFase({
        transferencia_id: route.params.transferenciaId,
        fase_id: values.id,
        situacao_id: valoresControlados.situacao_id || undefined,
        orgao_responsavel_id: valoresControlados.orgao_id,
        pessoa_responsavel_id: valoresControlados.pessoa_responsavel_id || undefined,
      });
    } else if (tipoFase.value === 'tarefa-workflow') {
      await workflowAndamentoStore.editarFase({
        transferencia_id: route.params.transferenciaId,
        fase_id: valoresControlados.fase_mae_id,
        orgao_responsavel_id: valoresControlados.orgao_id,
        tarefas: [{
          id: values.id,
          orgao_responsavel_id: valoresControlados.orgao_id,
          concluida: valoresControlados.concluido,
        }],
      });
    } else if (tipoFase.value === 'tarefa-cronograma') {
      let dados = {};

      if (valoresControlados.concluido) {
        const terminoReal = new Date();
        const inicioReal = values.inicio_real ? new Date(values.inicio_real) : terminoReal;

        const diasDecorridos = differenceInDays(terminoReal, inicioReal);

        dados = {
          inicio_real: inicioReal.toISOString(),
          termino_real: terminoReal.toISOString(),
          duracao_real: diasDecorridos > 1 ? diasDecorridos : 1,
        };
      }

      await tarefaStore.salvarItem({
        ...dados,
        recursos: valoresControlados.pessoa_responsavel,
      }, values.id, {
        transferenciaId: route.params.transferenciaId,
      });
    }

    workflowAndamentoStore.buscar();
  } finally {
    exibirModalFase.value = false;
    carregando.value = false;
  }
});

onMounted(() => {
  userStore.buscarPessoasSimplificadas();
});
</script>

<template>
  <SmallModal
    :active="exibirModalFase"
    has-close-button
    @close="exibirModalFase = false"
  >
    <h2>
      Disponibilização do Recurso
    </h2>

    <form @submit="onSubmit">
      <div class="flex g2 mb1">
        <div class="f1 mb1">
          <SmaeLabel
            :schema="schema"
            name="orgao_id"
          />

          <Field
            name="orgao_responsavel_nome"
            class="inputtext"
            :model-value="values.orgao_responsavel_nome"
            disabled
          />

          <Field
            name="orgao_id"
            class="inputtext"
            hidden
          />
        </div>
      </div>

      <div
        v-if="tipoFase === 'fase'"
        class="flex g2 mb1"
      >
        <div
          class="f1 mb1"
        >
          <LabelFromYup
            name="situacao_id"
            :schema="schema"
          />
          <Field
            name="situacao_id"
            as="select"
            rows="5"
            class="inputtext light mb1"
          >
            <option value="" />
            <option
              v-for="item in situacoes"
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
              v-for="item in pessoasDisponíveis"
              :key="item"
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

      <div v-if="tipoFase?.includes('tarefa')">
        <div>
          <Field
            name="fase_mae_id"
            hidden
          />

          <div class="mb1">
            <label class="flex g1">
              <Field
                name="concluido"
                class="inputtext"
                type="checkbox"
                :value="true"
                :unchecked-value="false"
              />

              <SmaeLabel
                class="mb0"
                as="div"
                :schema="schema"
                name="concluido"
              />

            </label>

            <ErrorMessage
              name="concluido"
              class="error-msg"
            />
          </div>

          <div
            v-if="tipoFase === 'tarefa-cronograma'"
            class="mb1"
          >
            <SmaeLabel
              :schema="schema"
              name="pessoa_responsavel"
            />

            <Field
              name="pessoa_responsavel"
              class="inputtext"
            />

            <ErrorMessage
              name="pessoa_responsavel"
              class="error-msg"
            />
          </div>
        </div>
      </div>

      <div class="flex g1 justifycenter">
        <button
          v-if="tipoFase === 'fase'"
          class="btn outline bgnone"
          type="button"
          :disabled="carregando"
          :aria-disabled="carregando"
          @click="salvarEFinaliarFase"
        >
          Salvar e Finaliza
        </button>

        <button
          class="btn"
          type="submit"
          :disabled="carregando"
          :aria-disabled="carregando"
        >
          Salvar
        </button>
      </div>
    </form>
  </SmallModal>
</template>
