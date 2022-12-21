<script setup>
import { onMounted, onUpdated, ref } from 'vue';
	const props = defineProps(['controlador', 'respostasof']);
	let itens = ref(props.controlador)

	function start(){
		itens.value = props.controlador;
	}
	start();
	onMounted(()=>{start()});
	onUpdated(()=>{start()});

	function maskFloat(el){
    	el.target.value=dinheiro(Number(el.target.value.replace(/[\D]/g, ''))/100);
    	if(el.target?._vei?.onChange)el.target?._vei?.onChange(el);
	}
	function dinheiro(v){
		return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(v))
	}
	function removeItem(g,i) {
		g = g.splice(i,1);
	}
	function addItem(g) {
		g = g.push({mes:null,valor_empenho:null,valor_liquidado:null});
	}
	function attVar(g,i,n) {
		g[i][n] = event.target.value;
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
        <div style="flex-basis: 30px;">
        </div>
    </div>
    <div class="flex center g2 mb1" v-for="(item,i) in itens" :key="i">
        <div class="f1">
            <input v-model="item.mes" type="number" min="1" max="12" step="1" class="inputtext light"/>
        </div>
        <div class="f1">
            <input v-model="item.valor_empenho" @keyup="maskFloat" @change="attVar(itens,i,'valor_empenho')" type="text" class="inputtext light"/>
        </div>
        <div class="f1">
            <input v-model="item.valor_liquidado" @keyup="maskFloat" @change="attVar(itens,i,'valor_liquidado')" type="text" class="inputtext light"/>
        </div>
        <div style="flex-basis: 30px;">
            <a @click="removeItem(itens,i)" class="addlink"><svg width="20" height="20"><use xlink:href="#i_remove"></use></svg></a>
        </div>
    </div>
    <div class="tc mb2">
    	<a @click="addItem(itens)" class="btn outline bgnone tcprimary">Adicionar novo empenho/liquidação</a>
    </div>
    <div class="flex g2 mb2">
    	<div class="f1">
    	</div>
    	<div class="f1">
    		<div class="flex center flexwrap" v-if="respostasof.smae_soma_valor_empenho!=undefined">
    			<span class="label mb0 tc300 mr1">Total Empenho SMAE</span>
    			{{ (somaitens = itens.reduce((r,x)=>r+toFloat(x.valor_empenho),0)) ? '':'' }}
    			{{ (somatotal = toFloat(respostasof.smae_soma_valor_empenho)+somaitens) ? '':'' }}
    			<span class="t14">R$ {{dinheiro(somatotal)}}</span>
    			<span v-if="somatotal > toFloat(respostasof.empenho_liquido)" class="tvermelho w700 block">(valor supera empenho SOF)</span>
    		</div>
    	</div>
    	<div class="f1">
    		<div class="flex center flexwrap" v-if="respostasof.smae_soma_valor_liquidado!=undefined">
    			<span class="label mb0 tc300 mr1">Total liquidação SMAE</span>
    			{{ (somaitens = itens.reduce((r,x)=>r+toFloat(x.valor_liquidado),0)) ? '':'' }}
    			{{ (somatotal = toFloat(respostasof.smae_soma_valor_liquidado)+somaitens) ? '':'' }}
    			<span class="t14">R$ {{dinheiro(somatotal)}}</span>
    			<span v-if="somatotal > toFloat(respostasof.valor_liquidado)" class="tvermelho w700 block">(valor supera liquidação SOF)</span>
    		</div>
    	</div>
    </div>
</template>
