<script setup>
import LoadingComponent from '@/components/LoadingComponent.vue';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store.ts';
import { storeToRefs } from 'pinia';
import { defineAsyncComponent } from 'vue';

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
const { lista: listaDeDistribuição } = storeToRefs(distribuicaoRecursos);
const {
  workflow,
  inícioDeFasePermitido,
  idDaPróximaFasePendente,
} = storeToRefs(workflowAndamento);
const { temPermissãoPara } = storeToRefs(authStore);

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
    <h3 class="w400 tc300 t20 mb0">
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

  <div>
    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt>
          Esfera
        </dt>
        <dd>
          {{ transferênciaEmFoco?.esfera || '-' }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Tipo
        </dt>
        <dd>
          {{ transferênciaEmFoco?.tipo.nome || '-' }}
        </dd>
      </dl>
    </div>
    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt>
          Interface
        </dt>
        <dd>
          {{ transferênciaEmFoco?.interface || '-' }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Emenda
        </dt>
        <dd>
          {{ transferênciaEmFoco?.emenda || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3" />
    </div>
    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt>
          Emenda unitária
        </dt>
        <dd>
          {{ transferênciaEmFoco?.emenda_unitaria || '-' }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Demanda
        </dt>
        <dd>
          {{ transferênciaEmFoco?.demanda ||'-' }}
        </dd>
      </dl>
      <dl class="f1 mb3" />
    </div>
  </div>

  <div class="flex g2 center mt3 mb2">
    <h3 class="w400 tc300 t20 mb0">
      Origem
    </h3>
    <hr class="f1">
  </div>

  <div>
    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt>
          Órgão concedente
        </dt>
        <dd>
          {{ transferênciaEmFoco?.orgao_concedente?.sigla || '-' }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Secretaria do órgão concedente
        </dt>
        <dd>
          {{ transferênciaEmFoco?.secretaria_concedente || '-' }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Parlamentar
        </dt>
        <dd>
          {{ transferênciaEmFoco?.parlamentar?.nome || '-' }}
        </dd>
      </dl>
    </div>
    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt>
          Número de identificação
        </dt>
        <dd>
          {{ transferênciaEmFoco?.numero_identificacao || '-' }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Partido
        </dt>
        <dd>
          {{ transferênciaEmFoco?.partido?.sigla || '-' }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Cargo
        </dt>
        <dd>
          {{ transferênciaEmFoco?.cargo || '-' }}
        </dd>
      </dl>
    </div>
  </div>

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
          <dt>
            Ano
          </dt>
          <dd>
            {{ transferênciaEmFoco?.ano || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Código do programa
          </dt>
          <dd>
            {{ transferênciaEmFoco?.programa || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Nome do Programa
          </dt>
          <dd>
            {{ transferênciaEmFoco?.nome_programa || '-' }}
          </dd>
        </dl>
      </div>
      <div>
        <dl class="f1 mb1">
          <dt>
            Objeto/Empreendimento
          </dt>
          <dd class="text">
            {{ transferênciaEmFoco?.objeto || '-' }}
          </dd>
        </dl>
        <dl class="f1 mb1">
          <dt>
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
          <dt>
            Cláusula suspensiva
          </dt>
          <dd>
            {{ transferênciaEmFoco?.clausula_suspensiva ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
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
        <dt>
          Normativa
        </dt>
        <dd>
          {{ transferênciaEmFoco?.normativa || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt>
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
    <div class="grid valores f1">
      <dl class="mb1">
        <dt>
          Valor do repasse
        </dt>
        <dd>
          {{ transferênciaEmFoco?.valor ? `R$${dinheiro(transferênciaEmFoco.valor)}` : '-' }}
        </dd>
      </dl>
      <dl class="mb1">
        <dt>
          Valor contrapartida
        </dt>
        <dd>
          {{ transferênciaEmFoco?.valor_contrapartida
            ? `R$${dinheiro(transferênciaEmFoco.valor_contrapartida)}`
            : '-' }}
        </dd>
      </dl>
      <dl class="mb1">
        <dt>
          Valor total
        </dt>
        <dd>
          {{ transferênciaEmFoco?.valor_total
            ? `R$${dinheiro(transferênciaEmFoco.valor_total)}`
            : '-' }}
        </dd>
      </dl>
    </div>
    <div class="grid f1">
      <dl class="mb1">
        <dt>
          Empenho
        </dt>
        <dd>
          {{ transferênciaEmFoco?.empenho ? 'Sim' : 'Não' }}
        </dd>
      </dl>
      <dl class="mb1">
        <dt>
          Ordenador de despesas
        </dt>
        <dd>
          {{ transferênciaEmFoco?.ordenador_despesa || '-' }}
        </dd>
      </dl>
      <dl class="mb1">
        <dt>
          Gestor municipal do contrato
        </dt>
        <dd>
          {{ transferênciaEmFoco?.gestor_contrato || '-' }}
        </dd>
      </dl>
    </div>
    <div class="grid f1">
      <dl class="mb1">
        <dt>
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
      <dt>
        Banco
      </dt>
      <dd>
        {{ transferênciaEmFoco?.banco_aceite || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt>
        Agência
      </dt>
      <dd>
        {{ transferênciaEmFoco?.agencia_aceite || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt>
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
      <dt>
        Banco
      </dt>
      <dd>
        {{ transferênciaEmFoco?.banco_fim || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt>
        Agência
      </dt>
      <dd>
        {{ transferênciaEmFoco?.agencia_fim || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt>
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
    class="mb2"
  >
    <div class="mb1">
      <dl class="mb1">
        <dt>
          Gestor municipal
        </dt>
        <dd>
          {{ distribuição.orgao_gestor
            ? `${distribuição.orgao_gestor.sigla} - ${distribuição.orgao_gestor.descricao}`
            : '-' }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
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
          <dt>
            Valor do repasse
          </dt>
          <dd>
            {{ distribuição.valor ? `R$${dinheiro(distribuição.valor)}` : '-' }}
          </dd>
        </dl>
        <dl class="mb1">
          <dt>
            Valor contrapartida
          </dt>
          <dd>
            {{ distribuição.valor_contrapartida
              ? `R$${dinheiro(distribuição.valor_contrapartida)}`
              : '-' }}
          </dd>
        </dl>
        <dl class="mb1">
          <dt>
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
          <dt>
            Empenho
          </dt>
          <dd>
            {{ distribuição.empenho ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="mb1">
          <dt>
            Programa orçamentário municipal
          </dt>
          <dd>
            {{ distribuição.programa_orcamentario_municipal || '-' }}
          </dd>
        </dl>
        <dl class="mb1">
          <dt>
            Programa orçamentário estadual
          </dt>
          <dd>
            {{ distribuição.programa_orcamentario_estadual || '-' }}
          </dd>
        </dl>
      </div>
      <div class="grid f1">
        <dl class="mb1">
          <dt>
            Dotação orçamentária
          </dt>
          <dd>
            {{ distribuição.dotacao || '-' }}
          </dd>
        </dl>
      </div>
    </div>

    <div>
      <div class="flex g2 flexwrap mb1">
        <dl class="f1">
          <dt>
            Número SEI
          </dt>

          <dd v-if="distribuição.registros_sei?.length">
            <ul>
              <li
                v-for="(registro, i) in distribuição.registros_sei"
                :key="i"
              >
                {{ registro.processo_sei || '-' }}
              </li>
            </ul>
          </dd>
          <dd v-else>
            -
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Número proposta
          </dt>
          <dd>
            {{ distribuição.proposta || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Número do convênio/pré convênio
          </dt>
          <dd>
            {{ distribuição.convenio || '-' }}
          </dd>
        </dl>
      </div>
      <div class="flex g2 flexwrap mb1">
        <dl class="f1">
          <dt>
            Número do contrato
          </dt>
          <dd>
            {{ distribuição.contrato || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Data de vigência
          </dt>
          <dd>
            {{ distribuição.vigencia
              ? dateToField(distribuição.vigencia)
              : '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
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
        <dt>
          Data da assinatura do termo de aceite
        </dt>
        <dd v-if="distribuição?.assinatura_termo_aceite">
          {{ dateToField(distribuição.assinatura_termo_aceite) }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Data da assinatura do representante do estado
        </dt>
        <dd v-if="distribuição?.assinatura_estado">
          {{ dateToField(distribuição.assinatura_estado) }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
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
section {
  box-shadow: 0px 4px 16px 0px rgba(21, 39, 65, 0.1);
  padding: 1rem 2rem 4rem 2rem;
  border-radius: 20px;
}

dt {
  color: #607A9F;
  font-weight: 700;
  font-size: 20px;
}

dd {
  font-weight: 400;
  color: #233B5C;
  font-size: 16px;
  padding-top: 4px;
}

.text {
  line-height: 24px;
}

.valores {
  border-right: solid 2px #B8C0CC;
  border-radius: 12px;
}

table {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
