<script setup>
import { storeToRefs } from 'pinia';
import { ref, defineProps, computed } from 'vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import TransitionExpand from '@/components/TransitionExpand.vue';
import dinheiro from '@/helpers/dinheiro';
import dateToDate from '@/helpers/dateToDate';
import dateToField from '@/helpers/dateToField';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';

const props = defineProps({
  distribuicao: {
    type: Object,
    default: () => ({}),
    required: true,
  },
});

const distribuicaoRecursosStore = useDistribuicaoRecursosStore();
const {
  chamadasPendentes: distribuicoesPendentes,
} = storeToRefs(distribuicaoRecursosStore);

const resumoCompleto = ref(null);
const estaExpandido = ref(false);

function alternaExpandido() {
  estaExpandido.value = !estaExpandido.value;
  if (!estaExpandido.value) {
    resumoCompleto.value.scrollIntoView({ behavior: 'smooth' });
  }
}

function atualizarLido(linha, lido) {
  linha.lido = lido;

  distribuicaoRecursosStore.selectionarSeiLido({
    id: props.distribuicao.transferencia_id,
    processoSei: linha.integracao_sei.processo_sei,
    lido,
  });
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
    { label: 'Custeio', porcentagem: props.distribuicao.pct_custeio, valor: dinheiro(props.distribuicao.custeio) },
    { label: 'Investimento', porcentagem: props.distribuicao.pct_investimento, valor: dinheiro(props.distribuicao.investimento) },
  ];
});

const registrosSei = computed(() => {
  if (!props.distribuicao.registros_sei) {
    return [];
  }

  const data = props.distribuicao.registros_sei.map((item) => {
    if (item.integracao_sei && typeof item.integracao_sei.json_resposta === 'string') {
      item.integracao_sei.json_resposta = JSON.parse(item.integracao_sei.json_resposta);
    }

    return item;
  });

  return data;
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

            <div class="flex flexwrap g4 mb3">
              <div class="recurso-financeiro-valores f1">
                <div
                  v-for="(valorItem, valorItemIndex) in recursoFinanceiroValores"
                  :key="`recurso-financeiro-valores--${valorItemIndex}`"
                  class="recurso-financeiro-valores__item flex f1 spacebetween center p05"
                >
                  <dt class="t16 w700 mb05 tamarelo recurso-financeiro-valores__item-label">
                    {{ valorItem.label }}
                  </dt>

                  <dd
                    v-if="valorItem.porcentagem"
                    class="recurso-financeiro-valores__item-porcentagem"
                  >
                    {{ valorItem.porcentagem }}%
                  </dd>

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

            <div>
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

              <div class="flex g1 mb2">
                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Gestor do contrato
                  </dt>

                  <dd>
                    {{ distribuicao.gestor_contrato || '-' }}
                  </dd>
                </dl>

                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Empenho
                  </dt>

                  <dd>
                    {{ distribuicao.empenho ? 'Sim' : 'Não' }}
                  </dd>
                </dl>

                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Valor empenhado
                  </dt>

                  <dd>
                    {{ distribuicao.valor_empenho
                      ? `R$${dinheiro(distribuicao.valor_empenho)}` : '-'
                    }}
                  </dd>
                </dl>
              </div>

              <div class="flex g1 mb2">
                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Data
                  </dt>

                  <dd>
                    {{
                      distribuicao.data_empenho ?
                        dateToDate(distribuicao.data_empenho) : '-'
                    }}
                  </dd>
                </dl>

                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Finalidade
                  </dt>

                  <dd>
                    {{ distribuicao.finalidade || '-' }}
                  </dd>
                </dl>

                <dl class="f1" />
              </div>

              <div class="flex g1 mb2">
                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Rúbrica da receita
                  </dt>

                  <dd>
                    {{ distribuicao.rubrica_de_receita ||'-' }}
                  </dd>
                </dl>

                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Liquidação/Pagamento
                  </dt>

                  <dd>
                    {{ distribuicao.valor_liquidado
                      ? `R$${dinheiro(distribuicao.valor_liquidado)}` : '-'
                    }}
                  </dd>
                </dl>

                <dl class="f1" />
              </div>
            </div>

            <SmaeTable
              v-if="registrosSei?.length"
              :dados="registrosSei"
              rolagem-horizontal
              titulo="Números SEI"
              :colunas="[
                {
                  chave: 'processo_sei',
                  label: 'Código SEI',
                  ehCabecalho: true,
                },
                {
                  chave: 'integracao_sei.relatorio_sincronizado_em',
                  label: 'data sincronização',
                  formatador: dateToDate
                },
                {
                  chave: 'integracao_sei.sei_atualizado_em',
                  label: 'Data última alteração',
                  formatador: dateToDate
                },
                {
                  chave: 'integracao_sei.json_resposta.ultimo_andamento.data',
                  label: 'Data último andamento',
                  formatador: dateToDate
                },
                {
                  chave: 'integracao_sei.json_resposta.ultimo_andamento.unidade.sigla',
                  label: 'unidade',
                },
                {
                  chave: 'integracao_sei.json_resposta.ultimo_andamento.usuario.nome',
                  label: 'usuário'
                },
                {
                  chave: 'lido',
                  label: 'não lido'
                },
                {
                  chave: 'link',
                },
              ]"
            >
              <template #titulo>
                <caption class="t16 w700 mb05 tamarelo tl">
                  Números SEI
                </caption>
              </template>

              <template #celula:lido="{ linha }">
                <label>
                  <input
                    v-if="linha.integracao_sei"
                    type="checkbox"
                    class="interruptor"
                    :checked="linha.lido"
                    :aria-disabled="!linha.integracao_sei"
                    @input="ev => atualizarLido(linha, ev.target.checked)"
                  >
                </label>
              </template>

              <template #celula:link="{ linha }">
                <span>
                  <SmaeLink
                    v-if="linha.integracao_sei?.link"
                    :to="linha.integracao_sei?.link"
                    title="Abrir no site do SEI"
                    @click="atualizarLido(linha, true)"
                  >
                    <svg
                      width="20"
                      height="20"
                    >
                      <use xlink:href="#i_link" />
                    </svg>
                  </SmaeLink>
                </span>
              </template>
            </SmaeTable>
            <div>
              <div class="flex g1 mt1 mb2">
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

                <dl class="f1">
                  <dt class="t16 w700 mb05 tamarelo">
                    Número do contrato
                  </dt>

                  <dd>
                    {{ distribuicao.contrato || '-' }}
                  </dd>
                </dl>
              </div>
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

            <div>
              <div class="flex g2 center mt3 mb2">
                <h3 class="w700 tc600 t20 mb0">
                  Assinaturas
                </h3>
                <hr class="f1">
              </div>

              <div>
                <div class="flex g2 flexwrap mb2">
                  <dl class="f1">
                    <dt class="t16 w700 mb05 tamarelo">
                      Data da assinatura do termo de aceite
                    </dt>

                    <dd>
                      {{
                        distribuicao.assinatura_termo_aceite
                          ? dateToField(distribuicao.assinatura_termo_aceite) : '-'
                      }}
                    </dd>
                  </dl>

                  <dl class="f1">
                    <dt class="t16 w700 mb05 tamarelo">
                      Data da assinatura do representante do estado
                    </dt>

                    <dd>
                      {{
                        distribuicao.assinatura_estado
                          ? dateToField(distribuicao.assinatura_estado) : '-'
                      }}
                    </dd>
                  </dl>

                  <dl class="f1">
                    <dt class="t16 w700 mb05 tamarelo">
                      Data da assinatura do representante do município
                    </dt>

                    <dd>
                      {{
                        distribuicao.assinatura_municipio
                          ? dateToField(distribuicao.assinatura_municipio) : '-'
                      }}
                    </dd>
                  </dl>
                </div>

                <div class="flex g2 flexwrap mb2">
                  <dl class="f1">
                    <dt class="t16 w700 mb05 tamarelo">
                      Data de vigência
                    </dt>

                    <dd>
                      {{
                        distribuicao.vigencia
                          ? dateToField(distribuicao.vigencia) : '-'
                      }}
                    </dd>
                  </dl>

                  <dl class="f1">
                    <dt class="t16 w700 mb05 tamarelo">
                      Data de conclusão da suspensiva
                    </dt>

                    <dd>
                      {{
                        distribuicao.conclusao_suspensiva
                          ? dateToField(distribuicao.conclusao_suspensiva) : '-'
                      }}
                    </dd>
                  </dl>

                  <dl class="f1" />
                </div>
              </div>
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
