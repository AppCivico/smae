<script setup>
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import months from '@/consts/months';
import dinheiro from '@/helpers/dinheiro';
import retornarQuaisOsRecentesDosItens from '@/helpers/retornarQuaisOsMaisRecentesDosItensDeOrcamento';
import toFloat from '@/helpers/toFloat';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { useMetasStore } from '@/stores/metas.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { range } from 'lodash';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useField,
} from 'vee-validate';
import {
  computed, onMounted, onUpdated, ref, toRef, watch,
} from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { líquidoDosItens, orçamentoEmFoco } = storeToRefs(useOrcamentosStore());
const props = defineProps({
  controlador: {
    type: Array,
    default: () => [],
  },
  name: {
    type: String,
    required: true,
  },
  respostasof: {
    type: Object,
    required: true,
  },
});

let MetasStore;
let projetosStore;

const itens = ref(props.controlador);
const emit = defineEmits(['change']);
const name = toRef(props, 'name');
const { handleChange } = useField(name, undefined, {
  initialValue: props.controlador,
});
const maisRecentesDosItens = computed(() => retornarQuaisOsRecentesDosItens(itens.value));
const mesesSelecionados = computed(() => itens.value?.map((x) => x.mes) || []);
const mesesDisponíveis = computed(() => {
  let mesesPermitidos = range(1, 13);

  if (route.params.projetoId) {
    if (!projetosStore) {
      projetosStore = useProjetosStore();
    }

    if (Array.isArray(projetosStore.emFoco?.portfolio?.orcamento_execucao_disponivel_meses)) {
      mesesPermitidos = projetosStore.emFoco.portfolio.orcamento_execucao_disponivel_meses;
    }
  } else {
    if (!MetasStore) {
      MetasStore = useMetasStore();
    }
    if (Array.isArray(MetasStore.activePdm?.orcamento_config)) {
      const configuraçõesParaEsseAno = MetasStore.activePdm.orcamento_config
        .find((x) => x.ano_referencia === Number(route.params.ano));

      mesesPermitidos = configuraçõesParaEsseAno.execucao_disponivel_meses;
    }
  }

  return mesesPermitidos.filter((x) => !mesesSelecionados.value.includes(x));
});
const totais = computed(() => ({
  empenho: líquidoDosItens.value.empenho + maisRecentesDosItens.value.empenho,
  liquidação: líquidoDosItens.value.liquidação + maisRecentesDosItens.value.liquidação,
}));

const totaisQueSuperamSOF = computed(() => ({
  empenho: orçamentoEmFoco?.value?.empenho_liquido !== null
    && typeof orçamentoEmFoco?.value?.empenho_liquido !== 'undefined'
    ? totais.value.empenho > Number(orçamentoEmFoco.value.empenho_liquido)
    : false,
  liquidação: orçamentoEmFoco?.value?.valor_liquidado !== null
    && typeof orçamentoEmFoco?.value?.valor_liquidado !== 'undefined'
    ? totais.value.liquidação > Number(orçamentoEmFoco.value.valor_liquidado)
    : false,
}));

watch(itens.value, (newValue) => {
  const valorLimpo = newValue.map((x) => ({
    mes: x.mes,
    valor_empenho: toFloat(x.valor_empenho),
    valor_liquidado: toFloat(x.valor_liquidado),
  }));

  handleChange(valorLimpo);
});

function start() {
  itens.value = props.controlador;
}

start();
onMounted(() => { start(); });
onUpdated(() => { start(); });

function removeItem(g, i) {
  g = g.splice(i, 1);
  emit('change', g);
}
function addItem(g) {
  g = g.push({ mes: 0, valor_empenho: 0, valor_liquidado: 0 });
  emit('change', g);
}
</script>
<template>
  <hr class="mt2 mb2">

  <legend class="label mt2 mb1">
    Ciclo de monitoramento
  </legend>

  <p class="t300 tc500 mb2">
    No quadro abaixo, informar o mês correspondente a etapa do ciclo e os
    valores acumulados realizados até o período. A cada novo ciclo, uma nova
    linha deve ser inserida com a informação dos valores acumulados, ou seja, o
    total realizado a partir de janeiro até o período de referência.
  </p>

  <div class="flex g2 mb1">
    <div class="f1">
      <label class="label tc300">Mês Ref. <span class="tvermelho">*</span></label>
    </div>
    <div class="f1">
      <label class="label tc300">Valor empenho <span class="tvermelho">*</span></label>
    </div>
    <div class="f1">
      <label class="label tc300">Valor liquidação <span class="tvermelho">*</span></label>
    </div>
    <div style="flex-basis: 30px;" />
  </div>

  <div
    v-for="(item, i) in itens"
    :key="i"
    class="flex center g2 mb1"
  >
    <div class="f1">
      <Field
        v-model.number="item.mes"
        :name="`itens[${i}].mes`"
        class="inputtext light"
        as="select"
      >
        <option
          :value="0"
          disabled
        >
          Selecionar
        </option>
        <option
          v-for="month, k in months"
          :key="k"
          :value="k + 1"
          :disabled="k + 1 != item.mes && !mesesDisponíveis.includes(k + 1)"
        >
          {{ month }}
        </option>
      </Field>
      <ErrorMessage
        class="error-msg mb1"
        :name="`itens[${i}].mes`"
      />
    </div>
    <div class="f1">
      <MaskedFloatInput
        v-model="item.valor_empenho"
        :value="item.valor_empenho"
        :name="`itens[${i}].valor_empenho`"
        type="text"
        class="inputtext light"
      />
      <ErrorMessage
        class="error-msg mb1"
        :name="`itens[${i}].valor_empenho`"
      />
    </div>
    <div class="f1">
      <MaskedFloatInput
        v-model="item.valor_liquidado"
        :value="item.valor_liquidado"
        :name="`itens[${i}].valor_liquidado`"
        type="text"
        class="inputtext light"
      />
      <ErrorMessage
        class="error-msg mb1"
        :name="`itens[${i}].valor_liquidado`"
      />
    </div>
    <div style="flex-basis: 30px;">
      <a
        class="addlink"
        @click="removeItem(itens, i)"
      ><svg
        width="20"
        height="20"
      ><use xlink:href="#i_remove" /></svg></a>
    </div>
  </div>
  <div class="tc mb2">
    <button
      type="button"
      class="btn outline bgnone tcprimary"
      @click="addItem(itens)"
    >
      Informar execução orçamentária
    </button>
  </div>

  <div class="flex g2 mb2">
    <div class="f1" />

    <div class="f1">
      <div
        v-if="respostasof.smae_soma_valor_empenho != undefined"
        class="flex center flexwrap"
      >
        <span class="label mb0 tc300 mr1">Total Empenho SMAE</span>
        <span class="t14">R$ {{ dinheiro(totais.empenho) }}</span>
        <span
          v-if="totaisQueSuperamSOF.empenho"
          class="tvermelho w700 block"
        >(valor supera empenho SOF)</span>
      </div>
    </div>

    <div class="f1">
      <div
        v-if="respostasof.smae_soma_valor_liquidado != undefined"
        class="flex center flexwrap"
      >
        <span class="label mb0 tc300 mr1">Total liquidação SMAE</span>
        <span class="t14">R$ {{ dinheiro(totais.liquidação) }}</span>
        <span
          v-if="totaisQueSuperamSOF.liquidação"
          class="tvermelho w700 block"
        >(valor supera liquidação SOF)</span>
      </div>
    </div>
  </div>
</template>
