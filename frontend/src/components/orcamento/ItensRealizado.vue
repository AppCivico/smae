<script setup>
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import months from '@/consts/months';
import dinheiro from '@/helpers/dinheiro';
import retornarQuaisOsRecentesDosItens from '@/helpers/retornarQuaisOsMaisRecentesDosItensDeOrcamento';
import { useMetasStore } from '@/stores/metas.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { range } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed, defineModel, defineOptions } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({ inheritAttrs: false });
defineProps({
  modelValue: {
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

const route = useRoute();

const { líquidoDosItens, orçamentoEmFoco } = storeToRefs(useOrcamentosStore());

const model = defineModel({
  default: [],
});

const maisRecentesDosItens = computed(() => retornarQuaisOsRecentesDosItens(model.value));
const mesesSelecionados = computed(() => model.value?.map((x) => x.mes) || []);
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

function removeItem(i) {
  model.value.splice(i, 1);
}

function addItem() {
  model.value.push({ mes: 0, valor_empenho: 0, valor_liquidado: 0 });
}
</script>
<template>
  <table class="tablemain no-zebra mb1">
    <thead>
      <tr>
        <th>Mês Ref. *</th>
        <th>Valor empenho *</th>
        <th>Valor liquidação *</th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="item, i in model"
        :key="i"
      >
        <td>
          <select
            v-model.number="item.mes"
            :name="`${name}[${i}].mes`"
            class="inputtext light"
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
          </select>
        </td>

        <td>
          <MaskedFloatInput
            v-model="item.valor_empenho"
            :value="Number(item.valor_empenho)"
            :name="`${name}[${i}].valor_empenho`"
            type="text"
            class="inputtext light"
          />
        </td>
        <td>
          <MaskedFloatInput
            v-model="item.valor_liquidado"
            :value="Number(item.valor_liquidado)"
            :name="`${name}[${i}].valor_liquidado`"
            type="text"
            class="inputtext light"
          />
        </td>
        <td>
          <button
            type="button"
            class="like-a__link addlink"
            @click="removeItem(i)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
      </tr>
    </tbody>
  </table>

  <button
    class="like-a__text addlink mb1"
    type="button"
    @click="addItem()"
  >
    <svg
      width="20"
      height="20"
    ><use xlink:href="#i_+" /></svg>Informar execução orçamentária
  </button>

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
