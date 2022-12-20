<script setup>
import formataValor from '@/helpers/formataValor';

defineProps(['group', 'permissao', 'parentlink']);

const alemDoEmpenhado = (x) => x.smae_soma_valor_empenho > x.empenho_liquido;
const alemDoLiquidado = (x) => x.smae_soma_valor_liquidado > x.valor_liquidado;
</script>
<template>
    <tr v-for="item in group.items" :key="item.id">
        <td style="word-break: break-all;">
          {{ item?.dotacao }}
          {{ item?.processo ? '/ '+item?.processo : '' }}
          {{ item?.nota_empenho ? ' / '+item?.nota_empenho : '' }}
        </td>

        <td :class="{'tvermelho': alemDoEmpenhado(item)}">{{formataValor(item?.soma_valor_empenho)}}</td>
        <td :class="{'tvermelho': alemDoLiquidado(item)}">{{formataValor(item?.soma_valor_liquidado)}}</td>
        <td>{{ item?.itens.length }}</td>
        <td style="white-space: nowrap; text-align: right">
            <router-link
                v-if="permissao"
                :to="`${parentlink}/orcamento/realizado/${item.ano_referencia}/${item.id}`"
                class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
        </td>
    </tr>
</template>
