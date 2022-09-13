<script setup>
import { reactive, onServerPrefetch } from 'vue';
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { requestS } from '@/helpers';

import { useAlertStore, useEditModalStore, useRegionsStore } from '@/stores';

const baseUrl = `${import.meta.env.VITE_API_URL}`;
const ps = defineProps(['props']);
const props = ps.props;
const alertStore = useAlertStore();
const editModalStore = useEditModalStore();
const route = useRoute();
const id = route.params.id;
const id2 = route.params.id2;
const id3 = route.params.id3;
const id4 = route.params.id4;


const regionsStore = useRegionsStore();
regionsStore.clearEdit();
const { singleTempRegions } = storeToRefs(regionsStore);

var title1, title2, level, parentID, lastid;
const curfile = reactive({});

if(props.type=='editar'){
    title1 = 'Editar';
    title2 = 'Município';
    level = 0;
    lastid;
    parentID;

    if (id) {
        title2 = 'Município';
        lastid = id;
        level++;
    }
    if (id2) {
        title2 = 'Região';
        lastid = id2;
        parentID = id;
        level++;
    }
    if (id3) {
        title2 = 'Subprefeitura';
        lastid = id3;
        parentID = id2;
        level++;
    }
    if (id4) {
        title2 = 'Distrito';
        lastid = id4;
        parentID = id3;
        level++;
    }

    if(props.type=='editar'){
        regionsStore.getById(lastid);
        curfile.name = singleTempRegions.value.shapefile;
    }

}else{
    title1 = 'Cadastro de';
    title2 = 'Município';
    level = 1;
    parentID;

    if (id) {
        title2 = 'Região';
        lastid = id;
        parentID = id;
        level++;
    }
    if (id2) {
        title2 = 'Subprefeitura';
        lastid = id2;
        parentID = id2;
        level++;
    }
    if (id3) {
        title2 = 'Distrito';
        lastid = id3;
        parentID = id3;
        level++;
    }
}

const schema = Yup.object().shape({
    nivel: Yup.number(),
    parente_id: Yup.number().nullable(),
    descricao: Yup.string().required('Preencha a descrição'),
    upload_shapefile: Yup.string().nullable(),
});

async function onSubmit(values) {
    try {
        var msg;
        var r;
        if (singleTempRegions.value.id) {
            r = await regionsStore.update(singleTempRegions.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await regionsStore.insert(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            regionsStore.filterRegions();
            await router.push('/regioes');
            alertStore.success(msg);
            editModalStore.clear();
        }
    } catch (error) {
        alertStore.error(error);
    }
}

async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?',()=>{ editModalStore.clear(); alertStore.clear(); router.push('/regioes'); });
}
async function checkDelete(id) {
    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await regionsStore.delete(id)){regionsStore.filterRegions(); editModalStore.clear(); router.push('/regioes');}},'Remover');
}
function removeshape(t) {
    curfile.name = '';
    curfile.loading = null;
    singleTempRegions.value.upload_shapefile = curfile.name;
}
async function uploadshape(e){
    curfile.name= '';
    curfile.loading = true;

    const files = e.target.files;
    const formData = new FormData();
    formData.append('tipo', 'SHAPEFILE');
    formData.append('arquivo', files[0]);

    let u = await requestS.upload(`${baseUrl}/upload`, formData)
    if(u.upload_token){
        curfile.name= u.upload_token;
        curfile.loading = null;
        singleTempRegions.value.upload_shapefile = curfile.name;
    }
}

</script>

<template>
    <div class="flex spacebetween center mb2">
        <h2>{{title1}} {{title2}}</h2>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <template v-if="!(singleTempRegions?.loading || singleTempRegions?.error)">
        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="singleTempRegions" v-slot="{ errors, isSubmitting }">
            <Field name="nivel" type="hidden" :value="level" /><div class="error-msg">{{ errors.nivel }}</div>
            <Field name="parente_id" type="hidden" :value="parentID" /><div class="error-msg">{{ errors.parente_id }}</div>

            <div class="flex g2">
                <div class="f1">
                    <label class="label">Descrição <span class="tvermelho">*</span></label>
                    <Field name="descricao" type="text" class="inputtext light mb1" :class="{ 'error': errors.descricao }" />
                    <div class="error-msg">{{ errors.descricao }}</div>
                </div>
            </div>
            <div class="flex g2 mb2">
                <div class="f1">
                    <label class="label">Shapefile</label>
                    
                    <label v-if="!curfile.loading&&!curfile.name" class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar arquivo de shapefile ( formatos .KML, GeoJSON ou SHP até 2mb) *</span><input type="file" id="shapefile" accept=".kml,.geojson,.json,.shp,.zip" :onchange="uploadshape" style="display:none;"></label>
                    
                    <div v-else-if="curfile.loading" class="addlink"><span>Carregando</span> <svg width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
                    
                    <div v-else-if="curfile.name"><span>{{curfile?.name?.slice(0,30)}}</span> <a :onclick="removeshape" class="addlink"><svg width="20" height="20"><use xlink:href="#i_remove"></use></svg></a></div>
                    <Field name="upload_shapefile" type="hidden" :value="curfile?.name"/>
                </div>
            </div>
            <div class="flex spacebetween center mb2">
                <hr class="mr2 f1"/>
                <button class="btn big" :disabled="isSubmitting">Salvar</button>
                <hr class="ml2 f1"/>
            </div>
        </Form>
    </template>
    <template v-if="singleTempRegions.id">
        <button @click="checkDelete(singleTempRegions.id)" class="btn amarelo big">Remover item</button>
    </template>
    <template v-if="singleTempRegions?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-if="singleTempRegions?.error||error">
        <div class="error p1">
            <div class="error-msg">{{singleTempRegions.error??error}}</div>
        </div>
    </template>
</template>
