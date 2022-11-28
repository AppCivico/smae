<script setup>
    const props = defineProps(['g']);
    function nestLinhas(l){
    	var a = {};
    	l.forEach(x=>{
    		if(!a[x.agrupador]) a[x.agrupador] = [];
    		a[x.agrupador].push(x);
    	})
    	return Object.entries(a).reverse();
    }
    function toggleAccordeon(t) {
		t.target.closest(".tzaccordeon").classList.toggle("active");
	}
</script>
<template>
	<template v-if="g?.linhas">
		<template v-for="k in nestLinhas(g.linhas)" :key="k[0]">
			<tr class="tzaccordeon" @click="toggleAccordeon">
			    <td colspan="56"><svg class="arrow" width="13" height="8"><use xlink:href="#i_down"></use></svg> <span>{{k[0]}}</span></td>
			</tr>
			<tbody>
			    <tr v-for="(val,i) in k[1]" :key="val.id ? val.id : i">
			        <td><div class="flex center"><div class="farol i1"></div> <span>{{val.periodo}}</span></div></td>
			        <td>{{val.series[g.ordem_series.indexOf('Previsto')]?.valor_nominal??'-'}}</td>
			        <td>{{val.series[g.ordem_series.indexOf('Realizado')]?.valor_nominal??'-'}}</td>
			        <td>{{val.series[g.ordem_series.indexOf('PrevistoAcumulado')]?.valor_nominal??'-'}}</td>
			        <td>{{val.series[g.ordem_series.indexOf('RealizadoAcumulado')]?.valor_nominal??'-'}}</td>
			        <td style="white-space: nowrap; text-align: right;">
			        </td>
			    </tr>
			</tbody>
		</template>
	</template>
	<tr v-else-if="g?.loading">
	    <td colspan="555"><span class="spinner">Carregando</span></td>
	</tr>
</template>