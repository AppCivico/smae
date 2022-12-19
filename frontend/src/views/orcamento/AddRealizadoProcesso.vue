<script setup>
	import { ref  } from 'vue';
	import { Dashboard} from '@/components';
	import { Form, Field } from 'vee-validate';
	import * as Yup from 'yup';
	import { storeToRefs } from 'pinia';
	import { router } from '@/router';
	import { useRoute } from 'vue-router';
	import { useAlertStore, useOrcamentosStore, useMetasStore, useIniciativasStore, useAtividadesStore } from '@/stores';
	import { default as ItensRealizado} from '@/components/orcamento/ItensRealizado.vue';

	const alertStore = useAlertStore();
	const route = useRoute();
	const meta_id = route.params.meta_id;
	const ano = route.params.ano;
	const id = route.params.id;

	const MetasStore = useMetasStore();
    const { singleMeta, activePdm } = storeToRefs(MetasStore);
    MetasStore.getPdM();
    MetasStore.getChildren(meta_id);

	const IniciativasStore = useIniciativasStore();
    const { singleIniciativa } = storeToRefs(IniciativasStore);
	const AtividadesStore = useAtividadesStore();
    const { singleAtividade } = storeToRefs(AtividadesStore);

	const parentlink = `${meta_id?'/metas/'+meta_id:''}`;
	const parent_item = ref(meta_id?singleMeta:false);

	const OrcamentosStore = useOrcamentosStore();
	const { OrcamentoRealizado, DotacaoSegmentos } = storeToRefs(OrcamentosStore);
	OrcamentosStore.getDotacaoSegmentos(ano);
	const currentEdit = ref({});
	const dota = ref('');
	const respostasof = ref({});

	const itens = ref([{mes:null,valor_empenho:null,valor_liquidado:null}]);

	var regprocesso = /^\d{4}\.?\d{4}\/?\d{7}\-?\d$/;
	const schema = Yup.object().shape({
		processo: Yup.string().required('Preencha o processo.').matches(regprocesso,'Formato inválido'),
		dotacao: Yup.string()
	});

	async function onSubmit(values) {
	    try {
	        var msg;
	        var r;

	        values.ano_referencia = Number(ano);

	        values.atividade_id = null;
	        values.iniciativa_id = null;
	        values.meta_id = null;

	        if(values.location[0] == "a"){
	        	values.atividade_id = Number(values.location.slice(1));
	        }else if(values.location[0] == "i"){
	        	values.iniciativa_id = Number(values.location.slice(1));
	        }else if(values.location[0] == "m"){
	        	values.meta_id = Number(values.location.slice(1));
	        }

	        values.itens = itens.value.map(x=>{
	        	x.valor_empenho = toFloat(x.valor_empenho);
	        	x.valor_liquidado = toFloat(x.valor_liquidado);
	        	return {mes:x.mes,valor_empenho:x.valor_empenho,valor_liquidado:x.valor_liquidado};
	        });


        	r = await OrcamentosStore.insertOrcamentoRealizado(values);
        	msg = 'Dados salvos com sucesso!';

	        if(r == true){
	            alertStore.success(msg);
	            await router.push(`${parentlink}/orcamento/realizado`);
	        }
	    } catch (error) {
	        alertStore.error(error);
	    }
	}

	async function checkClose() {
	    alertStore.confirm('Deseja sair sem salvar as alterações?',`${parentlink}/orcamento`);
	}
	async function checkDelete(id) {
	    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await OrcamentosStore.deleteOrcamentoRealizado(id)) router.push(`${parentlink}/orcamento`)},'Remover');
	}
	function maskFloat(el){
    	el.target.value=dinheiro(Number(el.target.value.replace(/[\D]/g, ''))/100);
    	el.target?._vei?.onChange(el);
	}
	function dinheiro(v){
		return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(v))
	}
	function toFloat(v){
		return isNaN(v) || String(v).indexOf(',') !== -1 ? Number( String(v).replace(/[^0-9\,]/g, '').replace(',','.') ) : Math.round(Number(v)*100)/100;
	}
	function maskProcesso(el){
	    var kC = event.keyCode;
	    el.target.value = formatProcesso(el.target.value);
	}
	function formatProcesso(d){
	    var data = String(d).replace(/[\D]/g,'').slice(0,16);
        var s = data.slice(0,4);
        if( data.length>4 ) s += '.'+data.slice(4,8);
        if( data.length>8 ) s += '/'+data.slice(8,15);
        if( data.length>15 ) s += '-'+data.slice(15,16);
		return s;
	}
	async function validarDota() {
		try{
			respostasof.value = {loading:true}
			let val = await schema.validate({ processo: dota.value, valor_empenho:1, valor_liquidado:1 });
			if(val){
				let r = await OrcamentosStore.getDotacaoRealizadoProcesso(dota.value,ano);
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
	        <h1>Empenho/Liquidação</h1>
	        <hr class="ml2 f1"/>
	        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
	    </div>
        <h3 class="mb2"><strong>{{ano}}</strong> - {{parent_item.codigo}} - {{parent_item.titulo}}</h3>
	    <template v-if="!(OrcamentoRealizado[ano]?.loading || OrcamentoRealizado[ano]?.error)">
	        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="currentEdit" v-slot="{ errors, isSubmitting, values }">
	            <div class="flex center g2 mb2">
	                <div class="f1">
	                    <label class="label">Processo SEI <span class="tvermelho">*</span></label>
	                    <Field name="processo" v-model="dota" type="text" class="inputtext light mb1" @keyup="maskProcesso" :class="{ 'error': errors.processo, 'loading': respostasof.loading}" />
	                    <div class="error-msg">{{ errors.processo }}</div>
	                    <div class="t13 mb1 tc300" v-if="respostasof.loading">Aguardando resposta do SOF</div>
	                </div>
	                <div class="f0">
	                	<a @click="validarDota()" class="btn outline bgnone tcprimary">Validar via SOF</a>
	                </div>
	            </div>
	            <div v-if="respostasof.length" class="mb2">
                    <label class="label mb2">Dotação vinculada* <span class="tvermelho">*</span></label>

                    <div class="flex g2">
                    	<div class="f0" style="flex-basis:30px"></div>
                    	<div class="f1"><label class="label tc300">Dotação</label></div>
                    	<div class="f1"><label class="label tc300">Nome do Projeto/Atividade</label></div>
                    	<div class="f0" style="flex-basis:90px"><label class="label tc300">Valor Empenho</label></div>
                    	<div class="f0" style="flex-basis:90px"><label class="label tc300">Valor Liquidação</label></div>
                    </div>
                    <hr class="mb05">
	            	<label class="flex g2 center mb1" v-for="(d,i) in respostasof" :key="d.id">
	            		<div class="f0" style="flex-basis:30px"><Field name="dotacao" type="radio" :value="d.dotacao" class="inputcheckbox"/><span></span></div>
	            		<div class="f1">{{d.dotacao}}</div>
	            		<div class="f1">{{d.projeto_atividade}}</div>
	            		<div class="f0" style="flex-basis:90px">{{dinheiro(d.empenho_liquido)}}</div>
	            		<div class="f0" style="flex-basis:90px">{{dinheiro(d.valor_liquidado)}}</div>
	            	</label>
	            </div>

	            <template v-if="respostasof.length&&values.dotacao">
		            <div>
                        <label class="label">Vincular dotação<span class="tvermelho">*</span></label>

                        <div v-for="m in singleMeta.children" :key="m.id">
                        	<div class="label tc300">Meta</div>
                        	<label class="block mb1">
                        		<Field name="location" type="radio" :value="'m'+m.id" class="inputcheckbox"/>
                        		<span>{{m.codigo}} - {{m.titulo}}</span>
                        	</label>
                        	<template v-if="['Iniciativa','Atividade'].indexOf(activePdm.nivel_orcamento)!=-1">
    	                    	<div v-if="m?.iniciativas?.length" class="label tc300">{{activePdm.rotulo_iniciativa}}{{ ['Atividade'].indexOf(activePdm.nivel_orcamento)!=-1 ? ' e '+activePdm.rotulo_atividade:'' }}</div>
    	                    	<div v-for="i in m.iniciativas" :key="i.id" class="">
    	                    		<label class="block mb1">
    	                    			<Field name="location" type="radio" :value="'i'+i.id" class="inputcheckbox"/>
    	                    			<span>{{i.codigo}} - {{i.titulo}}</span>
    	                    		</label>
    	                    		<template v-if="activePdm.nivel_orcamento=='Atividade'">
    		                    		<div v-for="a in i.atividades" :key="a.id" class="pl2">
    		                    			<label class="block mb1">
    		                    				<Field name="location" type="radio" :value="'a'+a.id" class="inputcheckbox"/>
    		                    				<span>{{a.codigo}} - {{a.titulo}}</span>
    		                    			</label>
    		                    		</div>
    	                    		</template>
    	                    	</div>
                        	</template>
                        </div>
                        <div class="error-msg">{{ errors.location }}</div>
    	            </div>

	            	<ItensRealizado :controlador="itens" :respostasof="respostasof.find(x=>x.dotacao==values.dotacao)" />

		            <div class="flex spacebetween center mb2">
		                <hr class="mr2 f1"/>
		                <button class="btn big" :disabled="isSubmitting">Salvar</button>
		                <hr class="ml2 f1"/>
		            </div>
	            </template>
	        </Form>
	    </template>
	    <template v-if="currentEdit&&currentEdit?.id">
	        <button @click="checkDelete(currentEdit.id)" class="btn amarelo big">Remover item</button>
	    </template>
	    <template v-if="OrcamentoRealizado[ano]?.loading">
	        <span class="spinner">Carregando</span>
	    </template>
	    <template v-if="OrcamentoRealizado[ano]?.error||error">
	        <div class="error p1">
	            <div class="error-msg">{{OrcamentoRealizado[ano].error??error}}</div>
	        </div>
	    </template>
	</Dashboard>
</template>
