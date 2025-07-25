<script setup>
import { storeToRefs } from 'pinia';
import {
  computed, nextTick,
} from 'vue';
import ListaDeDistribuicaoItem from '@/components/transferencia/ListaDeDistribuicaoItem.vue';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { useWorkflowAndamentoStore } from '@/stores/workflow.andamento.store.ts';
import SmaeLink from '@/components/SmaeLink.vue';

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
const { lista: listaDeDistribuicao } = storeToRefs(distribuicaoRecursos);
const {
  workflow,
  inícioDeFasePermitido,
  idDaPróximaFasePendente,
} = storeToRefs(workflowAndamento);
const { temPermissãoPara } = storeToRefs(authStore);

const recursoFinanceiroValores = computed(() => {
  if (!transferenciaEmFoco.value) {
    return [
      { label: 'Valor', valor: '-' },
      { label: 'Valor contrapartida', valor: '-' },
      { label: 'Custeio', valor: '-' },
      { label: 'Investimento', valor: '-' },
      { label: 'Valor total', valor: '-' },
    ];
  }

  return [
    { label: 'Valor', valor: dinheiro(transferenciaEmFoco.value.valor) },
    { label: 'Valor contrapartida', valor: dinheiro(transferenciaEmFoco.value.valor_contrapartida) },
    { label: 'Custeio', valor: dinheiro(transferenciaEmFoco.value.custeio) },
    { label: 'Investimento', valor: dinheiro(transferenciaEmFoco.value.investimento) },
    { label: 'Valor total', valor: dinheiro(transferenciaEmFoco.value.valor_total) },
  ];
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

distribuicaoRecursos.buscarTudo({ transferencia_id: props.transferenciaId });
nextTick(() => {
  window.scrollTo(0, 0);
});
</script>
<template>
  <header class="flex flexwrap spacebetween center mb2 g2">
    <TítuloDePágina />

    <hr class="f1">

    <menu
      v-if="temPermissãoPara('AndamentoWorkflow.listar') && workflow"
      class="flex g1 mr0 mlauto"
    >
      <li class="f0">
        <button
          v-if="inícioDeFasePermitido && temPermissãoPara('CadastroWorkflows.editar')"
          type="button"
          class="btn"
          @click="iniciarFase(idDaPróximaFasePendente)"
        >
          Iniciar fase
        </button>
      </li>
      <li class="f0">
        <button
          v-if="
            workflow.pode_passar_para_proxima_etapa
              && temPermissãoPara('CadastroWorkflows.editar')
          "
          type="button"
          class="btn"
          @click="avançarEtapa"
        >
          Avançar etapa
        </button>
      </li>
    </menu>
  </header>

  <pre v-scrollLockDebug>transferenciaEmFoco:{{ transferenciaEmFoco }}</pre>
  <pre v-scrollLockDebug>listaDeDistribuicao:{{ listaDeDistribuicao }}</pre>

  <div class="flex g2 center mt3 mb2">
    <h3 class="w700 tc600 t20 mb0">
      Identificação
    </h3>
    <hr class="f1">
    <SmaeLink
      :to="{ name: 'TransferenciasVoluntariaEditar' }"
      title="Editar identificação"
      class="btn with-icon bgnone tcprimary p0"
    >
      <svg
        width="20"
        height="20"
      >
        <use xlink:href="#i_edit" />
      </svg>
      Editar
    </SmaeLink>
  </div>
  <div class="flex flexwrap g2 mb2">
    <dl class="f1 fb66 flex g2 flexwrap">
      <div class="f1 fb33">
        <dt class="t16 w700 mb05 tamarelo">
          Identificador
        </dt>
        <dd>
          {{ transferenciaEmFoco?.identificador || '-' }}
        </dd>
      </div>

      <div class="f1 fb33">
        <dt class="t16 w700 mb05 tamarelo">
          Esfera
        </dt>
        <dd>
          {{ transferenciaEmFoco?.esfera || '-' }}
        </dd>
      </div>
      <div class="f1 fb33">
        <dt class="t16 w700 mb05 tamarelo">
          Tipo
        </dt>
        <dd>
          {{ transferenciaEmFoco?.tipo.nome || '-' }}
        </dd>
      </div>
      <div class="f1 fb33">
        <dt class="t16 w700 mb05 tamarelo">
          Classificação
        </dt>
        <dd>
          {{ transferenciaEmFoco?.classificacao?.nome || '-' }}
        </dd>
      </div>
      <div class="f1 fb33">
        <dt class="t16 w700 mb05 tamarelo">
          Classificação
        </dt>
        <dd>
          {{ transferenciaEmFoco?.classificacao?.nome || '-' }}
        </dd>
      </div>
      <div class="f1 fb33">
        <dt class="t16 w700 mb05 tamarelo">
          Órgão concedente / Gestor do órgão concedente
        </dt>
        <dd>
          {{ transferenciaEmFoco?.orgao_concedente?.sigla || '-' }} /
          {{ transferenciaEmFoco?.secretaria_concedente || '-' }}
        </dd>
      </div>
    </dl>
    <dl class="f0 fg999 fb10em flex g2 flexwrap align-start">
      <div class="f1 fb10em fg999">
        <dt class="t16 w700 mb05 tamarelo">
          Valor do repasse
        </dt>
        <dd>
          {{ transferenciaEmFoco?.valor
            ? `R$${dinheiro(transferenciaEmFoco.valor)}`
            : '-' }}
        </dd>
      </div>
      <div class="f1 fb10em fg999">
        <dt class="t16 w700 mb05 tamarelo">
          Valor total
        </dt>
        <dd>
          {{ transferenciaEmFoco?.valor_total
            ? `R$${dinheiro(transferenciaEmFoco.valor_total)}`
            : '-' }}
        </dd>
      </div>
      <div class="f1 fb10em fg999">
        <dt class="t16 w700 mb05 tamarelo">
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
    <h3 class="w700 tc600 t20 mb0">
      Parlamentares
    </h3>
    <hr class="f1">
  </div>

  <div
    v-for="parlamentar in transferenciaEmFoco?.parlamentares"
    :key="parlamentar.id"
    class="mb2 parlamentar"
  >
    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt class="t16 w700 mb05 tamarelo">
          Nome de urna
        </dt>
        <dd>
          {{ parlamentar.parlamentar.nome_popular || '-' }}
        </dd>
      </dl>

      <dl class="f1">
        <dt class="t16 w700 mb05 tamarelo">
          Nome civil
        </dt>
        <dd>
          {{ parlamentar.parlamentar.nome || '-' }}
        </dd>
      </dl>

      <dl class="f1">
        <dt class="t16 w700 mb05 tamarelo">
          Partido
        </dt>
        <dd>
          {{ parlamentar.partido.sigla || '-' }}
        </dd>
      </dl>
    </div>

    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt class="t16 w700 mb05 tamarelo">
          Cargo
        </dt>
        <dd>
          {{ parlamentar.cargo || '-' }}
        </dd>
      </dl>

      <dl class="f1">
        <dt class="t16 w700 mb05 tamarelo">
          Valor
        </dt>
        <dd>
          {{ parlamentar.valor ? `R$${dinheiro(parlamentar.valor)}` : '-' }}
        </dd>
      </dl>
    </div>

    <dl class="f1">
      <dt class="t16 w700 mb05 tamarelo">
        Objeto
      </dt>

      <dd class="break-word">
        {{ parlamentar.objeto || '-' }}
      </dd>
    </dl>
  </div>

  <div class="flex g2 center mt3 mb2">
    <h3 class="w700 tc600 t20 mb0">
      Transferência
    </h3>
    <hr class="f1">
  </div>

  <div>
    <div>
      <div class="flex g2 flexwrap mb2">
        <dl class="f1">
          <dt class="t16 w700 mb05 tamarelo">
            Ano
          </dt>
          <dd>
            {{ transferenciaEmFoco?.ano || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tamarelo">
            Código do programa
          </dt>
          <dd>
            {{ transferenciaEmFoco?.programa || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t16 w700 mb05 tamarelo">
            Nome do programa
          </dt>
          <dd>
            {{ transferenciaEmFoco?.nome_programa || '-' }}
          </dd>
        </dl>
      </div>
      <dl class="f1 mb2">
        <dt class="t16 w700 mb05 tamarelo">
          Objeto/Empreendimento
        </dt>
        <dd class="break-word">
          {{ transferenciaEmFoco?.objeto || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb2">
        <dt class="t16 w700 mb05 tamarelo">
          Detalhamento
        </dt>
        <dd class="text">
          {{ transferenciaEmFoco?.detalhamento }}
        </dd>
      </dl>
    </div>

    <div class="flex g2 flexwrap mb2">
      <dl class="f1">
        <dt class="t16 w700 mb05 tamarelo">
          Cláusula suspensiva
        </dt>
        <dd>
          {{ transferenciaEmFoco?.clausula_suspensiva ? 'Sim' : 'Não' }}
        </dd>
      </dl>
      <dl class="f1">
        <dt class="t16 w700 mb05 tamarelo">
          Data de vencimento
        </dt>
        <dd>
          {{ transferenciaEmFoco?.clausula_suspensiva_vencimento
            ? dateToField(transferenciaEmFoco.clausula_suspensiva_vencimento)
            : '-' }}
        </dd>
      </dl>
    </div>

    <div>
      <dl class="f1 mb2">
        <dt class="t16 w700 mb05 tamarelo">
          Normativa
        </dt>
        <dd>
          {{ transferenciaEmFoco?.normativa || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb2">
        <dt class="t16 w700 mb05 tamarelo">
          Número da demanda
        </dt>
        <dd>
          {{ transferenciaEmFoco?.demanda || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb2">
        <dt class="t16 w700 mb05 tamarelo">
          Observações
        </dt>
        <dd>
          {{ transferenciaEmFoco?.observacoes || '-' }}
        </dd>
      </dl>
    </div>
  </div>

  <section class="recurso-financeiro">
    <div class="flex g2 center mt3 mb2">
      <h3 class="w700 tc600 t20 mb0">
        Recurso Financeiro
      </h3>

      <hr class="f1">

      <SmaeLink
        :to="{ name: 'RegistroDeTransferenciaEditar' }"
        title="Editar recursos financeiros"
        class="btn with-icon bgnone tcprimary p0"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_edit" />
        </svg>
        Editar
      </SmaeLink>
    </div>

    <div class="flex flexwrap g4 mb3">
      <div class="f1">
        <div class="recurso-financeiro-valores">
          <div
            v-for="(valorItem, valorItemIndex) in recursoFinanceiroValores"
            :key="`recurso-financeiro-valores--${valorItemIndex}`"
            class="recurso-financeiro-valores__item flex f1 spacebetween center p1"
          >
            <div class="t16 w700 tamarelo">
              {{ valorItem.label }}
            </div>

            <div>
              {{ valorItem.valor }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex column g4 p1 f1">
        <div>
          <div class="t16 w700 mb05 tamarelo">
            Empenho
          </div>

          <div>
            {{ transferenciaEmFoco?.empenho ? 'Sim' : 'Não' }}
          </div>
        </div>

        <div>
          <div class="t16 w700 mb05 tamarelo">
            Ordenador de despesas
          </div>

          <div>
            {{ transferenciaEmFoco?.ordenador_despesa ?? '-' }}
          </div>
        </div>
      </div>

      <div class="flex column g4 p1 f1">
        <div>
          <div class="t16 w700 mb05 tamarelo">
            Dotação
          </div>

          <div>
            {{ transferenciaEmFoco?.dotacao ?? '-' }}
          </div>
        </div>

        <div>
          <div class="t16 w700 mb05 tamarelo">
            Gestor municipal do contrato
          </div>

          <div>
            {{ transferenciaEmFoco?.gestor_contrato ?? '-' }}
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="flex g2 center mt3 mb2">
    <h3 class="w700 tc600 t20 mb0">
      Dados Bancários de Aceite
    </h3>
    <hr class="f1">
  </div>

  <div class="flex g2 flexwrap mb1">
    <dl class="f1">
      <dt class="t16 w700 mb05 tamarelo">
        Banco
      </dt>
      <dd>
        {{ transferenciaEmFoco?.banco_aceite || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tamarelo">
        Agência
      </dt>
      <dd>
        {{ transferenciaEmFoco?.agencia_aceite || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tamarelo">
        Conta
      </dt>
      <dd>
        {{ transferenciaEmFoco?.conta_aceite || '-' }}
      </dd>
    </dl>
  </div>

  <div class="flex g2 center mt3 mb2">
    <h3 class="w700 tc600 t20 mb0">
      Dados Bancários Secretaria Fim
    </h3>
    <hr class="f1">
  </div>

  <div class="flex g2 flexwrap mb1">
    <dl class="f1">
      <dt class="t16 w700 mb05 tamarelo">
        Banco
      </dt>
      <dd>
        {{ transferenciaEmFoco?.banco_fim || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tamarelo">
        Agência
      </dt>
      <dd>
        {{ transferenciaEmFoco?.agencia_fim || '-' }}
      </dd>
    </dl>
    <dl class="f1">
      <dt class="t16 w700 mb05 tamarelo">
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
    <SmaeLink
      :to="{ name: 'TransferenciaDistribuicaoDeRecursos.Lista' }"
      title="Editar distribuição de recursos"
      class="btn with-icon bgnone tcprimary p0"
    >
      <svg
        width="20"
        height="20"
      >
        <use xlink:href="#i_edit" />
      </svg>
      Editar
    </SmaeLink>
  </div>

  <ListaDeDistribuicaoItem
    v-for="distribuicao in listaDeDistribuicao"
    :key="distribuicao.id"
    :distribuicao="distribuicao"
    class="mb2 card-shadow p2"
  />
</template>

<style scoped lang="less">
.parlamentares{
  padding: 20px;
  max-width: 700px;

  h4{
    color: #607A9F;
    font-weight: 700;
    font-size: 20px;
  }
}

.parlamentar {
  padding-bottom: 2rem;
  border-bottom: 1px solid @c100;
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

.resumo-da-distribuicao-de-recursos__percentagem {
  &::before {
    content: '(';
  }

  &::after {
    content: ')';
  }
}

.transferencia-sei-body__item--lido {
  width: 55px;
}

&, :deep {
  .recurso-financeiro-valores__item {
    border-bottom: 1px solid #E3E5E8;
  }

  .recurso-financeiro-valores__item-label {
    width: 11rem;
  }

  .recurso-financeiro-valores__item-porcentagem {
    text-align: center;
  }
}
</style>
