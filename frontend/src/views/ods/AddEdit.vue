<script setup>
import { Dashboard } from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useODSStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;

const ODSStore = useODSStore();
const { tempODS } = storeToRefs(ODSStore);
ODSStore.clear();

let title = 'Cadastro de ODS';
if (id) {
    title = 'Editar ODS';
    ODSStore.getById(id);
}

const schema = Yup.object().shape({
    numero: Yup.number().required('Preencha o número'),
    titulo: Yup.string().required('Preencha o título'),
    descricao: Yup.string().required('Preencha a descrição'),
});

async function onSubmit(values) {
    try {
        var msg;
        var r;
        if (id&&tempODS.value.id) {
            r = await ODSStore.update(tempODS.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await ODSStore.insert(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            await router.push('/ods');
            alertStore.success(msg);
        }
    } catch (error) {
        alertStore.error(error);
    }
}

async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?','/ods');
}
async function checkDelete(id) {
    alertStore.confirmAction('Deseja mesmo remover esse item?',()=>{if(ODSStore.delete(id)) router.push('/ods')},'Remover');
}

</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="!(tempODS?.loading || tempODS?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="tempODS" v-slot="{ errors, isSubmitting }">
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Número <span class="tvermelho">*</span></label>
                        <Field name="numero" type="number" class="inputtext light mb1" :class="{ 'error': errors.numero }" />
                        <div class="error-msg">{{ errors.numero }}</div>
                    </div>
                    <div class="f2">
                        <label class="label">Título <span class="tvermelho">*</span></label>
                        <Field name="titulo" type="text" class="inputtext light mb1" :class="{ 'error': errors.titulo }" />
                        <div class="error-msg">{{ errors.titulo }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Descrição <span class="tvermelho">*</span></label>
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
        <template v-if="tempODS.id">
            <button @click="checkDelete(tempODS.id)" class="btn amarelo big">Remover item</button>
        </template>
        <template v-if="tempODS?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="tempODS?.error||error">
            <div class="error p1">
                <div class="error-msg">{{tempODS.error??error}}</div>
            </div>
        </template>
    </Dashboard>
</template>
