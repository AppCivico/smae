<script setup>
import { storeToRefs } from 'pinia';
import { ref, defineProps, computed } from 'vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import TransitionExpand from '@/components/TransitionExpand.vue';
import dinheiro from '@/helpers/dinheiro';
import dateToField from '@/helpers/dateToField';
import combinadorDeListas from '@/helpers/combinadorDeListas.ts';
import { dateToShortDate, localizarData, localizarDataHorario } from '@/helpers/dateToDate';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

const props = defineProps({
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

const recursoFinanceiroValores = computed(() => {
  if (!props.distribuicao) {
    return [
      { label: 'Valor do repasse', valor: '-' },
      { label: 'Valor contrapartida', valor: '-' },
      { label: 'Custeio', valor: '-' },
      { label: 'Investimento', valor: '-' },
    ];
  }

  return [
    { label: 'Valor do repasse', valor: dinheiro(props.distribuicao.valor) },
    { label: 'Valor contrapartida', valor: dinheiro(props.distribuicao.valor_contrapartida) },
    { label: 'Custeio', valor: dinheiro(props.distribuicao.custeio) },
    { label: 'Investimento', valor: dinheiro(props.distribuicao.investimento) },
  ];
});
</script>

<template>
  <div
    ref="resumoCompleto"
    class="resumo-completo"
  >
    <section class="resumo-da-distribuicao-de-recursos">
      <LoadingComponent v-if="distribuicoesPendentes.lista" />

      <div class="resumo-da-distribuicao-de-recursos__descricao f1 fb75 mb2">
        <dl class="flex g2 flexwrap mb2 f1">
          <div>
            <dt class="t16 w700 mb05 tamarelo">
              Gestor municipal
            </dt>

            <dd>
              {{ distribuicao?.orgao_gestor?.sigla || '-' }}
            </dd>
          </div>

          <div class="f1 resumo-da-distribuicao-de-recursos__titulo flex g1">
            <h5 class="mlauto mr0 t16 w700 tc300">
              {{ distribuicao.valor ? `R$${dinheiro(distribuicao.valor)}` : '' }}
            </h5>

            <h6 class="resumo-da-distribuicao-de-recursos__percentagem mr0 t16 w700 tc500">
              ({{ distribuicao.pct_valor_transferencia }}%)
            </h6>
          </div>
        </dl>

        <div class="mb2">
          <h3 class="mb1 t16 w700 tc500">
            <abbr
              v-if="distribuicao.orgao_gestor"
              :title="distribuicao.orgao_gestor.descricao"
            >
              {{ distribuicao.orgao_gestor.sigla }}
            </abbr>
          </h3>

          <h4 class="t14 w400 mb0">
            {{ distribuicao.orgao_gestor.descricao }}
          </h4>
        </div>

        <TransitionExpand>
          <div v-if="estaExpandido">
            <div class="mb2">
              <dl>
                <dt class="t16 w700 mb05 tamarelo">
                  Objeto/Empreendimento
                </dt>

                <dd>
                  {{ distribuicao.objeto || '-' }}
                </dd>
              </dl>
            </div>

            <h1>2</h1>
            <div class="flex flexwrap g4 mb3">
              <div class="recurso-financeiro-valores f1">
                <div
                  v-for="(valorItem, valorItemIndex) in recursoFinanceiroValores"
                  :key="`recurso-financeiro-valores--${valorItemIndex}`"
                  class="recurso-financeiro-valores__item flex f1 spacebetween center p05"
                >
                  <dt class="t16 w700 mb05 tamarelo">
                    {{ valorItem.label }}
                  </dt>

                  <dd>
                    R${{ valorItem.valor }}
                  </dd>
                </div>
              </div>

              <div class="flex column spacebetween">
                <dl class="mb2 f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Dotação orçamentária
                  </dt>

                  <dd>
                    {{ distribuicao.dotacao || '-' }}
                  </dd>
                </dl>

                <dl>
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
            </div>

            <h1>2.1</h1>

            <div class="">
              <div class="flex g1 mb2">
                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Banco
                  </dt>
                  <dd>
                    {{ distribuicao.distribuicao_banco || '-' }}
                  </dd>
                </dl>

                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Agência
                  </dt>
                  <dd>
                    {{ distribuicao.distribuicao_agencia || '-' }}
                  </dd>
                </dl>

                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Número da conta
                  </dt>
                  <dd>
                    {{ distribuicao.distribuicao_conta || '-' }}
                  </dd>
                </dl>
              </div>

              <div class="flex f1 mb2">
                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Empenho
                  </dt>

                  <dd>
                    {{ distribuicao.empenho ? 'Sim' : 'Não' }}
                  </dd>
                </dl>
              </div>
            </div>

            <h1>3</h1>
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

            <h1>4</h1>
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

            <h1>5</h1>
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
                      >
                        <use xlink:href="#i_link" />
                      </svg>
                    </SmaeLink>
                  </td>
                </tr>
              </tbody>
            </table>

            <h1>6</h1>
            <div class="flex g2 center mt3 mb2">
              <h3 class="w700 tc600 t20 mb0">
                Assinaturas
              </h3>
              <hr class="f1">
            </div>

            <h1>7</h1>
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
        >
          <use xlink:href="#i_down" />
        </svg>
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
