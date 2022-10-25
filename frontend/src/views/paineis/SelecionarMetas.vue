<script setup>
	import { ref, unref, reactive } from 'vue';
	import { useRoute } from 'vue-router';
	import { router } from '@/router';
	import { storeToRefs } from 'pinia';
	import { useEditModalStore, useAlertStore, useMetasStore, usePaineisStore } from '@/stores';

	const route = useRoute();
	const painel_id = route.params.painel_id;
	const alertStore = useAlertStore();
	const editModalStore = useEditModalStore();


	let selMetas = ref({});
	let selAll = ref(false);

	const PaineisStore = usePaineisStore();
	const { singlePainel } = storeToRefs(PaineisStore);
	(async()=>{
		if(singlePainel.id != painel_id) await PaineisStore.getById(painel_id);
		singlePainel?.value?.painel_conteudo.forEach(x=>{
			selMetas.value[x.meta_id] = true;
		})
	})()
	
	const MetasStore = useMetasStore();
	const { activePdm, tempMetas, groupedMetas } = storeToRefs(MetasStore);
	MetasStore.getPdM();


	const filters = reactive({
	    groupBy: localStorage.getItem('groupBy')??"macro_tema",
	    currentFilter: ""
	});
	let itemsFiltered = ref(groupedMetas);

	function filterItems(){
	    MetasStore.filterMetas(filters);
	    localStorage.setItem('groupBy',filters.groupBy);
	}
	filterItems();
	function groupSlug(s) {
	    var r;
	    switch(s){
	        case 'macro_tema': r = 'macrotemas'; break;
	        case 'tema': r = 'temas'; break;
	        case 'sub_tema': r = 'subtemas'; break;
	        default: r = s;
	    }
	    return r;
	}
	function openParent(e) {
		e.target.closest('.accordeon').classList.toggle('active');
	}
	function selectAll(e){
		let check = e.target.checked;
		let els = e.target.closest('.group').querySelectorAll('.metasselect .inputcheckbox');
		if(check){
			tempMetas.value.forEach(x=>selMetas.value[x.id]=true);
		}else{
			selMetas.value = {};
		}
	}
	function checkSelect(e){
		if(!e.target.checked) selAll.value = false;
	}
	async function checkClose() {
	    alertStore.confirm('Deseja sair sem salvar as alterações?',()=>{ 
	        router.go(-1);
	        editModalStore.clear(); 
	        alertStore.clear(); 
	    });
	}
	async function submitMetas() {
	    try {
	        var msg;
	        var r;
        	var values = {
        		metas: Object.keys(unref(selMetas.value)).map(x=>Number(x)).filter(x=>!!x)
        	};

            r = await PaineisStore.insertMetas(painel_id, values);
            msg = 'Dados salvos com sucesso!';
	        
	        if(r == true){
	            PaineisStore.clear();
	            PaineisStore.getById(painel_id);
	            await router.push(`/paineis/${painel_id}`);
	            alertStore.success(msg);
	        }else{
	        	throw r;
	        }
	    } catch (error) {
	        alertStore.error(error);
	    }
	}

</script>
<template>
	<h2>Selecionar metas do Painel</h2>

	<label class="label tc300">Agrupar por</label>
	<select v-model="filters.groupBy" @change="filterItems" class="inputtext">
	    <option :selected="filters.groupBy=='todas'" value="todas">Todas as metas</option>
	    <option :selected="filters.groupBy=='macro_tema'" v-if="activePdm.possui_macro_tema" value="macro_tema">{{activePdm.rotulo_macro_tema??'Macrotema'}}</option>
	    <option :selected="filters.groupBy=='tema'" v-if="activePdm.possui_tema" value="tema">{{activePdm.rotulo_tema??'Tema'}}</option>
	    <option :selected="filters.groupBy=='sub_tema'" v-if="activePdm.possui_sub_tema" value="sub_tema">{{activePdm.rotulo_sub_tema??'Subtema'}}</option>
	</select>
	
	<div v-if="itemsFiltered.length" class="group">
		<label class="block t14 w400 mb2 mt2"><input type="checkbox" class="inputcheckbox" @change="selectAll" v-model="selAll"><span>Selecionar todas as metas</span></label>
		<div v-for="item in itemsFiltered" :key="item.id" class="accordeon metasselect">
		    <div class="flex" @click="openParent">
		    	<span class="t0"><svg class="arrow" width="13" height="8"><use xlink:href="#i_down"></use></svg></span><h4 class="t1">{{item.descricao}}</h4>
		    </div>
		    <ul class="content">
		        <li class="mb1" v-for="m in item.children" :key="m.id">
		        	<label class="t14 w700"><input type="checkbox" class="inputcheckbox" v-model="selMetas[m.id]" @change="checkSelect" :value="m.id"><span>Meta {{m.codigo}} - {{m.titulo}}</span></label>
		        </li>
		    </ul>
		</div>
		<div class="flex spacebetween center mb2">
		    <hr class="mr2 f1"/>
		    <a class="btn outline bgnone tcprimary" @click="checkClose">Cancelar</a>
		    <a class="btn ml2" @click="submitMetas" :disabled="isSubmitting">Salvar</a>
		    <hr class="ml2 f1"/>
		</div>
	</div>
    <template v-else-if="itemsFiltered.loading">
        <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
    </template>
    <template v-else-if="itemsFiltered.error">
        <div class="error p1"><p class="error-msg">Error: {{itemsFiltered.error}}</p></div>
    </template>
    <template v-else>
        <div class="error p1"><p class="error-msg">Nenhum item encontrado.</p></div>
    </template>

</template>