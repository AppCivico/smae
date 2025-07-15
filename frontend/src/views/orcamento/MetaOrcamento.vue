<script setup>
import { storeToRefs } from 'pinia';
import {
  computed, defineOptions, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import ConcluirPorOrgao from '@/components/orcamento/ConcluirPorOrgao.vue';
import SimpleOrcamentoCusteio from '@/components/orcamento/SimpleOrcamentoCusteio.vue';
import SimpleOrcamentoPlanejado from '@/components/orcamento/SimpleOrcamentoPlanejado.vue';
import SimpleOrcamentoRealizado from '@/components/orcamento/SimpleOrcamentoRealizado.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useMetasStore } from '@/stores/metas.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';

defineOptions({ inheritAttrs: false });

const alertStore = useAlertStore();

const props = defineProps({
  area: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

const route = useRoute();
const { meta_id: metaId } = route.params;
const { iniciativa_id: iniciativaId } = route.params;
const { atividade_id: atividadeId } = route.params;

const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);
const parentlink = `${metaId ? `/metas/${metaId}` : ''}${iniciativaId ? `/iniciativas/${iniciativaId}` : ''}${atividadeId ? `/atividades/${atividadeId}` : ''}`;

const conclusãoPendente = ref(false);
const campoPlanoConcluído = ref(null);
const anoDoDiálogoDeConclusãoAberto = ref(false);

const OrcamentosStore = useOrcamentosStore();

const {
  OrcamentoRealizadoConclusao,
  OrcamentoRealizadoConclusaoAdmin,
  OrcamentoCusteio,
  OrcamentoPlanejado,
  OrcamentoRealizado,
} = storeToRefs(OrcamentosStore);

OrcamentosStore.clear();

const parentLabel = computed(() => {
  if (atividadeId || iniciativaId) {
    return '-';
  }

  if (metaId) {
    return 'Meta';
  }

  return false;
});

const SimpleOrcamento = computed(() => {
  switch (props.area) {
    case 'Realizado':
      return SimpleOrcamentoRealizado;
    case 'Planejado':
      return SimpleOrcamentoPlanejado;
    case 'Custo':
      return SimpleOrcamentoCusteio;
    default:
      return null;
  }
});

const orçamentosEmOrdemDecrescente = computed(() => (Array.isArray(activePdm.value.orcamento_config)
  ? activePdm.value.orcamento_config
  // adicionando `_` à chave para porque números causam sua reordenação
    .map((x) => ({ ...x, chave: `_${x.ano_referencia}` }))
    .sort((a, b) => b.ano_referencia - a.ano_referencia)
  : []));
const anoCorrente = new Date().getUTCFullYear();

let anoPaginaAberta = orçamentosEmOrdemDecrescente.value.at(0).ano_referencia;
const anoCorrenteEstaNoPlano = orçamentosEmOrdemDecrescente.value.find(
  (item) => item.ano_referencia === anoCorrente,
);

if (anoCorrenteEstaNoPlano) {
  anoPaginaAberta = anoCorrenteEstaNoPlano.ano_referencia;
}

const dadosExtrasDeAbas = computed(() => orçamentosEmOrdemDecrescente.value.reduce((acc, cur) => {
  acc[`_${cur.ano_referencia}`] = {
    etiqueta: cur.ano_referencia,
  };

  if (Number(anoPaginaAberta) === Number(cur.ano_referencia)) {
    acc[`_${cur.ano_referencia}`].aberta = true;
  }
  return acc;
}, {}));

async function start() {
  await MetasStore.getPdM();
  if (atividadeId) parentLabel.value = activePdm.value.rotulo_atividade;
  else if (iniciativaId) parentLabel.value = activePdm.value.rotulo_iniciativa;
}

function buscarDadosParaAno(ano) {
  switch (props.area) {
    case 'Realizado':
      if (
        !Array.isArray(OrcamentoRealizado.value?.[ano])
        || !OrcamentoRealizado.value?.[ano].length
      ) {
        OrcamentosStore.getOrcamentoRealizadoById(metaId, ano);
      }
      break;

    case 'Planejado':
      if (
        !Array.isArray(OrcamentoPlanejado.value?.[ano])
        || !OrcamentoPlanejado.value?.[ano].length
      ) {
        OrcamentosStore.getOrcamentoPlanejadoById(metaId, ano);
      }
      break;

    case 'Custo':
      if (
        !Array.isArray(OrcamentoCusteio.value?.[ano])
        || !OrcamentoCusteio.value?.[ano].length
      ) {
        OrcamentosStore.getOrcamentoCusteioById(metaId, ano);
      }
      break;
    default:
      console.error('Área de orçamento não reconhecida');
      break;
  }
}

async function concluirOrçamento(evento, meta, ano) {
  if (conclusãoPendente.value) {
    return;
  }

  const valor = !OrcamentoRealizadoConclusao.value[ano].concluido;

  alertStore.confirmAction('Somente a coordenadoria poderá desfazer essa ação. Tem certeza?', async () => {
    const carga = {
      meta_id: meta,
      ano_referencia: ano,
      concluido: valor,
    };

    conclusãoPendente.value = true;
    try {
      const resultado = await OrcamentosStore.closeOrcamentoRealizado(carga);

      // Mudar mensagem junto ao botão enquanto a nova requisição não chega
      OrcamentoRealizadoConclusao.value[ano].concluido = resultado
        ? valor
        : !valor;
    } catch (error) {
      evento.preventDefault();
    } finally {
      await start();

      conclusãoPendente.value = false;
      campoPlanoConcluído.value.checked = !!OrcamentoRealizadoConclusao.value[ano].concluido;
    }
  }, 'Concluir', () => {
    evento.preventDefault();
    alertStore.$reset();
  });
}

watch(() => route.path, start, { immediate: true });
watch(() => route.query.aba, (novoValor) => {
  if (novoValor) {
    buscarDadosParaAno(novoValor);
  }
}, { immediate: true });
</script>
<template>
  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo">
        {{ parentLabel }}
      </div>
      <h1>{{ title }}</h1>
    </div>
    <hr class="ml2 f1">
  </div>

  <EnvelopeDeAbas
    v-if="orçamentosEmOrdemDecrescente.length"
    :key="$props.area"
    class="boards"
    :meta-dados-por-id="dadosExtrasDeAbas"
  >
    <template
      v-for="orc in orçamentosEmOrdemDecrescente"
      #[orc.chave]
      :key="orc.chave"
    >
      <component
        :is="SimpleOrcamento"
        :meta_id="metaId"
        :config="orc"
        :parentlink="parentlink"
        @apagar="start"
      >
        <template
          v-if="orc.execucao_disponivel && activePdm"
          #cabeçalho="{ ano }"
        >
          <label
            v-if="OrcamentoRealizadoConclusao[ano]"
            class="conclusão-de-plano__label ml2"
            :class="{ loading: conclusãoPendente }"
          >
            <input
              ref="campoPlanoConcluído"
              type="checkbox"
              name="plano-concluído"
              class="interruptor"
              :disabled="!OrcamentoRealizadoConclusao[ano]?.pode_editar"
              :aria-disabled="!OrcamentoRealizadoConclusao[ano]?.pode_editar"
              :checked="OrcamentoRealizadoConclusao[ano]?.concluido"
              @click.prevent="($event) => {
                concluirOrçamento(
                  $event, Number($route.params.meta_id), ano
                );
              }"
            >
            <template
              v-if="OrcamentoRealizadoConclusao[ano]?.concluido"
            >
              Concluído - {{ conclusãoPendente.value }}
            </template>
            <template v-else>
              Concluir
            </template>
          </label>
          <!-- Estamos dentro de um loop! Vamos ter certeza de que só um diálogo abriu!-->
          <ConcluirPorOrgao
            v-if="anoDoDiálogoDeConclusãoAberto === ano"
            :ano="ano"
            :meta="metaId"
            @close="() => { anoDoDiálogoDeConclusãoAberto = 0; }"
          />
          <button
            v-if="OrcamentoRealizadoConclusaoAdmin[ano]?.length"
            type="button"
            class="btn with-icon bgnone tcprimary p0"
            @click="anoDoDiálogoDeConclusãoAberto = ano"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
            Conclusão por órgãos
          </button>
        </template>
      </component>
    </template>
  </EnvelopeDeAbas>

  <template v-else-if="activePdm.error">
    <div class="error p1">
      <p class="error-msg">
        Error: {{ activePdm.error }}
      </p>
    </div>
  </template>
</template>
