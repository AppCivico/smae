<script setup>
    const props = defineProps(['group','permissao','parentlink']);
    function formataValor(d){
        return Number(d).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }) ?? d;
    }
</script>
<template>
    <tr v-for="item in group.items" :key="item.id">
        <td style="word-break: break-all;">{{item?.dotacao}} {{item?.processo? ' / '+item?.processo : ''}} {{item?.nota_empenho? ' / '+item?.nota_empenho : ''}}</td>
        <td>{{formataValor(item?.soma_valor_empenho)}}</td>
        <td>{{formataValor(item?.soma_valor_liquidado)}}</td>
        <td>{{ item?.itens.length }}</td>
        <td style="white-space: nowrap; text-align: right">
            <router-link 
                v-if="permissao"
                :to="`${parentlink}/orcamento/realizado/${item.ano_referencia}/${item.id}`" 
                class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
        </td>
    </tr>
</template>