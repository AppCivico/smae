<script setup>
import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import months from '@/consts/months';
import dinheiro from '@/helpers/dinheiro';
import toFloat from '@/helpers/toFloat';
import { useOrcamentosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useField } from 'vee-validate';
import {
  computed, onMounted, onUpdated, ref, toRef, watch,
} from 'vue';

const { totaisQueSuperamSOF, maioresDosItens } = storeToRefs(useOrcamentosStore());
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

const itens = ref(props.controlador);
const emit = defineEmits(['change']);
const name = toRef(props, 'name');
const { handleChange } = useField(name, undefined, {
  initialValue: props.controlador,
});
const mesesSelecionados = computed(() => itens.value?.map((x) => x.mes) || []);

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
  g = g.push({ mes: null, valor_empenho: null, valor_liquidado: null });
  emit('change', g);
}
</script>
<template>
  <hr class="mt2 mb2">
  <div class="flex g2">
    <div class="f1">
      <label class="label">Mês Ref. <span class="tvermelho">*</span></label>
    </div>
    <div class="f1">
      <label class="label">Valor empenho <span class="tvermelho">*</span></label>
    </div>
    <div class="f1">
      <label class="label">Valor liquidação <span class="tvermelho">*</span></label>
    </div>
    <div style="flex-basis: 30px;" />
  </div>

  <div
    v-for="(item, i) in itens"
    :key="i"
    class="flex center g2 mb1"
  >
    <div class="f1">
      <select
        v-model.number="item.mes"
        class="inputtext light"
      >
        <option
          :value="null"
          disabled
        >
          Selecionar
        </option>
        <option
          v-for="month, k in months"
          :key="k"
          :value="k + 1"
          :disabled="k + 1 != item.mes && mesesSelecionados.includes(k + 1)"
        >
          {{ month }}
        </option>
      </select>
    </div>
    <div class="f1">
      <MaskedFloatInput
        v-model="item.valor_empenho"
        :value="item.valor_empenho"
        :name="`itens[${i}].valor_empenho`"
        type="text"
        class="inputtext light"
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
        <span class="t14">R$ {{ dinheiro(maioresDosItens.empenho) }}</span>
        <span
          v-if="totaisQueSuperamSOF.includes('empenho')"
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
        <span class="t14">R$ {{ dinheiro(maioresDosItens.liquidacao) }}</span>
        <span
          v-if="totaisQueSuperamSOF.includes('liquidacao')"
          class="tvermelho w700 block"
        >(valor supera liquidação SOF)</span>
      </div>
    </div>
  </div>
</template>
