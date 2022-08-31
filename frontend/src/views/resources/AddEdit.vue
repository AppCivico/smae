<script setup>
import { Dashboard } from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useResourcesStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;

const resourcesStore = useResourcesStore();
const { tempResources } = storeToRefs(resourcesStore);
resourcesStore.clear();

let title = 'Cadastro de fonte de recurso';
if (id) {
    title = 'Editar fonte de recurso';
    resourcesStore.getById(id);
}

const schema = Yup.object().shape({
    fonte: Yup.string().required('Preencha a fonte'),
    sigla: Yup.string().required('Preencha a sigla')
});

async function onSubmit(values) {
    try {
        var msg;
        if (id&&tempResources.value.id) {
            var r = await resourcesStore.updateType(tempResources.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            var r = await resourcesStore.insertType(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            await router.push('/fonte-recurso');
            alertStore.success(msg);
        }
    } catch (error) {
        alertStore.error(error);
    }
}

async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?','/fonte-recurso');
}
async function checkDelete(id) {
    alertStore.confirmAction('Deseja mesmo remover esse item?',()=>{resourcesStore.deleteType(id); router.push('/fonte-recurso')},'Remover');
}

</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="!(tempResources?.loading || tempResources?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="tempResources" v-slot="{ errors, isSubmitting }">
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Fonte <span class="tvermelho">*</span></label>
                        <Field name="fonte" type="text" class="inputtext light mb1" :class="{ 'error': errors.fonte }" />
                        <div class="error-msg">{{ errors.fonte }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Sigla <span class="tvermelho">*</span></label>
                        <Field name="sigla" type="text" class="inputtext light mb1" :class="{ 'error': errors.sigla }" />
                        <div class="error-msg">{{ errors.sigla }}</div>
                    </div>
                </div>
                <div class="flex spacebetween center mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">Salvar</button>
                    <hr class="ml2 f1"/>
                </div>
            </Form>
        </template>
        <template v-if="tempResources.id">
            <button @click="checkDelete(tempResources.id)" class="btn amarelo big">Remover item</button>
        </template>
        <template v-if="tempResources?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="tempResources?.error||error">
            <div class="error p1">
                <div class="error-msg">{{tempResources.error??error}}</div>
            </div>
        </template>
    </Dashboard>
</template>
