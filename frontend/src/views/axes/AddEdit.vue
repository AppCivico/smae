<script setup>
import { Dashboard } from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useAxesStore, usePdMStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;

const AxesStore = useAxesStore();
const { tempAxes } = storeToRefs(AxesStore);
AxesStore.clear();

const PdMStore = usePdMStore();
const { PdM } = storeToRefs(PdMStore);
PdMStore.getAll();

let title = 'Cadastro de Eixo';
if (id) {
    title = 'Editar Eixo';
    AxesStore.getById(id);
}

const schema = Yup.object().shape({
    numero: Yup.string().required('Preencha o número'),
    titulo: Yup.string().required('Preencha o título'),
    descricao: Yup.string().required('Preencha a descrição'),
});

async function onSubmit(values) {
    try {
        var msg;
        var r;
        if (id&&tempAxes.value.id) {
            r = await AxesStore.update(tempAxes.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await AxesStore.insert(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            await router.push('/eixos');
            alertStore.success(msg);
        }
    } catch (error) {
        alertStore.error(error);
    }
}

async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?','/eixos');
}
async function checkDelete(id) {
    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await AxesStore.delete(id)) router.push('/eixos')},'Remover');
}

</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="!(tempAxes?.loading || tempAxes?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="tempAxes" v-slot="{ errors, isSubmitting }">
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">PdM <span class="tvermelho">*</span></label>
                        <Field name="pdm_id" as="select" class="inputtext light mb1" :class="{ 'error': errors.pdm_id }">
                            <option value="">Selecionar</option>
                            <template v-if="PdM.length">
                                <option v-for="type in PdM" :key="type.id" :value="type.id" :selected="pdm_id&&type.id==pdm_id">{{ type.descricao }}</option>
                            </template>
                        </Field>
                        <div class="error-msg">{{ errors.pdm_id }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Eixo Temático <span class="tvermelho">*</span></label>
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
        <template v-if="tempAxes.id">
            <button @click="checkDelete(tempAxes.id)" class="btn amarelo big">Remover item</button>
        </template>
        <template v-if="tempAxes?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="tempAxes?.error||error">
            <div class="error p1">
                <div class="error-msg">{{tempAxes.error??error}}</div>
            </div>
        </template>
    </Dashboard>
</template>
