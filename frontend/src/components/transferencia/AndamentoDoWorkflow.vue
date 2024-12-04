<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { andamentoDaFase } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useUsersStore } from '@/stores/users.store';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  computed, defineOptions, nextTick, onUnmounted, ref, watch,
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
const { workflow, etapaCorrente, chamadasPendentes } = storeToRefs(workflowAndamento);

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const faseSelecionada = ref(0);
const listaDeFases = ref(null);

const faseEmFoco = computed(() => (!faseSelecionada.value
  ? null
  : etapaCorrente.value?.fases?.find((x) => x.id === faseSelecionada.value) || null));

const schema = computed(() => andamentoDaFase(
  !!faseEmFoco.value?.andamento?.necessita_preencher_orgao,
  !!faseEmFoco.value?.andamento?.necessita_preencher_pessoa,
));

const itemParaEdicao = computed(() => ({
  transferencia_id: props.transferenciaId || Number(route.params.transferenciaId) || 0,
  fase_id: faseEmFoco.value?.fase?.id,
  orgao_responsavel_id: faseEmFoco.value?.andamento?.orgao_responsavel?.id || null,
  pessoa_responsavel_id: faseEmFoco.value?.andamento?.pessoa_responsavel?.id || null,
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
  initialValues: itemParaEdicao.value,
  validationSchema: schema.value,
});

const pessoasDisponíveis = computed(() => {
  if (!Array.isArray(pessoasSimplificadas.value)) {
    return [];
  }

  return !values.orgao_responsavel_id
    ? pessoasSimplificadas.value
    : pessoasSimplificadas.value.filter((x) => x.orgao_id === Number(values.orgao_responsavel_id));
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const cargaManipulada = nulificadorTotal(valoresControlados);

  const resposta = await workflowAndamento.editarFase(cargaManipulada);
  if (resposta) {
    workflowAndamento.buscar();
    alertStore.success('Fase editada!');
    faseSelecionada.value = 0;
  }
  return resposta;
});

const formularioSujo = useIsFormDirty();

async function rolarParaFaseCorrente() {
  if (Array.isArray(etapaCorrente.value?.fases)) {
    const índiceDaFaseCorrente = etapaCorrente.value.fases
      .findIndex((x) => x.andamento?.concluida === false);

    await nextTick();

    if (listaDeFases.value) {
      const { children: filhas } = listaDeFases.value;

      if (filhas[índiceDaFaseCorrente]) {
        listaDeFases.value.scrollLeft = filhas[índiceDaFaseCorrente].offsetLeft;
      }
    }
  }
}

function finalizarFase(idDaFase) {
  alertStore.confirmAction('Tem certeza?', async () => {
    if (await onSubmit() && await workflowAndamento.encerrarFase(idDaFase)) {
      faseSelecionada.value = 0;
      workflowAndamento.buscar();
      alertStore.success('Fase finalizada!');
    }
  }, 'Finalizar');
}

workflowAndamento.buscar().then(() => {
  rolarParaFaseCorrente();
});

onUnmounted(() => {
  workflowAndamento.$reset();
});

watch(itemParaEdicao, (novoValor) => {
  resetForm({
    values: novoValor,
    validationSchema: schema.value,
  });
});

watch(itemParaEdicao, () => {
  ÓrgãosStore.getAll();
  UserStore.buscarPessoasSimplificadas();
}, { once: true });
</script>
<template>
  <LoadingComponent
    v-if="chamadasPendentes.workflow"
    class="horizontal"
    v-bind="$attrs"
  />
  <div
    v-else-if="workflow"
    v-bind="$attrs"
    class="andamento-fluxo"
  >
    <h2 class="andamento-fluxo__título w400">
      Etapa
      <template v-if="etapaCorrente?.fluxo_etapa_de?.etapa_fluxo">
        de
        <strong class="w600">{{ etapaCorrente.fluxo_etapa_de.etapa_fluxo }}</strong>
      </template>
    </h2>

    <p class="tc400 t14 andamento-fluxo__info">
      Clique em uma fase para visualizar tarefas e editar situação.
    </p>

    <ul
      v-if="etapaCorrente?.fases?.length"
      ref="listaDeFases"
      class="flex pb1 andamento-fluxo__lista-de-fases"
    >
      <li
        v-for="item in etapaCorrente.fases"
        :key="item.id"
        class="p1 tc andamento-fluxo__fase"
        :class="{
          'andamento-fluxo__fase--iniciada': item?.andamento?.concluida === false,
          'andamento-fluxo__fase--concluída': !!item?.andamento?.concluida,
        }"
      >
        <button
          type="button"
          class="w400 like-a__text andamento-fluxo__nome-da-fase"
          @click="faseSelecionada = item.id"
        >
          {{ item.fase.fase }}
        </button>

        <span
          v-if="item.andamento?.dias_na_fase
            || item.andamento?.pessoa_responsavel
            || item.andamento?.orgao_responsavel"
          class="card-shadow tc500 p1 mt1 block andamento-fluxo__dados-da-fase"
        >
          <span
            v-if="item.andamento?.dias_na_fase"
            class="w700 andamento-fluxo__dias-da-fase"
          >
            {{ item.andamento?.dias_na_fase }} {{ item.andamento?.dias_na_fase === 1 ? 'dia' : 'dias' }}
          </span>

          <span
            v-if="item.andamento?.pessoa_responsavel"
            class="block andamento-fluxo__responsável-pela-fase"
          >
            {{ item.andamento?.pessoa_responsavel?.nome_exibicao
              || item.andamento?.pessoa_responsavel }}
          </span>
          <abbr
            v-else-if="item.andamento?.orgao_responsavel"
            :title="item.andamento?.orgao_responsavel?.descricao"
            class="block andamento-fluxo__responsável-pela-fase"
          >
            {{ item.andamento?.orgao_responsavel?.sigla || item.andamento?.orgao_responsavel }}
          </abbr>
        </span>
      </li>
    </ul>
  </div>

  <SmallModal
    v-if="faseSelecionada && temPermissãoPara('CadastroWorkflows.editar')"
  >
    <div class="flex center mb2">
      <h2
        v-if="faseEmFoco.fase?.fase"
        class="título-da-fase-selecionada f1"
      >
        {{ faseEmFoco.fase.fase }}
      </h2>

      <hr class="ml2 f1">

      <CheckClose
        :formulario-sujo="formularioSujo"
        :apenas-emitir="true"
        @close="faseSelecionada = 0"
      />
    </div>

    <pre v-scrollLockDebug>faseEmFoco:
  {{ faseEmFoco }}
</pre>

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

      <fieldset
        v-if="faseEmFoco?.tarefas?.length"
        class="campos-de-tarefas mb2"
      >
        <LabelFromYup
          class="label mb1"
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
              :disabled="faseEmFoco?.andamento?.concluida"
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
            <div
              v-if="(values.tarefas[idx].orgao_responsavel_id > -1
                && values.tarefas[idx].orgao_responsavel_id !== '')
                || tarefa.andamento?.necessita_preencher_orgao"
              class="mb1"
            >
              <label :for="`tarefas[${idx}].orgao_responsavel_id`">
                Órgão associado&nbsp;<span
                  v-if="tarefa.andamento?.necessita_preencher_orgao"
                  class="tvermelho"
                >*</span>
              </label>
              <Field
                :id="`tarefas[${idx}].orgao_responsavel_id`"
                :name="`tarefas[${idx}].orgao_responsavel_id`"
                as="select"
                class="inputtext light mb1"
                :class="{
                  error: errors[`tarefas[${idx}].orgao_responsavel_id`],
                  loading: organs?.loading
                }"
                :required="tarefa.andamento?.necessita_preencher_orgao"
                :disabled="!órgãosComoLista?.length || faseEmFoco?.andamento?.concluida"
              >
                <option
                  value=""
                  :disabled="tarefa.andamento?.necessita_preencher_orgao"
                >
                  <template v-if="tarefa.andamento?.necessita_preencher_orgao">
                    Selecionar
                  </template>
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
            </div>
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
          :disabled="faseEmFoco?.andamento?.concluida"
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
          :disabled="!órgãosComoLista?.length
            || faseEmFoco.responsabilidade === 'Propria'
            || faseEmFoco?.andamento?.concluida"
          @change="setFieldValue('pessoa_responsavel_id', null)"
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
          :disabled="!pessoasDisponíveis?.length || faseEmFoco?.andamento?.concluida"
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

      <pre v-scrollLockDebug>values:{{ values }}</pre>

      <FormErrorsList
        :errors="errors"
        class="mb1"
      />

      <div
        v-if="!faseEmFoco?.andamento?.concluida"
        class="flex spacebetween center g2 mb2"
      >
        <hr class="f1">
        <button
          v-if="!faseEmFoco?.andamento?.concluida"
          type="button"
          class="btn outline bgnone tcprimary big mr1"
          :disabled="!faseEmFoco.andamento?.pode_concluir"
          @click="finalizarFase(faseEmFoco.fase?.id)"
        >
          Salvar e finalizar
        </button>

        <button
          type="submit"
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar
        </button>
        <hr class="f1">
      </div>
    </form>
  </SmallModal>
</template>
<style lang="less" scoped>
@tamanho-da-bolinha: 1.8rem;

.andamento-fluxo {
}

.andamento-fluxo__título {
}

.andamento-fluxo__info {
}

.andamento-fluxo__lista-de-fases {
  .rolavel-horizontalmente;
}

.andamento-fluxo__fase {
  min-width: 18rem;
  position: relative;
  flex-grow: 1;
  flex-basis: 0;

  &::after {
    position: absolute;
    content: '';
    left: 50%;
    right: -50%;
    top: calc(@tamanho-da-bolinha * 0.5 + 1rem);
    height: 2px;
    background-color: currentColor;
    margin-top: -1px;
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

.andamento-fluxo__fase--concluída {
  &::after {
    color: @amarelo;
  }
}

.andamento-fluxo__nome-da-fase {
  text-wrap: balance;
  width: 50%;
  display: block;
  margin-left: auto;
  margin-right: auto;

  &:disabled {
    opacity: 1;
  }

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
    background-position: 50% 50%;
    background-repeat: no-repeat;
    z-index: 1;
    position: relative;
  }

  .andamento-fluxo__fase--iniciada &::before {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAD9SURBVHgBrZK9DcIwEIXfXaChYoSwAaNAT+FMQDokGqAAiY4FUMIGbAAbkA2ADaigAnM4/AVsR0I8yfLPne8+PRv4g8gXVL0kBFMXJz1KZ9HBlce+IhJVIB2jxl38QmIoAqxkGco44IiGi4a9FHmBm+o+GvJQbO/bpYyWj8ZOEtDAzBrrdBK1pVXmo2ErBbQqntK9+yVWcVIvLfKksMtKw+UUnxIak+co8kVBaKp+oqB1WKAJMCimvVO8XqRcZ3mpabQrkti9WAZUDaVX+hV5o+EnhdULzubjzh52qYc3OUmFHL/xMhRPNk6zOb9XMRutF7gZ5lZmPSVz7z+6AjAITco9Fq1nAAAAAElFTkSuQmCC);
  }

  .andamento-fluxo__fase--concluída &::before {
    color: @amarelo;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAC9SURBVHgB7ZAxDoIwFIb7UHZ3WIxx1oXQwoJLS1z0BngDjiCeQI/gDdx1YmN118QELkFiqCWxxoApYhz5pte+/l/bh1DHXyCEhZ7nDeRaQy0hxN8DoF2e6xO512+Rfwp4UBQ8SpJTXDtgWfMpIXSpEjgO4xjTdbX3+o6u3xcAcMDYD9QvOG6q/Z4s0vQam+ZoqGkoMozxLcsu528EJVC/lYoQiBCsxABnTYKPkndRWTcJlLgu29o2C1HHTzwAp05KMEpINHYAAAAASUVORK5CYII=);
  }
}

.andamento-fluxo__dados-da-fase {
  width: max-content;
  margin-left: auto;
  margin-right: auto;
}

.andamento-fluxo__dias-da-fase {}

.andamento-fluxo__responsável-pela-fase {
  margin-right: auto;
  margin-left: auto;
  max-width: max-content;
}

.título-da-fase-selecionada {
  flex-basis: 50%;
  flex-grow: 1;
}

.campos-de-tarefas {
  border-bottom: 1px solid @c100;
}
</style>
