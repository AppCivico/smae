<script setup>
import dateToField from '@/helpers/dateToField';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { storeToRefs } from 'pinia';

const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();
const distribuicaoRecursos = useDistribuicaoRecursosStore();

const { emFoco: transferênciaEmFoco } = storeToRefs(TransferenciasVoluntarias);
const { lista: listaDeDistribuição } = storeToRefs(distribuicaoRecursos);

TransferenciasVoluntarias.buscarItem(props.transferenciaId);
distribuicaoRecursos.buscarTudo({ transferencia_id: props.transferenciaId });
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>Resumo da transferência</h1> <!-- não finalizado -->
  </div>

  <pre v-scrollLockDebug>transferênciaEmFoco:{{ transferênciaEmFoco }}</pre>
  <pre v-scrollLockDebug>listaDeDistribuição:{{ listaDeDistribuição }}</pre>

  <div class="flex spacebetween center mb2">
    <h3 class="title">
      Identificação
    </h3>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'TransferenciasVoluntariaEditar' }"
      class="btn big ml2"
    >
      Editar
    </router-link>
  </div>

  <div>
    <div class="flex spacebetween start mb1">
      <dl class="f1 mb3">
        <dt>
          Identificador
        </dt>
        <dd>
          {{ transferênciaEmFoco?.identificador || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3">
        <dt>
          Esfera
        </dt>
        <dd>
          {{ transferênciaEmFoco?.esfera || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3">
        <dt>
          Tipo
        </dt>
        <dd>
          {{ transferênciaEmFoco?.tipo.nome || '-' }}
        </dd>
      </dl>
    </div>
    <div class="flex spacebetween start mb1">
      <dl class="f1 mb3">
        <dt>
          Interface
        </dt>
        <dd>
          {{ transferênciaEmFoco?.interface || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3">
        <dt>
          Programa
        </dt>
        <dd>
          {{ transferênciaEmFoco?.programa || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3">
        <dt>
          Emenda
        </dt>
        <dd>
          {{ transferênciaEmFoco?.emenda || '-' }}
        </dd>
      </dl>
    </div>
    <div class="flex spacebetween start mb1">
      <dl class="f1 mb3">
        <dt>
          Emenda unitária
        </dt>
        <dd>
          {{ transferênciaEmFoco?.emenda_unitaria || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3">
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

  <div class="flex spacebetween center mb2">
    <h3 class="title">
      Origem
    </h3>
    <hr class="ml2 f1">
  </div>

  <div>
    <div class="flex spacebetween start mb1">
      <dl class="f1 mb3">
        <dt>
          Órgão concedente
        </dt>
        <dd>
          {{ transferênciaEmFoco?.orgao_concedente?.sigla || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3">
        <dt>
          Secretaria do órgão concedente
        </dt>
        <dd>
          {{ transferênciaEmFoco?.secretaria_concedente || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3" />
    </div>
    <div class="flex spacebetween start mb1">
      <dl class="f1 mb3">
        <dt>
          Parlamentar
        </dt>
        <dd>
          {{ transferênciaEmFoco?.parlamentar?.nome || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3">
        <dt>
          Partido
        </dt>
        <dd>
          {{ transferênciaEmFoco?.partido?.sigla || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3">
        <dt>
          cargo
        </dt>
        <dd>
          {{ transferênciaEmFoco?.cargo || '-' }}
        </dd>
      </dl>
    </div>
  </div>

  <div class="flex spacebetween center mb2">
    <h3 class="title">
      Transferência
    </h3>
    <hr class="ml2 f1">
  </div>

  <div>
    <div>
      <div class="flex spacebetween start mb1">
        <dl class="f1 mb3">
          <dt>
            Ano
          </dt>
          <dd>
            {{ transferênciaEmFoco?.ano || '-' }}
          </dd>
        </dl>
        <dl class="f1 mb3">
          <dt>
            Nome do Programa
          </dt>
          <dd>
            {{ transferênciaEmFoco?.nome_programa || '-' }}
          </dd>
        </dl>
        <dl class="f1 mb3" />
      </div>
      <div class="mb1">
        <dl class="f1 mb3">
          <dt>
            Objeto/Empreendimento
          </dt>
          <dd>
            {{ transferênciaEmFoco?.objeto || '-' }}
          </dd>
        </dl>
        <dl class="f1 mb3">
          <dt>
            Detalhamento
          </dt>
          <dd>
            {{ transferênciaEmFoco?.detalhamento }}
          </dd>
        </dl>
      </div>
    </div>

    <div>
      <div class="flex spacebetween end mb1">
        <dl class="f1 mb3">
          <dt>
            Crítico
          </dt>
          <dd>
            {{ transferênciaEmFoco?.critico ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="f1 mb3">
          <dt>
            Cláusula suspensiva
          </dt>
          <dd>
            {{ transferênciaEmFoco?.clausula_suspensiva ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="f1 mb3">
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
      <dl class="f1 mb3">
        <dt>
          normativa
        </dt>
        <dd>
          {{ transferênciaEmFoco?.normativa || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3">
        <dt>
          observacoes
        </dt>
        <dd>
          {{ transferênciaEmFoco?.observacoes || '-' }}
        </dd>
      </dl>
    </div>
  </div>

  <div class="flex spacebetween center mb2">
    <h3 class="title">
      Recurso Financeiro
    </h3>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'RegistroDeTransferenciaEditar' }"
      class="btn big ml2"
    >
      Editar
    </router-link>
  </div>

  <div class="flex g2 mb3 spacebetween">
    <div class="grid valores f1">
      <dl class="mb3">
        <dt>
          valor
        </dt>
        <dd>
          {{ transferênciaEmFoco?.valor || '-' }}
        </dd>
      </dl>
      <dl class="mb3">
        <dt>
          Valor contra-partida
        </dt>
        <dd>
          {{ transferênciaEmFoco?.valor_contrapartida || '-' }}
        </dd>
      </dl>
      <dl class="mb3">
        <dt>
          Valor total
        </dt>
        <dd>
          {{ transferênciaEmFoco?.valor_total || '-' }}
        </dd>
      </dl>
    </div>
    <div class="grid f1">
      <dl class="mb3">
        <dt>
          Empenho
        </dt>
        <dd>
          {{ transferênciaEmFoco?.empenho ? 'Sim' : 'Não' }}
        </dd>
      </dl>
      <dl class="mb3">
        <dt>
          Ordenador de despesas
        </dt>
        <dd>
          {{ transferênciaEmFoco?.ordenador_despesa || '-' }}
        </dd>
      </dl>
      <dl class="mb3">
        <dt>
          Gestor municipal do contrato
        </dt>
        <dd>
          {{ transferênciaEmFoco?.gestor_contrato || '-' }}
        </dd>
      </dl>
    </div>
    <div class="grid f1">
      <dl class="mb3">
        <dt>
          Dotação
        </dt>
        <dd>
          {{ transferênciaEmFoco?.dotacao || '-' }}
        </dd>
      </dl>
    </div>
  </div>

  <div class="flex spacebetween center mb3">
    <h3 class="title">
      Dados Bancários de Aceite
    </h3>
    <hr class="ml2 f1">
  </div>

  <div class="flex spacebetween start mb3">
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

  <div class="flex spacebetween center mb3">
    <h3 class="title">
      Dados Bancários Secretaria Fim
    </h3>
    <hr class="ml2 f1">
  </div>

  <div class="flex spacebetween start mb3">
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

  <div class="flex spacebetween center mb3">
    <h3 class="title">
      Distribuição de Recursos
    </h3>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'TransferenciaDistribuicaoDeRecursosEditar' }"
      class="btn big ml2"
    >
      Editar
    </router-link>
  </div>

  <section
    v-for="distribuição in listaDeDistribuição"
    :key="distribuição.id"
    class="mb1"
  >
    <div class="mb2">
      <dl class="mb3">
        <dt>
          Gestor municipal
        </dt>
        <dd>
          {{ distribuição.gestor_contrato || '-' }}
        </dd>
      </dl>
      <dl class="f1 mb3">
        <dt>
          Objeto/Empreendimento
        </dt>
        <dd>
          {{ distribuição.objeto || '-' }}
        </dd>
      </dl>
    </div>

    <div class="flex g2 mb3 spacebetween">
      <div class="grid valores f1">
        <dl class="mb3">
          <dt>
            Valor
          </dt>
          <dd>
            {{ distribuição.valor || '-' }}
          </dd>
        </dl>
        <dl class="mb3">
          <dt>
            Valor contra-partida
          </dt>
          <dd>
            {{ distribuição.valor_contrapartida || '-' }}
          </dd>
        </dl>
        <dl class="mb3">
          <dt>
            Valor total
          </dt>
          <dd>
            {{ distribuição.valor_total || '-' }}
          </dd>
        </dl>
      </div>
      <div class="grid f1">
        <dl class="mb3">
          <dt>
            Empenho
          </dt>
          <dd>
            {{ distribuição.empenho ? 'Sim' : 'Não' }}
          </dd>
        </dl>
        <dl class="mb3">
          <dt>
            Programa orçamentário municipal
          </dt>
          <dd>
            {{ distribuição.programa_orcamentario_municipal || '-' }}
          </dd>
        </dl>
        <dl class="mb3">
          <dt>
            Programa orçamentário estadual
          </dt>
          <dd>
            {{ distribuição.programa_orcamentario_estadual || '-' }}
          </dd>
        </dl>
      </div>
      <div class="grid f1">
        <dl class="mb3">
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
      <div class="flex spacebetween start mb4">
        <dl class="f1">
          <dt>
            Número SEI
          </dt>

          <dd v-if="distribuição.numero_sei?.length">
            <ul>
              <li
                v-for="(número, i) in distribuição.numero_sei"
                :key="i"
              >
                {{ número || '-' }}
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
            {{ distribuição.convenios || '-' }}
          </dd>
        </dl>
      </div>
      <div class="flex spacebetween start mb4">
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

    <div class="flex spacebetween center mb3">
      <h3 class="title">
        Assinaturas
      </h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex spacebetween start mb4">
      <dl class="f1">
        <dt>
          Data assinatura do termo de aceite
        </dt>
        <dd v-if="distribuição?.data_assinatura_termo_aceite">
          {{ distribuição.data_assinatura_termo_aceite }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Data assinatura do representante do estado
        </dt>
        <dd v-if="distribuição?.data_assinatura_representante_estado">
          {{ dateToField(distribuição.data_assinatura_representante_estado) }}
        </dd>
      </dl>
      <dl class="f1">
        <dt>
          Data assinatura do representante do município
        </dt>
        <dd v-if="distribuição?.data_assinatura_representante_municipio">
          {{ dateToField(distribuição.data_assinatura_representante_municipio) }}
        </dd>
      </dl>
    </div>
  </section>
</template>

<style scoped lang="less">
section{
  box-shadow: 0px 4px 16px 0px rgba(21, 39, 65, 0.1);
  padding: 1rem 2rem 4rem 2rem;
  border-radius: 20px;
}

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
