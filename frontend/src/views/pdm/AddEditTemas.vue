<script setup>
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useEditModalStore, useTemasStore, usePdMStore } from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;

const TemasStore = useTemasStore();
const { tempTemas } = storeToRefs(TemasStore);
TemasStore.clear();

const pdm_id = route.params.pdm_id;
const PdMStore = usePdMStore();
const { singlePdm } = storeToRefs(PdMStore);
if(!singlePdm.id || singlePdm.id != pdm_id) PdMStore.getById(pdm_id);

var label = singlePdm?.rotulo_macro_tema??"Macrotema";

var virtualParent;
let title = 'Cadastro de '+label;
if (id) {
    title = 'Editar '+label;
    TemasStore.getById(id);
}else{
    virtualParent = {pdm_id: route.params.pdm_id};
}

const schema = Yup.object().shape({
    descricao: Yup.string().required('Preencha a descrição'),
    pdm_id: Yup.string().required('Selecione um PdM'),
});

async function onSubmit(values) {
    try {
        var msg;
        var r;
        if (id&&tempTemas.value.id) {
            r = await TemasStore.update(tempTemas.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await TemasStore.insert(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            PdMStore.filterPdM();
            await router.push('/pdm');
            alertStore.success(msg);
            editModalStore.clear();
        }
    } catch (error) {
        alertStore.error(error);
    }
}

async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?',()=>{ editModalStore.clear(); alertStore.clear(); router.push('/pdm'); });
}
async function checkDelete(id) {
    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await TemasStore.delete(id)){PdMStore.filterPdM(); editModalStore.clear(); router.push('/pdm');}},'Remover');
}

</script>

<template>
    <div class="flex spacebetween center mb2">
        <h2>{{title}}</h2>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <template v-if="!(tempTemas?.loading || tempTemas?.error)">
        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="tempTemas.pdm_id&&id?tempTemas:virtualParent" v-slot="{ errors, isSubmitting }">
            <Field name="pdm_id" type="hidden" :value="pdm_id" /><div class="error-msg">{{ errors.pdm_id }}</div>
            <div class="flex g2">
                <div class="f1">
                    <label class="label">Tema <span class="tvermelho">*</span></label>
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
    <template v-if="tempTemas.id">
        <button @click="checkDelete(tempTemas.id)" class="btn amarelo big">Remover item</button>
    </template>
    <template v-if="tempTemas?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-if="tempTemas?.error||error">
        <div class="error p1">
            <div class="error-msg">{{tempTemas.error??error}}</div>
        </div>
    </template>
</template>
