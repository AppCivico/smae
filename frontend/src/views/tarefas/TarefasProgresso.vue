<script setup>
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { tarefa as schema } from '@/consts/formSchemas';
import addToDates from '@/helpers/addToDates';
import dateToField from '@/helpers/dateToField';
import subtractDates from '@/helpers/subtractDates';
import { useAlertStore } from '@/stores/alert.store';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, Form,
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
    const resposta = await tarefasStore.salvarItem(
      carga,
      props.tarefaId,
    );

    if (resposta) {
      alertStore.success('Dados salvos com sucesso!');
      tarefasStore.$reset();
      router.push({ name: 'tarefasListar' });
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
        {{ 'Registro de progresso' }}
      </div>

      <h1>{{ emFoco?.tarefa }}</h1>
    </div>

    <hr class="ml2 f1">

    <div
      v-if="!emFoco?.projeto?.permissoes?.apenas_leitura"
      class="ml2"
    >
      <router-link
        :to="{
          name: 'tarefasEditar',
          params: {
            projetoId: projetoId,
            tarefaId: tarefaId,
          }
        }"
        title="Editar tarefa"
        class="btn"
      >
        Editar tarefa
      </router-link>
    </div>

    <CheckClose />
  </div>

  <div class="boards mb4">
    <dl class="flex g2">
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Início previsto
        </dt>
        <dd class="t13">
          {{ emFoco?.inicio_planejado
            ? dateToField(emFoco.inicio_planejado)
            : '--/--/----' }}
        </dd>
      </div>
      <div class="mr2">
        <dt class="t12 uc w700 mb05 tamarelo">
          Término previsto
        </dt>
        <dd class="t13">
          {{ emFoco?.termino_planejado
            ? dateToField(emFoco.termino_planejado)
            : '--/--/----' }}
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
    <Field
      name="atualizacao_do_realizado"
      type="hidden"
      :value="true"
    />

    <hr class="mb1 f1">

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="inicio_real"
          :schema="schema"
        >
          {{ schema.fields.inicio_real.spec.label }}&nbsp;<span class="tvermelho">*</span>
        </LabelFromYup>
        <Field
          name="inicio_real"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.inicio_real }"
          maxlength="10"
          :disabled="emFoco.n_filhos_imediatos > 0"
          @update:model-value="values.inicio_real === ''
            ? values.inicio_real = null
            : null"
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
        <LabelFromYup
          name="duracao_real"
          :schema="schema"
        />
        <Field
          name="duracao_real"
          type="number"
          class="inputtext light mb1"
          :class="{ 'error': errors.duracao_real }"
          :disabled="emFoco.n_filhos_imediatos > 0"
          @update:model-value="values.duracao_real = Number(values.duracao_real)
            || null"
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
        <LabelFromYup
          name="termino_real"
          :schema="schema"
        />
        <Field
          name="termino_real"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.termino_real }"
          maxlength="10"
          :disabled="emFoco.n_filhos_imediatos > 0"
          @update:model-value="values.termino_real === ''
            ? values.termino_real = null
            : null"
          @change="values.termino_real && values.inicio_real
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
      <button
        class="like-a__text addlink"
        arial-label="limpar datas"
        title="limpar datas"
        type="button"
        @click="() => {
          setFieldValue('inicio_real', null);
          setFieldValue('duracao_real', null);
          setFieldValue('termino_real', null);
        }
        "
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_remove" /></svg>
      </button>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="custo_real"
          :schema="schema"
        />
        <MaskedFloatInput
          name="custo_real"
          :value="values.custo_real"
          :disabled="emFoco.n_filhos_imediatos > 0"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="custo_real"
        />
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="percentual_concluido"
          :schema="schema"
        >
          {{ schema.fields.percentual_concluido.spec.label }}&nbsp;<span class="tvermelho">*</span>
        </LabelFromYup>
        <Field
          name="percentual_concluido"
          type="number"
          min="0"
          max="100"
          class="inputtext light mb1"
          :disabled="emFoco.n_filhos_imediatos > 0"
          :class="{ 'error': errors.percentual_concluido }"
          @update:model-value="values.percentual_concluido = Number(values.percentual_concluido) ?? null"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="percentual_concluido"
        />
      </div>
    </div>

    <FormErrorsList :errors="errors" />

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
