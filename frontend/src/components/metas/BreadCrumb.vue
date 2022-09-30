<script setup>
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useMetasStore, useIniciativasStore, useAtividadesStore } from '@/stores';

const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;
const atividade_id = route.params.atividade_id;

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);
if(meta_id&&singleMeta.value.id != meta_id) MetasStore.getById(meta_id);
if(meta_id&&!activePdm.value.id) MetasStore.getPdM();

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
if(iniciativa_id&&singleIniciativa.value.id != iniciativa_id) IniciativasStore.getById(meta_id,iniciativa_id);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);
if(atividade_id&&singleAtividade.value.id != atividade_id) AtividadesStore.getById(iniciativa_id,atividade_id);


let groupBy = localStorage.getItem('groupBy')??"macro_tema";
let groupByRoute;
switch(groupBy){
	case 'macro_tema': 
		groupByRoute = 'macrotemas';
		break;
	case 'tema': 
		groupByRoute = 'temas';
		break;
	case 'sub_tema': 
		groupByRoute = 'subtemas';
		break;
}
</script>
<template>
	<div class="breadcrumb">
		<router-link to="/">Início</router-link>
		<router-link v-if="activePdm.id" to="/metas">{{activePdm.nome}}</router-link>
		<router-link v-if="meta_id&&activePdm.id&&activePdm['possui_'+groupBy]&&singleMeta[groupBy]" :to="`/metas/${groupByRoute}/${singleMeta[groupBy]?.id}`">{{singleMeta[groupBy]?.descricao}}</router-link>
		<router-link v-if="meta_id&&singleMeta.id" :to="`/metas/${meta_id}`">{{singleMeta?.titulo}}</router-link>
		<router-link v-if="iniciativa_id&&singleIniciativa.id" :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}`">{{singleIniciativa?.titulo}}</router-link>
		<router-link v-if="atividade_id&&singleAtividade.id" :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}/atividades/${atividade_id}`">{{singleAtividade?.titulo}}</router-link>
	</div>
</template>