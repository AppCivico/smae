<script setup>
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useDocumentTypesStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;

const documentTypesStore = useDocumentTypesStore();
const { tempDocumentTypes } = storeToRefs(documentTypesStore);
documentTypesStore.clear();

let title = 'Cadastro de tipo de documento';
if (id) {
    title = 'Editar tipo de documento';
    documentTypesStore.getById(id);
}

const schema = Yup.object().shape({
    codigo: Yup.string().required('Preencha o código'),
    titulo: Yup.string().required('Preencha o título'),
    descricao: Yup.string().required('Preencha a descrição'),
    extensoes: Yup.string().required('Preencha a extensões').matches(/^[a-zA-Z0-9,]*$/,'Somente letras, números e vírgula.')
});

async function onSubmit(values) {
    try {
        var msg;
        var r;
        if (id&&tempDocumentTypes.value.id) {
            r = await documentTypesStore.update(tempDocumentTypes.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await documentTypesStore.insert(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            await router.push('/tipo-documento');
            alertStore.success(msg);
        }
    } catch (error) {
        alertStore.error(error);
    }
}

async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?','/tipo-documento');
}
async function checkDelete(id) {
    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await documentTypesStore.delete(id)) router.push('/tipo-documento')},'Remover');
}
function removeChars(x){
    x.target.value = x.target.value.replace(/[^a-zA-Z0-9,]/g,'');
}

</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="!(tempDocumentTypes?.loading || tempDocumentTypes?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="tempDocumentTypes" v-slot="{ errors, isSubmitting }">
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Código <span class="tvermelho">*</span></label>
                        <Field name="codigo" type="text" class="inputtext light mb1" :class="{ 'error': errors.codigo }" />
                        <div class="error-msg">{{ errors.codigo }}</div>
                    </div>
                    <div class="f1">
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
                    <div class="f1">
                        <label class="label">Extensões <span class="tvermelho">*</span></label>
                        <Field name="extensoes" type="text" class="inputtext light mb1" placeholder="Liste aqui as extensões aceitas" @keyup="removeChars" :class="{ 'error': errors.extensoes }" />
                        <div class="error-msg">{{ errors.extensoes }}</div>
                        <p class="t13 tc500">Separe as extensões por vírgula (ex: pdf,jpg,xls)</p>
                    </div>
                </div>
                <div class="flex spacebetween center mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">Salvar</button>
                    <hr class="ml2 f1"/>
                </div>
            </Form>
        </template>
        <template v-if="tempDocumentTypes.id">
            <button @click="checkDelete(tempDocumentTypes.id)" class="btn amarelo big">Remover item</button>
        </template>
        <template v-if="tempDocumentTypes?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="tempDocumentTypes?.error||error">
            <div class="error p1">
                <div class="error-msg">{{tempDocumentTypes.error??error}}</div>
            </div>
        </template>
    </Dashboard>
</template>
