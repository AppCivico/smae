<script setup>
// eslint-disable-next-line import/no-extraneous-dependencies
import { impactoDescricao, probabilidadeDescricao, RiscoCalc } from '@/../../common/RiscoCalc.ts';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import MenuDeMudançaDeStatusDeRisco from '@/components/riscos/MenuDeMudançaDeStatusDeRisco.vue';
import { risco as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  Form,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const alertStore = useAlertStore();
const projetosStore = useProjetosStore();
const riscosStore = useRiscosStore();
const tarefasStore = useTarefasStore();
const router = useRouter();
const route = useRoute();

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdicao,
} = storeToRefs(riscosStore);

const {
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);

const {
  tarefasOrdenadas,
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
      riscosStore.$reset();
      router.push({ name: 'riscosListar' });
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
  if (!tarefasOrdenadas.value.length) {
    tarefasStore.buscarTudo();
  }
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      {{ riscoId ? 'Risco' : 'Novo risco' }}
    </TítuloDePágina>

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
    :initial-values="itemParaEdicao"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div
        v-if="riscoId"
        class="f1 mb1"
      >
        <LabelFromYup
          name="codigo"
          :schema="schema"
        />
        <Field
          name="codigo"
          type="number"
          class="inputtext light mb1"
          :disabled="emFoco?.edicao_limitada"
          @update:model-value="values.codigo = Number(values.codigo)"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="codigo"
        />
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="registrado_em"
          :schema="schema"
        />
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
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('registrado_em', $v || null); }"
        />
        <ErrorMessage
          name="registrado_em"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="titulo"
          :schema="schema"
        />
        <Field
          name="titulo"
          class="inputtext light mb1"
          maxlength="500"
          :class="{ 'error': errors.titulo }"
        />
        <ErrorMessage
          name="titulo"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="descricao"
          :schema="schema"
        />
        <SmaeText
          name="descricao"
          as="textarea"
          rows="5"
          class="mb1"
          :model-value="values.descricao"
          :schema="schema"
          anular-vazio
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
        <LabelFromYup
          name="probabilidade"
          :schema="schema"
        />

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
        <LabelFromYup
          name="impacto"
          :schema="schema"
        />
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

      <dl class="f05 mb1">
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

      <dl class="f05 mb1">
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
        Tarefas afetadas
      </legend>

      <div class="flex g2">
        <div class="f2 mb1">
          <LabelFromYup class="tc300">
            Do cronograma
          </LabelFromYup>
          <AutocompleteField
            name="tarefa_id"
            :controlador="{ busca: '', participantes: values.tarefa_id || [] }"
            :grupo="tarefasOrdenadas"
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
          <LabelFromYup class="tc300">
            Outras
          </LabelFromYup>
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
        <LabelFromYup
          name="causa"
          :schema="schema"
        />
        <SmaeText
          name="causa"
          as="textarea"
          rows="5"
          class="mb1"
          :class="{ error: errors.causa }"
          :model-value="values.causa"
          :schema="schema"
          anular-vazio
        />
        <ErrorMessage
          class="error-msg mb1"
          name="causa"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="consequencia"
          :schema="schema"
        />
        <SmaeText
          name="consequencia"
          as="textarea"
          rows="5"
          class="mb1"
          :class="{ error: errors.consequencia }"
          :model-value="values.consequencia"
          :schema="schema"
          anular-vazio
        />
        <ErrorMessage
          class="error-msg mb1"
          name="consequencia"
        />
      </div>
    </div>

    <FormErrorsList :errors="errors" />

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

  <div
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </div>

  <button
    v-if="emFoco?.id
      && (!permissõesDoProjetoEmFoco.apenas_leitura
        || permissõesDoProjetoEmFoco.sou_responsavel)"
    class="btn amarelo big"
    @click="excluirRisco(emFoco.id)"
  >
    Remover item
  </button>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
