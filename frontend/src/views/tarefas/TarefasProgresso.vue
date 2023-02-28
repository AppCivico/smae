<script setup>
import CheckClose from '@/components/CheckClose.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { tarefa as schema } from '@/consts/formSchemas';
import addToDates from '@/helpers/addToDates';
import dateToField from '@/helpers/dateToField';
import subtractDates from '@/helpers/subtractDates';
import { useAlertStore } from '@/stores/alert.store';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, Form
} from 'vee-validate';
import { useRouter } from 'vue-router';

const alertStore = useAlertStore();
const tarefasStore = useTarefasStore();
const router = useRouter();

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdição,
} = storeToRefs(tarefasStore);

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
  tarefaId: {
    type: Number,
    default: 0,
  },
});

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.tarefaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.tarefaId
      ? await tarefasStore.salvarItem(carga, props.tarefaId)
      : await tarefasStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      await router.push({ name: 'tarefasListar' });
      tarefasStore.$reset();
    }
  } catch (error) {
    alertStore.error(error);
  }
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo">
        {{ $route?.meta?.título || 'Registro de progresso' }}
      </div>

      <h1>{{ emFoco?.tarefa }}</h1>
    </div>

    <hr class="ml2 f1">

    <CheckClose :rota-de-escape="`/projetos/${props.projetoId}/tarefas/`" />
  </div>

  <div class="boards mb4">
    <dl class="flex g2">
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Início previsto
        </dt>
        <dd class="t13">
          {{
            emFoco?.inicio_planejado
            ? dateToField(emFoco.inicio_planejado)
            : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Término previsto
        </dt>
        <dd class="t13">
          {{
            emFoco?.termino_planejado
            ? dateToField(emFoco.termino_planejado)
            : '--/--/----'
          }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Duração prevista
        </dt>
        <dd class="t13">
          {{ emFoco?.duracao_planejado }}
          <template v-if="emFoco?.duracao_planejado">
            dias corridos
          </template>
        </dd>
      </div>
    </dl>
  </div>

  <Form
    v-if="!tarefaId || emFoco"
    v-slot="{ errors, isSubmitting, setFieldValue, values }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdição"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <hr class="mb1 f1">

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">
          Data de início real&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="inicio_real"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.inicio_real }"
          maxlength="10"
          :disabled="emFoco.n_filhos_imediatos > 0"
          @change="values.duracao_real
            ? setFieldValue(
              'termino_real',
              addToDates(values.inicio_real, values.duracao_real - 1)
            )
            : null"
        />
        <ErrorMessage
          name="inicio_real"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <label class="label tc300">
          Duração real
        </label>
        <Field
          name="duracao_real"
          type="number"
          class="inputtext light mb1"
          :class="{ 'error': errors.duracao_real }"
          :disabled="emFoco.n_filhos_imediatos > 0"
          @update:model-value="values.duracao_real = Number(values.duracao_real)"
          @change="values.inicio_real
            ? setFieldValue(
              'termino_real',
              addToDates(values.inicio_real, values.duracao_real - 1)
            )
            : null"
        />
        <ErrorMessage
          name="duracao_real"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <label class="label tc300">
          Data de término real
        </label>
        <Field
          name="termino_real"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.termino_real }"
          maxlength="10"
          :disabled="emFoco.n_filhos_imediatos > 0"
          @change="values.termino_real
            ? setFieldValue(
              'duracao_real',
              subtractDates(values.termino_real, values.inicio_real) + 1
            )
            : null"
        />
        <ErrorMessage
          name="termino_real"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">
          Custo real&nbsp;<span class="tvermelho">*</span>
        </label>
        <MaskedFloatInput
          name="custo_estimado"
          :value="values.custo_estimado"
          :disabled="emFoco.n_filhos_imediatos > 0"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="custo_estimado"
        />
      </div>

      <div class="f1 mb1">
        <label class="label tc300">
          Porcentual concluído&nbsp;<span class="tvermelho">*</span>
        </label>

        <Field
          name="percentual_concluido"
          type="number"
          min="0"
          max="100"
          class="inputtext light mb1"
          :disabled="emFoco.n_filhos_imediatos > 0"
          :class="{ 'error': errors.percentual_concluido }"
          @update:model-value="values.percentual_concluido = Number(values.percentual_concluido)"
        />

        <ErrorMessage
          class="error-msg mb1"
          name="percentual_concluido"
        />
      </div>
    </div>

    <div
      v-if="emFoco.n_filhos_imediatos === 0"
      class="flex spacebetween center mb2"
    >
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
  </Form>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
