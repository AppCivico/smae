<script setup>
import CheckClose from '@/components/CheckClose.vue';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import dependencyTypes from '@/consts/dependencyTypes';
import { tarefa as schema } from '@/consts/formSchemas';
import addToDates from '@/helpers/addToDates';
import dinheiro from '@/helpers/dinheiro';
import subtractDates from '@/helpers/subtractDates';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { isEqual } from 'lodash';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, FieldArray, Form
} from 'vee-validate';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const alertStore = useAlertStore();
const ÓrgãosStore = useOrgansStore();
const tarefasStore = useTarefasStore();
const router = useRouter();

const { organs: órgãos } = storeToRefs(ÓrgãosStore);

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdição,
  tarefasAgrupadasPorMãe,
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

const dependênciasValidadas = ref([]);

const tiposDeDependências = Object.keys(dependencyTypes)
  .map((x) => ({ valor: x, nome: dependencyTypes[x] }));

const todasAsOutrasTarefas = computed(() => tarefasComHierarquia.value
  .filter((x) => x.id !== props.tarefaId));

// eslint-disable-next-line max-len
const filtrarIrmãs = (listagem = [], id = props.tarefaId) => listagem.filter((x) => x.id !== id);

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

async function validarDependências(dependências) {
  const params = {
    tarefa_corrente_id: props.tarefaId,
    dependencias: dependências,
  };
  try {
    await tarefasStore.validarDependências(params);

    dependênciasValidadas.value = dependências;
  } catch (error) {
    dependênciasValidadas.value = [];
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
          maxlength="60"
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
          :max="tarefasAgrupadasPorMãe[values.tarefa_pai_id || 0]?.length + 1"
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
      v-if="(irmãs = filtrarIrmãs(tarefasAgrupadasPorMãe[values.tarefa_pai_id || 0], tarefaId))?.length"
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

    <template v-if="!tarefaId || !emFoco?.n_filhos_imediatos">
      <hr class="mb1 f1">

      <div class="g2 mb2">
        <legend class="label mt2 mb1">
          Dependências
        </legend>

        <FieldArray
          v-slot="{ fields, push, remove }"
          name="dependencias"
        >
          <div
            v-for="(field, idx) in fields"
            :key="`dependência--${field.key}`"
            class="flex g2"
          >
            <div class="f1 mb1">
              <label class="label tc300">
                Tarefa&nbsp;<span class="tvermelho">*</span>
              </label>
              <Field
                :name="`dependencias[${idx}].dependencia_tarefa_id`"
                type="text"
                maxlength="2"
                class="inputtext light mb1"
                as="select"
              >
                <option value="">
                  Selecionar
                </option>
                <option
                  v-for="item in todasAsOutrasTarefas"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.hierarquia }} - {{ item.tarefa }}
                </option>
              </Field>
              <ErrorMessage
                class="error-msg mb1"
                :name="`dependencias[${idx}].dependencia_tarefa_id`"
              />
            </div>

            <div class="f1 mb1">
              <label class="label tc300">
                Tipo de relação&nbsp;<span class="tvermelho">*</span>
              </label>
              <Field
                :name="`dependencias[${idx}].tipo`"
                type="text"
                maxlength="2"
                class="inputtext light mb1"
                as="select"
              >
                <option value="">
                  Selecionar
                </option>
                <option
                  v-for="item in tiposDeDependências"
                  :key="item.valor"
                  :value="item.valor"
                >
                  {{ item.nome }}
                </option>
              </Field>
              <ErrorMessage
                class="error-msg mb1"
                :name="`dependencias[${idx}].tipo`"
              />
            </div>

            <div class="f1 mb1">
              <label class="label tc300">
                Dias de latência&nbsp;<span class="tvermelho">*</span>
              </label>
              <Field
                :name="`dependencias[${idx}].latencia`"
                type="number"
                class="inputtext light mb1"
                min="0"
                step="1"
                @update:model-value="
                  fields[idx]?.value?.latencia
                    ? (fields[idx].value.latencia = Number(fields[idx].value.latencia))
                    : null
                "
              />

              <ErrorMessage
                class="error-msg mb1"
                :name="`dependencias[${idx}].latencia`"
              />
            </div>

            <button
              class="like-a__text addlink"
              arial-label="excluir"
              title="excluir"
              type="button"
              @click="remove(idx)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </div>

          <button
            class="like-a__text addlink"
            type="button"
            @click="push({
              dependencia_tarefa_id: 0,
              tipo: '',
              latencia: 0,
            })"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg>Adicionar dependência
          </button>
        </FieldArray>
      </div>

      <div
        v-if="values.dependencias?.length"
        class="flex spacebetween center mb2"
      >
        <hr class="mr2 f1">
        <button
          class="btn outline bgnone tcprimary mr2"
          type="button"
          :disabled="isEqual(values.dependencias, dependênciasValidadas)
          "
          @click="validarDependências(values.dependencias)"
        >
          Validar dependências
        </button>
        <hr class="mr2 f1">
      </div>
    </template>

    <textarea
      readonly
      cols="30"
      rows="10"
    >itemParaEdição:
{{ itemParaEdição }}
</textarea>

    <textarea
      readonly
      cols="30"
      rows="10"
    >values:
{{ values }}
</textarea>

    <hr class="mb1 f1">

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">
          Previsão de início
        </label>
        <Field
          v-if="
            !emFoco?.inicio_planejado_calculado
              && !values.dependencias?.length
              && !emFoco?.n_filhos_imediatos
          "
          name="inicio_planejado"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.inicio_planejado }"
          maxlength="10"
          @change="values.duracao_planejado
            ? setFieldValue(
              'termino_planejado',
              addToDates(values.inicio_planejado, values.duracao_planejado - 1)
            )
            : null"
        />
        <input
          v-else
          type="date"
          name="inicio_planejado"
          :value="itemParaEdição.inicio_planejado"
          class="inputtext light mb1"
          disabled
        >
        <ErrorMessage
          name="inicio_planejado"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <label class="label tc300">
          Duração prevista
        </label>
        <Field
          v-if="
            !emFoco?.termino_planejado_calculado
              && !values.dependencias?.length
              && !emFoco?.n_filhos_imediatos
          "
          name="duracao_planejado"
          type="number"
          class="inputtext light mb1"
          :class="{ 'error': errors.duracao_planejado }"
          @update:model-value="values.duracao_planejado = Number(values.duracao_planejado)"
          @change="values.inicio_planejado
            ? setFieldValue(
              'termino_planejado',
              addToDates(values.inicio_planejado, values.duracao_planejado - 1)
            )
            : null"
        />
        <input
          v-else
          type="text"
          name="duracao_planejado"
          :value="itemParaEdição.duracao_planejado"
          class="inputtext light mb1"
          disabled
        >
        <ErrorMessage
          name="duracao_planejado"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <label class="label tc300">
          Previsão de término
        </label>
        <Field
          v-if="
            !emFoco?.duracao_planejado_calculado
              && !values.dependencias?.length
              && !emFoco?.n_filhos_imediatos
          "
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
        <input
          v-else
          type="date"
          name="termino_planejado"
          :value="itemParaEdição.termino_planejado"
          class="inputtext light mb1"
          disabled
        >
        <ErrorMessage
          name="termino_planejado"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">
          Previsão de custo
        </label>
        <MaskedFloatInput
          v-if="!values.dependencias?.length && !emFoco?.n_filhos_imediatos"
          name="custo_estimado"
          :value="values.custo_estimado"
          class="inputtext light mb1"
        />
        <input
          v-else
          type="text"
          name="custo_estimado"
          :value="dinheiro(itemParaEdição.custo_estimado)"
          class="inputtext light mb1"
          disabled
        >
        <ErrorMessage
          class="error-msg mb1"
          name="custo_estimado"
        />
      </div>
    </div>

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
        :disabled="isSubmitting
          || Object.keys(errors)?.length
          || (values.dependencias?.length && !isEqual(values.dependencias, dependênciasValidadas))
        "
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
