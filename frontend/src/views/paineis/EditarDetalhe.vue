<script setup>
	import { ref, unref, reactive } from 'vue';
	import { useRoute } from 'vue-router';
	import { router } from '@/router';
	import { storeToRefs } from 'pinia';
	import { useEditModalStore, useAlertStore, useMetasStore, usePaineisStore } from '@/stores';

	const route = useRoute();
	const painel_id = route.params.painel_id;
	const conteudo_id = route.params.conteudo_id;
	const alertStore = useAlertStore();
	const editModalStore = useEditModalStore();

	const PaineisStore = usePaineisStore();
	const { singlePainel } = storeToRefs(PaineisStore);
	let metaConteudo = ref({loading: true});
	let selDetalhes = ref({});
	let selIndicador = ref(false);

	(async ()=>{
		if(singlePainel.value.id != painel_id) await PaineisStore.getById(painel_id);
		let c = singlePainel.value.painel_conteudo.find(x=>x.id==conteudo_id);
		if(c){
			metaConteudo.value = c;

			selIndicador.value = !!c.mostrar_indicador;
			c.detalhes.forEach(x=>{
				selDetalhes.value[x.id] = !!x.mostrar_indicador;
				if(x.filhos)x.filhos.forEach(xx=>{
					selDetalhes.value[xx.id] = !!xx.mostrar_indicador;
					if(xx.filhos)xx.filhos.forEach(xxx=>{
						selDetalhes.value[xxx.id] = !!xxx.mostrar_indicador;
						if(xxx.filhos)xxx.filhos.forEach(xxxx=>{
							selDetalhes.value[xxxx.id] = !!xxxx.mostrar_indicador;
							if(xxxx.filhos)xxxx.filhos.forEach(xxxxx=>{
								selDetalhes.value[xxxxx.id] = !!xxxxx.mostrar_indicador;
							})
						})
					})
				})
			})
		}else{
			metaConteudo.value = {error: 'Item não encontrado'};
		}
	})();

	async function submitMetas(values) {
	    try {
	        var msg;
	        var r;

        	var values = {
			  mostrar_indicador_meta: unref(selIndicador.value),
			  detalhes: Object.entries(unref(selDetalhes.value)).map(x=>{
			  	return {
			  		mostrar_indicador: x[1],
			  		id: Number(x[0])
			  	}
			  })
			};
	        r = await PaineisStore.detalhesMeta(painel_id,conteudo_id,values);
            msg = 'Dados salvos com sucesso!';
	        if(r == true){
	            PaineisStore.clear();
	            PaineisStore.getById(painel_id);
	            await router.push(`/paineis/${painel_id}`);
	        	editModalStore.clear(); 
	            alertStore.success(msg);
	        }else{
	        	throw r;
	        }
	    } catch (error) {
	        alertStore.error(error);
	    }
	}
	async function checkClose() {
	    alertStore.confirm('Deseja sair sem salvar as alterações?',()=>{ 
	        router.go(-1);
	        editModalStore.clear(); 
	        alertStore.clear(); 
	    });
	}
	function openParent(e) {
		e.target.closest('.accordeon').classList.toggle('active');
	}

</script>
<template>
	<h2>Adicionar indicador, Variáveis, iniciativas e atividades</h2>
	<template v-if="metaConteudo.id">
		<p class="w700 mb2">Meta {{metaConteudo.meta.codigo}} {{metaConteudo.meta.titulo}}</p>

		<div class="label tc300">Detalhamento do Indicador da meta</div>
		<hr class="mb1 mt1">
    	<label class="block t14 w700 mb1"><input type="checkbox" class="inputcheckbox" v-model="selIndicador"><span>Exibir indicador da meta</span></label>
		<template v-for="x in metaConteudo.detalhes.filter(y=>y.tipo=='Variavel')" :key="x.id">
			<div class="mb1 ml1">
				<label class="t14 w700"><input type="checkbox" class="inputcheckbox" v-model="selDetalhes[x.id]" :value="true"><span>Variável - {{x.variavel.codigo?x.variavel.codigo+' - ':''}}{{x.variavel.titulo}}</span></label>
			</div>
		</template>

		<div class="label tc300 mt2">Conteúdo da meta incluso na visão de evolução</div>
		<hr class="mb1 mt1">

		<template v-for="x in metaConteudo.detalhes.filter(y=>y.tipo=='Iniciativa')" :key="x.id">
			<div class="accordeon metasselect">
			    <div class="flex mb1" @click="openParent">
			    	<span class="t0"><svg class="arrow" width="13" height="8"><use xlink:href="#i_down"></use></svg></span><span class="t0 mr1"><svg width="20" height="20"><use xlink:href="#i_valores"></use></svg></span><h4 class="t1 mb0">Iniciativa - {{x.iniciativa.codigo?x.iniciativa.codigo+' - ':''}}{{x.iniciativa.titulo}}</h4>
			    </div>
			    <div class="content">
			    	<label class="block mb1 t14 w700"><input type="checkbox" class="inputcheckbox" v-model="selDetalhes[x.id]" :value="true"><span>Indicador da Iniciativa - {{x.iniciativa.codigo?x.iniciativa.codigo+' - ':''}}{{x.iniciativa.titulo}}</span></label>

			    	<template v-for="xx in x.filhos.filter(y=>y.tipo=='Variavel')" :key="xx.id">
			    		<div v-if="xx.tipo=='Variavel'" class="mb1 ml1">
			    			<label class="t14 w700"><input type="checkbox" class="inputcheckbox" v-model="selDetalhes[xx.id]" :value="true"><span>Variável - {{xx.variavel.codigo?xx.variavel.codigo+' - ':''}}{{xx.variavel.titulo}}</span></label>
			    		</div>
			    	</template>
				   
				    <template v-for="xx in x.filhos.filter(y=>y.tipo=='Atividade')" :key="xx.id">
				    	<div class="accordeon metasselect ml1">
				    	    <div class="flex mb1" @click="openParent">
				    	    	<span class="t0"><svg class="arrow" width="13" height="8"><use xlink:href="#i_down"></use></svg></span><span class="t0 mr1"><svg width="20" height="20"><use xlink:href="#i_valores"></use></svg></span><h4 class="t1 mb0">Atividade - {{xx.atividade.codigo?xx.atividade.codigo+' - ':''}}{{xx.atividade.titulo}}</h4>
				    	    </div>
				    	    <div class="content">
				    	    	<label class="block mb1 t14 w700"><input type="checkbox" class="inputcheckbox" v-model="selDetalhes[xx.id]" :value="true"><span>Indicador da Atividade - {{xx.atividade.codigo?xx.atividade.codigo+' - ':''}}{{xx.atividade.titulo}}</span></label>

				    	    	<template v-for="xxx in xx.filhos.filter(y=>y.tipo=='Variavel')" :key="xxx.id">
				    	    		<div v-if="xxx.tipo=='Variavel'" class="mb1 ml1">
				    	    			<label class="t14 w700"><input type="checkbox" class="inputcheckbox" v-model="selDetalhes[xxx.id]" :value="true"><span>Variável - {{xxx.variavel.codigo?xxx.variavel.codigo+' - ':''}}{{xxx.variavel.titulo}}</span></label>
				    	    		</div>
				    	    	</template>
				    	    </div>
				    	</div>
				    </template>
			    </div>

			</div>
		</template>

		<div class="flex spacebetween center mt2 mb2">
		    <hr class="mr2 f1"/>
		    <a class="btn outline bgnone tcprimary" @click="checkClose">Cancelar</a>
		    <a class="btn ml2" @click="submitMetas" :disabled="isSubmitting">Salvar</a>
		    <hr class="ml2 f1"/>
		</div>

	</template>
    <template v-else-if="metaConteudo.loading">
        <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
    </template>
    <template v-else-if="metaConteudo.error">
        <div class="error p1"><p class="error-msg">Error: {{metaConteudo.error}}</p></div>
    </template>
    <template v-else>
        <div class="error p1"><p class="error-msg">Nenhum item encontrado.</p></div>
    </template>

</template>