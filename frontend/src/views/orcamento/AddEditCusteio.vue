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
	const id = route.params.id;
	const ano = route.params.ano;

	const MetasStore = useMetasStore();
    const { singleMeta } = storeToRefs(MetasStore);
    MetasStore.getChildren(meta_id);
	const IniciativasStore = useIniciativasStore();
    const { singleIniciativa } = storeToRefs(IniciativasStore);
	const AtividadesStore = useAtividadesStore();
    const { singleAtividade } = storeToRefs(AtividadesStore);

	const parentlink = `${meta_id?'/metas/'+meta_id:''}${iniciativa_id?'/iniciativas/'+iniciativa_id:''}${atividade_id?'/atividades/'+atividade_id:''}`;
	const parent_item = ref(atividade_id?singleAtividade:iniciativa_id?singleIniciativa:meta_id?singleMeta:false);

	const OrcamentosStore = useOrcamentosStore();
	const { OrcamentoCusteio, DotacaoSegmentos } = storeToRefs(OrcamentosStore);
	const currentEdit = ref({});

	const dota = ref('');
	const d_orgao = ref('');
	const d_unidade = ref('');
	const d_funcao = ref('');
	const d_subfuncao = ref('');
	const d_programa = ref('');
	const d_projetoatividade = ref('');
	const d_contadespesa = ref('');
	const d_fonte = ref('');
	const caret = ref(0);

	(async()=>{
		await OrcamentosStore.getDotacaoSegmentos(ano);
		await OrcamentosStore.getOrcamentoCusteioById(meta_id,ano);

		OrcamentoCusteio.value[ano].map(x=>{
			x.custeio_previsto = dinheiro(x.custeio_previsto);
			x.investimento_previsto = dinheiro(x.investimento_previsto);
		});

		if(id){
			currentEdit.value = OrcamentoCusteio.value[ano].find(x=>x.id==id);

	        currentEdit.value.parte_dotacao = await currentEdit.value.parte_dotacao.split('.').map((x,i)=>{
	        	if(x.indexOf('*')!=-1){
	        		if(i==4){
	        			return "****";
	        		}else if(i==7){
	        			return "********";
	        		}
	        	}
	        	return x;
	        }).join('.');
			dota.value = currentEdit.value.parte_dotacao;
	        validaPartes(currentEdit.value.parte_dotacao);

			currentEdit.value.location =  
				currentEdit.value.atividade?.id?'a'+currentEdit.value.atividade.id:
				currentEdit.value.iniciativa?.id?'i'+currentEdit.value.iniciativa.id:
				currentEdit.value.meta?.id?'m'+currentEdit.value.meta.id:'m'+meta_id;
		}
	})();

	var regdota = /^(\d{2}(\.\d{2}(\.\d{2}(\.\d{3}(\.[0-9*]{4}((?:\.\d\.\d{3})(\.[0-9*]{8}(\.\d{2})?)?)?)?)?)?)?)?$/;
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

	        values.parte_dotacao = values.parte_dotacao.split('.').map(x=>x.indexOf('*')!=-1?'*':x).join('.');

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

            if(id){
	            r = await OrcamentosStore.updateOrcamentoCusteio(id,values);
	            msg = 'Dados salvos com sucesso!';
            }else{
            	r = await OrcamentosStore.insertOrcamentoCusteio(values);
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
	    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await OrcamentosStore.deleteOrcamentoCusteio(id)) router.push(`${parentlink}/orcamento`)},'Remover');
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
	function maskDotacao(el){
		//caret.value = el.target.selectionStart;
	    var kC = event.keyCode;
	    let f = formatDota(el.target.value);
	    el.target.value = f;
	    //el.target.focus();
	    //el.target.setSelectionRange(pos, pos);
	    validaPartes(f);
	}
	function formatDota(d){
	    var data = String(d).replace(/([^0-9*])/g,'').slice(0,27);
        var s = data.slice(0,2);
        if( data.length>2 ) s += '.'+data.slice(2,4);
        if( data.length>4 ) s += '.'+data.slice(4,6);
        if( data.length>6 ) s += '.'+data.slice(6,9);
        if( data.length>9 ) s += '.'+data.slice(9,13);
        if( data.length>13 ) s += '.'+data.slice(13,14);
        if( data.length>14 ) s += '.'+data.slice(14,17);
        if( data.length>17 ) s += '.'+data.slice(17,25);
        if( data.length>25 ) s += '.'+data.slice(25);
		return s;
	}
	function validaPartes(a){
		let v = a.split('.');
		if(v.length){
			d_orgao.value = (v[0]) ? v[0] : '';
			d_unidade.value = (v[1]) ? v[1] : '';
			d_funcao.value = (v[2]) ? v[2] : '';
			d_subfuncao.value = (v[3]) ? v[3] : '';
			d_programa.value = (v[4]) ? v[4] : '';
			d_projetoatividade.value = (v[5]&&v[6]) ? v[5]+''+v[6] : '';
			d_contadespesa.value = (v[7]) ? v[7] : '';
			d_fonte.value = (v[8]) ? v[8] : '';
		}
	}
	function montaDotacao(a){
		let o = '';
		if(d_orgao.value) o += d_orgao.value;
		if(d_unidade.value) o += '.'+d_unidade.value;
		if(d_funcao.value) o += '.'+d_funcao.value;
		if(d_subfuncao.value) o += '.'+d_subfuncao.value;
		if(d_programa.value) o += '.'+d_programa.value;
		if(d_projetoatividade.value) o += '.'+d_projetoatividade.value.slice(0,1)+'.'+d_projetoatividade.value.slice(1,4);
		if(d_contadespesa.value) o += '.'+d_contadespesa.value;
		if(d_fonte.value) o += '.'+d_fonte.value;
		dota.value = o;
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
	        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="currentEdit" v-slot="{ errors, isSubmitting }">
	            <div class="flex center g2 mb2">
	                <div class="f1">
	                    <label class="label">Parte da dotação <span class="tvermelho">*</span></label>
	                    <Field name="parte_dotacao" v-model="dota" type="text" class="inputtext light mb1" @keyup="maskDotacao" :class="{ 'error': errors.parte_dotacao }" />
	                    <div class="error-msg">{{ errors.parte_dotacao }}</div>
	                </div>
	            </div>
	            <template v-if="DotacaoSegmentos[ano]?.atualizado_em">
	                <label class="label mb1">parte da dotação - por segmento</label>
		            <div class="flex g2 mb2">
		                <div class="f1">
		                	<label class="label tc300">Órgão <span class="tvermelho">*</span></label>
		                    <Field name="d_orgao" v-model="d_orgao" @change="montaDotacao" as="select" class="inputtext light mb1">
		                    	<option v-for="i in DotacaoSegmentos[ano].orgaos" :key="i.codigo" :value="i.codigo">{{i.codigo+' - '+i.descricao}}</option>
		                    </Field>
		                    <div class="t12 tc500" v-if="d_orgao">
		                    	{{ (it = DotacaoSegmentos[ano].orgaos.find(x=>x.codigo==d_orgao)) ? `${it.codigo} - ${it.descricao}` : '' }}
		                    </div>
		                </div>
		                <div class="f1">
		                    <label class="label tc300">Unidade <span class="tvermelho">*</span></label>
		                    <Field name="d_unidade" v-model="d_unidade" @change="montaDotacao" as="select" class="inputtext light mb1">
		                    	<option v-for="i in DotacaoSegmentos[ano].unidades" :key="i.codigo" :value="i.codigo">{{i.codigo+' - '+i.descricao}}</option>
		                    </Field>
		                    <div class="t12 tc500" v-if="d_unidade">
		                    	{{ (it = DotacaoSegmentos[ano].unidades.find(x=>x.codigo==d_unidade)) ? `${it.codigo} - ${it.descricao}` : '' }}
		                    </div>
		                </div>
		                <div class="f1">
		                    <label class="label tc300">Função <span class="tvermelho">*</span></label>
		                    <Field name="d_funcao" v-model="d_funcao" @change="montaDotacao" as="select" class="inputtext light mb1">
		                    	<option v-for="i in DotacaoSegmentos[ano].funcoes" :key="i.codigo" :value="i.codigo">{{i.codigo+' - '+i.descricao}}</option>
		                    </Field>
		                    <div class="t12 tc500" v-if="d_funcao">
		                    	{{ (it = DotacaoSegmentos[ano].funcoes.find(x=>x.codigo==d_funcao)) ? `${it.codigo} - ${it.descricao}` : '' }}
		                    </div>
		                </div>
		                <div class="f1">
		                    <label class="label tc300">Subfunção <span class="tvermelho">*</span></label>
		                    <Field name="d_subfuncao" v-model="d_subfuncao" @change="montaDotacao" as="select" class="inputtext light mb1">
		                    	<option v-for="i in DotacaoSegmentos[ano].subfuncoes" :key="i.codigo" :value="i.codigo">{{i.codigo+' - '+i.descricao}}</option>
		                    </Field>
		                    <div class="t12 tc500" v-if="d_subfuncao">
		                    	{{ (it = DotacaoSegmentos[ano].subfuncoes.find(x=>x.codigo==d_subfuncao)) ? `${it.codigo} - ${it.descricao}` : '' }}
		                    </div>
		                </div>
		                <div class="f1">
		                    <label class="label tc300">Programa</label>
		                    <Field name="d_programa" v-model="d_programa" @change="montaDotacao" as="select" class="inputtext light mb1">
		                    	<option value="****">****</option>
		                    	<option v-for="i in DotacaoSegmentos[ano].programas" :key="i.codigo" :value="i.codigo">{{i.codigo+' - '+i.descricao}}</option>
		                    </Field>
		                    <div class="t12 tc500" v-if="d_programa">
		                    	{{ (it = DotacaoSegmentos[ano].programas.find(x=>x.codigo==d_programa)) ? `${it.codigo} - ${it.descricao}` : '' }}
		                    </div>
		                </div>
		            </div>
		            <!-- categorias -->
		            <!-- elementos -->
		            <!-- grupos -->
		            <!-- modalidades -->

		            <div class="flex g2 mb2">
		                <div class="f1">
		                    <label class="label tc300">Projeto/atividade <span class="tvermelho">*</span></label>
		                    <Field name="d_projetoatividade" v-model="d_projetoatividade" @change="montaDotacao" as="select" class="inputtext light mb1">
		                    	<option v-for="i in DotacaoSegmentos[ano].projetos_atividades" :key="i.codigo" :value="i.codigo">{{i.codigo+' - '+i.descricao}}</option>
		                    </Field>
		                    <div class="t12 tc500" v-if="d_projetoatividade">
		                    	{{ (it = DotacaoSegmentos[ano].projetos_atividades.find(x=>x.codigo==d_projetoatividade)) ? `${it.codigo} - ${it.descricao}` : '' }}
		                    </div>
		                </div>
		                <div class="f1">
		                    <label class="label tc300">Conta despesa</label>
		                    <Field name="d_contadespesa" v-model="d_contadespesa" @change="montaDotacao" as="select" class="inputtext light mb1">
		                    	<option value="********">********</option>
		                    </Field>
		                </div>
		                <div class="f1">
		                    <label class="label tc300">Fonte <span class="tvermelho">*</span></label>
		                    <Field name="d_fonte" v-model="d_fonte" @change="montaDotacao" as="select" class="inputtext light mb1">
		                    	<option v-for="i in DotacaoSegmentos[ano].fonte_recursos" :key="i.codigo" :value="i.codigo">{{i.codigo+' - '+i.descricao}}</option>
		                    </Field>
		                    <div class="t12 tc500" v-if="d_fonte">
		                    	{{ (it = DotacaoSegmentos[ano].fonte_recursos.find(x=>x.codigo==d_fonte)) ? `${it.codigo} - ${it.descricao}` : '' }}
		                    </div>
		                </div>
		            </div>
	            </template>

	            <hr class="mt2 mb2">
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

	            <hr class="mt2 mb2">
	            <div class="flex g2 mb2">
	                <div class="f1">
	                    <label class="label">Previsão de investimento<span class="tvermelho">*</span></label>
	                    <Field name="investimento_previsto" @keyup="maskFloat" type="text" class="inputtext light mb1" :class="{ 'error': errors.investimento_previsto }" />
	                    <div class="error-msg">{{ errors.investimento_previsto }}</div>
	                </div>
	                <div class="f1">
	                    <label class="label">Previsão de custeio <span class="tvermelho">*</span></label>
	                    <Field name="custeio_previsto" @keyup="maskFloat" type="text" class="inputtext light mb1" :class="{ 'error': errors.custeio_previsto }" />
	                    <div class="error-msg">{{ errors.custeio_previsto }}</div>
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