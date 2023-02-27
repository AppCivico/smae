<script setup>
import CheckClose from '@/components/CheckClose.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import { tarefa as schema } from '@/consts/formSchemas';
import addToDates from '@/helpers/addToDates';
import subtractDates from '@/helpers/subtractDates';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, Form
} from 'vee-validate';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const alertStore = useAlertStore();
const ÓrgãosStore = useOrgansStore();
const tarefasStore = useTarefasStore();
const router = useRouter();

const { organs: órgãos } = storeToRefs(ÓrgãosStore);

const {
  árvoreDeTarefas,
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdição,
  lista,
  tarefasAgrupadasPorMãe,
  tarefasAgrupadasPorNível,
  tarefasComHierarquia,
  tarefasPorId,
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

const máximoDeNíveisPermitido = computed(() => {
  const níveis = Object.keys(tarefasAgrupadasPorNível.value);

  return níveis.length ? Number(níveis[níveis.length - 1]) + 1 : 1;
});

// eslint-disable-next-line max-len
const filtrarIrmãs = (listagem = [], id = props.tarefaId) => listagem.filter((x) => x.id !== id);

async function onSubmit(_, { controlledValues: valores }) {
  const carga = valores;

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

async function iniciar() {
  tarefasStore.buscarTudo();

  if (props.tarefaId) {
    if (emFoco.value?.dependencias?.length) {
      // buscar dependencias
    }
  }

  ÓrgãosStore.getAll().finally(() => {
    chamadasPendentes.value.emFoco = false;
  });
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="tarefaId"
        class="t12 uc w700 tamarelo"
      >
        {{ $route?.meta?.título || 'Editar tarefa' }}
      </div>
      {{ emFoco?.tarefa || (tarefaId ? 'Tarefa' : 'Nova tarefa') }}
    </h1>
    <hr class="ml2 f1">

    <CheckClose :rota-de-escape="`/projetos/${props.projetoId}/tarefas/`" />
  </div>

  <Form
    v-if="!tarefaId || emFoco"
    v-slot="{ errors, isSubmitting, setFieldValue, values }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdição"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <label class="label tc300">
          Nome da tarefa&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="tarefa"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="tarefa"
        />
      </div>
    </div>
    <hr class="mb1 f1">

    <div class="flex g2 mb1 flexwrap">
      <div class="f1 mb1">
        <label class="label tc300">
          Tarefa-mãe
        </label>

        <Field
          name="tarefa_pai_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.tarefa_pai_id,
            loading: chamadasPendentes.lista,
          }"
          :disabled="chamadasPendentes.lista"
          @change="setFieldValue('nivel', (tarefasPorId[values.tarefa_pai_id]?.nivel || 0) + 1)"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in tarefasComHierarquia"
            :key="item.id"
            :value="item.id"
          >
            {{ item.hierarquia }} - {{ item.tarefa }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb1"
          name="tarefa_pai_id"
        />
      </div>

      <Field
        name="nivel"
        type="hidden"
        @update:model-value="values.nivel = Number(values.nivel)"
      />

      <div class="f1 mb1">
        <label class="label tc300">
          Ordem&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="numero"
          type="number"
          class="inputtext light mb1"
          min="1"
          :max="(tarefasAgrupadasPorMãe[values.tarefa_pai_id]?.length || 0) + 1"
          step="1"
          @update:model-value="values.numero = Number(values.numero)"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="numero"
        />
      </div>

      <div class="f1 mb1">
        <label class="label tc300">Órgão responsável&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="orgao_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.orgao_id,
            loading: órgãos.loading,
          }"
          :disabled="!Array.isArray(órgãos) || !órgãos?.length"
        >
          <option :value="0">
            Selecionar
          </option>
          <template v-if="Array.isArray(órgãos)">
            <option
              v-for="item in órgãos"
              :key="item"
              :value="item.id"
            >
              {{ item.sigla }} - {{ item.descricao }}
            </option>
          </template>
        </Field>
        <ErrorMessage
          name="orgao_id"
          class="error-msg"
        />
      </div>
    </div>

    <div
      v-if="(irmãs = filtrarIrmãs(tarefasAgrupadasPorMãe[values.tarefa_pai_id], tarefaId))?.length"
      class="flex g2 mb1"
    >
      <div class="f1 mb1">
        <p class="label tc300">
          Tarefas irmãs
        </p>
        <ol class="pl0">
          <template
            v-for="item, i in irmãs"
            :key="item.id"
          >
            <li v-if="values.numero == i + 1">
              <strong>{{ values.tarefa }}</strong>
            </li>
            <li>
              {{ item.tarefa }}
            </li>
          </template>
          <li v-if="values.numero > irmãs.length">
            <strong>{{ values.tarefa }}</strong>
          </li>
        </ol>
      </div>
    </div>

    <hr class="mb1 f1">

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">
          Descrição
        </label>
        <Field
          name="descricao"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="500"
          :class="{ 'error': errors.descricao }"
        />
        <ErrorMessage
          name="descricao"
          class="error-msg"
        />
      </div>
    </div>

    <template v-if="!tarefaId || !tarefasAgrupadasPorMãe[tarefaId]?.length">
      <hr class="mb1 f1">

      <div class="flex g2">
        <div class="f1 mb1">
          <label class="label tc300">
            Previsão de início&nbsp;<span class="tvermelho">*</span>
          </label>
          <Field
            name="inicio_planejado"
            type="date"
            class="inputtext light mb1"
            :class="{ 'error': errors.inicio_planejado }"
            maxlength="10"
            @change="values.duracao_planejado
              ? setFieldValue(
                'termino_planejado',
                addToDates(values.inicio_planejado, values.duracao_planejado + 1)
              )
              : null"
          />
          <ErrorMessage
            name="inicio_planejado"
            class="error-msg"
          />
        </div>
        <div class="f1 mb1">
          <label class="label tc300">
            Duração prevista&nbsp;<span class="tvermelho">*</span>
          </label>
          <Field
            name="duracao_planejado"
            type="number"
            class="inputtext light mb1"
            :class="{ 'error': errors.duracao_planejado }"
            @update:model-value="values.duracao_planejado = Number(values.duracao_planejado)"
            @change="values.inicio_planejado
              ? setFieldValue(
                'termino_planejado',
                addToDates(values.inicio_planejado, values.duracao_planejado + 1)
              )
              : null"
          />
          <ErrorMessage
            name="duracao_planejado"
            class="error-msg"
          />
        </div>
        <div class="f1 mb1">
          <label class="label tc300">
            Previsão de término&nbsp;<span class="tvermelho">*</span>
          </label>
          <Field
            name="termino_planejado"
            type="date"
            class="inputtext light mb1"
            :class="{ 'error': errors.termino_planejado }"
            maxlength="10"
            @change="values.termino_planejado
              ? setFieldValue(
                'duracao_planejado',
                subtractDates(values.termino_planejado, values.inicio_planejado) + 1
              )
              : null"
          />
          <ErrorMessage
            name="termino_planejado"
            class="error-msg"
          />
        </div>
      </div>

      <div class="flex g2">
        <div class="f1 mb1">
          <label class="label tc300">
            Previsão de custo&nbsp;<span class="tvermelho">*</span>
          </label>
          <MaskedFloatInput
            name="custo_estimado"
            :value="values.custo_estimado"
            class="inputtext light mb1"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="custo_estimado"
          />
        </div>
      </div>
    </template>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">
          Recursos
        </label>
        <Field
          name="recursos"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          :class="{ 'error': errors.recursos }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="recursos"
        />
      </div>
    </div>

    <div class="flex spacebetween center mb2">
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
