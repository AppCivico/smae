<script setup>
import {
  computed, defineOptions, ref, watch,
} from 'vue';
import { isEqual } from 'lodash';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  FieldArray,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import dependencyTypes from '@/consts/dependencyTypes';
import { tarefa as schema } from '@/consts/formSchemas';
import addToDates from '@/helpers/addToDates';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import dinheiro from '@/helpers/dinheiro';
import subtractDates from '@/helpers/subtractDates';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';

defineOptions({ inheritAttrs: false });

const alertStore = useAlertStore();
const ÓrgãosStore = useOrgansStore();
const tarefasStore = useTarefasStore();
const router = useRouter();
const route = useRoute();
const projetosStore = useProjetosStore();
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
const {
  órgãosEnvolvidosNoProjetoEmFoco,
} = storeToRefs(projetosStore);

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdicao,
  tarefasAgrupadasPorMãe,
  tarefasOrdenadas,
  tarefasPorId,
} = storeToRefs(tarefasStore);

const props = defineProps({
  tarefaId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
});

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, setValues, values,
} = useForm({
  initialValues: itemParaEdicao.value,
  validationSchema: schema,
});

const dependênciasValidadas = ref([]);

const irmãs = computed(() => tarefasAgrupadasPorMãe.value[values.tarefa_pai_id || 0]
  ?.filter((x) => x.id !== Number(props.tarefaId))
  || []);

const órgãosPendentes = computed(() => (route.meta.entidadeMãe === 'projeto'
  ? projetosStore.chamadasPendentes?.emFoco
  : (ÓrgãosStore.organs.loading || !Array.isArray(ÓrgãosStore.organs))));

const órgãosDisponíveis = computed(() => (route.meta.entidadeMãe === 'projeto'
  ? órgãosEnvolvidosNoProjetoEmFoco.value
  : órgãosComoLista.value));

const tiposDeDependências = Object.keys(dependencyTypes)
  .map((x) => ({ valor: x, nome: dependencyTypes[x] }));

const todasAsOutrasTarefas = computed(() => tarefasOrdenadas.value
  .filter((x) => x.id !== Number(props.tarefaId)));

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (valores) => {
  const carga = valores;

  if (!carga.dependencias && !emFoco?.n_filhos_imediatos) {
    carga.dependencias = [];
  }

  if (!carga.eh_marco) {
    carga.eh_marco = false;
  }

  try {
    const msg = props.tarefaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.tarefaId
      ? await tarefasStore.salvarItem(carga, props.tarefaId)
      : await tarefasStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      tarefasStore.$reset();
      router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

async function obterDependenciasValidadas(dependências) {
  const params = {
    tarefa_corrente_id: Number(props.tarefaId),
    dependencias: dependências,
  };

  try {
    const resposta = await tarefasStore.validarDependências(params);

    const atualizacao = {
      inicio_planejado_calculado: resposta.inicio_planejado_calculado,
      duracao_planejado_calculado: resposta.duracao_planejado_calculado,
      termino_planejado_calculado: resposta.termino_planejado_calculado,
    };

    if (resposta.inicio_planejado_calculado) {
      atualizacao.inicio_planejado = dateTimeToDate(resposta.inicio_planejado);

      if (!resposta.inicio_planejado) {
        atualizacao.termino_planejado = null;
      }
    }
    if (resposta.duracao_planejado_calculado) {
      atualizacao.duracao_planejado = resposta.duracao_planejado;
    }
    if (resposta.termino_planejado_calculado) {
      atualizacao.termino_planejado = dateTimeToDate(resposta.termino_planejado);

      if (!resposta.termino_planejado) {
        atualizacao.inicio_planejado = null;
      }
    }

    dependênciasValidadas.value = dependências;

    return atualizacao;
  } catch (error) {
    dependênciasValidadas.value = [];
    alertStore.error(error);

    return {};
  }
}

async function validarDependencias(tarefaAtual) {
  const dependenciasValidadas = await obterDependenciasValidadas(tarefaAtual.dependencias);

  setValues({
    ...tarefaAtual,
    ...dependenciasValidadas,
  });
}

async function handleLiberarPrevisaoAposDependenciaRemovida(tarefaAtual) {
  if (tarefaAtual.dependencias.length !== 0) {
    return;
  }

  setValues({
    ...tarefaAtual,
    duracao_planejado_calculado: false,
    inicio_planejado: null,
    inicio_planejado_calculado: false,
    termino_planejado: null,
    termino_planejado_calculado: true,
  });
}

async function iniciar() {
  // apenas porque alguma tarefa nova pode ter sido criada por outra pessoa
  tarefasStore.buscarTudo();
  if (route.meta.entidadeMãe !== 'projeto') {
    ÓrgãosStore.getAll();
  }
}

function verificarDependenciasAoIniciar(tarefa) {
  if (tarefa.dependencias.length === 0) {
    handleLiberarPrevisaoAposDependenciaRemovida(tarefa);
    return;
  }

  validarDependencias(tarefa);
}

iniciar();

watch(emFoco, () => {
  if (emFoco.value?.dependencias?.length) {
    dependênciasValidadas.value = emFoco.value?.dependencias;
  }
});

watch(itemParaEdicao, (novoValor) => {
  resetForm({
    values: novoValor,
  });

  verificarDependenciasAoIniciar(novoValor);
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="tarefaId"
        class="t12 uc w700 tamarelo"
      >
        {{ 'Editar tarefa' }}
      </div>
      {{ emFoco?.tarefa || (tarefaId ? 'Tarefa' : 'Nova tarefa') }}
    </h1>
    <hr class="ml2 f1">

    <CheckClose
      :formulario-sujo="formularioSujo"
    />
  </div>

  <form
    v-if="!tarefaId || emFoco"
    :disabled="chamadasPendentes.emFoco"
    @submit.prevent="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="tarefa"
          :schema="schema"
        />
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
      <div class="f05 mb1 mt1">
        <label class="block mt1">
          <Field
            name="eh_marco"
            type="checkbox"
            :value="true"
            class="inputcheckbox"
          />
          <span :class="{ 'error': errors.eh_marco }">
            {{ schema.fields.eh_marco.spec.label }}
          </span>
        </label>
      </div>
    </div>
    <hr class="mb1 f1">

    <div class="flex g2 mb1 flexwrap end">
      <div class="f1 mb1">
        <LabelFromYup
          name="tarefa_pai_id"
          :schema="schema"
        />
        <Field
          name="tarefa_pai_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.tarefa_pai_id,
            loading: chamadasPendentes.lista,
          }"
          :disabled="chamadasPendentes.lista || !tarefasOrdenadas.length"
          @change="() => {
            setFieldValue('nivel', (tarefasPorId[values.tarefa_pai_id]?.nivel || 0) + 1);
            setFieldValue(
              'numero',
              (tarefasAgrupadasPorMãe[values.tarefa_pai_id || 0]?.length || 0) + 1
            );
          }"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in tarefasOrdenadas"
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

      <div class="mb1">
        <LabelFromYup
          name="numero"
          :schema="schema"
        >
          {{ schema.fields.numero.spec.label }}&nbsp;<span class="tvermelho">*</span>
        </LabelFromYup>
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
        <LabelFromYup
          name="orgao_id"
          :schema="schema"
        />
        <Field
          name="orgao_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.orgao_id,
            loading: órgãosPendentes,
          }"
          :disabled="!órgãosDisponíveis.length"
        >
          <option :value="0">
            Selecionar
          </option>

          <option
            v-for="item in órgãosDisponíveis"
            :key="item"
            :value="item.id"
          >
            {{ item.sigla }} - {{ item.descricao }}
          </option>
        </Field>
        <ErrorMessage
          name="orgao_id"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="recursos"
          :schema="schema"
        />
        <Field
          name="recursos"
          type="text"
          class="inputtext light mb1"
          :class="{ 'error': errors.recursos }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="recursos"
        />
      </div>
    </div>

    <div
      v-if="irmãs?.length"
      class="flex g2 mb1"
    >
      <div class="f1 mb1">
        <p class="label">
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
        <LabelFromYup
          name="descricao"
          :schema="schema"
        />
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

    <template v-if="!values?.n_filhos_imediatos">
      <hr class="mb1 f1">

      <div class="g2 mb2">
        <legend class="label mt2 mb1">
          {{ schema.fields.dependencias.spec.label }}
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
            <div class="f2 mb1">
              <LabelFromYup
                class="tc300"
                :schema="schema.fields.dependencias.innerType"
                name="dependencia_tarefa_id"
              />
              <Field
                :name="`dependencias[${idx}].dependencia_tarefa_id`"
                maxlength="2"
                class="inputtext light mb1"
                as="select"
                :class="{
                  error: errors[`dependencias[${idx}].dependencia_tarefa_id`],
                  loading: chamadasPendentes.validaçãoDeDependências
                }"
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

            <div class="f2 mb1">
              <LabelFromYup
                class="tc300"
                :schema="schema.fields.dependencias.innerType"
                name="tipo"
              />

              <Field
                :name="`dependencias[${idx}].tipo`"
                maxlength="2"
                class="inputtext light mb1"
                as="select"
                :class="{
                  error: errors[`dependencias[${idx}].tipo`],
                  loading: chamadasPendentes.validaçãoDeDependências
                }"
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
              <LabelFromYup
                class="tc300"
                :schema="schema.fields.dependencias.innerType"
                name="latencia"
              />
              <Field
                :name="`dependencias[${idx}].latencia`"
                type="number"
                class="inputtext light mb1"
                step="1"
                :class="{
                  error: errors[`dependencias[${idx}].latencia`],
                  loading: chamadasPendentes.validaçãoDeDependências
                }"
                @update:model-value="() => {
                  if (typeof fields[idx]?.value.latencia !== 'undefined') {
                    fields[idx].value.latencia = Number(fields[idx].value.latencia)
                      || 0;
                  }
                }
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
              :disabled="chamadasPendentes.validaçãoDeDependências"
              @click="() => {
                remove(idx);
                handleLiberarPrevisaoAposDependenciaRemovida(values);
              }"
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
            :disabled="chamadasPendentes.validaçãoDeDependências"
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
          :disabled="chamadasPendentes.validaçãoDeDependências"
          @click="validarDependencias(values)"
        >
          Validar dependências
        </button>
        <hr class="mr2 f1">
      </div>
    </template>

    <hr class="mb1 f1">

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="inicio_planejado"
          :schema="schema"
        />
        <Field
          v-if="!values?.n_filhos_imediatos"
          :disabled="
            values?.inicio_planejado_calculado
              || chamadasPendentes.validaçãoDeDependências
          "
          name="inicio_planejado"
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors.inicio_planejado,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          maxlength="10"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('inicio_planejado', $v || null); }"
          @change="values.duracao_planejado
            && !values?.termino_planejado_calculado
            ? setFieldValue(
              'termino_planejado',
              addToDates(values.inicio_planejado, values.duracao_planejado - 1)
            )
            : null"
        />
        <input
          v-else
          type="date"
          :value="itemParaEdicao.inicio_planejado"
          class="inputtext light mb1"
          disabled
        >
        <ErrorMessage
          name="inicio_planejado"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="duracao_planejado"
          :schema="schema"
        />
        <Field
          v-if="!values?.n_filhos_imediatos"
          :disabled="values?.duracao_planejado_calculado
            || chamadasPendentes.validaçãoDeDependências"
          name="duracao_planejado"
          type="number"
          class="inputtext light mb1"
          :class="{
            error: errors.duracao_planejado,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          @update:model-value="values.duracao_planejado = Number(values.duracao_planejado)
            || null"
          @change="() => {
            if (values.inicio_planejado && !values.termino_planejado_calculado) {
              setFieldValue(
                'termino_planejado',
                addToDates(values.inicio_planejado, values.duracao_planejado - 1)
              );
            } else if (values.termino_planejado && !values.inicio_planejado_calculado) {
              setFieldValue(
                'inicio_planejado',
                addToDates(values.termino_planejado, values.duracao_planejado * -1 + 1)
              );
            }
          }"
        />
        <input
          v-else
          type="text"
          :value="itemParaEdicao.duracao_planejado"
          class="inputtext light mb1"
          disabled
        >
        <ErrorMessage
          name="duracao_planejado"
          class="error-msg"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="termino_planejado"
          :schema="schema"
        />
        <Field
          v-if="!values?.n_filhos_imediatos"
          :disabled="values?.termino_planejado_calculado
            || chamadasPendentes.validaçãoDeDependências
            || (values?.inicio_planejado_calculado && !values?.inicio_planejado)"
          name="termino_planejado"
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors.termino_planejado,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          maxlength="10"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('termino_planejado', $v || null); }"
          @change="values.termino_planejado && values.inicio_planejado
            && !values?.duracao_planejado_calculado
            ? setFieldValue(
              'duracao_planejado',
              subtractDates(values.termino_planejado, values.inicio_planejado) + 1
            )
            : null"
        />
        <input
          v-else
          type="date"
          :value="itemParaEdicao.termino_planejado"
          class="inputtext light mb1"
          disabled
        >
        <ErrorMessage
          name="termino_planejado"
          class="error-msg"
        />
      </div>
      <button
        class="like-a__text addlink"
        arial-label="limpar datas"
        title="limpar datas"
        type="button"
        @click="() => {
          if (!values?.inicio_planejado_calculado) {
            setFieldValue('inicio_planejado', null)
          }
          if (!values?.duracao_planejado_calculado) {
            setFieldValue('duracao_planejado', null)
          }
          if (!values?.termino_planejado_calculado) {
            setFieldValue('termino_planejado', null)
          }
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
          name="custo_estimado"
          :schema="schema"
        />
        <MaskedFloatInput
          v-if="!values?.n_filhos_imediatos"
          name="custo_estimado"
          :value="values.custo_estimado"
          class="inputtext light mb1"
        />
        <input
          v-else
          type="text"
          name="custo_estimado"
          :value="dinheiro(itemParaEdicao.custo_estimado)"
          class="inputtext light mb1"
          disabled
        >
        <ErrorMessage
          class="error-msg mb1"
          name="custo_estimado"
        />
      </div>
    </div>

    <div
      v-if="values.dependencias?.length && !isEqual(values.dependencias, dependênciasValidadas)"
      class="error-msg mb1"
    >
      <p>
        <a
          href="#validar-dependencias"
          class="link"
        >
          Valide
        </a>
        a relação entre essa tarefa e suas dependências antes de salvar
        suas modificações.
      </p>
    </div>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting
          || Object.keys(errors)?.length
          || chamadasPendentes.validaçãoDeDependências
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
  </form>

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
