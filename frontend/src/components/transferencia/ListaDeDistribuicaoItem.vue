<script setup>
import { storeToRefs } from 'pinia';
import { ref, defineProps } from 'vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import TransitionExpand from '@/components/TransitionExpand.vue';
import dinheiro from '@/helpers/dinheiro';
import dateToField from '@/helpers/dateToField';
import combinadorDeListas from '@/helpers/combinadorDeListas.ts';
import { dateToShortDate, localizarData, localizarDataHorario } from '@/helpers/dateToDate';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

defineProps({
  distribuicao: {
    type: Object,
    default: () => ({}),
    required: true,
  },
});

const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();
const { emFoco: transferenciaEmFoco } = storeToRefs(TransferenciasVoluntarias);

const distribuicaoRecursos = useDistribuicaoRecursosStore();
const {
  chamadasPendentes: distribuicoesPendentes,
} = storeToRefs(distribuicaoRecursos);

const resumoCompleto = ref(null);
const estaExpandido = ref(false);

function alternaExpandido() {
  estaExpandido.value = !estaExpandido.value;
  if (!estaExpandido.value) {
    resumoCompleto.value.scrollIntoView({ behavior: 'smooth' });
  }
}

function removeParlamentaresSemValor(distribuicao) {
  if (!distribuicao.parlamentares.length) {
    return [];
  }

  return distribuicao.parlamentares.filter((parlamentar) => Number(parlamentar.valor));
}
</script>

<template>
  <div
    ref="resumoCompleto"
    class="resumo-completo"
  >
    <section class="resumo-da-distribuicao-de-recursos">
      <LoadingComponent v-if="distribuicoesPendentes.lista" />

      <div class="resumo-da-distribuicao-de-recursos__descricao f1 fb75 mb2">
        <div class="flex g2 flexwrap mb2">
          <dl class="f1">
            <dt class="t16 w700 mb05 tamarelo">
              Gestor municipal
            </dt>
            <dd>
              {{ distribuicao?.orgao_gestor
                ? `${distribuicao.orgao_gestor.sigla} - ${distribuicao.orgao_gestor.descricao}`
                : '-' }}
            </dd>
          </dl>
          <dl class="f1">
            <dt class="t16 w700 mb05 tamarelo">
              Status atual
            </dt>
            <dd>
              {{ distribuicao.status_atual }}
            </dd>
          </dl>
          <dl class="f1">
            <dt class="t16 w700 mb05 tamarelo">
              Valor de repasse
            </dt>
            <dd>
              {{ distribuicao.valor
                ? `R$${dinheiro(distribuicao.valor)}`
                : '' }}
            </dd>
          </dl>
        </div>
        <dl class="mb2">
          <dt class="t16 w700 mb05 tamarelo">
            Objeto/Empreendimento
          </dt>
          <dd>
            {{ distribuicao.objeto || '-' }}
          </dd>
        </dl>
        <dl class="mb2">
          <dt class="t16 w700 mb05 tamarelo">
            Parlamentares envolvidos
          </dt>
          <dd>
            <template v-if="removeParlamentaresSemValor(distribuicao).length">
              {{ combinadorDeListas(
                removeParlamentaresSemValor(distribuicao),
                null,
                'parlamentar.nome_popular'
              ) }}
            </template>
            <template v-else>
              Sem parlamentares envolvidos
            </template>
          </dd>
        </dl>

        <TransitionExpand>
          <div v-if="estaExpandido">
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

            <div class="resumo-da-distribuicao-de-recursos__objeto contentStyle f1 mb2">
              {{ distribuicao.objeto || '-' }}
            </div>

            <dl
              class="resumo-da-distribuicao-de-recursos__lista-de-status f0 fg999 fb10em
              flex flexwrap g2 align-end"
            >
              <div
                v-if="distribuicao?.historico_status"
                class="resumo-da-distribuicao-de-recursos__status-item f1 mb2"
              >
                <ul
                  ref="listaDeStatus"
                  class="flex mb2 andamento-fluxo__lista-de-fases"
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
                  class="parlamentares mb1"
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
                        <strong v-if="parlamentar?.valor && transferenciaEmFoco?.valor">
                          R$ {{ dinheiro(parlamentar.valor) || '0' }} ({{
                            (parlamentar.valor / transferenciaEmFoco.valor * 100).toFixed()
                          }}%)
                        </strong>
                      </dd>
                    </dl>
                  </div>
                </dd>
              </div>
            </dl>

            <div class="flex flexwrap g2 mb2">
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
                    {{
                      distribuicao.investimento ?
                        `R$${dinheiro(distribuicao.investimento)}`
                        : '-'
                    }}
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

            <table
              v-if="distribuicao.registros_sei?.length"
              class="tablemain no-zebra horizontal-lines mb1"
            >
              <caption class="t16 w700 mb05 tamarelo tl">
                Números SEI
              </caption>

              <colgroup>
                <col class="col--botão-de-ação">
                <col>
                <col class="col--dataHora">
                <col class="col--dataHora">
                <col class="col--data">
                <col>
                <col>
                <col>
                <col class="col--botão-de-ação">
              </colgroup>
              <thead>
                <tr>
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
                </tr>
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
                        {{
                          localizarDataHorario(registro?.integracao_sei?.relatorio_sincronizado_em)
                        }}
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
                  <td>
                    {{ localizarData(registro?.integracao_sei?.processado?.ultimo_andamento_em) }}
                  </td>
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
          </div>
        </TransitionExpand>
      </div>
    </section>
    <div class="flex justifycenter">
      <button
        class="btn with-icon bgnone tcprimary"
        aria-label="Fechar erro"
        title="Fechar erro"
        @click="alternaExpandido"
      >
        <svg
          :class="estaExpandido ? 'rotacionado' : ''"
          width="20"
          height="20"
        ><use xlink:href="#i_down" /></svg>
        Detalhamento
      </button>
    </div>
  </div>
</template>
<style scoped lang="less">
@tamanho-da-bolinha: 1.8rem;

.rotacionado {
  .rotate(180deg);
}

.resumo-completo {
  scroll-margin: 2rem;
}

.resumo-da-distribuicao-de-recursos--expandido {
  height: auto;
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
</style>
