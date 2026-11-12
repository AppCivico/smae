<script setup>
import Big from 'big.js';
import { range } from 'lodash';
import { storeToRefs } from 'pinia';
import {
  computed, defineModel, defineOptions,
} from 'vue';
import { useRoute } from 'vue-router';

import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import months from '@/consts/months';
import dinheiro from '@/helpers/dinheiro';
import { useMetasStore } from '@/stores/metas.store';
import { useObrasStore } from '@/stores/obras.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';

import retornarQuaisOsRecentesDosItens from './helpers/retornarQuaisOsMaisRecentesDosItensDeOrcamento';

defineOptions({ inheritAttrs: false });
const props = defineProps({
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
let obrasStore;

const route = useRoute();

const { líquidoDosItens, orçamentoEmFoco } = storeToRefs(useOrcamentosStore());

const model = defineModel({
  required: true,
  type: Array,
});

const maisRecenteDosMeses = computed(() => (
  model.value?.reduce((acc, cur) => Math.max(acc, cur.mes), 0)
));
const maisRecentesDosItens = computed(() => retornarQuaisOsRecentesDosItens(model.value));
const mesesSelecionados = computed(() => model.value?.map((x) => x.mes) || []);
const mesesDisponíveis = computed(() => {
  let mesesPermitidos = range(1, 13);

  switch (route.meta.entidadeMãe) {
    case 'obras': // TODO: trocar todas as ocorrências para 'mdo'
    case 'mdo':
      if (!obrasStore) {
        obrasStore = useObrasStore();
      }

      if (Array.isArray(obrasStore.emFoco?.portfolio?.orcamento_execucao_disponivel_meses)) {
        mesesPermitidos = obrasStore.emFoco.portfolio.orcamento_execucao_disponivel_meses;
      }
      break;

    case 'projeto':
      if (!projetosStore) {
        projetosStore = useProjetosStore();
      }

      if (Array.isArray(projetosStore.emFoco?.portfolio?.orcamento_execucao_disponivel_meses)) {
        mesesPermitidos = projetosStore.emFoco.portfolio.orcamento_execucao_disponivel_meses;
      }
      break;

    // transferências não têm configuração de meses disponíveis
    case 'TransferenciasVoluntarias':
      break;

    default:
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
  empenho: (líquidoDosItens.value.empenho ?? 0)
    + (maisRecentesDosItens.value.empenho ?? 0),
  liquidação: (líquidoDosItens.value.liquidação ?? 0)
    + (maisRecentesDosItens.value.liquidação ?? 0),
}));

const totaisQueSuperamSOF = computed(() => ({
  empenho: orçamentoEmFoco?.value?.empenho_liquido !== null
    && orçamentoEmFoco?.value?.empenho_liquido !== undefined
    ? totais.value.empenho > Number(orçamentoEmFoco.value.empenho_liquido)
    : false,
  liquidação: orçamentoEmFoco?.value?.valor_liquidado !== null
    && orçamentoEmFoco?.value?.valor_liquidado !== undefined
    ? totais.value.liquidação > Number(orçamentoEmFoco.value.valor_liquidado)
    : false,
}));

function removeItem(i) {
  model.value.splice(i, 1);
}

function obterCampos(coluna) {
  switch (coluna) {
    case 'empenho':
      return {
        base: props.respostasof.empenho_liquido,
        campoPercentual: 'percentual_empenho',
        campoValor: 'valor_empenho',
      };

    case 'liquidação':
    case 'liquidacao':
      return {
        base: props.respostasof.valor_liquidado,
        campoPercentual: 'percentual_liquidado',
        campoValor: 'valor_liquidado',
      };

    default:
      throw new Error('Coluna desconhecida fornecida');
  }
}

function atualizarDePercentagem(i, coluna) {
  const { base, campoPercentual, campoValor } = obterCampos(coluna);
  const percentual = model.value[i][campoPercentual];

  if (percentual === 0) {
    model.value[i][campoPercentual] = null;
    return;
  }

  model.value[i][campoValor] = new Big(percentual)
    .times(new Big(base).div(100))
    .toFixed(2);
}

function atualizarDeValor(i, coluna, valor) {
  const { base, campoPercentual } = obterCampos(coluna);

  if (valor === null || valor === undefined || valor === ''
    || !Number(base)) {
    model.value[i][campoPercentual] = null;
    return;
  }

  model.value[i][campoPercentual] = Number(new Big(valor)
    .times(100)
    .div(new Big(base))
    .toFixed(2));
}

async function addItem() {
  model.value.push({ mes: 0, valor_empenho: 0, valor_liquidado: 0 });
}
</script>
<template>
  <pre v-scrollLockDebug>respostasof:{{ respostasof }}</pre>
  <pre v-scrollLockDebug>orçamentoEmFoco:{{ orçamentoEmFoco }}</pre>
  <pre v-scrollLockDebug>
líquidoDosItens.empenho: {{ líquidoDosItens.empenho }}
líquidoDosItens.liquidação: {{ líquidoDosItens.liquidação }}
maisRecentesDosItens.empenho: {{ maisRecentesDosItens.empenho }}
maisRecentesDosItens.liquidação: {{ maisRecentesDosItens.liquidação }}
</pre>

  <table class="tablemain no-zebra mb1">
    <colgroup>
      <col>
      <col class="col--percentagem">
      <col>
      <col class="col--percentagem">
      <col>
      <col class="col--botão-de-ação">
    </colgroup>

    <thead>
      <tr>
        <th rowspan="2">
          Mês Ref. <span class="tvermelho">*</span>
        </th>
        <th
          colspan="2"
          class="tc"
        >
          Valor empenho
        </th>
        <th
          colspan="2"
          class="tc"
        >
          Valor liquidação
        </th>
        <th />
      </tr>
      <tr>
        <th
          class="cell--number"
        >
          Percentagem
        </th>
        <th
          class="cell--number"
        >
          Valor <span class="tvermelho">*</span>
        </th>
        <th
          class="cell--number"
        >
          Percentagem
        </th>
        <th
          class="cell--number"
        >
          Valor <span class="tvermelho">*</span>
        </th>
        <th />
      </tr>
    </thead>

    <tbody v-if="Array.isArray(model)">
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
              <template v-if="k + 1 != item.mes && !mesesDisponíveis.includes(k + 1)">
                (indisponível)
              </template>
            </option>
          </select>
        </td>

        <td>
          <input
            v-model="item.percentual_empenho"
            name="percentual_empenho"
            max="100"
            min="0"
            step="0.01"
            autocomplete="off"
            type="number"
            class="inputtext light"
            @input="atualizarDePercentagem(i,'empenho')"
          >
        </td>
        <td>
          <MaskedFloatInput
            v-model="item.valor_empenho"
            :value="item.valor_empenho"
            :name="`${name}[${i}].valor_empenho`"
            type="text"
            class="inputtext light"
            @update:model-value="(valor) => atualizarDeValor(i, 'empenho', valor)"
          />
        </td>
        <td>
          <input
            v-model="item.percentual_liquidado"
            name="percentual_liquidado"
            max="100"
            min="0"
            step="0.01"
            autocomplete="off"
            type="number"
            class="inputtext light"
            @input="atualizarDePercentagem(i,'liquidação')"
          >
        </td>
        <td>
          <MaskedFloatInput
            v-model="item.valor_liquidado"
            :value="item.valor_liquidado"
            :name="`${name}[${i}].valor_liquidado`"
            type="text"
            class="inputtext light"
            @update:model-value="(valor) => atualizarDeValor(i, 'liquidação', valor)"
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
    <tfoot>
      <tr>
        <th>
          compartilhado com todo
          <abbr title="Sistema de Monitoramento e Acompanhamento Estratégico">
            SMAE
          </abbr>
        </th>
        <td />
        <td class="tc300 cell--number">
          R$ {{ dinheiro(respostasof.smae_soma_valor_empenho || 0) }}
        </td>
        <td />
        <td class="tc300 cell--number">
          R$ {{ dinheiro(respostasof.smae_soma_valor_liquidado || 0) }}
        </td>
        <td />
      </tr>
      <tr>
        <th>
          compartilhado + {{ months[maisRecenteDosMeses - 1] || 'último mês' }}
        </th>
        <td />
        <td
          class="cell--number"
          :class="{
            tvermelho: totaisQueSuperamSOF.empenho
          }"
        >
          <template v-if="respostasof.smae_soma_valor_empenho != undefined">
            R$ {{ dinheiro(totais.empenho) }}
          </template>

          <span
            v-if="totaisQueSuperamSOF.empenho"
            class="tipinfo"
          >
            <svg
              width="24"
              height="24"
              color="#F2890D"
            ><use xlink:href="#i_alert" /></svg><div>
              valor supera empenho SOF
            </div>
          </span>
        </td>
        <td />
        <td
          class="cell--number"
          :class="{
            tvermelho: totaisQueSuperamSOF.liquidação
          }"
        >
          <template v-if="respostasof.smae_soma_valor_liquidado != undefined">
            R$ {{ dinheiro(totais.liquidação) }}
          </template>

          <span
            v-if="totaisQueSuperamSOF.liquidação"
            class="tipinfo"
          >
            <svg
              width="24"
              height="24"
              color="#F2890D"
            ><use xlink:href="#i_alert" /></svg><div>
              valor supera liquidação SOF
            </div>
          </span>
        </td>
        <td />
      </tr>
    </tfoot>
  </table>

  <div class="flex justifyright">
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
  </div>
</template>
