<script setup>
import { ref } from 'vue';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { useAlertStore, useEditModalStore, useRegionsStore, useCronogramasStore, useEtapasStore } from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;
const atividade_id = route.params.atividade_id;
const cronograma_id = route.params.cronograma_id;
const etapa_id = route.params.etapa_id;
const fase_id = route.params.fase_id;
const subfase_id = route.params.subfase_id;

const props = defineProps(['props']);
let group = ref(props?.props?.group);

const parentVar = atividade_id??iniciativa_id??meta_id??false;
const parentField = atividade_id?'atividade_id':iniciativa_id?'iniciativa_id':meta_id?'meta_id':false;
const currentEdit = route.path.slice(0,route.path.indexOf('/cronograma')+11);

const CronogramasStore = useCronogramasStore();
const { singleCronograma } = storeToRefs(CronogramasStore);
if(cronograma_id&&(!singleCronograma?.value?.id || singleCronograma?.value.id!=cronograma_id)){
    CronogramasStore.getById(parentVar,parentField,cronograma_id);
}

const EtapasStore = useEtapasStore();
const { singleEtapa } = storeToRefs(EtapasStore);

const RegionsStore = useRegionsStore();
const { tempRegions } = storeToRefs(RegionsStore);

let title = ref(`Adicionar ${group.value}`);
let level1 = ref(null);
let level2 = ref(null);
let level3 = ref(null);
let regiao_id_mount = ref(null);

let currentParent = group.value=='subfase' ? fase_id : etapa_id;
let currentId = group.value=='subfase' ? subfase_id : fase_id;
let currentFase = ref({});
let oktogo = ref(0);
let minLevel = ref(0);
(async()=>{
    await EtapasStore.getById(cronograma_id,etapa_id);
    var p1;
    var noregion = true;
    if(group.value=='subfase'&&subfase_id){
        title.value = `Editar subfase`;
        p1 = await singleEtapa.value.etapa?.etapa_filha?.find(x=>x.id==fase_id)??{};
        var p2 = p1?.etapa_filha?.find(x=>x.id==subfase_id)??{};
        currentFase.value = p2.id ? p2 : {error: 'Subfase não encontrada'};
        if(p1?.regiao_id){
            getRegionByParent(p1.regiao_id,p2?.regiao_id);
            noregion = false;
        }

    }else if(group.value=='subfase'){
        title.value = `Adicionar subfase`;
        p1 = await singleEtapa.value.etapa?.etapa_filha?.find(x=>x.id==fase_id)??{};
        if(p1?.regiao_id){
            getRegionByParent(p1.regiao_id);
            noregion = false;
        }

    }else if(group.value=='fase'&&fase_id){
        title.value = `Editar ${group.value}`;
        p1 = await singleEtapa.value.etapa?.etapa_filha?.find(x=>x.id==fase_id)??{};
        currentFase.value = p1.id ? p1 : {error: 'Fase não encontrada'};
        if(p1?.regiao_id){
            getRegionByParent(singleEtapa.value.etapa.regiao_id,p1?.regiao_id);
            noregion = false;
        }
    }
    if(noregion && singleEtapa.value?.etapa?.regiao_id) getRegionByParent(singleEtapa.value.etapa.regiao_id);
    oktogo.value = 1;
})();


var regx = /^$|^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;

const schema = Yup.object().shape({
    regiao_id: Yup.string().nullable(),
    
    titulo: Yup.string().required('Preencha o título'),
    descricao: Yup.string().nullable(),
    ordem: Yup.string().nullable(),
    peso: Yup.string().nullable(),
    
    inicio_previsto: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'),
    termino_previsto: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'),
    inicio_real: Yup.string().nullable().matches(regx,'Formato inválido'),
    termino_real: Yup.string().nullable().matches(regx,'Formato inválido'),
});

async function getRegionByParent(r_id,cur){
    await RegionsStore.filterRegions({id: r_id});
    level1.value = tempRegions.value[0]?.children[0].index!==undefined?tempRegions.value[0]?.children[0].id:'';
    if(level1.value){ 
        minLevel.value = 1; 
    }else if(cur){
        level1.value=cur;
    }
    level2.value = tempRegions.value[0]?.children[0]?.children[0].index!==undefined?tempRegions.value[0]?.children[0]?.children[0].id:'';
    if(level2.value){ 
        minLevel.value = 2; 
    }else if(cur&&cur!=level1.value){
        level2.value=cur;
    }
    level3.value = tempRegions.value[0]?.children[0]?.children[0]?.children[0].index!==undefined?tempRegions.value[0]?.children[0]?.children[0]?.children[0].id:'';
    if(level3.value){ 
        minLevel.value = 3; 
    }else if(cur&&cur!=level2.value){
        level3.value=cur;
    }
    lastlevel();
}

async function onSubmit(values) {
    try {
        var msg;
        var r;


        values.regiao_id = singleCronograma.value.regionalizavel&&Number(values.regiao_id)? Number(values.regiao_id):null;
        values.ordem = Number(values.ordem)??null;
        values.peso = Number(values.peso)??null;
        values.etapa_pai_id = currentParent;

        var rota = false;
        var etapa_id_gen = null;
        if (currentId) {
            if(currentFase.value.id==currentId){
                r = await EtapasStore.update(currentId, values);
                msg = 'Dados salvos com sucesso!';
                rota = currentEdit;
                etapa_id_gen = currentId;

                if(values.ordem!=currentFase.value.ordem){
                    EtapasStore.monitorar({
                        cronograma_id: Number(cronograma_id),
                        etapa_id: Number(etapa_id_gen),
                        inativo: false,
                        ordem: Number(values.ordem)??null
                    });
                }
            }
        } else {
            r = await EtapasStore.insert(Number(cronograma_id),values);
            msg = 'Item adicionado com sucesso!';
            rota = currentEdit;
            etapa_id_gen = r;
        }

        if(r){
            EtapasStore.clear();
            CronogramasStore.clear();
            (async()=>{
                await EtapasStore.getAll(cronograma_id);
                CronogramasStore.getById(parentVar,parentField,cronograma_id);
            })();
            
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
function lastlevel() {
    var r;
    if(level1.value){ r= tempRegions.value[0]?.children.find(x=>x.id==level1.value)?.id; }
    if(level1.value&&level2.value){ r= tempRegions.value[0]?.children.find(x=>x.id==level1.value)?.children.find(x=>x.id==level2.value)?.id; }
    if(level1.value&&level2.value&&level3.value){ r= tempRegions.value[0]?.children.find(x=>x.id==level1.value)?.children.find(x=>x.id==level2.value)?.children.find(x=>x.id==level3.value)?.id; }
    regiao_id_mount.value = r;
}
function maskDate(el){
    var kC = event.keyCode;
    var data = el.target.value.replace(/[^0-9/]/g,'');
    if( kC!=8 && kC!=46 ){
        if( data.length==2 ){
            el.target.value = data += '/';
        }else if( data.length==5 ){
            el.target.value = data += '/';
        }else{
            el.target.value = data;
        }
    }
}
</script>
<template>
    <div class="minimodal">
        <div class="flex spacebetween center mb2">
            <h2>{{title}}</h2>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="!(currentFase?.loading || currentFase?.error)&&oktogo">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="currentFase" v-slot="{ errors, isSubmitting }">
                <div>
                    <label class="label">Nome <span class="tvermelho">*</span></label>
                    <Field name="titulo" type="text" class="inputtext light mb1" :class="{ 'error': errors.titulo }" />
                    <div class="error-msg">{{ errors.titulo }}</div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Peso</label>
                        <Field name="peso" type="number" class="inputtext light mb1" :class="{ 'error': errors.peso }" />
                        <div class="error-msg">{{ errors.peso }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Ordem</label>
                    <Field name="ordem" type="text" class="inputtext light mb1" :class="{ 'error': errors.ordem }" />
                        <div class="error-msg">{{ errors.ordem }}</div>
                    </div>
                </div>
                <div>
                    <label class="label">Descrição</label>
                    <Field name="descricao" as="textarea" rows="3" class="inputtext light mb1" :class="{ 'error': errors.descricao }" />
                    <div class="error-msg">{{ errors.descricao }}</div>
                </div>

                <div v-if="singleCronograma.regionalizavel&&tempRegions.length">
                        
                    <label class="label">Região</label>
                        <select class="inputtext light mb1" v-model="level1" @change="lastlevel" :disabled="minLevel>=1">
                            <option value="">Selecione</option>
                            <option v-for="(r) in tempRegions[0]?.children" :key="r.id" :value="r.id">{{r.descricao}}</option>
                        </select>
                        <template v-if="level1!==null">
                            <select class="inputtext light mb1" v-model="level2" @change="lastlevel" :disabled="minLevel>=2">
                                <option value="">Selecione</option>
                                <option v-for="(rr) in tempRegions[0]?.children.find(x=>x.id==level1)?.children" :key="rr.id" :value="rr.id">{{rr.descricao}}</option>
                            </select>
                            <template v-if="level2!==null">
                                <select class="inputtext light mb1" v-model="level3" @change="lastlevel" :disabled="minLevel>=3">
                                    <option value="">Selecione</option>
                                    <option v-for="(rrr) in tempRegions[0]?.children.find(x=>x.id==level1)?.children.find(x=>x.id==level2)?.children" :key="rrr.id" :value="rrr.id">{{rrr.descricao}}</option>
                                </select>
                            </template>
                            <template v-else>
                                <input class="inputtext light mb1" type="text" disabled value="Selecione uma subprefeitura">
                            </template>
                        </template>
                        <template v-else>
                            <input class="inputtext light mb1" type="text" disabled value="Selecione uma região">
                        </template>
                    <Field name="regiao_id" v-model="regiao_id_mount" type="hidden" :class="{ 'error': errors.regiao_id }"/>
                    <div class="error-msg">{{ errors.regiao_id }}</div>
                </div>

                <hr class="mt2 mb2" />

                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Início previsto <span class="tvermelho">*</span></label>
                        <Field name="inicio_previsto" type="text" class="inputtext light mb1" :class="{ 'error': errors.inicio_previsto }" maxlength="10" @keyup="maskDate" />
                        <div class="error-msg">{{ errors.inicio_previsto }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Término previsto <span class="tvermelho">*</span></label>
                        <Field name="termino_previsto" type="text" class="inputtext light mb1" :class="{ 'error': errors.termino_previsto }" maxlength="10" @keyup="maskDate" />
                        <div class="error-msg">{{ errors.termino_previsto }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Início real</label>
                        <Field name="inicio_real" type="text" class="inputtext light mb1" :class="{ 'error': errors.inicio_real }" maxlength="10" @keyup="maskDate" />
                        <div class="error-msg">{{ errors.inicio_real }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Término real</label>
                        <Field name="termino_real" type="text" class="inputtext light mb1" :class="{ 'error': errors.termino_real }" maxlength="10" @keyup="maskDate" />
                        <div class="error-msg">{{ errors.termino_real }}</div>
                    </div>
                </div>

                <div class="flex spacebetween center mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" type="submit" :disabled="isSubmitting">Salvar</button>
                    <hr class="ml2 f1"/>
                </div>
            </Form>
        </template>
        <template v-if="currentFase?.loading||!oktogo">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="currentFase?.error||error">
            <div class="error p1">
                <div class="error-msg">{{currentFase.error??error}}</div>
            </div>
        </template>
    </div>
</template>
