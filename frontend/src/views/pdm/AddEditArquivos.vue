<script setup>
import { reactive } from 'vue';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

import { useAlertStore, useEditModalStore, usePdMStore, useDocumentTypesStore } from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const pdm_id = route.params.pdm_id;

const props = defineProps(['props']);

const documentTypesStore = useDocumentTypesStore();
const { tempDocumentTypes } = storeToRefs(documentTypesStore);
documentTypesStore.clear();
documentTypesStore.filterDocumentTypes();

const PdMStore = usePdMStore();
const { singlePdm } = storeToRefs(PdMStore);
if(!singlePdm.value.id || singlePdm.value.id != pdm_id) PdMStore.getById(pdm_id);

let title = 'Adicionar arquivo';

const schema = Yup.object().shape({
    descricao: Yup.string().required('Preencha a descrição'),
    tipo_documento_id: Yup.string().nullable(),
    arquivo: Yup.string().required('Selecione um arquivo')
});

const curfile = reactive({});

async function onSubmit(values) {
    try {
        var msg;
        var r;

        curfile.loading = true;
        values.tipo = 'DOCUMENTO';
        const formData = new FormData();
        Object.entries(values).forEach(x=>{
            formData.append(x[0], x[1]);
        });

        let u = await requestS.upload(`${baseUrl}/upload`, formData)
        if(u.upload_token){
            r = await PdMStore.insertArquivo(pdm_id,{upload_token: u.upload_token});
            if(r == true){
                msg = 'Item adicionado com sucesso!';
                PdMStore.clearLoad();
                alertStore.success(msg);
                editModalStore.clear();
                if(props.props.parentPage=='pdm') PdMStore.filterPdM();
                await router.push('/'+props.props.parentPage);
                curfile.loading = false;
            }
        }else{
            curfile.loading = false;
        }

    } catch (error) {
        alertStore.error(error);
        curfile.loading = false;
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?',()=>{ 
        router.push('/'+props.props.parentPage);  
        editModalStore.clear(); 
        alertStore.clear(); 
    });
}
function addFile(e) {
    const files = e.target.files;
    curfile.name = files[0].name;
    curfile.file = files[0];
}
</script>

<template>
    <div class="flex spacebetween center mb2">
        <h2>{{title}}</h2>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <template v-if="!(singlePdm?.loading || singlePdm?.error)&&singlePdm.id&&!curfile?.loading">
        <Form @submit="onSubmit" :validation-schema="schema" v-slot="{ errors, isSubmitting }">
            <div class="flex g2">
                <div class="f1">
                    <label class="label">Descrição <span class="tvermelho">*</span></label>
                    <Field name="descricao" type="text" class="inputtext light mb1" :class="{ 'error': errors.descricao }" />
                    <div class="error-msg">{{ errors.descricao }}</div>
                </div>
                <div class="f1">
                    <label class="label">Tipo de Documento <span class="tvermelho">*</span></label>
                    <Field name="tipo_documento_id" as="select" class="inputtext light mb1" :class="{ 'error': errors.tipo_documento_id }">
                        <option value="">Selecione</option>
                        <option v-for="d in tempDocumentTypes" :key="d.id" :value="d.id">{{d.titulo}}</option>
                    </Field>
                    <div class="error-msg">{{ errors.tipo_documento_id }}</div>
                </div>
            </div>

            <div class="flex g2 mb2">
                <div class="f1">
                    <label class="label">Arquivo</label>
                    
                    <label v-if="!curfile.name" class="addlink" :class="{ 'error': errors.arquivo }"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg><span>Selecionar arquivo</span><input type="file" :onchange="addFile" style="display:none;"></label>
                            
                    <div v-else-if="curfile.name"><span>{{curfile?.name?.slice(0,30)}}</span> <a @click="curfile.name=''" class="addlink"><svg width="20" height="20"><use xlink:href="#i_remove"></use></svg></a></div>
                    <Field name="arquivo" type="hidden" v-model="curfile.file"/>
                    <div class="error-msg">{{ errors.arquivo }}</div>
                </div>
            </div>
            <div class="flex spacebetween center mb2">
                <hr class="mr2 f1"/>
                <button class="btn big" :disabled="isSubmitting">Salvar</button>
                <hr class="ml2 f1"/>
            </div>
        </Form>
    </template>
    <template v-if="singlePdm?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-if="curfile?.loading">
        <span class="spinner">Enviando o arquivo</span>
    </template>
    <template v-if="singlePdm?.error||error">
        <div class="error p1">
            <div class="error-msg">{{singlePdm.error??error}}</div>
        </div>
    </template>
</template>
