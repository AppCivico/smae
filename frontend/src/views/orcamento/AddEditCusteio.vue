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
	const iniciativa_id = route.params.iniciativa_id;
	const atividade_id = route.params.atividade_id;
	const ano = route.params.ano;

	const MetasStore = useMetasStore();
    const { singleMeta } = storeToRefs(MetasStore);
	const IniciativasStore = useIniciativasStore();
    const { singleIniciativa } = storeToRefs(IniciativasStore);
	const AtividadesStore = useAtividadesStore();
    const { singleAtividade } = storeToRefs(AtividadesStore);

	const parentlink = `${meta_id?'/metas/'+meta_id:''}${iniciativa_id?'/iniciativas/'+iniciativa_id:''}${atividade_id?'/atividades/'+atividade_id:''}`;
	const parent_item = ref(atividade_id?singleAtividade:iniciativa_id?singleIniciativa:meta_id?singleMeta:false);

	const OrcamentosStore = useOrcamentosStore();
	const { OrcamentoCusteio } = storeToRefs(OrcamentosStore);
	(async()=>{
		await OrcamentosStore.getOrcamentoCusteioById(meta_id,ano);
		OrcamentoCusteio.value[ano].map(x=>{
			x.custeio_previsto = dinheiro(x.custeio_previsto);
			x.investimento_previsto = dinheiro(x.investimento_previsto);
		})
	})();

	var regdota = /^(\d{2}(\.\d{2}(\.\d{2}(\.\d{3}(\.\d{4}((?:\.\d\.\d{3})(\.\d{8}(\.\d{2})?)?)?)?)?)?)?)?$/;
	const schema = Yup.object().shape({
		custeio_previsto: Yup.string().required('Preencha o custeio.'),
		investimento_previsto: Yup.string().required('Preencha o investimento.'),
		parte_dotacao: Yup.string().required('Preencha a dotação.').matches(regdota,'Formato inválido')
	});

	async function onSubmit(values) {
	    try {
	        var msg;
	        var r;

	        values.meta_id = meta_id;
	        values.ano_referencia = ano;
	        if(isNaN(values.custeio_previsto)) values.custeio_previsto = values.custeio_previsto.replace(/\./g, '').replace(',','.');
	        if(isNaN(values.investimento_previsto)) values.investimento_previsto = values.investimento_previsto.replace(/\./g, '').replace(',','.');

            r = await OrcamentosStore.updateOrcamentoCusteio(values);
            msg = 'Dados salvos com sucesso!';
	        
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
	    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await OrcamentosStore.deleteOrcamentoCusteio(id)) router.push(`${parentlink}/orcamento`)},'Remover');
	}
	async function validar() {
		
	}
	function maskFloat(el){
	    var value = el.target.value.replace(/[\D]/g, '');
		if(!value) return;
    	var result = dinheiro(parseFloat(value/100));
    	el.target.value=result;
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
	function dinheiro(v){
		return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v)
	}
</script>
<template>
	<Dashboard>
	    <div class="flex spacebetween center">
	        <h1>Previsão de custo</h1>
	        <hr class="ml2 f1"/>
	        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
	    </div>
        <h3 class="mb2"><strong>{{ano}}</strong> - {{parent_item.codigo}} - {{parent_item.titulo}}</h3>
	    <template v-if="!(OrcamentoCusteio[ano]?.loading || OrcamentoCusteio[ano]?.error)">
	        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="OrcamentoCusteio[ano]?OrcamentoCusteio[ano][0]:{}" v-slot="{ errors, isSubmitting }">
	            <div class="flex g2 mb2">
	                <div class="f1">
	                    <label class="label">Previsão de investimento<span class="tvermelho">*</span></label>
	                    <Field name="custeio_previsto" @keyup="maskFloat" @change="maskFloat" type="text" class="inputtext light mb1" :class="{ 'error': errors.custeio_previsto }" />
	                    <div class="error-msg">{{ errors.custeio_previsto }}</div>
	                </div>
	                <div class="f1">
	                    <label class="label">Previsão de custeio <span class="tvermelho">*</span></label>
	                    <Field name="investimento_previsto" @keyup="maskFloat" @change="maskFloat" type="text" class="inputtext light mb1" :class="{ 'error': errors.investimento_previsto }" />
	                    <div class="error-msg">{{ errors.investimento_previsto }}</div>
	                </div>
	            </div>
	            <div class="flex center g2">
	                <div class="f1">
	                    <label class="label">Parte da dotação <span class="tvermelho">*</span></label>
	                    <Field name="parte_dotacao" type="text" class="inputtext light mb1" @keyup="maskDotacao" :class="{ 'error': errors.parte_dotacao }" />
	                    <div class="error-msg">{{ errors.parte_dotacao }}</div>
	                </div>
	            </div>
	            <div class="flex spacebetween center mb2">
	                <hr class="mr2 f1"/>
	                <button class="btn big" :disabled="isSubmitting">Salvar</button>
	                <hr class="ml2 f1"/>
	            </div>
	        </Form>
	    </template>
	    <template v-if="OrcamentoCusteio[ano]&&OrcamentoCusteio[ano][0]?.id">
	        <button @click="checkDelete(OrcamentoCusteio[ano][0].id)" class="btn amarelo big">Remover item</button>
	    </template>
	    <template v-if="OrcamentoCusteio[ano]?.loading">
	        <span class="spinner">Carregando</span>
	    </template>
	    <template v-if="OrcamentoCusteio[ano]?.error||error">
	        <div class="error p1">
	            <div class="error-msg">{{OrcamentoCusteio[ano].error??error}}</div>
	        </div>
	    </template>
	</Dashboard>
</template>