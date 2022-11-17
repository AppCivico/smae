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
    const { SingleFechamento } = storeToRefs(CiclosStore);

    async function getAnaliseData(){
    	await CiclosStore.getMetaFechamento(props.ciclo_id,props.meta_id);
    }
    getAnaliseData();

    const schema = Yup.object().shape({
        comentario: Yup.string(),
    });

    async function onSubmit(values) {
        try {
            var msg;
            var r;
		    
		    let v = {
		    	"ciclo_fisico_id": props.ciclo_id,
		    	"meta_id": props.meta_id,
	        	"comentario": values.comentario
		    };
            r = await CiclosStore.updateMetaFechamento(v);
            msg = 'Ciclo fechado com sucesso!';
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
	    <h1>Fechar Ciclo</h1>
	    <hr class="ml2 f1"/>
	    <span>
		    <button @click="props.checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
	    </span>
	</div>

	<template v-if="!SingleFechamento?.loading&&!SingleFechamento?.error&&!error">
		
		<div class="t24 mb2">{{props.parent.codigo}} - {{props.parent.titulo}}</div>

		<Form @submit="onSubmit" ref="varForm" :validation-schema="schema" :initial-values="SingleFechamento" v-slot="{ errors, isSubmitting }">
		    <div class="flex g2">
		        <div class="f1">
		            <label class="label">Comentário</label>
		            <Field name="comentario" as="textarea" rows="5" class="inputtext light mb1" :class="{ 'error': errors.comentario }" />
		            <div class="error-msg">{{ errors.comentario }}</div>
		        </div>
		    </div>
		    <div class="flex spacebetween center mb2">
		        <hr class="mr2 f1"/>
		        <button ref="submitBt" type="submit" class="btn big" :disabled="isSubmitting">Fechar ciclo da meta</button>
		        <hr class="ml2 f1"/>
		    </div>
		</Form>

	</template>
	<template v-if="SingleFechamento?.loading">
	    <span class="spinner">Carregando</span>
	</template>
	<template v-if="SingleFechamento?.error||error">
	    <div class="error p1">
	        <div class="error-msg">{{SingleFechamento.error??error}}</div>
	    </div>
	</template>
</template>