<script setup>
// Não finalizado
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { workflow as schema } from '@/consts/formSchemas';
import responsabilidadeEtapaFluxo from '@/consts/responsabilidadeEtapaFluxo';
import { useAlertStore } from '@/stores/alert.store';
import { useFluxosEtapasProjetosStore } from '@/stores/fluxosEtapasProjeto.store';
import { useFluxosFasesProjetosStore } from '@/stores/fluxosFasesProjeto.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import { useFluxosTarefasProjetosStore } from '@/stores/fluxosTarefaProjeto.store';
import { useStatusDistribuicaoWorflowStore } from '@/stores/statusDistribuicaoWorkflow.store';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';
import EtapaFluxo from '@/views/fluxosProjeto/EtapaFluxo.vue';
import FaseFluxo from '@/views/fluxosProjeto/FaseFluxo.vue';
import TarefaFluxo from '@/views/fluxosProjeto/TarefaFluxo.vue';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import {
  computed, onUnmounted, ref, watch, watchEffect,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

const fluxosEtapasProjetos = useFluxosEtapasProjetosStore();
const tipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const fluxosProjetoStore = useFluxosProjetosStore();
const fluxosFasesProjetos = useFluxosFasesProjetosStore();
const fluxosTarefasProjetos = useFluxosTarefasProjetosStore();
const statusDistribuicaoWorflowStore = useStatusDistribuicaoWorflowStore();
const alertStore = useAlertStore();
const router = useRouter();
const route = useRoute();

const { lista: tipoTransferenciaComoLista } = storeToRefs(tipoDeTransferenciaStore);
const { lista: statusesDistribuicaoComoLista } = storeToRefs(statusDistribuicaoWorflowStore);
const {
  chamadasPendentes, erro, itemParaEdicao, emFoco,
} = storeToRefs(fluxosProjetoStore);
const { chamadasPendentes: fasesPendentes } = storeToRefs(fluxosFasesProjetos);
const { chamadasPendentes: tarefasPendentes } = storeToRefs(fluxosTarefasProjetos);

const esferaSelecionada = ref('');
const tipoTransferenciaSelecionado = ref('');
const idDaEtapaEmFoco = ref(-1);
const idDaTarefaEmFoco = ref(-1);
const idDoRelacionamentoComFase = ref(-1);
const idDaMãeDaFase = ref(0);
const idDaMãeDaTarefa = ref(0);
const statusesDistribuicaoSelecionados = ref([]);

const props = defineProps({
  fluxoId: {
    type: Number,
    default: 0,
  },
  tipoDeTransferenciaId: {
    type: Number,
    default: 0,
  },
  item: {
    type: Object,
    required: true,
  },
});

const {
  errors, isSubmitting, setFieldValue, handleSubmit,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const tiposDisponíveis = computed(() => (esferaSelecionada.value
  ? tipoTransferenciaComoLista.value
    .filter((x) => x.esfera === esferaSelecionada.value)
  : []));

// =============================================================================
// Lucas 23:34
// =============================================================================
statusesDistribuicaoSelecionados.value = [];

const statusesBaseSelecionados = computed(() => (statusesDistribuicaoSelecionados.value
  ? statusesDistribuicaoSelecionados.value
    .filter((status) => status?.status_base)
    .map((status) => status.id) : []));

const statusesCustomizadosSelecionados = computed(() => (statusesDistribuicaoSelecionados.value
  ? statusesDistribuicaoSelecionados.value
    .filter((status) => !!status && !status?.status_base)
    .map((status) => status?.id) : []));

watchEffect(() => {
  setFieldValue('statuses', statusesDistribuicaoSelecionados.value);
  setFieldValue('statusesBaseSelecionados', statusesBaseSelecionados.value);
  setFieldValue('statusesCustomizadosSelecionados', statusesCustomizadosSelecionados.value);
});

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      ...values,
      distribuicao_statuses_base: statusesBaseSelecionados.value,
      distribuicao_statuses_customizados: statusesCustomizadosSelecionados.value,
    };

    const msg = props.fluxoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = await fluxosProjetoStore.salvarItem(payload, props.fluxoId);
    if (resposta) {
      alertStore.success(msg);
      fluxosProjetoStore.$reset();
      fluxosProjetoStore.buscarTudo();
      router.push({ name: 'fluxosListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function markCheckboxesWithSavedValues() {
  if (emFoco?.value.statuses_distribuicao && emFoco?.value.statuses_distribuicao.length > 0) {
    statusesDistribuicaoSelecionados.value = emFoco?.value.statuses_distribuicao.map((status) => ({
      id: status.id,
      status_base: status.status_base,
    }));
  }
}

async function carregarFluxo() {
  if (props.fluxoId) {
    // PRA-FAZER: reavaliar a necessidade desse `await`
    await fluxosProjetoStore.buscarItem(props.fluxoId);
  }
}

async function iniciar() {
  await tipoDeTransferenciaStore.buscarTudo();
  await carregarFluxo();
  markCheckboxesWithSavedValues();
}

function excluirFase(idDaFase) {
  alertStore.confirmAction('Tem certeza?', async () => {
    if (await fluxosFasesProjetos.excluirItem(idDaFase)) {
      alertStore.success('Fase excluída!');
      iniciar();
    }
  }, 'Excluir');
}

function excluirTarefa(idDaTarefa) {
  alertStore.confirmAction('Tem certeza?', async () => {
    if (await fluxosTarefasProjetos.excluirItem(idDaTarefa)) {
      alertStore.success('Tarefa excluída!');
      iniciar();
    }
  }, 'Excluir');
}

function excluirEtapa(idDaEtapa) {
  alertStore.confirmAction('Tem certeza?', async () => {
    if (await fluxosEtapasProjetos.excluirItem(idDaEtapa)) {
      alertStore.success('Etapa excluída!');
      iniciar();
    }
  }, 'Excluir');
}
iniciar();

onUnmounted(() => {
  emFoco.value = null;
});

watch(itemParaEdicao, (novoValor) => {
  if (novoValor.transferencia_tipo?.id) {
    tipoTransferenciaSelecionado.value = novoValor.transferencia_tipo.id;
    statusDistribuicaoWorflowStore.buscarTudo();
    esferaSelecionada.value = tipoTransferenciaComoLista.value
      .find((x) => x.id === novoValor.transferencia_tipo.id)?.esfera || '';
  }
}, { immediate: true });

watch(statusesDistribuicaoSelecionados, (newValue) => {
  setFieldValue('statuses', newValue);
}, { immediate: true });

</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Cadastro de Fluxo' }}</h1>
    <hr class="ml2 f1">
  </div>
  <EtapaFluxo
    v-if="idDaEtapaEmFoco > -1"
    :ordem="item?.ordem || null"
    :item="item"
    :workflow_etapa_de_id="workflow_etapa_de_id"
    :workflow_etapa_para_id="workflow_etapa_para_id"
    :etapa-id="idDaEtapaEmFoco"
    @close="idDaEtapaEmFoco = -1"
    @saved="carregarFluxo()"
  />

  <FaseFluxo
    v-if="idDoRelacionamentoComFase > -1"
    :relacionamento-id="idDoRelacionamentoComFase"
    :etapa-id="idDaMãeDaFase"
    @close="idDoRelacionamentoComFase = -1"
    @saved="carregarFluxo()"
  />

  <TarefaFluxo
    v-if="idDaTarefaEmFoco > -1"
    :fase-id="idDaMãeDaTarefa"
    :relacionamento-id="idDaTarefaEmFoco"
    @close="() => {
      idDaTarefaEmFoco = -1;
      idDaMãeDaTarefa = 0;
    }"
    @saved="carregarFluxo()"
  />

  <form
    :disabled="isSubmitting"
    @submit.prevent="onSubmit"
  >
    <div class="flex g2 mb1 center">
      <div class="f1">
        <LabelFromYup
          name="nome"
          :schema="schema"
        />
        <Field
          name="nome"
          type="text"
          class="inputtext light mb1"
          :disabled="emFoco?.edicao_restrita"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="nome"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="esfera"
          :schema="schema"
        />
        <select
          v-model="esferaSelecionada"
          name="esfera"
          class="inputtext light mb1"
          :class="{ 'error': errors.esfera }"
          :disabled="emFoco?.edicao_restrita"
          @change="setFieldValue('transferencia_tipo_id', null)"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="esfera in Object.values(esferasDeTransferencia)"
            :key="esfera.valor"
            :value="esfera.valor"
          >
            {{ esfera.nome }}
          </option>
        </select>
        <div class="error-msg">
          {{ errors.esfera }}
        </div>
      </div>
      <div class="f1">
        <LabelFromYup
          name="transferencia_tipo_id"
          :schema="schema"
        />
        <Field
          name="transferencia_tipo_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.transferencia_tipo_id,
            loading: tipoDeTransferenciaStore.chamadasPendentes?.lista,
          }"
          :disabled="!tiposDisponíveis.length || emFoco?.edicao_restrita"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="tipo in tiposDisponíveis"
            :key="tipo"
            :value="tipo.id"
          >
            {{ tipo.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="transferencia_tipo_id"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1 center">
      <div class="f1">
        <LabelFromYup
          name="inicio"
          :schema="schema"
        />
        <Field
          name="inicio"
          type="date"
          class="inputtext light mb1"
          :class="{ errors: errors.inicio }"
          maxlength="10"
          :disabled="emFoco?.edicao_restrita"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('inicio', $v || null); }"
        />
        <ErrorMessage
          name="inicio"
          class="error-msg"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="termino"
          :schema="schema"
        />
        <Field
          name="termino"
          type="date"
          class="inputtext light mb1"
          :class="{ errors: errors.termino }"
          maxlength="10"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('termino', $v || null); }"
        />
        <ErrorMessage
          name="termino"
          class="error-msg"
        />
      </div>
      <div
        v-if="props.fluxoId"
        class="f1 flex"
      >
        <Field
          name="ativo"
          type="checkbox"
          :value="true"
          :unchecked-value="false"
          class="inputcheckbox mr1"
        />
        <LabelFromYup
          name="ativo"
          :schema="schema"
        />
        <ErrorMessage
          class="error-msg"
          name="ativo"
        />
      </div>
      <FormErrorsList :errors="errors" />
    </div>

    <div class="flex g2 mb1 center">
      <LabelFromYup
        name="distribuicao_status"
        :schema="schema"
      />
    </div>
    <div class="flex g2 mb1 center">
      <div class="flex flexwrap g1 lista-de-opções">
        <label
          v-for="s in statusesDistribuicaoComoLista"
          :key="`${s.id}-${s.status_base}`"
          class="tc600 lista-de-opções__item"
        >
          <Field
            v-model="statusesDistribuicaoSelecionados"
            name="statuses"
            :value="{ id: s.id, status_base: s.status_base }"
            type="checkbox"
            class="inputcheckbox"
            :class="{ 'error': errors['parametros.tipo'] }"
          />
          <span>
            {{ s.nome }}
          </span>
        </label>
      </div>
    </div>
    <FormErrorsList :errors="errors" />

    <span
      v-if="chamadasPendentes?.emFoco"
      class="spinner"
    >Carregando</span>
    <div
      v-if="erro"
      class="error p1 mb1"
    >
      <div class="error-msg">
        {{ erro }}
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
  </form>

  <div
    v-if="props.fluxoId"
    class="flex spacebetween center mb2"
  >
    <h1>Etapas do fluxo</h1>
    <hr class="ml2 f1">
    <button
      v-if="emFoco && !emFoco?.edicao_restrita"
      class="btn ml2"
      @click="idDaEtapaEmFoco = 0"
    >
      Adicionar etapa
    </button>
  </div>

  <div class="todasTabela">
    <div
      v-for="etapa in emFoco?.fluxo"
      :key="etapa.id"
      class="cadaTabela"
    >
      <div class="flex flexwrap center">
        <div class="flex">
          <span class="ordem">{{ etapa && etapa.ordem ? etapa.ordem : '' }}</span>
          <h2 class="mb0 fb50 f1 tituloTabela flex g1 center">
            Etapa <span>{{ etapa.fluxo_etapa_de.etapa_fluxo }}</span>
            para <span>{{ etapa.fluxo_etapa_para.etapa_fluxo }}</span>
          </h2>
        </div>
        <hr class="ml2 f1">
        <div class="flex f0 spacebetween g1 center mlauto mr0">
          <button
            v-if="emFoco && !emFoco?.edicao_restrita"
            class="btn ml2"
            @click="() => {
              idDoRelacionamentoComFase = 0;
              idDaMãeDaFase = etapa.id;
            }"
          >
            Adicionar fase
          </button>
          <button
            v-if="emFoco && !emFoco?.edicao_restrita"
            class="btn outline bgnone tcprimary mtauto"
            :ordem="etapa.ordem"
            :workflow_etapa_de_id="etapa.workflow_etapa_de_id"
            :workflow_etapa_para_id="etapa.workflow_etapa_para_id"
            @click="idDaEtapaEmFoco = etapa.id"
          >
            Editar etapa
          </button>
          <button
            v-if="emFoco && !emFoco?.edicao_restrita"
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirEtapa(etapa.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_waste" /></svg>
          </button>
        </div>
      </div>
      <div
        role="region"
        aria-label="Tabela de etapas do fluxo"
        tabindex="0"
      >
        <table class="tablemain mb4">
          <col>
          <col class="col--minimum">
          <col class="col--minimum">
          <col>
          <col>
          <col class="col--botão-de-ação">
          <col class="col--botão-de-ação">
          <col class="col--botão-de-ação">
          <thead>
            <tr>
              <th>
                Fase
              </th>
              <th class="cell--number">
                Duração
              </th>
              <th>
                Marco
              </th>
              <th class="cell--nowrap">
                Responsabilidade
              </th>
              <th>
                Situação
              </th>
            </tr>
          </thead>
          <tbody
            v-for="fase in etapa.fases"
            :key="fase.id"
          >
            <tr v-scrollLockDebug>
              <td colspan="6">
                <pre>fase:{{ fase }}</pre>
              </td>
            </tr>
            <tr>
              <td
                :class="{
                  loading: fasesPendentes?.lista
                }"
              >
                {{ fase.fase.fase }}
              </td>
              <td class="cell--number">
                {{ fase.duracao ? `${fase.duracao} dias` : '-' }}
              </td>
              <td class="cell--nowrap">
                {{ fase.marco ? 'sim' : 'não' }}
              </td>
              <td class="cell--nowrap">
                {{ responsabilidadeEtapaFluxo[fase.responsabilidade]?.nome
                  || fase.responsabilidade }}
              </td>
              <td>
                <template v-if="fase.situacoes && fase.situacoes.length">
                  {{ fase.situacoes.map(situacao => situacao.situacao).join(', ') }}
                </template>
                <template v-else>
                  -
                </template>
              </td>
              <td>
                <button
                  v-if="emFoco && !emFoco?.edicao_restrita"
                  class="bgnone like-a__text"
                  @click="() => {
                    idDaTarefaEmFoco = 0;
                    idDaMãeDaTarefa = fase.id;
                  }"
                >
                  <svg
                    width="20"
                    height="20"
                  >
                    <use xlink:href="#i_+" />
                  </svg>
                </button>
              </td>
              <td>
                <button
                  v-if="emFoco && !emFoco?.edicao_restrita"
                  class="like-a__text"
                  arial-label="excluir"
                  title="excluir"
                  @click="excluirFase(fase.id)"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_remove" /></svg>
                </button>
              </td>
              <td>
                <button
                  v-if="emFoco && !emFoco?.edicao_restrita"
                  class="bgnone like-a__text"
                  @click="() => {
                    idDoRelacionamentoComFase = fase.id;
                    idDaMãeDaFase = etapa.id;
                  }"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_edit" /></svg>
                </button>
              </td>
            </tr>
            <tr
              v-for="tarefa in fase.tarefas"
              :key="tarefa.id"
              class="tarefaTabela"
            >
              <td
                class="cell--nowrap"
                :class="{
                  loading: tarefasPendentes?.lista
                }"
              >
                <span class="tarefa pl3">Tarefa</span>
                {{ tarefa.workflow_tarefa.descricao || "-" }}
              </td>
              <td class="cell--number">
                {{ tarefa.duracao ? `${tarefa.duracao} dias` : '-' }}
              </td>
              <td class="cell--nowrap">
                {{ tarefa.marco ? 'sim' : 'não' }}
              </td>
              <td class="cell--nowrap">
                {{ responsabilidadeEtapaFluxo[tarefa.responsabilidade]?.nome
                  || tarefa.responsabilidade }}
              </td>
              <td />
              <td />
              <td>
                <button
                  v-if="emFoco && !emFoco?.edicao_restrita"
                  class="like-a__text"
                  arial-label="excluir"
                  title="excluir"
                  @click="excluirTarefa(tarefa.id)"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_remove" /></svg>
                </button>
              </td>
              <td>
                <button
                  v-if="emFoco && !emFoco?.edicao_restrita"
                  class="bgnone like-a__text"
                  @click="() => {
                    idDaTarefaEmFoco = tarefa.id;
                    idDaMãeDaTarefa = fase.id;
                  }"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_edit" /></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .tituloTabela span{
    color:#607A9F;
  }

  span.ordem {
      width: 46px;
      height: 46px;
      color: #fff;
      padding: 16px;
      text-align: center;
      border-radius: 50%;
      position: relative;
      right: 25px;
  }

  .tablemain td {
    padding: 4px 1em;
  }

  .todasTabela > div:nth-child(odd) .ordem {
    background-color:#4074BF;
  }

  .todasTabela > div:nth-child(even) .ordem  {
    background-color: #F7C234;
  }

  .todasTabela > .cadaTabela:nth-child(even) {
    border-left: 4px solid #F7C234;
  }

  .todasTabela > .cadaTabela:nth-child(odd) {
    border-left: 4px solid #4074BF;
  }

  .tablemain tr:nth-of-type(even) {
      background: transparent;
  }

  .tarefa {
    color: #4074BF;
    font-weight: 700;
  }

  .tarefaTabela span::after {
      content: '';
      display: inline-block;
      width: 40px;
      height: 1px;
      background: #4074BF;
      vertical-align: middle;
      margin: 0 24px 0 24px;

  }
</style>
