<template>
  <details
    :id="$attrs.id"
    ref="detailsElem"
    :open="$props.open || $props.cicloAtual"
    :class="cicloAtual ? 'ciclo-atual' : 'ciclo-passado'"
    @toggle.prevent="handleToggle"
  >
    <summary :class="cicloAtual ? 'ciclo-atual__summary' : ''">
      <div
        v-if="cicloAtual"
        class="titulo-monitoramento"
      >
        <h2 class="tc500 t20 titulo-monitoramento__text">
          <span class="w400">
            Ciclo <template v-if="cicloAtual">atual</template>:
          </span>
          {{ dateToTitle(ciclo.data_ciclo) }}
        </h2>
      </div>
      <template v-else>
        <h2 class="tc500 t20">
          {{ dateToTitle(ciclo.data_ciclo) }}
        </h2>
      </template>
    </summary>
    <LoadingComponent
      v-if="chamadasPendentes.ciclosDetalhadosPorId[ciclo.id]"
      class="mb2"
    />
    <div
      v-else
      class="details-content"
    >
      <div class="details-content__item">
        <div class="flex g2 center mt3 mb2">
          <h3 class="w700 mb0">
            Qualificação
          </h3>
          <hr class="f1">
        </div>
        <dl>
          <div
            class="mb1"
          >
            <dt class="t12 uc w700 mb05 tc300">
              <div class="flex spacebetween">
                Informações complementares
                <SmaeLink
                  v-if="cicloAtual && saoEditaveis.analise"
                  :to="{
                    name: `.monitoramentoDeMetasAnaliseQualitativa`,
                    params: { cicloId: ciclo.id }
                  }"
                  class="tprimary"
                >
                  <svg
                    width="20"
                    height="20"
                  >
                    <use xlink:href="#i_edit" />
                  </svg>
                </SmaeLink>
              </div>
              <hr class="f1 mt025">
            </dt>
            <dd
              class="t13 contentStyle mt1"
              v-html="analise?.informacoes_complementares || '-'"
            />
          </div>
        </dl>
        <hr class="f1">
        <footer
          v-if="analise?.criador?.nome_exibicao || analise?.criado_em"
          class="tc600 mt1"
        >
          <p>
            Analisado
            <template v-if="analise.criador?.nome_exibicao">
              por <strong>{{ analise.criador.nome_exibicao }}</strong>
            </template>
            <template v-if="analise.criado_em">
              em
              <time :datetime="analise.criado_em">
                {{ dateToShortDate(analise.criado_em) }}
              </time>.
            </template>
          </p>
          <hr class="f1">
        </footer>

        <ListaDeDocumentos
          v-if="analiseDocumentos.length"
          :arquivos="analiseDocumentos"
        />
      </div>

      <div class="details-content__item">
        <div class="flex g2 center mt3 mb2">
          <h3 class="w700 mb0">
            Análise de risco
          </h3>
          <hr class="f1">
        </div>
        <dl>
          <div class="mb1">
            <dt class="t12 uc w700 mb05 tc300">
              <div class="flex spacebetween">
                Detalhamento
                <SmaeLink
                  v-if="cicloAtual && saoEditaveis.risco"
                  :to="{
                    name: `.monitoramentoDeMetasAnaliseDeRisco`,
                    params: { cicloId: ciclo.id }
                  }"
                  class="tprimary"
                >
                  <svg
                    width="20"
                    height="20"
                  >
                    <use xlink:href="#i_edit" />
                  </svg>
                </SmaeLink>
              </div>
              <hr class="f1 mt025">
            </dt>
            <dd
              class="t13 contentStyle"
              v-html="risco?.detalhamento || '-'"
            />
          </div>
          <div
            class="mb1"
          >
            <dt class="t12 uc w700 mb05 tc300">
              Ponto de ação
              <hr class="f1 mt025">
            </dt>
            <dd
              class="t13 contentStyle"
              v-html="risco?.ponto_de_atencao || '-'"
            />
          </div>
        </dl>
        <footer
          v-if="risco?.criador?.nome_exibicao || risco?.criado_em"
          class="tc600"
        >
          <p>
            Analisado
            <template v-if="risco.criador?.nome_exibicao">
              por <strong>{{ risco.criador.nome_exibicao }}</strong>
            </template>
            <template v-if="risco.criado_em">
              em <time :datetime="risco.criado_em">{{ dateToShortDate(risco.criado_em) }}</time>.
            </template>
          </p>
        </footer>
      </div>

      <div class="details-content__item">
        <div class="flex g2 center mt3 mb2">
          <h3 class="w700 mb0">
            Fechamento
          </h3>
          <hr class="f1">
        </div>
        <dl>
          <div class="mb1">
            <dt class="t12 uc w700 mb05 tc300">
              <div class="flex spacebetween">
                Comentários
                <SmaeLink
                  v-if="cicloAtual && saoEditaveis.fechamento"
                  :to="{
                    name: `.monitoramentoDeMetasRegistroDeFechamento`,
                    params: { cicloId: ciclo.id }
                  }"
                  class="tprimary"
                >
                  <svg
                    width="20"
                    height="20"
                  >
                    <use xlink:href="#i_edit" />
                  </svg>
                </SmaeLink>
              </div>
            </dt>
            <dd
              class="t13 contentStyle"
              v-html="fechamento?.comentario || '-'"
            />
          </div>
        </dl>
        <footer
          v-if="fechamento?.criador?.nome_exibicao || fechamento?.criado_em"
          class="tc600"
        >
          <p>
            Fechado
            <template v-if="fechamento.criador?.nome_exibicao">
              por <strong>{{ fechamento.criador.nome_exibicao }}</strong>
            </template>
            <template v-if="fechamento.criado_em">
              em <time :datetime="fechamento.criado_em">
                {{ dateToShortDate(fechamento.criado_em) }}
              </time>.
            </template>
          </p>
        </footer>
      </div>
    </div>
  </details>
</template>
<script setup>
import ListaDeDocumentos from '@/components/monitoramentoDeMetas/ListaDeDocumentos.vue';
import { dateToShortDate } from '@/helpers/dateToDate';
import dateToTitle from '@/helpers/dateToTitle';
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';
import { storeToRefs } from 'pinia';
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
  ciclo: {
    type: Object,
    default: () => ({}),
  },
  metaId: {
    type: [
      Number,
      String,
    ],
    required: true,
  },
  open: {
    type: Boolean,
    default: false,
  },
  cicloAtual: {
    type: Boolean,
    default: false,
  },
});

const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);
const estaAberto = ref(false);

const {
  saoEditaveis,
  chamadasPendentes,
  ciclosDetalhadosPorId,
} = storeToRefs(monitoramentoDeMetasStore);

const detailsElem = ref(null);
const cicloDetalhes = computed(() => ciclosDetalhadosPorId.value?.[props.ciclo.id]?.atual || null);

const analise = computed(() => cicloDetalhes.value?.analise || null);
const analiseDocumentos = computed(() => cicloDetalhes.value?.arquivos || []);
const risco = computed(() => cicloDetalhes.value?.risco || null);
const fechamento = computed(() => cicloDetalhes.value?.fechamento || null);

function handleToggle(event) {
  estaAberto.value = event.target.open;
}

watch(() => estaAberto.value, (novoValor) => {
  if (novoValor && !cicloDetalhes.value) {
    monitoramentoDeMetasStore.buscarCiclo(
      route.params.planoSetorialId,
      props.ciclo.id,
      {
        meta_id: route.params.meta_id,
      },
    );
  }
});

onMounted(() => {
  estaAberto.value = props.open;
});
</script>
<style scoped>
.ciclo-atual__summary::before {
  display: none;
}

.details-content__item {
  margin-block-end: 3rem;
  padding-block-end: 3rem;
  border-block-end: 1px solid #005c8a;
}

.ciclo-passado .details-content__item {
  padding-inline: 1.5rem;
}
</style>
