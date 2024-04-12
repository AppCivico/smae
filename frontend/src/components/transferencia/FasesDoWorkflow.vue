<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { andamentoDaFase } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useUsersStore } from '@/stores/users.store';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  computed, defineOptions, nextTick, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';

defineOptions({ inheritAttrs: false });

const route = useRoute();
const props = defineProps({
  transferenciaId: {
    type: [Number, String],
    default: 0,
  },
});

const alertStore = useAlertStore();

const UserStore = useUsersStore();
const { pessoasSimplificadas } = storeToRefs(UserStore);

const ÓrgãosStore = useOrgansStore();
const { organs, órgãosComoLista } = storeToRefs(ÓrgãosStore);

const workflowAndamento = useWorkflowAndamentoStore();
const { emFoco: workflow, chamadasPendentes } = storeToRefs(workflowAndamento);

const faseSelecionada = ref(0);
const listaDeFases = ref(null);

const etapaCorrente = computed(() => workflow.value?.fluxo?.[0] || {});

const faseEmFoco = computed(() => (!faseSelecionada.value
  ? null
  : etapaCorrente.value?.fases?.find((x) => x.id === faseSelecionada.value) || null));

const schema = computed(() => andamentoDaFase(
  !!faseEmFoco.value?.andamento?.necessita_preencher_orgao,
  !!faseEmFoco.value?.andamento?.necessita_preencher_pessoa,
));

const itemParaEdição = computed(() => ({
  transferencia_id: props.transferenciaId || Number(route.params.transferenciaId) || 0,
  fase_id: faseEmFoco.value?.fase?.id,
  orgao_responsavel_id: faseEmFoco.value?.andamento?.orgao_responsavel?.id || null,
  pessoa_responsavel_id: faseEmFoco.value?.andamento?.pessoal_responsavel?.id || null,
  situacao_id: faseEmFoco.value?.andamento?.situacao?.id || null,
  tarefas: faseEmFoco.value?.tarefas?.map((x) => ({
    id: x.id,
    orgao_responsavel_id: x.andamento?.orgao_responsavel?.id,
    concluida: x.andamento?.concluida || false,
  }))
  || [],
}));

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  initialValues: itemParaEdição.value,
  validationSchema: schema.value,
});

const pessoasDisponíveis = computed(() => (!Array.isArray(pessoasSimplificadas.value)
  ? []
  : pessoasSimplificadas.value
    .filter((x) => (x.orgao_id === Number(values.orgao_responsavel_id)))));

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const cargaManipulada = nulificadorTotal(valoresControlados);

  if (await workflowAndamento.editarFase(cargaManipulada)) {
    alertStore.success('Fase editada!');
    faseSelecionada.value = 0;
  }
});

const formulárioSujo = useIsFormDirty();

workflowAndamento.buscar().then(async () => {
  await nextTick();
  listaDeFases.value.scrollLeft = listaDeFases.value?.scrollWidth || 0;
});

watch(itemParaEdição, (novoValor) => {
  resetForm({
    values: novoValor,
    validationSchema: schema.value,
  });
});

watch(itemParaEdição, () => {
  ÓrgãosStore.getAll();
  UserStore.buscarPessoasSimplificadas();
}, { once: true });
</script>
<template>
  <LoadingComponent
    v-if="chamadasPendentes.emFoco"
    class="horizontal"
    v-bind="$attrs"
  />
  <div
    v-else
    v-bind="$attrs"
    class="dedo-duro"
  >
    <h2 class="dedo-duro__título w400">
      Etapa de
      <strong class="w600">{{ etapaCorrente.fluxo_etapa_de.etapa_fluxo }}</strong>
    </h2>

    <p class="tc400 t14 dedo-duro__info">
      Clique em uma fase para visualizar tarefas e editar situação.
    </p>

    <ul
      v-if="etapaCorrente?.fases?.length"
      ref="listaDeFases"
      class="flex pb1 dedo-duro__lista-de-fases"
    >
      <li
        v-for="item in etapaCorrente.fases"
        :key="item.id"
        class="p1 tc dedo-duro__fase"
        :class="{
          'dedo-duro__fase--iniciada': !!item?.andamento,
          concluida: item?.andamento?.concluida
        }"
      >
        <button
          type="button"
          class="w400 like-a__text dedo-duro__nome-da-fase"
          @click="faseSelecionada = item.id"
        >
          {{ item.fase.fase }}
        </button>

        <span class="card-shadow tc500 p1 mt1 block dedo-duro__dados-da-fase">
          <span v-if="item.andamento?.pessoa_responsavel">
            {{ item.andamento?.pessoa_responsavel }}
          </span>
          <abbr
            v-if="item.andamento?.orgao_responsavel"
            :title="item.andamento?.orgao_responsavel?.descricao"
          >
            {{ item.andamento?.orgao_responsavel?.sigla || item.andamento?.orgao_responsavel }}
          </abbr>

          {{ item.andamento?.dias_na_fase || '-' }}
        </span>
      </li>
    </ul>
  </div>

  <SmallModal
    v-if="faseSelecionada"
    class="small"
  >
    <div class="flex spacebetween center mb2">
      <h2>
        Editar fase
      </h2>
      <hr class="ml2 f1">

      <CheckClose
        :formulário-sujo="formulárioSujo"
        :apenas-emitir="true"
        @close="faseSelecionada = 0"
      />
    </div>

    <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit"
    >
      <Field
        name="transferencia_id"
        type="hidden"
      />
      <Field
        name="fase_id"
        type="hidden"
      />

      <div class="mb1">
        <LabelFromYup
          name="situacao_id"
          :schema="schema"
        />
        <Field
          name="situacao_id"
          as="select"
          rows="5"
          class="inputtext light mb1"
          :class="{ 'error': errors.situacao_id }"
        >
          <option value="" />
          <option
            v-for="item in faseEmFoco?.situacoes"
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
      <div class="mb1">
        <LabelFromYup
          name="orgao_responsavel_id"
          :schema="schema"
        />
        <Field
          name="orgao_responsavel_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.orgao_responsavel_id,
            loading: organs?.loading
          }"
          :disabled="!órgãosComoLista?.length"
        >
          <option value="" />
          <option
            v-for="item in órgãosComoLista"
            :key="item"
            :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null"
          >
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb2"
          name="orgao_responsavel_id"
        />
      </div>

      <div class="mb1">
        <LabelFromYup
          name="pessoa_responsavel_id"
          :schema="schema"
        />
        <Field
          name="pessoa_responsavel_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.pessoa_responsavel_id,
            loading: pessoasSimplificadas?.loading
          }"
          :disabled="!pessoasDisponíveis?.length"
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
      <pre>values:{{ values }}</pre>
      <fieldset v-if="faseEmFoco?.tarefas?.length">
        <LabelFromYup
          class="label mt2 mb1"
          name="tarefas"
          :schema="schema"
          as="legend"
        />

        <div
          v-for="(tarefa, idx) in faseEmFoco.tarefas"
          :key="`tarefas--${tarefa.workflow_tarefa.id}`"
          class="mb2"
        >
          <Field
            :name="`tarefas[${idx}].id`"
            :value="tarefa.workflow_tarefa.id"
            type="hidden"
          />

          <label class="block mb1 tc600">
            <Field
              :name="`tarefas[${idx}].concluida`"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
            />
            <span>
              concluir
              <strong class="w600">{{ tarefa.workflow_tarefa.descricao }}</strong>
            </span>
            <ErrorMessage
              class="error-msg mb2"
              :name="`tarefas[${idx}].concluida`"
            />
          </label>

          <template v-if="tarefa.responsabilidade !== 'Propria'">
            <Field
              v-if="values.tarefas[idx].orgao_responsavel_id > -1
                && values.tarefas[idx].orgao_responsavel_id !== ''"
              :name="`tarefas[${idx}].orgao_responsavel_id`"
              as="select"
              class="inputtext light mb1"
              :class="{
                error: errors[`tarefas[${idx}].orgao_responsavel_id`],
                loading: organs?.loading
              }"
              :disabled="!órgãosComoLista?.length"
            >
              <option value="">
                Selecionar
              </option>
              <option
                v-for="item in órgãosComoLista"
                :key="item"
                :value="item.id"
                :title="item.descricao?.length > 36 ? item.descricao : null"
              >
                {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
              </option>
            </Field>

            <button
              v-else
              type="button"
              class="like-a__link block addlink ml2"
              @click="setFieldValue(`tarefas[${idx}].orgao_responsavel_id`, 0)"
            >
              <svg
                width="20"
                height="20"
              >
                <use xlink:href="#i_+" />
              </svg>
              Associar órgão responsável
            </button>
          </template>
        </div>
      </fieldset>
      <FormErrorsList
        :errors="errors"
        class="mb1"
      />

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          type="submit"
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </form>
  </SmallModal>
</template>
<style lang="less" scoped>
@tamanho-da-bolinha: 1.8rem;

.dedo-duro {
}

.dedo-duro__título {
}

.dedo-duro__info {
}

.dedo-duro__lista-de-fases {
  overflow-x: auto;
  overflow-y: clip;
}

.dedo-duro__fase {
  min-width: 18rem;
  position: relative;
  flex-grow: 1;

  &::after {
    position: absolute;
    content: '';
    left: 50%;
    right: -50%;
    top: calc(@tamanho-da-bolinha *0.5 + 1rem);
    height: 2px;
    background-color: currentColor;
    margin-top: -1px;
    z-index: -1;
    color: @c300;
  }

  &:first-child::after {
    left: 50%;
  }

  &:last-child::after {
    right: 25%;
    background-image: linear-gradient(to left, @branco, @c300 3rem);
  }
}

.dedo-duro__fase--iniciada {
  &::after {
    color: @amarelo;
  }
}

.dedo-duro__nome-da-fase {
  text-wrap: balance;
  width: 50%;
  display: block;
  margin-left: auto;
  margin-right: auto;

  &::before {
    width: @tamanho-da-bolinha;
    height: @tamanho-da-bolinha;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 1rem;
    border-radius: 100%;
    content: '';
    display: block;
    background-color: currentColor;
    color: @c300;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAD9SURBVHgBrZK9DcIwEIXfXaChYoSwAaNAT+FMQDokGqAAiY4FUMIGbAAbkA2ADaigAnM4/AVsR0I8yfLPne8+PRv4g8gXVL0kBFMXJz1KZ9HBlce+IhJVIB2jxl38QmIoAqxkGco44IiGi4a9FHmBm+o+GvJQbO/bpYyWj8ZOEtDAzBrrdBK1pVXmo2ErBbQqntK9+yVWcVIvLfKksMtKw+UUnxIak+co8kVBaKp+oqB1WKAJMCimvVO8XqRcZ3mpabQrkti9WAZUDaVX+hV5o+EnhdULzubjzh52qYc3OUmFHL/xMhRPNk6zOb9XMRutF7gZ5lZmPSVz7z+6AjAITco9Fq1nAAAAAElFTkSuQmCC);
    background-position: 50% 50%;
    background-repeat: no-repeat;
  }

  .dedo-duro__fase--iniciada &::before {
    color: @amarelo;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAC9SURBVHgB7ZAxDoIwFIb7UHZ3WIxx1oXQwoJLS1z0BngDjiCeQI/gDdx1YmN118QELkFiqCWxxoApYhz5pte+/l/bh1DHXyCEhZ7nDeRaQy0hxN8DoF2e6xO512+Rfwp4UBQ8SpJTXDtgWfMpIXSpEjgO4xjTdbX3+o6u3xcAcMDYD9QvOG6q/Z4s0vQam+ZoqGkoMozxLcsu528EJVC/lYoQiBCsxABnTYKPkndRWTcJlLgu29o2C1HHTzwAp05KMEpINHYAAAAASUVORK5CYII=);
  }
}

.dedo-duro__dados-da-fase {
  width: max-content;
  margin-left: auto;
  margin-right: auto;
}
</style>
