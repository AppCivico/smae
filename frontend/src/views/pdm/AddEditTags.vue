<script setup>
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useEditModalStore, useTagsStore, usePdMStore, useODSStore } from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;

const TagsStore = useTagsStore();
const { tempTags } = storeToRefs(TagsStore);
TagsStore.clear();

const pdm_id = route.params.pdm_id;
const PdMStore = usePdMStore();
const { singlePdm } = storeToRefs(PdMStore);
if(!singlePdm.id || singlePdm.id != pdm_id) PdMStore.getById(pdm_id);

const ODSStore = useODSStore();
const { ODS } = storeToRefs(ODSStore);
ODSStore.getAll();

var virtualParent;
let title = 'Cadastro de Tag';
if (id) {
    title = 'Editar Tag';
    TagsStore.getById(id);
}else{
    virtualParent = {pdm_id: route.params.pdm_id};
}

const schema = Yup.object().shape({
    descricao: Yup.string().required('Preencha a descrição'),
    pdm_id: Yup.string(),
    ods_id: Yup.string().nullable(),
});


async function onSubmit(values) {
    try {
        var msg;
        var r;
        if (id&&tempTags.value.id) {
            r = await TagsStore.update(tempTags.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await TagsStore.insert(values);
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
    alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{if(await TagsStore.delete(id)){PdMStore.filterPdM(); editModalStore.clear(); router.push('/pdm');}},'Remover');
}

</script>

<template>
    <div class="flex spacebetween center mb2">
        <h2>{{title}}</h2>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <template v-if="!(tempTags?.loading || tempTags?.error)">
        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="tempTags.pdm_id&&id?tempTags:virtualParent" v-slot="{ errors, isSubmitting }">
            <Field name="pdm_id" type="hidden" :value="pdm_id" /><div class="error-msg">{{ errors.pdm_id }}</div>
            <div class="flex g2">
                <div class="f1">
                    <label class="label">ODS</label>
                    <Field name="ods_id" as="select" class="inputtext light mb1" :class="{ 'error': errors.ods_id }">
                        <option value="">Selecionar</option>
                        <template v-if="ODS.length">
                            <option v-for="type in ODS" :key="type.id" :value="type.id" :selected="ods_id&&type.id==ods_id">{{ type.titulo }}</option>
                        </template>
                    </Field>
                    <div class="error-msg">{{ errors.ods_id }}</div>
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
    <template v-if="tempTags.id">
        <button @click="checkDelete(tempTags.id)" class="btn amarelo big">Remover item</button>
    </template>
    <template v-if="tempTags?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-if="tempTags?.error||error">
        <div class="error p1">
            <div class="error-msg">{{tempTags.error??error}}</div>
        </div>
    </template>
</template>
