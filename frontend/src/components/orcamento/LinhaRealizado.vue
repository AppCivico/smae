<script setup>
import { computed } from 'vue';
import formataValor from '@/helpers/formataValor';
import { useAuthStore } from '@/stores/auth.store';
import mêsDoÚltimoItem from './helpers/mesDoUltimoItem';

const { temPermissãoPara } = useAuthStore();

const props = defineProps({
  group: {
    type: Array,
    required: true,
  },
  permissao: {
    type: Boolean,
    required: true,
  },
  parentlink: {
    type: String,
    required: true,
  },
  órgãoEUnidadeSelecionados: {
    type: String,
    default: '',
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const alemDoEmpenhado = (x) => Number(x.smae_soma_valor_empenho) > Number(x.empenho_liquido);
const alemDoLiquidado = (x) => Number(x.smae_soma_valor_liquidado) > Number(x.valor_liquidado);

const linhasEscolhidas = computed({
  get() {
    return props.modelValue;
  },
  set(id) {
    emit('update:modelValue', id);
  },
});
</script>
<template>
  <tr
    v-for="item in group.items"
    :key="item.id"
    :hidden="!!órgãoEUnidadeSelecionados
      && item?.dotacao.indexOf(órgãoEUnidadeSelecionados) !== 0"
  >
    <td style="word-break: break-all;">
      {{ item?.dotacao }}
      {{ item?.processo ? '/ ' + item.processo : '' }}
      {{ item?.nota_empenho ? ' / ' + item.nota_empenho : '' }}
    </td>

    <td :class="{'tvermelho': alemDoEmpenhado(item)}">
      {{ formataValor(item?.soma_valor_empenho) }}
    </td>
    <td :class="{'tvermelho': alemDoLiquidado(item)}">
      {{ formataValor(item?.soma_valor_liquidado) }}
    </td>
    <td>
      {{ !item?.itens.length
        ? '-'
        : mêsDoÚltimoItem(item.itens) || '-' }}
    </td>
    <td style="white-space: nowrap; text-align: right">
      <router-link
        v-if="permissao && ($route.meta?.rotaParaEdição || parentlink)"
        :to="$route.meta?.rotaParaEdição
          ? {
            name: $route.meta.rotaParaEdição,
            params: { ano: item.ano_referencia, id: item.id },
            query: $route.query
          }
          : {
            path: `${parentlink}/orcamento/realizado/${item.ano_referencia}/${item.id}`,
            query: $route.query,
          }"
        class="tprimary"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_edit" /></svg>
      </router-link>
    </td>
    <td v-if="temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp'])">
      <input
        v-model="linhasEscolhidas"
        :disabled="linhasEscolhidas.length === gblLimiteDeSeleçãoSimultânea
          && linhasEscolhidas.indexOf(item.id) === -1"
        :value="item.id"
        type="checkbox"
        class=""
      >
    </td>
  </tr>
</template>
