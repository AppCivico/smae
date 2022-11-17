<script setup>
	import { ref } from 'vue';
    import { Form, Field } from 'vee-validate';
    import * as Yup from 'yup';
    import { storeToRefs } from 'pinia';
	import { useEditModalStore, useAlertStore, useCiclosStore } from '@/stores';
	import { requestS } from '@/helpers';
    import { router } from '@/router';
	const baseUrl = `${import.meta.env.VITE_API_URL}`;

    const editModalStore = useEditModalStore();
	const alertStore = useAlertStore();

    const pr = defineProps(['props']);
    const props = pr.props;

	const CiclosStore = useCiclosStore();
    const { SingleMetaAnalise, SingleMetaAnaliseDocs } = storeToRefs(CiclosStore);

    async function getAnaliseData(){
    	await CiclosStore.getMetaAnalise(props.ciclo_id,props.meta_id);
    }
    getAnaliseData();

    const schema = Yup.object().shape({
        informacoes_complementares: Yup.string(),
    });

    async function onSubmit(values) {
        try {
            var msg;
            var r;
		    
		    let v = {
		    	"ciclo_fisico_id": props.ciclo_id,
		    	"meta_id": props.meta_id,
	        	"informacoes_complementares": values.informacoes_complementares,
		    };
            r = await CiclosStore.updateMetaAnalise(v);
            msg = 'Análise qualitativa salva com sucesso!';
            if(r == true){
            	editModalStore.clear(); 
                alertStore.success(msg);
    			getAnaliseData();
            }
        } catch (error) {
            alertStore.error(error);
        }
    }
</script>
<template>
	<div class="flex spacebetween center">
	    <h1>Qualificar meta</h1>
	    <hr class="ml2 f1"/>
	    <span>
		    <button @click="props.checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
	    </span>
	</div>

	<template v-if="!SingleMetaAnalise?.loading&&!SingleMetaAnalise?.error&&!error">
		
		<div class="t24 mb2">{{props.parent.codigo}} - {{props.parent.titulo}}</div>

		<Form @submit="onSubmit" ref="varForm" :validation-schema="schema" :initial-values="SingleMetaAnalise" v-slot="{ errors, isSubmitting }">
	        <div class="mb2">
	            <label class="label">Informações complementares</label>
	            <Field name="informacoes_complementares" as="textarea" rows="5" class="inputtext light mb1" :class="{ 'error': errors.informacoes_complementares }" />
	            <div class="error-msg">{{ errors.informacoes_complementares }}</div>
	        </div>
	        
		    <div class="flex spacebetween center mb2">
		        <hr class="mr2 f1"/>
		        <button ref="submitBt" type="submit" class="btn big" :disabled="isSubmitting">Salvar análise de risco</button>
		        <hr class="ml2 f1"/>
		    </div>
		</Form>

	</template>
	<template v-if="SingleMetaAnalise?.loading">
	    <span class="spinner">Carregando</span>
	</template>
	<template v-if="SingleMetaAnalise?.error||error">
	    <div class="error p1">
	        <div class="error-msg">{{SingleMetaAnalise.error??error}}</div>
	    </div>
	</template>
</template>