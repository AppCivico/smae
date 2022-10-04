<script setup>
import { ref } from 'vue';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { useAlertStore, useEditModalStore, useRegionsStore, useMetasStore, useIniciativasStore, useAtividadesStore, useCronogramasStore, useEtapasStore } from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;
const atividade_id = route.params.atividade_id;
const cronograma_id = route.params.cronograma_id;
const etapa_id = route.params.etapa_id;

const currentEdit = route.path.slice(0,route.path.indexOf('/etapas'));

const MetasStore = useMetasStore();
const { singleMeta } = storeToRefs(MetasStore);
if(!singleMeta?.id || singleMeta.id!=meta_id) MetasStore.getById(meta_id);

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
if(iniciativa_id)IniciativasStore.getById(meta_id,iniciativa_id);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);
if(atividade_id)AtividadesStore.getById(iniciativa_id,atividade_id);

const CronogramasStore = useCronogramasStore();
const { singleCronograma } = storeToRefs(CronogramasStore);
if(cronograma_id&&(!singleCronograma?.id || singleCronograma.id!=cronograma_id)){
    if(atividade_id){
        CronogramasStore.getById(atividade_id,'atividade_id',cronograma_id);
    }else if(iniciativa_id){
        CronogramasStore.getById(iniciativa_id,'iniciativa_id',cronograma_id);
    }else{
        CronogramasStore.getById(meta_id,'meta_id',cronograma_id);
    }
}
//CronogramasStore.getFakeData();

let lastParent = ref({});
if(atividade_id){
    lastParent = singleAtividade.value;
}else if(iniciativa_id){
    lastParent = singleIniciativa.value;
}else{
    lastParent = singleMeta.value;
}

const EtapasStore = useEtapasStore();
const { singleMonitoramento } = storeToRefs(EtapasStore);
EtapasStore.clearEdit();

let title = 'Monitorar etapa';
const virtualParent = ref({});
if(etapa_id){
    title = 'Editar monitoramento de etapa';
    if(!singleMonitoramento.value.id) EtapasStore.getMonitoramento(cronograma_id,etapa_id);
}

const schema = Yup.object().shape({
    etapa_id: Yup.string().required('Selecione a etapa'),
    inativo: Yup.string().nullable(),
    ordem: Yup.string().nullable(),
});

async function onSubmit(values) {
    try {
        var msg;
        var r;
        var rota;

        r = await EtapasStore.monitorar(cronograma_id,values.etapa_id,values);
        msg = 'Monitorando etapa';
        rota = currentEdit;
        if(r){
            EtapasStore.clear();
            EtapasStore.getAll(cronograma_id);
            alertStore.success(msg);
            editModalStore.clear();
            if(rota)router.push(rota);
        }

    } catch (error) {
        alertStore.error(error);
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?',()=>{ 
        editModalStore.clear();
        alertStore.clear();
        router.go(-1);
    });
}
</script>
<template>
    <div class="flex spacebetween center mb2">
        <h2>{{title}}</h2>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <template v-if="!(singleMonitoramento?.loading || singleMonitoramento?.error)&&singleCronograma?.id">
        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="etapa_id?singleMonitoramento:virtualParent" v-slot="{ errors, isSubmitting }">

            <div class="mb2">
                <label class="block">
                    <Field name="inativo" v-model="inativo" type="checkbox" value="1" class="inputcheckbox" />
                    <span :class="{ 'error': errors.inativo }">Monitoramento inativo</span>
                </label>
                <div class="error-msg">{{ errors.inativo }}</div>
            </div>

            <div class="flex g2">
                <div class="f1">
                    <label class="label">Ordem</label>
                    <Field name="ordem" type="text" class="inputtext light mb1" :class="{ 'error': errors.ordem }" />
                    <div class="error-msg">{{ errors.ordem }}</div>
                </div>
            </div>

            <div class="flex spacebetween center mb2">
                <hr class="mr2 f1"/>
                <button class="btn big" :disabled="isSubmitting">Salvar</button>
                <hr class="ml2 f1"/>
            </div>
        </Form>
    </template>
    <template v-if="singleMonitoramento?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-if="singleMonitoramento?.error||error">
        <div class="error p1">
            <div class="error-msg">{{singleMonitoramento.error??error}}</div>
        </div>
    </template>
</template>
