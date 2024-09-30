<script setup>
import { storeToRefs } from 'pinia';
import {
  defineAsyncComponent,
  nextTick, onMounted,
  ref,
} from 'vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import { dateToShortDate, localizarData, localizarDataHorario } from '@/helpers/dateToDate';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store.ts';

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

const { emFoco: transferenciaEmFoco } = storeToRefs(TransferenciasVoluntarias);
const {
  lista: listaDeDistribuicao,
  chamadasPendentes: distribuicoesPendentes,
} = storeToRefs(distribuicaoRecursos);
const {
  workflow,
  inícioDeFasePermitido,
  idDaPróximaFasePendente,
} = storeToRefs(workflowAndamento);
const { temPermissãoPara } = storeToRefs(authStore);

const listaDeStatus = ref(null);

function rolarParaStatusCorrente() {
  if (listaDeStatus.value && Array.isArray(distribuicao?.historico_status)) {
    const índiceDoStatusCorrente = distribuicao.historico_status.findIndex(
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

function atualizaSeiLido(item, transferenciaId, lido) {
  // eslint-disable-next-line no-param-reassign
  item.lido = lido;

  distribuicaoRecursos.selectionarSeiLido({
    id: transferenciaId,
    processoSei: item.integracao_sei.processo_sei,
    lido,
  });
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
    v-if="temPermissãoPara('AndamentoWorkflow.listar') && transferenciaEmFoco?.workflow_id"
    class="mb2"
  />

  <pre v-scrollLockDebug>transferenciaEmFoco:{{ transferenciaEmFoco }}</pre>
  <pre v-scrollLockDebug>listaDeDistribuicao:{{ listaDeDistribuicao }}</pre>

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
          {{ transferenciaEmFoco?.esfera || '-' }}
        </dd>
      </div>
      <div class="f1 fb5em">
        <dt class="t16 w700 mb05 tc500">
          Tipo
        </dt>
        <dd>
          {{ transferenciaEmFoco?.tipo.nome || '-' }}
        </dd>
      </div>
      <div class="f1 fb5em">
        <dt class="t16 w700 mb05 tc500">
          Classificação
        </dt>
        <dd>
          {{ transferenciaEmFoco?.classificacao || '-' }}
        </dd>
      </div>
      <div class="f1 fb5">
        <dt class="t16 w700 mb05 tc500">
          Classificacao
        </dt>
        <dd>
          {{ transferenciaEmFoco?.classificacao?.nome || '-' }}
        </dd>
      </div>
      <div class="f1 fb5">
        <dt class="t16 w700 mb05 tc500">
          Interface
        </dt>
        <dd>
          {{ transferenciaEmFoco?.interface || '-' }}
        </dd>
      </div>
      <div class="f1 fb100">
        <dt class="t16 w700 mb05 tc500">
          Órgão concedente / Secretaria do órgão concedente
        </dt>
        <dd>
          {{ transferenciaEmFoco?.orgao_concedente?.sigla || '-' }} /
          {{ transferenciaEmFoco?.secretaria_concedente || '-' }}
        </dd>
      </div>
    </dl>
    <dl class="f0 fg999 fb10em flex g2 flexwrap align-start">
      <div class="f1 fb10em fg999">
        <dt class="t16 w700 mb05 tc500">
          Valor do repasse
        </dt>
        <dd>
          {{ transferenciaEmFoco?.valor
            ? `R$${dinheiro(transferenciaEmFoco.valor)}`
            : '-' }}
        </dd>
      </div>
      <div class="f1 fb10em fg999">
        <dt class="t16 w700 mb05 tc500">
          Valor total
        </dt>
        <dd>
          {{ transferenciaEmFoco?.valor_total
            ? `R$${dinheiro(transferenciaEmFoco.valor_total)}`
            : '-' }}
        </dd>
      </div>
      <div class="f1 fb10em fg999">
        <dt class="t16 w700 mb05 tc500">
          Valor distribuído
        </dt>
        <dd>
          {{ transferenciaEmFoco?.valor_distribuido
            ? `R$${dinheiro(transferenciaEmFoco?.valor_distribuido)}`
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
            :max="transferenciaEmFoco?.valor"
            :value="transferenciaEmFoco?.valor_distribuido || 0"
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
    v-for="parlamentar in transferenciaEmFoco?.parlamentares"
    :key="parlamentar.id"
    class="mb2"
  >
    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt class="t16 w700 mb05 tc500">
          Nome de urna
        </dt>
        <dd>
          {{ parlamentar.parlamentar.nome_popular || '-' }}
        </dd>
      </dl>

      <dl class="f1">
        <dt class="t16 w700 mb05 tc500">
          Nome civil
        </dt>
        <dd>
          {{ parlamentar.parlamentar.nome || '-' }}
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
    </div>

    <div class="flex g2 flexwrap mb2">
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
      v-for="distribuicao in listaDeDistribuicao"
      :key="distribuicao.id"
      class="resumo-da-distribuicao-de-recursos__item mb2"
    >
      <div class="resumo-da-distribuicao-de-recursos__descricao f1 fb75 mb2">
        <hgroup class="resumo-da-distribuicao-de-recursos__titulo flex g1">
          <h3 class="ml0 t16 w700 tc500">
            <abbr
              v-if="distribuicao.orgao_gestor"
              :title="distribuicao.orgao_gestor.descricao"
            >
              {{ distribuicao.orgao_gestor.sigla }}
            </abbr>
          </h3>
          <h4 class="mlauto mr0 t16 w700 tc300">
            {{ distribuicao.valor
              ? `R$${dinheiro(distribuicao.valor)}`
              : '' }}
          </h4>
          <h5
            class="resumo-da-distribuicao-de-recursos__percentagem mr0 t16 w700 tc500"
          >
            {{ distribuicao.pct_valor_transferencia }}%
          </h5>
        </hgroup>

        <div class="resumo-da-distribuicao-de-recursos__objeto contentStyle f1">
          {{ distribuicao.objeto || '-' }}
        </div>
      </div>

      <dl
        class="resumo-da-distribuicao-de-recursos__lista-de-status f0 fg999 fb10em
      flex flexwrap g2 align-end"
      >
        <div
          v-if=" distribuicao?.historico_status"
          class="resumo-da-distribuicao-de-recursos__status-item f1 mb1"
        >
          <ul
            ref="listaDeStatus"
            class="flex pb1 andamento-fluxo__lista-de-fases"
          >
            <li
              v-for="(status, index) in distribuicao.historico_status"
              :key="status.id"
              class="p1 tc andamento-fluxo__fase"
              :class="index === distribuicao.historico_status.length - 1
                && index === 0
                ? 'andamento-fluxo__fase--iniciada'
                : 'andamento-fluxo__fase--concluída'"
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
            v-if="distribuicao.parlamentares.length"
            class="parlamentares"
          >
            <div
              v-for="parlamentar, index in distribuicao.parlamentares"
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
                    v-if="parlamentar?.valor && transferenciaEmFoco?.valor"
                  >
                    R$ {{ dinheiro(parlamentar.valor) || '0' }} ({{
                      (parlamentar.valor / transferenciaEmFoco.valor *
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
            {{ transferenciaEmFoco?.ano || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Código do programa
          </dt>
          <dd>
            {{ transferenciaEmFoco?.programa || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Nome do Programa
          </dt>
          <dd>
            {{ transferenciaEmFoco?.nome_programa || '-' }}
          </dd>
        </dl>
      </div>
      <div>
        <dl class="f1 mb1">
          <dt class="t16 w700 mb05 tc500">
            Objeto/Empreendimento
          </dt>
          <dd class="text">
            {{ transferenciaEmFoco?.objeto || '-' }}
          </dd>
        </dl>
        <dl class="f1 mb1">
          <dt class="t16 w700 mb05 tc500">
            Detalhamento
          </dt>
          <dd class="text">
            {{ transferenciaEmFoco?.detalhamento }}
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
            {{ transferenciaEmFoco?.clausula_suspensiva ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tc500">
            Data de vencimento
          </dt>
          <dd>
            {{ transferenciaEmFoco?.clausula_suspensiva_vencimento
              ? dateToField(transferenciaEmFoco.clausula_suspensiva_vencimento)
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
          {{ transferenciaEmFoco?.normativa || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t16 w700 mb05 tc500">
          Número da demanda
        </dt>
        <dd>
          {{ transferenciaEmFoco?.demanda || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt class="t16 w700 mb05 tc500">
          Observações
        </dt>
        <dd>
          {{ transferenciaEmFoco?.observacoes || '-' }}
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
          {{ transferenciaEmFoco?.empenho ? 'Sim' : 'Não' }}
        </dd>
      </dl>
      <dl class="mb1">
        <dt class="t16 w700 mb05 tc500">
          Ordenador de despesas
        </dt>
        <dd>
          {{ transferenciaEmFoco?.ordenador_despesa || '-' }}
        </dd>
      </dl>
      <dl class="mb1">
        <dt class="t16 w700 mb05 tc500">
          Gestor municipal do contrato
        </dt>
        <dd>
          {{ transferenciaEmFoco?.gestor_contrato || '-' }}
        </dd>
      </dl>
    </div>
    <div class="grid f1">
      <dl class="mb1">
        <dt class="t16 w700 mb05 tc500">
          Dotação
        </dt>
        <dd>
          {{ transferenciaEmFoco?.dotacao || '-' }}
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
        {{ transferenciaEmFoco?.banco_aceite || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tc500">
        Agência
      </dt>
      <dd>
        {{ transferenciaEmFoco?.agencia_aceite || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tc500">
        Conta
      </dt>
      <dd>
        {{ transferenciaEmFoco?.conta_aceite || '-' }}
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
        {{ transferenciaEmFoco?.banco_fim || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tc500">
        Agência
      </dt>
      <dd>
        {{ transferenciaEmFoco?.agencia_fim || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tc500">
        Conta
      </dt>
      <dd>
        {{ transferenciaEmFoco?.conta_fim || '-' }}
      </dd>
    </dl>
  </div>

  <div class="flex g2 flexwrap center mt3 mb2">
    <h3 class="w700 tc600 t20 mb0">
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
    v-for="distribuicao in listaDeDistribuicao"
    :key="distribuicao.id"
    class="mb2 card-shadow p2"
  >
    <div class="mb2">
      <dl class="mb2">
        <dt class="t16 w700 mb05 tamarelo">
          Gestor municipal
        </dt>
        <dd>
          {{ distribuicao.orgao_gestor
            ? `${distribuicao.orgao_gestor.sigla} - ${distribuicao.orgao_gestor.descricao}`
            : '-' }}
        </dd>
      </dl>
      <dl class="f1">
        <dt class="t16 w700 mb05 tamarelo">
          Objeto/Empreendimento
        </dt>
        <dd>
          {{ distribuicao.objeto || '-' }}
        </dd>
      </dl>
    </div>

    <div class="flex flexwrap g2 mb1">
      <div class="grid valores f1">
        <dl class="mb1 pb1">
          <dt class="t16 w700 mb05 tamarelo">
            Valor do repasse
          </dt>
          <dd>
            {{ distribuicao.valor ? `R$${dinheiro(distribuicao.valor)}` : '-' }}
          </dd>
        </dl>
        <dl class="mb1 pb1">
          <dt class="t16 w700 mb05 tamarelo">
            Valor contrapartida
          </dt>
          <dd>
            {{ distribuicao.valor_contrapartida
              ? `R$${dinheiro(distribuicao.valor_contrapartida)}`
              : '-' }}
          </dd>
        </dl>
        <dl class="mb1 pb1">
          <dt class="t16 w700 mb05 tamarelo">
            Custeio
          </dt>
          <dd>
            {{ distribuicao.custeio ? `R$${dinheiro(distribuicao.custeio)}` : '-' }}
          </dd>
        </dl>
        <dl class="mb1 pb1">
          <dt class="t16 w700 mb05 tamarelo">
            Investimento
          </dt>
          <dd>
            {{ distribuicao.investimento ? `R$${dinheiro(distribuicao.investimento)}` : '-' }}
          </dd>
        </dl>
        <dl class="mb1 pb1">
          <dt class="t16 w700 mb05 tamarelo">
            Valor total
          </dt>
          <dd>
            {{ distribuicao.valor_total
              ? `R$${dinheiro(distribuicao.valor_total)}`
              : '-' }}
          </dd>
        </dl>
      </div>
      <div class="grid f1">
        <dl class="mb2">
          <dt class="t16 w700 mb05 tamarelo">
            Empenho
          </dt>
          <dd>
            {{ distribuicao.empenho ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="mb2">
          <dt class="t16 w700 mb05 tamarelo">
            Programa orçamentário municipal
          </dt>
          <dd>
            {{ distribuicao.programa_orcamentario_municipal || '-' }}
          </dd>
        </dl>
        <dl class="mb2">
          <dt class="t16 w700 mb05 tamarelo">
            Programa orçamentário estadual
          </dt>
          <dd>
            {{ distribuicao.programa_orcamentario_estadual || '-' }}
          </dd>
        </dl>
      </div>
      <div class="grid f1">
        <dl class="mb2">
          <dt class="t16 w700 mb05 tamarelo">
            Dotação orçamentária
          </dt>
          <dd>
            {{ distribuicao.dotacao || '-' }}
          </dd>
        </dl>
      </div>
    </div>

    <div>
      <div class="flex g2 flexwrap mb2">
        <dl class="f1">
          <dt class="t16 w700 mb05 tamarelo">
            Número proposta
          </dt>
          <dd>
            {{ distribuicao.proposta || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tamarelo">
            Número do convênio/pré convênio
          </dt>
          <dd>
            {{ distribuicao.convenio || '-' }}
          </dd>
        </dl>
      </div>
      <div class="flex g2 flexwrap mb2">
        <dl class="f1">
          <dt class="t16 w700 mb05 tamarelo">
            Número do contrato
          </dt>
          <dd>
            {{ distribuicao.contrato || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tamarelo">
            Data de vigência
          </dt>
          <dd>
            {{ distribuicao.vigencia
              ? dateToField(distribuicao.vigencia)
              : '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tamarelo">
            Motivo do aditamento
          </dt>
          <dd>
            {{ distribuicao.aditamentos[0]?.justificativa || ' - ' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tamarelo">
            Data de conclusão da suspensiva
          </dt>
          <dd>
            {{ distribuicao.conclusao_suspensiva
              ? dateToField(distribuicao.conclusao_suspensiva)
              : '-' }}
          </dd>
        </dl>
      </div>
    </div>

    <table
      v-if="distribuicao.registros_sei?.length"
      class="tablemain no-zebra horizontal-lines mb1"
    >
      <caption class="t16 w700 mb05 tamarelo tl">
        Números SEI
      </caption>
      <col class="col--botão-de-ação">
      <col>
      <col class="col--dataHora">
      <col class="col--dataHora">
      <col class="col--data">
      <col>
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
        <th>Usuário SEI</th>
        <th>Lido</th>
        <th />
      </thead>

      <tbody class="transferencia-sei-body">
        <tr
          v-for="registro, idx in distribuicao.registros_sei"
          :key="idx"
          class="transferencia-sei-body__item"
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
            <label
              v-if="registro.integracao_sei"
              class="transferencia-sei-body__item--lido flex column g05 start"
            >
              {{ registro.lido ? "Lido" : "Não lido" }}
              <input
                type="checkbox"
                class="interruptor"
                :checked="registro.lido"
                @input="atualizaSeiLido(
                  registro,
                  distribuicao.id,
                  $event.target.checked
                )"
              >
            </label>
          </td>
          <td>
            <SmaeLink
              v-if="registro?.integracao_sei?.link"
              :to="registro?.integracao_sei?.link"
              title="Abrir no site do SEI"
              @click="atualizaSeiLido(registro, distribuicao.transferencia_id, true)"
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

    <div class="flex g2 center mt3 mb2">
      <h3 class="w700 tc600 t20 mb0">
        Assinaturas
      </h3>
      <hr class="f1">
    </div>

    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt class="t16 w700 mb05 tamarelo">
          Data da assinatura do termo de aceite
        </dt>
        <dd v-if="distribuicao?.assinatura_termo_aceite">
          {{ dateToField(distribuicao.assinatura_termo_aceite) }}
        </dd>
      </dl>
      <dl class="f1">
        <dt class="t16 w700 mb05 tamarelo">
          Data da assinatura do representante do estado
        </dt>
        <dd v-if="distribuicao?.assinatura_estado">
          {{ dateToField(distribuicao.assinatura_estado) }}
        </dd>
      </dl>
      <dl class="f1">
        <dt class="t16 w700 mb05 tamarelo">
          Data da assinatura do representante do município
        </dt>
        <dd v-if="distribuicao?.assinatura_municipio">
          {{ dateToField(distribuicao.assinatura_municipio) }}
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

.valores dl {
  border-bottom: 1px solid @c100;
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

.transferencia-sei-body__item--lido {
  width: 55px;
}
</style>
