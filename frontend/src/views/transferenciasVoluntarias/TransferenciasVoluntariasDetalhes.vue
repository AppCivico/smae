<script setup>
import LoadingComponent from '@/components/LoadingComponent.vue';
import { localizarDataHorario, localizarData, dateToShortDate } from '@/helpers/dateToDate';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store.ts';
import { storeToRefs } from 'pinia';
import {
  computed, defineAsyncComponent,
  nextTick, onMounted,
  ref,
} from 'vue';

const AndamentoDoWorkflow = defineAsyncComponent({
  loader: () => import('@/components/transferencia/AndamentoDoWorkflow.vue'),
  loadingComponent: LoadingComponent,
});

const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

const authStore = useAuthStore();
const alertStore = useAlertStore();
const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();
const distribuicaoRecursos = useDistribuicaoRecursosStore();
const workflowAndamento = useWorkflowAndamentoStore();

const { emFoco: transferênciaEmFoco } = storeToRefs(TransferenciasVoluntarias);
const {
  lista: listaDeDistribuição,
  chamadasPendentes: distribuicoesPendentes,
} = storeToRefs(distribuicaoRecursos);
const {
  workflow,
  inícioDeFasePermitido,
  idDaPróximaFasePendente,
} = storeToRefs(workflowAndamento);
const { temPermissãoPara } = storeToRefs(authStore);

const totalDistribuído = computed(() => listaDeDistribuição.value
  .reduce((acc, cur) => acc + (Number(cur.valor) || 0), 0));

const listaDeStatus = ref(null);

function rolarParaStatusCorrente() {
  if (listaDeStatus.value && Array.isArray(distribuição?.historico_status)) {
    const índiceDoStatusCorrente = distribuição.historico_status.findIndex(
      (status) => status.concluida === false,
    );

    nextTick(() => {
      if (listaDeStatus.value) {
        const { children: filhas } = listaDeStatus.value;

        if (filhas[índiceDoStatusCorrente]) {
          listaDeStatus.value.scrollLeft = filhas[índiceDoStatusCorrente].offsetLeft;
        }
      }
    });
  }
}

onMounted(() => {
  // rolarParaStatusCorrente();
});

function iniciarFase(idDaFase) {
  alertStore.confirmAction('Tem certeza?', async () => {
    if (await workflowAndamento.iniciarFase(idDaFase)) {
      workflowAndamento.buscar();
      alertStore.success('Fase iniciada!');
    }
  }, 'Iniciar');
}

function avançarEtapa() {
  alertStore.confirmAction('Tem certeza?', async () => {
    if (await workflowAndamento.avançarEtapa(props.transferenciaId)) {
      workflowAndamento.buscar();
      alertStore.success('Nova etapa iniciada!');
    }
  }, 'Avançar');
}

TransferenciasVoluntarias.buscarItem(props.transferenciaId);
distribuicaoRecursos.buscarTudo({ transferencia_id: props.transferenciaId });
</script>
<template>
  <header class="flex flexwrap spacebetween center mb2 g2">
    <MigalhasDePão />

    <TítuloDePágina />

    <hr class="f1">

    <menu
      v-if="temPermissãoPara('AndamentoWorkflow.listar') && workflow"
      class="flex g1 mr0 mlauto"
    >
      <li class="f0">
        <button
          type="button"
          class="btn"
          :disabled="!inícioDeFasePermitido"
          @click="iniciarFase(idDaPróximaFasePendente)"
        >
          Iniciar fase
        </button>
      </li>
      <li class="f0">
        <button
          v-if="workflow"
          type="button"
          class="btn"
          :disabled="!workflow.pode_passar_para_proxima_etapa"
          @click="avançarEtapa"
        >
          Avançar etapa
        </button>
      </li>
    </menu>
  </header>

  <AndamentoDoWorkflow
    v-if="temPermissãoPara('AndamentoWorkflow.listar') && transferênciaEmFoco?.workflow_id"
    class="mb2"
  />

  <pre v-scrollLockDebug>transferênciaEmFoco:{{ transferênciaEmFoco }}</pre>
  <pre v-scrollLockDebug>listaDeDistribuição:{{ listaDeDistribuição }}</pre>

  <div class="flex g2 flexwrap center mt3 mb2">
    <h3 class="sr-only">
      Identificação
    </h3>
    <hr class="f1">
    <router-link
      :to="{ name: 'TransferenciasVoluntariaEditar' }"
      title="Editar identificação"
      class="btn with-icon bgnone tcprimary p0"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_edit" /></svg>
      Editar
    </router-link>
  </div>

  <div class="flex flexwrap g2 mb2">
    <dl class="f1 fb75 flex g2 flexwrap">
      <div class="f1 fb5em">
        <dt class="t16 w700 mb05 tc500">
          Esfera
        </dt>
        <dd>
          {{ transferênciaEmFoco?.esfera || '-' }}
        </dd>
      </div>
      <div class="f1 fb5em">
        <dt class="t16 w700 mb05 tc500">
          Tipo
        </dt>
        <dd>
          {{ transferênciaEmFoco?.tipo.nome || '-' }}
        </dd>
      </div>
      <div class="f1 fb5">
        <dt class="t16 w700 mb05 tc500">
          Interface
        </dt>
        <dd>
          {{ transferênciaEmFoco?.interface || '-' }}
        </dd>
      </div>
      <div class="f1 fb100">
        <dt class="t16 w700 mb05 tc500">
          Órgão concedente / Secretaria do órgão concedente
        </dt>
        <dd>
          {{ transferênciaEmFoco?.orgao_concedente?.sigla || '-' }} /
          {{ transferênciaEmFoco?.secretaria_concedente || '-' }}
        </dd>
      </div>
    </dl>
    <dl class="f0 fg999 fb10em flex g2 flexwrap align-start">
      <div class="f1 fb10em fg999">
        <dt class="t16 w700 mb05 tc500">
          Valor do repasse
        </dt>
        <dd>
          {{ transferênciaEmFoco?.valor
            ? `R$${dinheiro(transferênciaEmFoco.valor)}`
            : '-' }}
        </dd>
      </div>
      <div class="f1 fb10em fg999">
        <dt class="t16 w700 mb05 tc500">
          Valor total
        </dt>
        <dd>
          {{ transferênciaEmFoco?.valor_total
            ? `R$${dinheiro(transferênciaEmFoco.valor_total)}`
            : '-' }}
        </dd>
      </div>
      <div class="f1 fb10em fg999">
        <dt class="t16 w700 mb05 tc500">
          Valor distribuído
        </dt>
        <dd>
          {{ totalDistribuído
            ? `R$${dinheiro(totalDistribuído)}`
            : '-' }}
        </dd>
      </div>
      <div class="f1 fb10em fg999 align-end">
        <dt class="sr-only">
          Progresso da distribuição de recursos
        </dt>
        <dd>
          <progress
            id="file"
            :max="transferênciaEmFoco?.valor"
            :value="totalDistribuído"
          />
        </dd>
      </div>
    </dl>
  </div>

  <div class="flex g2 center mt3 mb2">
    <h3 class="w400 tc300 t20 mb0">
      Parlamentares
    </h3>
    <hr class="f1">
  </div>

  <div
    v-for="parlamentar in transferênciaEmFoco?.parlamentares"
    :key="parlamentar.id"
    class="mb2"
  >
    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt class="t16 w700 mb05 tc500">
          Parlamentar
        </dt>
        <dd>
          {{ parlamentar.parlamentar.nome_popular || '-' }}
        </dd>
      </dl>

      <dl class="f1">
        <dt class="t16 w700 mb05 tc500">
          Partido
        </dt>
        <dd>
          {{ parlamentar.partido.sigla || '-' }}
        </dd>
      </dl>

      <dl class="f1">
        <dt class="t16 w700 mb05 tc500">
          Cargo
        </dt>
        <dd>
          {{ parlamentar.cargo || '-' }}
        </dd>
      </dl>

      <dl class="f1">
        <dt class="t16 w700 mb05 tc500">
          Valor
        </dt>
        <dd>
          {{ parlamentar.valor ? `R$${dinheiro(parlamentar.valor)}` : '-' }}
        </dd>
      </dl>
    </div>

    <dl class="f1">
      <dt class="t16 w700 mb05 tc500">
        objeto
      </dt>
      <dd>
        {{ parlamentar.objeto || '-' }}
      </dd>
    </dl>
  </div>

  <section class="resumo-da-distribuicao-de-recursos pt2 pb1">
    <LoadingComponent v-if="distribuicoesPendentes.lista" />

    <div
      v-for="distribuição in listaDeDistribuição"
      :key="distribuição.id"
      class="resumo-da-distribuicao-de-recursos__item mb2"
    >
      <div class="resumo-da-distribuicao-de-recursos__descricao f1 fb75 mb2">
        <hgroup class="resumo-da-distribuicao-de-recursos__titulo flex g1">
          <h3 class="ml0 t16 w700 tc500">
            <abbr
              v-if="distribuição.orgao_gestor"
              :title="distribuição.orgao_gestor.descricao"
            >
              {{ distribuição.orgao_gestor.sigla }}
            </abbr>
          </h3>
          <h4 class="mlauto mr0 t16 w700 tc300">
            {{ distribuição.valor
              ? `R$${dinheiro(distribuição.valor)}`
              : '' }}
          </h4>
          <h5
            class="resumo-da-distribuicao-de-recursos__percentagem mr0 t16 w700 tc500"
          >
            {{ distribuição.pct_valor_transferencia }}%
          </h5>
        </hgroup>

        <div class="resumo-da-distribuicao-de-recursos__objeto contentStyle f1">
          {{ distribuição.objeto || '-' }}
        </div>
      </div>

      <dl
        class="resumo-da-distribuicao-de-recursos__lista-de-status f0 fg999 fb10em
      flex flexwrap g2 align-end"
      >
        <div
          v-if=" distribuição?.historico_status"
          class="resumo-da-distribuicao-de-recursos__status-item f1 mb1"
        >
          <ul
            ref="listaDeStatus"
            class="flex pb1 andamento-fluxo__lista-de-fases"
          >
            <li
              v-for="(status, index) in distribuição.historico_status"
              :key="status.id"
              class="p1 tc andamento-fluxo__fase"
              :class="index === distribuição.historico_status.length - 1 && index === 0? 'andamento-fluxo__fase--iniciada' : 'andamento-fluxo__fase--concluída'"
            >
              <div class="status-item__header">
                <dt class="w700 t16 andamento-fluxo__nome-da-fase">
                  {{ status.status_customizado?.nome || status.status_base?.nome }}
                </dt>
                <dd
                  v-if="status.dias_no_status"
                  class="card-shadow tc500 p1 mt1 block andamento-fluxo__dados-da-fase"
                >
                  <time :datetime="status.data_troca">
                    <strong>+ {{ status.dias_no_status }} dias </strong>
                    <span class="tipinfo">
                      <svg
                        width="16"
                        height="16"
                      >
                        <use xlink:href="#i_i" />
                      </svg>
                      <div>desde {{ dateToShortDate(status.data_troca) }}</div>
                    </span>
                    <p class="mb0">
                      {{ status.nome_responsavel }}
                    </p>
                  </time>
                </dd>
              </div>
            </li>
          </ul>
          <dd
            v-if="distribuição.parlamentares.length"
            class="parlamentares"
          >
            <div
              v-for="parlamentar, index in distribuição.parlamentares"
              :key="parlamentar.id"
              :class="['flex spacebetween center g2', { 'mt1': index > 0}]"
            >
              <dl
                class="f1"
              >
                <dt class="t16 w700 mb05 tc500">
                  Parlamentar
                </dt>
                <dd>{{ parlamentar.parlamentar.nome_popular }}</dd>
              </dl>
              <hr class="f2">
              <dl class="f2">
                <dt class="t16 w700 mb05 tc500 f1">
                  Valor do recurso
                </dt>
                <dd class="tc300">
                  <strong
                    v-if="parlamentar?.valor && transferênciaEmFoco?.valor"
                  >
                    R$ {{ dinheiro(parlamentar.valor) || '0' }} ({{
                      (parlamentar.valor / transferênciaEmFoco.valor *
                        100).toFixed() }}%)
                  </strong>
                </dd>
              </dl>
            </div>
          </dd>
        </div>
      </dl>
    </div>
  </section>

  <div class="flex g2 center mt3 mb2">
    <h3 class="w400 tc300 t20 mb0">
      Transferência
    </h3>
    <hr class="f1">
  </div>

  <div>
    <div>
      <div class="flex g2 flexwrap mb2">
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Ano
          </dt>
          <dd>
            {{ transferênciaEmFoco?.ano || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Código do programa
          </dt>
          <dd>
            {{ transferênciaEmFoco?.programa || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Nome do Programa
          </dt>
          <dd>
            {{ transferênciaEmFoco?.nome_programa || '-' }}
          </dd>
        </dl>
      </div>
      <div>
        <dl class="f1 mb1">
          <dt class="t16 w700 mb05 tc500">
            Objeto/Empreendimento
          </dt>
          <dd class="text">
            {{ transferênciaEmFoco?.objeto || '-' }}
          </dd>
        </dl>
        <dl class="f1 mb1">
          <dt class="t16 w700 mb05 tc500">
            Detalhamento
          </dt>
          <dd class="text">
            {{ transferênciaEmFoco?.detalhamento }}
          </dd>
        </dl>
      </div>
    </div>

    <div>
      <div class="flex g2 flexwrap">
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Cláusula suspensiva
          </dt>
          <dd>
            {{ transferênciaEmFoco?.clausula_suspensiva ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Data de vencimento
          </dt>
          <dd>
            {{ transferênciaEmFoco?.clausula_suspensiva_vencimento
              ? dateToField(transferênciaEmFoco.clausula_suspensiva_vencimento)
              : '-' }}
          </dd>
        </dl>
      </div>
    </div>

    <div>
      <dl class="f1 mb1">
        <dt class="t16 w700 mb05 tc500">
          Normativa
        </dt>
        <dd>
          {{ transferênciaEmFoco?.normativa || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t16 w700 mb05 tc500">
          Observações
        </dt>
        <dd>
          {{ transferênciaEmFoco?.observacoes || '-' }}
        </dd>
      </dl>
    </div>
  </div>

  <div class="flex g2 flexwrap center mt2 mb1">
    <h3 class="w400 tc300 mb0 t20">
      Recurso Financeiro
    </h3>
    <hr class="f1">
    <router-link
      :to="{ name: 'RegistroDeTransferenciaEditar' }"
      title="Editar recursos financeiros"
      class="btn with-icon bgnone tcprimary p0"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_edit" /></svg>
      Editar
    </router-link>
  </div>

  <div class="flex flexwrap g2 mb3">
    <div class="grid f1">
      <dl class="mb1">
        <dt class="t16 w700 mb05 tc500">
          Empenho
        </dt>
        <dd>
          {{ transferênciaEmFoco?.empenho ? 'Sim' : 'Não' }}
        </dd>
      </dl>
      <dl class="mb1">
        <dt class="t16 w700 mb05 tc500">
          Ordenador de despesas
        </dt>
        <dd>
          {{ transferênciaEmFoco?.ordenador_despesa || '-' }}
        </dd>
      </dl>
      <dl class="mb1">
        <dt class="t16 w700 mb05 tc500">
          Gestor municipal do contrato
        </dt>
        <dd>
          {{ transferênciaEmFoco?.gestor_contrato || '-' }}
        </dd>
      </dl>
    </div>
    <div class="grid f1">
      <dl class="mb1">
        <dt class="t16 w700 mb05 tc500">
          Dotação
        </dt>
        <dd>
          {{ transferênciaEmFoco?.dotacao || '-' }}
        </dd>
      </dl>
    </div>
  </div>

  <div class="flex g2 center mt3 mb2">
    <h3 class="w400 tc300 mb0 t20">
      Dados Bancários de Aceite
    </h3>
    <hr class="f1">
  </div>

  <div class="flex g2 flexwrap mb1">
    <dl class="f1">
      <dt class="t16 w700 mb05 tc500">
        Banco
      </dt>
      <dd>
        {{ transferênciaEmFoco?.banco_aceite || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tc500">
        Agência
      </dt>
      <dd>
        {{ transferênciaEmFoco?.agencia_aceite || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tc500">
        Conta
      </dt>
      <dd>
        {{ transferênciaEmFoco?.conta_aceite || '-' }}
      </dd>
    </dl>
  </div>

  <div class="flex g2 center mt3 mb2">
    <h3 class="w400 tc300 t20 mb0">
      Dados bancários secretaria fim
    </h3>
    <hr class="f1">
  </div>

  <div class="flex g2 flexwrap mb1">
    <dl class="f1">
      <dt class="t16 w700 mb05 tc500">
        Banco
      </dt>
      <dd>
        {{ transferênciaEmFoco?.banco_fim || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tc500">
        Agência
      </dt>
      <dd>
        {{ transferênciaEmFoco?.agencia_fim || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tc500">
        Conta
      </dt>
      <dd>
        {{ transferênciaEmFoco?.conta_fim || '-' }}
      </dd>
    </dl>
  </div>

  <div class="flex g2 flexwrap center mt3 mb2">
    <h3 class="w400 tc300 mb0 t20">
      Distribuição de Recursos
    </h3>
    <hr class="f1">
    <router-link
      :to="{ name: 'TransferenciaDistribuicaoDeRecursosEditar' }"
      title="Editar distribuição de recursos"
      class="btn with-icon bgnone tcprimary p0"
    >
      <svg
        width="20"
        height="20"
      ><use xlink:href="#i_edit" /></svg>
      Editar
    </router-link>
  </div>

  <section
    v-for="distribuição in listaDeDistribuição"
    :key="distribuição.id"
    class="mb2 pt1"
  >
    <div class="mb1">
      <dl class="mb1">
        <dt class="t16 w700 mb05 tc500">
          Gestor municipal
        </dt>
        <dd>
          {{ distribuição.orgao_gestor
            ? `${distribuição.orgao_gestor.sigla} - ${distribuição.orgao_gestor.descricao}`
            : '-' }}
        </dd>
      </dl>
      <dl class="f1">
        <dt class="t16 w700 mb05 tc500">
          Objeto/Empreendimento
        </dt>
        <dd>
          {{ distribuição.objeto || '-' }}
        </dd>
      </dl>
    </div>

    <div class="flex flexwrap g2 mb2">
      <div class="grid valores f1">
        <dl class="mb1">
          <dt class="t16 w700 mb05 tc500">
            Valor do repasse
          </dt>
          <dd>
            {{ distribuição.valor ? `R$${dinheiro(distribuição.valor)}` : '-' }}
          </dd>
        </dl>
        <dl class="mb1">
          <dt class="t16 w700 mb05 tc500">
            Valor contrapartida
          </dt>
          <dd>
            {{ distribuição.valor_contrapartida
              ? `R$${dinheiro(distribuição.valor_contrapartida)}`
              : '-' }}
          </dd>
        </dl>
        <dl class="mb1">
          <dt class="t16 w700 mb05 tc500">
            Valor total
          </dt>
          <dd>
            {{ distribuição.valor_total
              ? `R$${dinheiro(distribuição.valor_total)}`
              : '-' }}
          </dd>
        </dl>
      </div>
      <div class="grid f1">
        <dl class="mb1">
          <dt class="t16 w700 mb05 tc500">
            Empenho
          </dt>
          <dd>
            {{ distribuição.empenho ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="mb1">
          <dt class="t16 w700 mb05 tc500">
            Programa orçamentário municipal
          </dt>
          <dd>
            {{ distribuição.programa_orcamentario_municipal || '-' }}
          </dd>
        </dl>
        <dl class="mb1">
          <dt class="t16 w700 mb05 tc500">
            Programa orçamentário estadual
          </dt>
          <dd>
            {{ distribuição.programa_orcamentario_estadual || '-' }}
          </dd>
        </dl>
      </div>
      <div class="grid f1">
        <dl class="mb1">
          <dt class="t16 w700 mb05 tc500">
            Dotação orçamentária
          </dt>
          <dd>
            {{ distribuição.dotacao || '-' }}
          </dd>
        </dl>
      </div>
    </div>

    <div>
      <table
        v-if="distribuição.registros_sei?.length"
        class="tablemain no-zebra horizontal-lines mb1"
      >
        <caption class="t16 w700 mb05 tc500 tl">
          Números SEI
        </caption>
        <col class="col--botão-de-ação">
        <col>
        <col class="col--dataHora">
        <col class="col--dataHora">
        <col class="col--data">
        <col>
        <col>
        <col class="col--botão-de-ação">

        <thead>
          <th />
          <th class="cell--nowrap">
            Código
          </th>
          <th>Tipo</th>
          <th>Especificação</th>
          <th>Alteração</th>
          <th>Andamento</th>
          <th>Unidade</th>
          <th>Usuário</th>
          <th />
        </thead>

        <tbody>
          <tr
            v-for="registro, idx in distribuição.registros_sei"
            :key="idx"
          >
            <td>
              <span
                v-if="registro?.integracao_sei?.relatorio_sincronizado_em"
                class="tipinfo right"
              >
                <svg
                  width="24"
                  height="24"
                  color="#F2890D"
                >
                  <use xlink:href="#i_i" />
                </svg>

                <div>
                  Sincronização:
                  {{ localizarDataHorario(registro?.integracao_sei?.relatorio_sincronizado_em) }}
                </div>
              </span>
            </td>
            <th class="cell--nowrap">
              {{ registro?.processo_sei }}
            </th>
            <th>{{ registro?.integracao_sei?.json_resposta?.tipo }}</th>
            <th>{{ registro?.integracao_sei?.json_resposta?.especificacao }}</th>
            <td>
              {{ localizarDataHorario(registro?.integracao_sei?.sei_atualizado_em) }}
            </td>
            <td>{{ localizarData(registro?.integracao_sei?.processado?.ultimo_andamento_em) }}</td>
            <td>
              {{ registro?.integracao_sei?.processado?.ultimo_andamento_unidade?.descricao }}
              -
              {{ registro?.integracao_sei?.processado?.ultimo_andamento_unidade?.sigla }}
            </td>
            <td>{{ registro?.integracao_sei?.processado?.ultimo_andamento_por?.nome }}</td>
            <td>
              <SmaeLink
                v-if="registro?.integracao_sei?.link"
                :to="registro?.integracao_sei?.link"
                title="Abrir no site do SEI"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_link" /></svg>
              </SmaeLink>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex g2 flexwrap mb1">
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Número proposta
          </dt>
          <dd>
            {{ distribuição.proposta || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Número do convênio/pré convênio
          </dt>
          <dd>
            {{ distribuição.convenio || '-' }}
          </dd>
        </dl>
      </div>
      <div class="flex g2 flexwrap mb1">
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Número do contrato
          </dt>
          <dd>
            {{ distribuição.contrato || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Data de vigência
          </dt>
          <dd>
            {{ distribuição.vigencia
              ? dateToField(distribuição.vigencia)
              : '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Motivo do aditamento
          </dt>
          <dd>
            {{ distribuição.aditamentos[0]?.justificativa || ' - ' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Data de conclusão da suspensiva
          </dt>
          <dd>
            {{ distribuição.conclusao_suspensiva
              ? dateToField(distribuição.conclusao_suspensiva)
              : '-' }}
          </dd>
        </dl>
      </div>
    </div>

    <div class="flex g2 center mt3 mb2">
      <h3 class="w400 tc300 t20 mb0">
        Assinaturas
      </h3>
      <hr class="f1">
    </div>

    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt class="t16 w700 mb05 tc500">
          Data da assinatura do termo de aceite
        </dt>
        <dd v-if="distribuição?.assinatura_termo_aceite">
          {{ dateToField(distribuição.assinatura_termo_aceite) }}
        </dd>
      </dl>
      <dl class="f1">
        <dt class="t16 w700 mb05 tc500">
          Data da assinatura do representante do estado
        </dt>
        <dd v-if="distribuição?.assinatura_estado">
          {{ dateToField(distribuição.assinatura_estado) }}
        </dd>
      </dl>
      <dl class="f1">
        <dt class="t16 w700 mb05 tc500">
          Data da assinatura do representante do município
        </dt>
        <dd v-if="distribuição?.assinatura_municipio">
          {{ dateToField(distribuição.assinatura_municipio) }}
        </dd>
      </dl>
    </div>
  </section>
</template>
<style scoped lang="less">
.parlamentares{
  border-left: solid 2px #B8C0CC;
  border-radius: 12px;
  padding: 20px;
  max-width: 700px;

  h4{
    color: #607A9F;
    font-weight: 700;
    font-size: 20px;
  }
}

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

section + section {
  border-top: 1px solid @c100;
}

.text {
  line-height: 24px;
}

.valores {
  border-right: solid 2px #B8C0CC;
  border-radius: 12px;
}

.resumo-da-distribuicao-de-recursos {
  * + & {
    border-top: 1px solid @c100;
  }
}

.resumo-da-distribuicao-de-recursos__item {}

.resumo-da-distribuicao-de-recursos__descricao {}

.resumo-da-distribuicao-de-recursos__titulo {}

.resumo-da-distribuicao-de-recursos__percentagem {
  &::before {
    content: '(';
  }

  &::after {
    content: ')';
  }
}

.resumo-da-distribuicao-de-recursos__objeto {}

.resumo-da-distribuicao-de-recursos__lista-de-status {
}

.resumo-da-distribuicao-de-recursos__status-item {
}
</style>
