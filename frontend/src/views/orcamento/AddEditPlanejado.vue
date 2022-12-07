<script setup>
	import { ref  } from 'vue';
	import { Dashboard} from '@/components';
	import { Form, Field } from 'vee-validate';
	import * as Yup from 'yup';
	import { storeToRefs } from 'pinia';
	import { router } from '@/router';
	import { useRoute } from 'vue-router';
	import { useAlertStore, useOrcamentosStore, useMetasStore, useIniciativasStore, useAtividadesStore } from '@/stores';
	
	const alertStore = useAlertStore();
	const route = useRoute();
	const meta_id = route.params.meta_id;
	const ano = route.params.ano;
	const id = route.params.id;

	const MetasStore = useMetasStore();
    const { singleMeta } = storeToRefs(MetasStore);
    MetasStore.getChildren(meta_id);
	
	const IniciativasStore = useIniciativasStore();
    const { singleIniciativa } = storeToRefs(IniciativasStore);
	const AtividadesStore = useAtividadesStore();
    const { singleAtividade } = storeToRefs(AtividadesStore);

	const parentlink = `${meta_id?'/metas/'+meta_id:''}`;
	const parent_item = ref(meta_id?singleMeta:false);

	const OrcamentosStore = useOrcamentosStore();
	const { OrcamentoPlanejado } = storeToRefs(OrcamentosStore);
	const currentEdit = ref({});
	const dota = ref('');
	const respostasof = ref({});

	(async()=>{
		if(id){
			await OrcamentosStore.getOrcamentoPlanejadoById(meta_id,ano);
			currentEdit.value = OrcamentoPlanejado.value[ano].find(x=>x.id==id);
			currentEdit.value.valor_planejado = dinheiro(currentEdit.value.valor_planejado);
			dota.value = currentEdit.value.dotacao;

			currentEdit.value.location =  
				currentEdit.value.atividade?.id?'a'+currentEdit.value.atividade.id:
				currentEdit.value.iniciativa?.id?'i'+currentEdit.value.iniciativa.id:
				currentEdit.value.meta?.id?'m'+currentEdit.value.meta.id:'m'+meta_id;
		}
	})();

	var regdota = /^\d{2}\.\d{2}\.\d{2}\.\d{3}\.\d{4}\.\d\.\d{3}\.\d{8}\.\d{2}$/;
	const schema = Yup.object().shape({
		valor_planejado: Yup.string().required('Preencha o valor planejado.'),
		dotacao: Yup.string().required('Preencha a dotação.').matches(regdota,'Formato inválido')
	});

	async function onSubmit(values) {
	    try {
	        var msg;
	        var r;

	        values.meta_id = meta_id;
	        values.ano_referencia = Number(ano);
	        if(isNaN(values.valor_planejado)) values.valor_planejado = toFloat(values.valor_planejado);

	        if(values.location[0] == "a"){
	        	values.atividade_id = Number(values.location.slice(1));
	        }else if(values.location[0] == "i"){
	        	values.iniciativa_id = Number(values.location.slice(1));
	        }else if(values.location[0] == "m"){
	        	values.meta_id = Number(values.location.slice(1));
	        }

            if(id){
	            r = await OrcamentosStore.updateOrcamentoPlanejado(id,values);
	            msg = 'Dados salvos com sucesso!';
            }else{
            	r = await OrcamentosStore.insertOrcamentoPlanejado(values);
            	msg = 'Dados salvos com sucesso!';
            }
	        
	        if(r == true){
	            alertStore.success(msg);
	            await router.push(`${parentlink}/orcamento`);
	        }
	    } catch (error) {
	        alertStore.error(error);
	    }
	}

	async function checkClose() {
	    alertStore.confirm('Deseja sair sem salvar as alterações?',`${parentlink}/orcamento`);
	}
	async function checkDelete(id) {
	    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await OrcamentosStore.deleteOrcamentoPlanejado(id)) router.push(`${parentlink}/orcamento`)},'Remover');
	}
	function maskFloat(el){
	    var value = el.target.value.replace(/[\D]/g, '');
		if(!value) return;
    	var result = dinheiro(parseFloat(value/100));
    	el.target.value=result;
	}
	function dinheiro(v){
		return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v)
	}
	function toFloat(v){
		return isNaN(v) ? Number( v.replace(/\./g, '').replace(',','.')) : v;
	}
	function maskDotacao(el){
	    var kC = event.keyCode;
	    var data = el.target.value.replace(/[^0-9\.-]/g,'');
	    if( kC!=8 && kC!=46 ){
	        if( data.length==2 ){
	            el.target.value = data += '.';
	        }else if( data.length==5 ){
	            el.target.value = data += '.';
	        }else if( data.length==8 ){
	            el.target.value = data += '.';
	        }else if( data.length==12 ){
	            el.target.value = data += '.';
	        }else if( data.length==17 ){
	            el.target.value = data += '.';
	        }else if( data.length==19 ){
	            el.target.value = data += '.';
	        }else if( data.length==23 ){
	            el.target.value = data += '.';
	        }else if( data.length==32 ){
	            el.target.value = data += '.';
	        }else{
	            el.target.value = data.slice(0,35);
	        }
	    }
	}
	async function validarDota() {
		try{
			respostasof.value = {loading:true}
			let val = await schema.validate({ dotacao: dota.value, valor_planejado:1 });
			if(val){
				let r = await OrcamentosStore.getDotacaoPlanejado(dota.value,ano);
				respostasof.value = r;
			}
		}catch(error){
	        respostasof.value = error;
		}
	}
</script>
<template>
	<Dashboard>
	    <div class="flex spacebetween center">
	        <h1>Adicionar dotação</h1>
	        <hr class="ml2 f1"/>
	        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
	    </div>
        <h3 class="mb2"><strong>{{ano}}</strong> - {{parent_item.codigo}} - {{parent_item.titulo}}</h3>
	    <template v-if="!(OrcamentoPlanejado[ano]?.loading || OrcamentoPlanejado[ano]?.error)">
	        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="currentEdit" v-slot="{ errors, isSubmitting, values }">
	            <div class="flex center g2">
	                <div class="f1">
	                    <label class="label">Dotação <span class="tvermelho">*</span></label>
	                    <Field name="dotacao" v-model="dota" type="text" class="inputtext light mb1" @keyup="maskDotacao" :class="{ 'error': errors.dotacao||respostasof.informacao_valida===false, 'loading': respostasof.loading}" />
	                    <div class="error-msg">{{ errors.dotacao }}</div>
	                    <div class="t13 mb1 tc300" v-if="respostasof.loading">Aguardando resposta do SOF</div>
	                    <div class="t13 mb1 tvermelho" v-if="respostasof.informacao_valida===false">Dotação não encontrada</div>
	                </div>
	                <div class="f0">
	                	<a @click="validarDota()" class="btn outline bgnone tcprimary">Validar via SOF</a>
	                </div>
	            </div>
	            <div>
                    <label class="label">Vincular dotação<span class="tvermelho">*</span></label>
                    
                    <div v-for="m in singleMeta.children" :key="m.id">
                    	<div class="label tc300">Meta</div>
                    	<label class="block mb1">
                    		<Field name="location" type="radio" :value="'m'+m.id" class="inputcheckbox"/> 
                    		<span>{{m.codigo}} - {{m.titulo}}</span>
                    	</label>
                    	<div v-if="m?.iniciativas?.length" class="label tc300">Iniciativas e atividades</div>
                    	<div v-for="i in m.iniciativas" :key="i.id" class="">
                    		<label class="block mb1">
                    			<Field name="location" type="radio" :value="'i'+i.id" class="inputcheckbox"/> 
                    			<span>{{i.codigo}} - {{i.titulo}}</span>
                    		</label>
                    		<div v-for="a in i.atividades" :key="a.id" class="pl2">
                    			<label class="block mb1">
                    				<Field name="location" type="radio" :value="'a'+a.id" class="inputcheckbox"/> 
                    				<span>{{a.codigo}} - {{a.titulo}}</span>
                    			</label>	
                    		</div>
                    	</div>	
                    </div>
                    
                    <div class="error-msg">{{ errors.location }}</div>
	            </div>
	            <div class="flex g2 mb2">
	                <div class="f1">
	                    <label class="label">Valor planejado<span class="tvermelho">*</span></label>
	                    <Field name="valor_planejado" @keyup="maskFloat" @change="maskFloat" type="text" class="inputtext light mb1" :class="{ 'error': errors.valor_planejado }" />
	                    <div class="error-msg">{{ errors.valor_planejado }}</div>
	                    <div class="flex center" v-if="val=respostasof.empenho_liquido??currentEdit.empenho_liquido">
	                    	<span class="label mb0 tc300 mr1">Saldo disponível na dotação</span>
	                    	<span class="t14">R$ {{dinheiro(val)}}</span>
	                    	<span v-if="toFloat(values.valor_planejado) > toFloat(val)" class="tvermelho w700">(Valor acima da dotação)</span>
	                    </div>
	                </div>
	            </div>
	            <div class="flex spacebetween center mb2">
	                <hr class="mr2 f1"/>
	                <button class="btn big" :disabled="isSubmitting">Salvar</button>
	                <hr class="ml2 f1"/>
	            </div>
	        </Form>
	    </template>
	    <template v-if="currentEdit&&currentEdit?.id">
	        <button @click="checkDelete(currentEdit.id)" class="btn amarelo big">Remover item</button>
	    </template>
	    <template v-if="OrcamentoPlanejado[ano]?.loading">
	        <span class="spinner">Carregando</span>
	    </template>
	    <template v-if="OrcamentoPlanejado[ano]?.error||error">
	        <div class="error p1">
	            <div class="error-msg">{{OrcamentoPlanejado[ano].error??error}}</div>
	        </div>
	    </template>
	</Dashboard>
</template>