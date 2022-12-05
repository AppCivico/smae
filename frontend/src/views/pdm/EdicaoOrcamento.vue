<script setup>
	import { ref } from 'vue';
	import { Form, Field } from 'vee-validate';
	import { storeToRefs } from 'pinia';
	import { useAlertStore, useEditModalStore, usePdMStore } from '@/stores';
	const pr = defineProps(['props']);
	const props = pr.props
	const pdm_id = props.pdm_id;

	const alertStore = useAlertStore();
	const editModalStore = useEditModalStore();

	const PdMStore = usePdMStore();
	const { singlePdm } = storeToRefs(PdMStore);


	let anosOrcamento = ref({});
	(async()=>{
		await PdMStore.getById(pdm_id);
		anosOrcamento.value = singlePdm.value.orcamento_config;
	})();

	async function onSubmit(values) {
	    try {
	        var msg;
	        var r;

	        values.orcamento_config = anosOrcamento.value;

            r = await PdMStore.updatePermissoesOrcamento(singlePdm.value.id, values);
            msg = 'Dados salvos com sucesso!';

	        if(r == true){
	            editModalStore.clear();
	            alertStore.success(msg);
	        }
	    } catch (error) {
	        alertStore.error(error);
	    }
	}
</script>
<template>
	<div class="flex spacebetween center mb2">
	    <h2 class="mb0">Permissões para edição do orçamento</h2>
	    <hr class="ml2 f1"/>
	    <button @click="props.checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
	</div>
	<hr class="mt2 mb2">
	<template v-if="!(singlePdm?.loading || singlePdm?.error)">
		<Form @submit="onSubmit" v-slot="{ errors, isSubmitting }">
			<div v-for="y in anosOrcamento" :key="y.id" class="mb2">
				<h4>{{y.ano_referencia}}</h4>
				<label class="block mb05"><input v-model="y.previsao_custo_disponivel" class="inputcheckbox" type="checkbox" value=true /><span>Previsão de custo</span></label>
				<label class="block mb05"><input v-model="y.planejado_disponivel" class="inputcheckbox" type="checkbox" value=true /><span>Orçamento planejado</span></label>
				<label class="block mb05"><input v-model="y.execucao_disponivel" class="inputcheckbox" type="checkbox" value=true /><span>Execução orçamentária</span></label>
			</div>
			<div class="flex spacebetween center mb2">
			    <hr class="mr2 f1"/>
			    <button class="btn outline tcprimary bgnone mr1" type="button" @click="props.checkClose">Cancelar</button>
			    <button class="btn" :disabled="isSubmitting">Salvar</button>
			    <hr class="ml2 f1"/>
			</div>
		</Form>
	</template>
    <template v-if="singlePdm?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-if="singlePdm?.error||error">
        <div class="error p1">
            <div class="error-msg">{{singlePdm.error??error}}</div>
        </div>
    </template>
</template>