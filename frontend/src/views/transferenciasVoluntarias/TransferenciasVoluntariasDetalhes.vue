<script setup>
import { useAuthStore } from '@/stores/auth.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import dateToField from '@/helpers/dateToField';
import { computed, onMounted, ref } from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

const authStore = useAuthStore();
const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();

const emFoco = ref({});
onMounted(async () => {
  await TransferenciasVoluntarias.buscarItem(props.transferenciaId);
  emFoco.value = TransferenciasVoluntarias.emFoco;
});

const equipe = computed(() => emFoco.value?.equipe ?? []);

const assessores = computed(() => equipe.value.filter((item) => item.tipo === 'Assessor'));
const contatos = computed(() => equipe.value.filter((item) => item.tipo === 'Contato'));

function formatarNumero(numero) {
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>Resumo da transferência</h1> <!-- não finalizado -->
  </div>
  <div class="flex spacebetween center mb1">
    <h3 class="title">Identificação</h3>
    <hr class="ml2 f1">
  </div>

  <div>
    <div class="flex spacebetween start mb1">
      <dl class="f1">
        <dt>
          Identificador
        </dt>
        <dd v-if="emFoco.identificador">
          {{ emFoco.identificador }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Esfera
        </dt>
        <dd v-if="emFoco.esfera">
          {{ emFoco.esfera }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Tipo
        </dt>
        <dd v-if="emFoco.tipo">
          {{ emFoco.tipo }}
        </dd>
      </dl>
    </div>
    <div class="flex spacebetween start mb1">
      <dl class="f1">
        <dt>
          Interface
        </dt>
        <dd v-if="emFoco.interface">
          {{ emFoco.interface }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          programa
        </dt>
        <dd v-if="emFoco.programa">
          {{ emFoco.programa }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Emenda
        </dt>
        <dd v-if="emFoco.emenda">
          {{ emFoco.emenda }}
        </dd>
      </dl>
    </div>
    <div class="flex spacebetween start mb1">
      <dl class="f1">
        <dt>
          Emenda unitária
        </dt>
        <dd v-if="emFoco.emenda_unitaria">
          {{ emFoco.emenda_unitaria }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Demanda
        </dt>
        <dd v-if="emFoco.demanda">
          {{ emFoco.demanda }}
        </dd>
      </dl>
      <dl class="f1">
      </dl>
    </div>
  </div>

  <div class="flex spacebetween center mb1">
    <h3 class="title">Origem</h3>
    <hr class="ml2 f1">
  </div>

  <div>
    <div class="flex spacebetween start mb1">
      <dl class="f1">
        <dt>
          Órgão concedente
        </dt>
        <dd v-if="emFoco.orgao_concedente">
          {{ emFoco.orgao_concedente?.sigla }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Secretaria do órgão concedente
        </dt>
        <dd v-if="emFoco.secretaria_concedente">
          {{ emFoco.secretaria_concedente.descricao }}
        </dd>
      </dl>
      <dl class="f1">
      </dl>
    </div>
    <div class="flex spacebetween start mb1">
      <dl class="f1">
        <dt>
          Parlamentar
        </dt>
        <dd v-if="emFoco.parlamentar">
          {{ emFoco.parlamentar.nome }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Partido
        </dt>
        <dd v-if="emFoco.partido">
          {{ emFoco.partido.sigla }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          cargo
        </dt>
        <dd v-if="emFoco.cargo">
          {{ emFoco.cargo }}
        </dd>
      </dl>
    </div>
  </div>

  <div class="flex spacebetween center mb1">
    <h3 class="title">Transferência</h3>
    <hr class="ml2 f1">
  </div>

  <div>
    <div>
      <div class="flex spacebetween start mb1">
        <dl class="f1">
          <dt>
            Ano
          </dt>
          <dd v-if="emFoco.ano">
            {{ emFoco.ano }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Nome do Programa
          </dt>
          <dd v-if="emFoco.nome_programa">
            {{ emFoco.nome_programa }}
          </dd>
        </dl>
        <dl class="f1">
        </dl>
      </div>
      <div class="mb1">
        <dl class="f1">
          <dt>
            Objeto/Empreendimento
          </dt>
          <dd v-if="emFoco.objeto">
            {{ emFoco.objeto }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            detalhamento
          </dt>
          <dd v-if="emFoco.detalhamento">
            {{ emFoco.detalhamento }}
          </dd>
        </dl>
      </div>
    </div>

    <div>
      <div class="flex spacebetween start mb1">
        <dl class="f1">
          <dt>
            Crítico
          </dt>
          <dd v-if="emFoco.critico">
            {{ emFoco.critico ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Cláusula suspensiva
          </dt>
          <dd v-if="emFoco.clausula_suspensiva">
            {{ emFoco.clausula_suspensiva ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Data de vencimento
          </dt>
          <dd v-if="emFoco.clausula_suspensiva_vencimento">
            {{ dateToField(emFoco.clausula_suspensiva_vencimento) }}
          </dd>
        </dl>
      </div>
    </div>

    <div>
      <dl class="f1 mb1">
        <dt>
          normativa
        </dt>
        <dd v-if="emFoco.normativa">
          {{ emFoco.normativa }}
        </dd>
      </dl>
      <dl class="f1 mb1">
        <dt>
          observacoes
        </dt>
        <dd v-if="emFoco.observacoes">
          {{ emFoco.observacoes }}
        </dd>
      </dl>
    </div>
  </div>

  <div class="flex spacebetween center mb1">
    <h3 class="title">Recurso Financeiro</h3>
    <hr class="ml2 f1">
  </div>

  <div class="flex g2 mb3 spacebetween">
    <div class="grid valores f1">
      <dl class="mb3">
        <dt>
          valor
        </dt>
        <dd v-if="emFoco.valor">
          {{ emFoco.valor }}
        </dd>
      </dl>
      <dl class="mb3">
        <dt>
          Valor contra-partida
        </dt>
        <dd v-if="emFoco.valor_contrapartida">
          {{ emFoco.valor_contrapartida }}
        </dd>
      </dl>
      <dl class="mb3">
        <dt>
          Valor total
        </dt>
        <dd v-if="emFoco.valor_total">
          {{ emFoco.valor_total }}
        </dd>
      </dl>
    </div>
    <div class="grid f1">
      <dl class="mb3">
        <dt>
          Empenho
        </dt>
        <dd v-if="emFoco.empenho">
          {{ emFoco.empenho ? 'Sim' : 'Não' }}
        </dd>
      </dl>
      <dl class="mb3">
        <dt>
          Ordenador de despesas
        </dt>
        <dd v-if="emFoco.ordenador_despesa">
          {{ emFoco.ordenador_despesa }}
        </dd>
      </dl>
      <dl class="mb3">
        <dt>
          Gestor municipal do contrato
        </dt>
        <dd v-if="emFoco.gestor_contrato">
          {{ emFoco.gestor_contrato }}
        </dd>
      </dl>
    </div>
    <div class="grid f1">
      <dl class="mb3">
        <dt>
          Dotação
        </dt>
        <dd v-if="emFoco.dotacao">
          {{ emFoco.dotacao ? 'Sim' : 'Não' }}
        </dd>
      </dl>
    </div>
  </div>

  <div class="flex spacebetween center mb3">
    <h3 class="title">Dados Bancários de Aceite</h3>
    <hr class="ml2 f1">
  </div>

  <div class="flex spacebetween start mb3">
    <dl class="f1">
      <dt>
        Banco
      </dt>
      <dd v-if="emFoco.banco_aceite">
        {{ emFoco.banco_aceite }}
      </dd>
    </dl>
    <dl class="f1">
      <dt>
        Agência
      </dt>
      <dd v-if="emFoco.agencia_aceite">
        {{ emFoco.agencia_aceite }}
      </dd>
    </dl>
    <dl class="f1">
      <dt>
        Conta
      </dt>
      <dd v-if="emFoco.conta_aceite">
        {{ emFoco.conta_aceite }}
      </dd>
    </dl>
  </div>

  <div class="flex spacebetween center mb3">
    <h3 class="title">Dados Bancários Secretaria Fim</h3>
    <hr class="ml2 f1">
  </div>

  <div class="flex spacebetween start mb3">
    <dl class="f1">
      <dt>
        Banco
      </dt>
      <dd v-if="emFoco.banco_fim">
        {{ emFoco.banco_fim }}
      </dd>
    </dl>
    <dl class="f1">
      <dt>
        Agência
      </dt>
      <dd v-if="emFoco.agencia_fim">
        {{ emFoco.agencia_fim }}
      </dd>
    </dl>
    <dl class="f1">
      <dt>
        Conta
      </dt>
      <dd v-if="emFoco.conta_fim">
        {{ emFoco.conta_fim }}
      </dd>
    </dl>
  </div>

  <div class="flex spacebetween center mb3">
    <h3 class="title">Distribuição de Recursos </h3>
    <hr class="ml2 f1">
  </div>

  <section>
    <div class="mb2">
      <dl class="mb3">
        <dt>
          Gestor municipal do contrato
        </dt>
        <dd v-if="emFoco.gestor_contrato">
          {{ emFoco.gestor_contrato }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Objeto/Empreendimento
        </dt>
        <dd v-if="emFoco.objeto">
          {{ emFoco.objeto }}
        </dd>
      </dl>
    </div>

    <div class="flex g2 mb3 spacebetween">
      <div class="grid valores f1">
        <dl class="mb3">
          <dt>
            valor
          </dt>
          <dd v-if="emFoco.valor">
            {{ emFoco.valor }}
          </dd>
        </dl>
        <dl class="mb3">
          <dt>
            Valor contra-partida
          </dt>
          <dd v-if="emFoco.valor_contrapartida">
            {{ emFoco.valor_contrapartida }}
          </dd>
        </dl>
        <dl class="mb3">
          <dt>
            Valor total
          </dt>
          <dd v-if="emFoco.valor_total">
            {{ emFoco.valor_total }}
          </dd>
        </dl>
      </div>
      <div class="grid f1">
        <dl class="mb3">
          <dt>
            Empenho
          </dt>
          <dd v-if="emFoco.empenho">
            {{ emFoco.empenho ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="mb3">
          <dt>
            Programa orçamentário municipal
          </dt>
          <dd v-if="emFoco.programa_orcamentario_municipal">
            {{ emFoco.programa_orcamentario_municipal }}
          </dd>
        </dl>
        <dl class="mb3">
          <dt>
            Programa orçamentário estadual
          </dt>
          <dd v-if="emFoco.programa_orcamentario_estadual">
            {{ emFoco.programa_orcamentario_estadual }}
          </dd>
        </dl>
      </div>
      <div class="grid f1">
        <dl class="mb3">
          <dt>
            Dotação orçamentária
          </dt>
          <dd v-if="emFoco.dotacao">
            {{ emFoco.dotacao ? 'Sim' : 'Não' }}
          </dd>
        </dl>
      </div>
    </div>

    <div>
      <div class="flex spacebetween start mb4">
        <dl class="f1">
          <dt>
            Número SEI
          </dt>
          <dd v-if="emFoco.numero_sei">
            {{ emFoco.numero_sei }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Número proposta
          </dt>
          <dd v-if="emFoco.numero_proposta">
            {{ emFoco.numero_proposta }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Número do convênio/pré convênio
          </dt>
          <dd v-if="emFoco.numero_convenio">
            {{ emFoco.numero_convenio }}
          </dd>
        </dl>
      </div>
      <div class="flex spacebetween start mb4">
        <dl class="f1">
          <dt>
            Número do convênio/pré convênio
          </dt>
          <dd v-if="emFoco.numero_convenio">
            {{ emFoco.numero_convenio }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Agência
          </dt>
          <dd v-if="emFoco.agencia_fim">
            {{ emFoco.agencia_fim }}
          </dd>
        </dl>
        <dl class="f1">
          <dt>
            Conta
          </dt>
          <dd v-if="emFoco.conta_fim">
            {{ emFoco.conta_fim }}
          </dd>
        </dl>
      </div>
    </div>

  </section>

</template>

<style scoped lang="less">
dt {
  color: #607A9F;
  font-weight: 700;
  font-size: 24px;
}

dd {
  font-weight: 400;
  color: #233B5C;
  font-size: 20px;
  padding-top: 8px;
  margin-bottom: 15px;
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
