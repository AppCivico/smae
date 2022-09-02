<script setup>
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useStrategicObjectivesStore/*, usePdMStore*/ } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;

const strategicObjectivesStore = useStrategicObjectivesStore();
const { tempStrategicObjectives } = storeToRefs(strategicObjectivesStore);
strategicObjectivesStore.clear();

/*const PdMStore = usePdMStore();
const { PdM } = storeToRefs(PdMStore);
PdMStore.getAll();*/

var virtualAxes;
let title = 'Cadastro de Objetivo Estratégico';
if (id) {
    title = 'Editar Objetivo Estratégico';
    strategicObjectivesStore.getById(id);
}else{
    virtualAxes = {pdm_id: route.params.pdm_id};
}

const schema = Yup.object().shape({
    descricao: Yup.string().required('Preencha a descrição'),
    pdm_id: Yup.string().required('Selecione um PdM'),
});

async function onSubmit(values) {
    try {
        var msg;
        var r;
        if (id&&tempStrategicObjectives.value.id) {
            r = await strategicObjectivesStore.update(tempStrategicObjectives.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await strategicObjectivesStore.insert(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            await router.push('/pdm');
            alertStore.success(msg);
        }
    } catch (error) {
        alertStore.error(error);
    }
}

async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?','/pdm');
}
async function checkDelete(id) {
    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await strategicObjectivesStore.delete(id)) router.push('/pdm')},'Remover');
}

</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="!(tempStrategicObjectives?.loading || tempStrategicObjectives?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="tempStrategicObjectives.pdm_id&&id?tempStrategicObjectives:virtualAxes" v-slot="{ errors, isSubmitting }">
                <Field name="pdm_id" type="hidden" :value="pdm_id" /><div class="error-msg">{{ errors.pdm_id }}</div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Objetivo Estratégico <span class="tvermelho">*</span></label>
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
        <template v-if="tempStrategicObjectives.id">
            <button @click="checkDelete(tempStrategicObjectives.id)" class="btn amarelo big">Remover item</button>
        </template>
        <template v-if="tempStrategicObjectives?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="tempStrategicObjectives?.error||error">
            <div class="error p1">
                <div class="error-msg">{{tempStrategicObjectives.error??error}}</div>
            </div>
        </template>
    </Dashboard>
</template>
