<script setup>
	import { ref } from 'vue';
    import { Form, Field } from 'vee-validate';
    import * as Yup from 'yup';
    import { useRoute } from 'vue-router';
    import { router } from '@/router';
    import { storeToRefs } from 'pinia';
	import { useEditModalStore, useAlertStore, useCiclosStore } from '@/stores';

    const editModalStore = useEditModalStore();
	const alertStore = useAlertStore();

	const route = useRoute();
    const meta_id = route.params.meta_id;

    const pr = defineProps(['props']);
    const props = pr.props;
	
	const CiclosStore = useCiclosStore();
    const { SingleAnalise } = storeToRefs(CiclosStore);
    CiclosStore.getAnalise(props.var_id,props.periodo);
    
    const schema = Yup.object().shape({
        valor_realizado: Yup.string().required('Insira um valor'),
        valor_realizado_acumulado: Yup.string().nullable(),
        analise_qualitativa: Yup.string(),
        replicar: Yup.boolean().nullable(),
    });

    let submitBt = ref({});
    let enviaCP = ref(false);

    async function onSubmit(values) {
        try {
            var msg;
            var r;
		    
		    let v = {
		      "variavel_id": props.var_id,
		      "data_valor": props.periodo,
		      "valor_realizado": !isNaN(parseFloat(values.valor_realizado))?String(parseFloat(values.valor_realizado.replace(',','.'))):'',
		      "valor_realizado_acumulado": !SingleAnalise.value.variavel.acumulativa?!isNaN(parseFloat(values.valor_realizado_acumulado))?String(parseFloat(values.valor_realizado_acumulado.replace(',','.'))):'':null,
		      "analise_qualitativa": values.analise_qualitativa,
		      "enviar_para_cp": enviaCP.value,
		      "replicar": !!values.replicar ? true:false,
		    };
            r = await CiclosStore.updateAnalise(v);
            msg = 'Dados salvos com sucesso!';
            enviaCP.value=false;
            if(r == true){
            	editModalStore.clear(); 
                alertStore.success(msg);
                CiclosStore.getMetaVars(meta_id);
            }
        } catch (error) {
        	enviaCP.value=false;
            alertStore.error(error);
        }
    }
    function replicarConfirm(e){
    	var item = e.target;
    	if(item.checked)alertStore.confirmAction(
    		'Deseja replicar o preenchimento para as variáveis desse indicador?',
    		()=>{alertStore.clear();},
    		'Replicar preenchimento',
    		()=>{item.checked=false; alertStore.clear();},
		);
    }
    function submeter(e){
    	var item = e.target;
    	alertStore.confirmAction(
    		'Deseja enviar variável para conferência? Os dados só poderão ser editados pela coordenadoria, ou em caso de solicitação de complementação.',
    		()=>{ enviaCP.value=true; submitBt.value.click(); alertStore.clear();},
    		'Enviar'
		);
    }
    function dateToTitle(d) {
        var dd=d?new Date(d):false;
        if(!dd) return d;
        var month = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][dd.getUTCMonth()];
        var year = dd.getUTCFullYear();
        return `${month} ${year}`;
    }

</script>
<template>
	<div class="flex spacebetween center mb2">
	    <h2>Adicionar valor realizado</h2>
	    <hr class="ml2 f1"/>
	    <span>
		    <button @click="props.checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
	    </span>
	</div>

	<template v-if="SingleAnalise?.variavel">

		<div class="label tamarelo mb1">{{props.parent.atividade?`Indicador da atividade ${props.parent.atividade.codigo} ${props.parent.atividade.titulo}`:props.parent.iniciativa?`Indicador da iniciativa ${props.parent.iniciativa.codigo} ${props.parent.iniciativa.titulo}`:'Indicador da Meta'}}</div>

		<div class="flex center mb2">
        	<svg class="f0 tlaranja mr1" style="flex-basis: 2rem;" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><use :xlink:href="`#i_${props.parent.atividade?'atividade':props.parent.iniciativa?'iniciativa':'indicador'}`"></use></svg>
			<div class="t20"><strong>{{props.parent.indicador.codigo}} {{props.parent.indicador.titulo}}</strong></div>
		</div>
		
		<div class="t20"><strong>{{SingleAnalise.variavel.codigo}} {{SingleAnalise.variavel.titulo}}</strong></div>
		<div class="t20 mb2">{{dateToTitle(props.periodo)}}</div>
		
		<div class="flex g2">
		    <div>
		        <div class="t12 uc w700 tc200">Unidade de medida</div>
		        <div class="t13">{{SingleAnalise.variavel.unidade_medida.sigla}} ({{SingleAnalise.variavel.unidade_medida.descricao}})</div>
		    </div>
		    <div>
		        <div class="t12 uc w700 tc200">Número de casas decimais</div>
		        <div class="t13">{{SingleAnalise.variavel.casas_decimais}}</div>
		    </div>
		    <div>
		        <div class="t12 uc w700 tc200">Projetado</div>
		        <div class="t13">{{SingleAnalise.series[SingleAnalise.ordem_series.indexOf('Previsto')].valor_nominal??'-'}}</div>
		    </div>
		</div>
		

		<hr class="mt2 mb2"/>


		<Form @submit="onSubmit" ref="varForm" :validation-schema="schema" :initial-values="singlePaineisGrupos" v-slot="{ errors, isSubmitting }">
		    <div class="flex g2">
		        <div class="f1">
		            <label class="label">Valor Realizado <span class="tvermelho">*</span></label>
		            <Field name="valor_realizado" type="number" :step="'0'+(SingleAnalise.variavel.casas_decimais? '.'+('0'.repeat(SingleAnalise.variavel.casas_decimais-1))+'1' : '')" class="inputtext light mb1" :class="{ 'error': errors.valor_realizado }" />
		            <div class="error-msg mb1">{{ errors.valor_realizado }}</div>

		            <template v-if="!SingleAnalise.variavel.acumulativa">
		            	<label class="label">Valor Realizado Acumulado</label>
		            	<Field name="valor_realizado_acumulado" type="text" class="inputtext light mb1" :class="{ 'error': errors.valor_realizado_acumulado }" />
		            	<div class="error-msg mb1">{{ errors.valor_realizado_acumulado }}</div>
		            </template>
		        </div>
		        <div class="f1">
		            <label class="label">Análise qualitativa <span class="tvermelho">*</span></label>
		            <Field name="analise_qualitativa" as="textarea" rows="3" class="inputtext light mb1" :class="{ 'error': errors.analise_qualitativa }" />
		            <div class="error-msg">{{ errors.analise_qualitativa }}</div>
		        </div>
		    </div>
		    <div class="mb1" v-if="SingleAnalise.variavel.regionalizavel">
		        <label class="block">
		            <Field name="replicar" type="checkbox" value="1" @change="replicarConfirm" class="inputcheckbox" /><span :class="{ 'error': errors.replicar }">Replicar valor para outras variáveis regionalizaveis</span>
		        </label>
		        <div class="error-msg">{{ errors.replicar }}</div>
		    </div>
		    <div class="flex spacebetween center mb2">
		        <hr class="mr2 f1"/>
		        <button ref="submitBt" type="submit" class="btn outline bgnone tcprimary big mr1" :disabled="isSubmitting">Salvar</button>
		        <button class="btn big" type="button" @click="submeter" :disabled="isSubmitting">Salvar e submeter</button>
		        <hr class="ml2 f1"/>
		    </div>
		</Form>
	</template>
	<template v-if="SingleAnalise?.loading">
	    <span class="spinner">Carregando</span>
	</template>
	<template v-if="SingleAnalise?.error||error">
	    <div class="error p1">
	        <div class="error-msg">{{SingleAnalise.error??error}}</div>
	    </div>
	</template>
</template>