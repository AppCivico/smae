<script setup>
import { ref, reactive, onMounted, onUpdated } from 'vue';
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useEditModalStore, usePdMStore } from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;

const ps = defineProps(['props']);
const props = ps.props;

const virtualParent = reactive({});

var pdm_id = route.params.pdm_id;
const PdMStore = usePdMStore();
const { singlePdm, tempArquivos } = storeToRefs(PdMStore);

if(!singlePdm.value.id || singlePdm.value.id != pdm_id) PdMStore.getById(pdm_id);
virtualParent.pdm_id=pdm_id;

let title = 'Adicionar arquivo';
if (id) {
    title = 'Editar arquivo';
    PdMStore.getArquivoById(pdm_id,id);
}

const schema = Yup.object().shape({
    descricao: Yup.string().required('Preencha a descrição'),
    pdm_id: Yup.string(),
    tipo_documento_id: Yup.string().nullable(),
    //tipo: 'DOCUMENTO'
});

async function onSubmit(values) {
    try {
        var msg;
        var r;
        if (id&&tempArquivos.value.id) {
            r = await ArquivosStore.update(tempArquivos.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await ArquivosStore.insert(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            ArquivosStore.clear();
            PdMStore.clearLoad();
            if(props.parentPage=='pdm') PdMStore.filterPdM();
            await router.push('/'+props.parentPage);
            alertStore.success(msg);
            editModalStore.clear();
        }
    } catch (error) {
        alertStore.error(error);
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?',()=>{ 
        router.push('/'+props.parentPage);  
        editModalStore.clear(); 
        alertStore.clear(); 
    });
}
async function checkDelete(id) {
    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{
        if(await ArquivosStore.delete(id)){
            ArquivosStore.clear();
            PdMStore.clearLoad();
            if(props.parentPage=='pdm') PdMStore.filterPdM();
            editModalStore.clear(); 
            router.push('/'+props.parentPage);
        }
    },'Remover');
}
</script>

<template>
    <div class="flex spacebetween center mb2">
        <h2>{{title}} {{label}}</h2>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <template v-if="!(tempArquivos?.loading || tempArquivos?.error)">
        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="id?tempArquivos:virtualParent" v-slot="{ errors, isSubmitting }">
            <Field name="pdm_id" type="hidden" :value="pdm_id" /><div class="error-msg">{{ errors.pdm_id }}</div>
            <div class="flex g2">
                <div class="f1">
                    <label class="label">{{label}} <span class="tvermelho">*</span></label>
                    <Field name="descricao" type="text" class="inputtext light mb1" :class="{ 'error': errors.descricao }" />
                    <div class="error-msg">{{ errors.descricao }}</div>
                </div>
            </div>
            <div class="flex spacebetween center mb2">
                <hr class="mr2 f1"/>
                <button class="btn big" :disabled="isSubmitting">Salvar</button>
                <hr class="ml2 f1"/>
            </div>
        </Form>
    </template>
    <template v-if="tempArquivos.id">
        <button @click="checkDelete(tempArquivos.id)" class="btn amarelo big">Remover item</button>
    </template>
    <template v-if="tempArquivos?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-if="tempArquivos?.error||error">
        <div class="error p1">
            <div class="error-msg">{{tempArquivos.error??error}}</div>
        </div>
    </template>
</template>
