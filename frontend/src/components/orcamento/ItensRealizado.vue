<script setup>
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import months from '@/consts/months';
import dinheiro from '@/helpers/dinheiro';
import { useMetasStore } from '@/stores/metas.store';
import { useObrasStore } from '@/stores/obras.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import Big from 'big.js';
import { range } from 'lodash';
import { storeToRefs } from 'pinia';
import {
  computed, defineModel, defineOptions, nextTick,
} from 'vue';
import { useRoute } from 'vue-router';
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
});

const maisRecenteDosMeses = computed(() => model.value
  .reduce((acc, cur) => Math.max(acc, cur.mes), 0));
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
  empenho: líquidoDosItens.value.empenho + maisRecentesDosItens.value.empenho,
  liquidação: líquidoDosItens.value.liquidação + maisRecentesDosItens.value.liquidação,
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

function atualizarDePercentagem(i, coluna) {
  switch (coluna) {
    case 'empenho':
      if (model.value[i].percentual_empenho === 0) {
        model.value[i].percentual_empenho = null;
      } else {
        model.value[i].valor_empenho = new Big(model.value[i].percentual_empenho)
          .times(new Big(props.respostasof.empenho_liquido).div(100)).toFixed(2);
      }
      break;

    case 'liquidação':
    case 'liquidacao':
      if (model.value[i].percentual_liquidado === 0) {
        model.value[i].percentual_liquidado = null;
      } else {
        model.value[i].valor_liquidado = new Big(model.value[i].percentual_liquidado)
          .times(new Big(props.respostasof.valor_liquidado).div(100)).toFixed(2);
      }
      break;

    default:
      throw new Error('Coluna desconhecida fornecida');
  }
}

async function addItem() {
  if (!Array.isArray(model.value)) {
    model.value = [];
    await nextTick();
  }

  model.value.push({ mes: 0, valor_empenho: 0, valor_liquidado: 0 });
}
</script>
<template>
  <pre v-scrollLockDebug>respostasof:{{ respostasof }}</pre>
  <pre v-scrollLockDebug>orçamentoEmFoco:{{ orçamentoEmFoco }}</pre>

  <table class="tablemain no-zebra mb1">
    <col>
    <col class="col--percentagem">
    <col>
    <col class="col--percentagem">
    <col>
    <col class="col--botão-de-ação">
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
        <th>Percentagem</th>
        <th>Valor <span class="tvermelho">*</span></th>
        <th>Percentagem</th>
        <th>Valor <span class="tvermelho">*</span></th>
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
        <td class="tc300">
          R$ {{ dinheiro(respostasof.smae_soma_valor_empenho || 0) }}
        </td>
        <td />
        <td class="tc300">
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
