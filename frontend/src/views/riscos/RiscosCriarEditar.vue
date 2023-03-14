<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import CheckClose from '@/components/CheckClose.vue';
import MenuDeMudançaDeStatusDeRisco from '@/components/riscos/MenuDeMudançaDeStatusDeRisco.vue';
import { risco as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  Form
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
// eslint-disable-next-line import/no-extraneous-dependencies
import { impactoDescricao, probabilidadeDescricao, RiscoCalc } from '@/../../backend/src/common/RiscoCalc.ts';

const alertStore = useAlertStore();
const riscosStore = useRiscosStore();
const tarefasStore = useTarefasStore();
const router = useRouter();
const route = useRoute();

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdição,
} = storeToRefs(riscosStore);

const {
  tarefasComHierarquia,
} = storeToRefs(tarefasStore);

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
  riscoId: {
    type: Number,
    default: 0,
  },
});

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.riscoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.riscoId
      ? await riscosStore.salvarItem(carga, props.riscoId)
      : await riscosStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      await router.push({ name: 'riscosListar' });
      riscosStore.$reset();
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function excluirRisco(id) {
  useAlertStore().confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await useRiscosStore().excluirItem(id)) {
      useRiscosStore().$reset();
      useRiscosStore().buscarTudo();
      useAlertStore().success('Risco removido.');

      const rotaDeEscape = route.meta?.rotaDeEscape;

      if (rotaDeEscape) {
        router.push(typeof rotaDeEscape === 'string' ? { name: rotaDeEscape } : rotaDeEscape);
      }
    }
  }, 'Remover');
}

function iniciar() {
  if (!tarefasComHierarquia.value.length) {
    tarefasStore.buscarTudo();
  }
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="riscoId"
        class="t12 uc w700 tamarelo"
      >
        {{ 'Editar risco' }}
      </div>
      {{ emFoco?.consequencia || (riscoId ? 'Risco' : 'Novo risco') }}
    </h1>

    <hr class="ml2 f1">
    <MenuDeMudançaDeStatusDeRisco
      v-if="emFoco?.id"
    />

    <CheckClose />
  </div>

  <Form
    v-if="!riscoId || emFoco"
    v-slot="{ errors, isSubmitting, setFieldValue, values }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdição"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <label class="label tc300">
          Código&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="codigo"
          type="number"
          class="inputtext light mb1"
          @update:model-value="values.codigo = Number(values.codigo)"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="codigo"
        />
      </div>
      <div class="f1 mb1">
        <label class="label tc300">
          Data de registro
        </label>
        <Field
          name="registrado_em"
          required
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors.registrado_em,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          maxlength="10"
          @update:model-value="values.registrado_em === ''
            ? values.registrado_em = null
            : null"
        />
        <ErrorMessage
          name="registrado_em"
          class="error-msg"
        />
      </div>
    </div>

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

    <div class="flex g2 mb1 flexwrap">
      <div class="f2 mb1">
        <label class="label tc300">
          Probabilidade
        </label>

        <Field
          name="probabilidade"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.probabilidade,
          }"
          @update:model-value="values.probabilidade = Number(values.probabilidade)"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item, k in probabilidadeDescricao"
            :key="k"
            :value="k + 1"
          >
            {{ k + 1 }} - {{ item }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb1"
          name="probabilidade"
        />
      </div>

      <div class="f2 mb1">
        <label class="label tc300">
          Impacto&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="impacto"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.impacto,
          }"
          @update:model-value="values.impacto = Number(values.impacto)"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item, k in impactoDescricao"
            :key="k"
            :value="k + 1"
          >
            {{ k + 1 }} - {{ item }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb1"
          name="impacto"
        />
      </div>

      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Nível
        </dt>
        <dd class="t13">
          <output class="inputtext light mb1 no-border">
            {{ values.probabilidade && values.impacto
              ? RiscoCalc.getResult(values.probabilidade, values.impacto)?.nivel
              : null
            }}
          </output>
        </dd>
      </dl>

      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Grau
        </dt>
        <dd class="t13">
          <div class="inputtext light mb1 no-border">
            <output
              class="etiqueta"
              :class="`etiqueta--alerta__peso-${values.probabilidade && values.impacto
                ? RiscoCalc.getResult(values.probabilidade, values.impacto)?.grau_valor
                : null
                }`"
            >
              <template v-if="values.probabilidade && values.impacto">
                {{ RiscoCalc.getResult(values.probabilidade, values.impacto)?.grau_valor }}
                - {{ RiscoCalc.getResult(values.probabilidade, values.impacto)?.grau_descricao }}
              </template>
            </output>
          </div>
        </dd>
      </dl>
    </div>

    <div class="flex g2 mb1">
      <dl class="f1 mb1">
        <dt class="t12 uc w700 mb05 tamarelo">
          Resposta indicada
        </dt>
        <dd class="t13">
          <output class="inputtext light mb1 no-border">
            {{ values.probabilidade && values.impacto
              ? RiscoCalc.getResult(values.probabilidade, values.impacto)?.resposta_descricao
              : null
            }}
          </output>
        </dd>
      </dl>
    </div>

    <div class="mb1">
      <legend class="label mt2 mb1">
        Tarefas afetadas&nbsp;<span class="tvermelho">*</span>
      </legend>
      <div class="flex g2">
        <div class="f2 mb1">
          <label class="label tc300">
            Do cronograma<template
              v-if="!values.risco_tarefa_outros"
            >&nbsp;<span class="tvermelho">*</span></template>
          </label>

          <AutocompleteField
            name="tarefa_id"
            :controlador="{ busca: '', participantes: values.tarefa_id || [] }"
            :grupo="tarefasComHierarquia"
            label="tarefa"
            :class="{
              error: errors.tarefa_id,
              loading: tarefasStore.chamadasPendentes.lista
            }"
            @change="setFieldValue('risco_tarefa_outros', null)"
          />

          <ErrorMessage
            name=""
            class="error-msg mb1"
          />
        </div>

        <div class="f2 mb1">
          <label class="label tc300">
            Outras<template
              v-if="!values.tarefa_id?.length"
            >&nbsp;<span class="tvermelho">*</span></template>
          </label>
          <Field
            name="risco_tarefa_outros"
            class="inputtext light mb1"
            @change="setFieldValue('tarefa_id', null)"
          />
          <ErrorMessage
            name=""
            class="error-msg mb1"
          />
        </div>
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <label class="label tc300">
          Causa&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="causa"
          type="text"
          class="inputtext light mb1"
          maxlength="60"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="causa"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <label class="label tc300">
          Consequência&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="consequencia"
          type="text"
          class="inputtext light mb1"
          maxlength="60"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="consequencia"
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

  <button
    v-if="emFoco?.id"
    class="btn amarelo big"
    @click="excluirRisco(emFoco.id)"
  >
    Remover item
  </button>

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
