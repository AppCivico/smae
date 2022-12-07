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
        <td style="word-break: break-all;">{{item?.dotacao}}</td>
        <td>{{formataValor(item?.valor_empenho)}}</td>
        <td>{{formataValor(item?.valor_liquidado)}}</td>
        <td style="white-space: nowrap; text-align: right">
            <router-link 
                v-if="permissao"
                :to="`${parentlink}/orcamento/realizado/${item.ano_referencia}/${item.nota_empenho?'nota':item.processo?'processo':'dotacao'}/${item.id}`" 
                class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
        </td>
    </tr>
</template>