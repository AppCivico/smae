<script setup>
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useRegionsStore } from '@/stores';

const props = defineProps(['type']);
const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;
const id2 = route.params.id2;
const id3 = route.params.id3;

const regionsStore = useRegionsStore();
const { tempRegions } = storeToRefs(regionsStore);
regionsStore.clear();

var title1, title2, level, parentID, lastid;

if(props.type=='editar'){
    title1 = 'Editar';
    title2 = 'Região';
    level = 0;
    lastid;
    parentID;

    if (id) {
        title2 = 'Região';
        lastid = id;
        level++;
    }
    if (id2) {
        title2 = 'Subprefeitura';
        lastid = id2;
        parentID = id;
        level++;
    }
    if (id3) {
        title2 = 'Distrito';
        lastid = id3;
        parentID = id2;
        level++;
    }

    if(props.type=='editar'){
        regionsStore.getById(lastid);
    }

}else{
    title1 = 'Cadastro de';
    title2 = 'Região';
    level = 1;
    parentID;

    if (id) {
        title2 = 'Subprefeitura';
        lastid = id;
        parentID = id;
        level++;
    }
    if (id2) {
        title2 = 'Distrito';
        lastid = id2;
        parentID = id2;
        level++;
    }
}


const schema = Yup.object().shape({
    nivel: Yup.number(),
    parente_id: Yup.number().nullable(),
    descricao: Yup.string().required('Preencha a descrição'),
    shapefile: Yup.string().nullable(),
});

async function onSubmit(values) {
    try {
        var msg;
        var r;
        if (tempRegions.value.id) {
            r = await regionsStore.update(tempRegions.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await regionsStore.insert(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            await router.push('/regioes');
            alertStore.success(msg);
        }
    } catch (error) {
        alertStore.error(error);
    }
}

async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?','/regioes');
}
async function checkDelete(id) {
    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await regionsStore.delete(id)) router.push('/regioes')},'Remover');
}

</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>{{title1}} {{title2}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="!(tempRegions?.loading || tempRegions?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="tempRegions" v-slot="{ errors, isSubmitting }">
                <Field name="nivel" type="hidden" :value="level" /><div class="error-msg">{{ errors.nivel }}</div>
                <Field name="parente_id" type="hidden" :value="parentID" /><div class="error-msg">{{ errors.parente_id }}</div>

                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Descrição <span class="tvermelho">*</span></label>
                        <Field name="descricao" type="text" class="inputtext light mb1" :class="{ 'error': errors.descricao }" />
                        <div class="error-msg">{{ errors.descricao }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Shapefile</label>
                        <Field name="shapefile" type="text" class="inputtext light mb1" :class="{ 'error': errors.shapefile }" />
                        <div class="error-msg">{{ errors.shapefile }}</div>
                    </div>
                </div>
                <div class="flex spacebetween center mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">Salvar</button>
                    <hr class="ml2 f1"/>
                </div>
            </Form>
        </template>
        <template v-if="tempRegions.id">
            <button @click="checkDelete(tempRegions.id)" class="btn amarelo big">Remover item</button>
        </template>
        <template v-if="tempRegions?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="tempRegions?.error||error">
            <div class="error p1">
                <div class="error-msg">{{tempRegions.error??error}}</div>
            </div>
        </template>
    </Dashboard>
</template>
