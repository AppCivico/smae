<script setup>
import formataValor from '@/helpers/formataValor';
import mêsDoÚltimoItem from './helpers/mesDoUltimoItem';

defineProps(['group', 'permissao', 'parentlink']);

const alemDoEmpenhado = (x) => Number(x.smae_soma_valor_empenho) > Number(x.empenho_liquido);
const alemDoLiquidado = (x) => Number(x.smae_soma_valor_liquidado) > Number(x.valor_liquidado);
</script>
<template>
  <tr
    v-for="item in group.items"
    :key="item.id"
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
    <td>{{ !item?.itens.length ? '-' : mêsDoÚltimoItem(item.itens) || '-' }}</td>
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
  </tr>
</template>
