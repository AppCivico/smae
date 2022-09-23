<script setup>
import { ref, unref } from 'vue';
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useAuthStore, useMetasStore, useIniciativasStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;
var oktogo = ref(0);

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
IniciativasStore.clearEdit();

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
MetasStore.getPdM();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const orgaos_participantes = ref([
    {orgao_id:null, responsavel:true, participantes:[], busca:''}
]);
const coordenadores_cp = ref({participantes:[], busca:''});

const virtualParent = ref({});
let title = 'Cadastro de Iniciativa';
if (iniciativa_id) {
    title = 'Editar Iniciativa';
    (async()=>{
        await IniciativasStore.getById(meta_id,iniciativa_id);
        if(singleIniciativa.value.orgaos_participantes){
            orgaos_participantes.value.splice(0,orgaos_participantes.value.length);
            singleIniciativa.value.orgaos_participantes.map(x=>{
                x.orgao_id = x.orgao.id;
                x.busca = "";
                x.orgao = x.orgao;
                x.participantes = x.participantes.map(y=>y.id);
                return x;
            }).forEach(x=>orgaos_participantes.value.push(x));
        }
        if(singleIniciativa.value.coordenadores_cp){
            coordenadores_cp.value.participantes = singleIniciativa.value.coordenadores_cp.map(x=>x.id);
        }
    })();
}

const organsAvailable = ref([]);
const usersAvailable = ref({});
const coordsAvailable = ref([]);
(async()=>{
    if(!singleMeta?.id || singleMeta.id!=meta_id) await MetasStore.getById(meta_id);
    
    singleMeta.value.orgaos_participantes.forEach(x=>{
        x.orgao_id = x.orgao.id;
        organsAvailable.value.push(x);
        if(!usersAvailable.value[x.orgao_id]) usersAvailable.value[x.orgao_id] = [];
        usersAvailable.value[x.orgao_id] = usersAvailable.value[x.orgao_id].concat(x.participantes);
    });
    singleMeta.value.coordenadores_cp.forEach(x=>{
        coordsAvailable.value.push(x);
    })

    oktogo.value = true;
})();

const schema = Yup.object().shape({
    codigo: Yup.string().required('Preencha o código'),
    titulo: Yup.string().required('Preencha o titulo'),
    contexto: Yup.string().nullable(),
    complemento: Yup.string().nullable(),

    meta_id: Yup.string().nullable(),
    compoe_indicador_meta: Yup.string().nullable(),
});

function addOrgao(obj,r) {
    obj.push({orgao_id:null, responsavel:r??false, participantes:[], busca:''});
}
function removeOrgao(obj,i) {
    obj.splice(i,1);
}
function removeParticipante(item,p) {
    item.participantes.splice(item.participantes.indexOf(p),1);
}
async function onSubmit(values) {
    try {
        var er = [];
        values.orgaos_participantes = unref(orgaos_participantes);
        values.orgaos_participantes = values.orgaos_participantes.filter(x=>{
            if(x.orgao_id && !x.participantes.length) er.push('Selecione pelo menos um responsável para o órgão.');
            return x.orgao_id;
        });

        values.coordenadores_cp = coordenadores_cp.value.participantes;
        if(!values.coordenadores_cp.length) er.push('Selecione pelo menos um responsável para a coordenadoria.');
        
        if(!values.meta_id)values.meta_id = meta_id;
        values.compoe_indicador_meta = values.compoe_indicador_meta?true:false;

        if(er.length) throw er.join('<br />');

        var msg;
        var r;
        if (iniciativa_id&&singleIniciativa.value.id) {
            r = await IniciativasStore.update(singleIniciativa.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await IniciativasStore.insert(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            IniciativasStore.clear();
            await router.push(`/metas/${meta_id}`);
            alertStore.success(msg);
        }
    } catch (error) {
        alertStore.error(error);
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?',`/metas/${meta_id}`);
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
function pushId(e,id) {
    e.push(id);
    e = [...new Set(e)];
}
function filterResponsible(orgao_id) {
    var r = usersAvailable.value[orgao_id] ?? [];
    return r.length ? r : [];
}
function buscaResponsible(e,item) {
    e.preventDefault();
    e.stopPropagation();
    if (e.keyCode === 13) {
        var i = filterResponsible(item.orgao_id).find(x=>!item.participantes.includes(x.id)&&x.nome_exibicao.toLowerCase().includes(item.busca.toLowerCase()));
        if(i) pushId(item.participantes,i.id);
        item.busca="";
    }
}
function buscaCoord(e,item) {
    e.preventDefault();
    e.stopPropagation();
    if (e.keyCode === 13) {
        var i = coordsAvailable.find(x=>!item.participantes.includes(x.id)&&x.nome_exibicao.toLowerCase().includes(item.busca.toLowerCase()));
        if(i) pushId(item.participantes,i.id);
        item.busca="";
    }
}
</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <div>
                <h1>{{title}}</h1>
                <div class="t24">Meta {{singleMeta.titulo}}</div>
            </div>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="oktogo&&!(singleIniciativa?.loading || singleIniciativa?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="iniciativa_id?singleIniciativa:virtualParent" v-slot="{ errors, isSubmitting }">
                <hr class="mt2 mb2"/>
                <div class="flex g2">
                    <div class="f0" style="flex-basis: 100px;">
                        <label class="label">Código <span class="tvermelho">*</span></label>
                        <Field name="codigo" type="text" class="inputtext light mb1" maxlength="30" :class="{ 'error': errors.codigo }" />
                        <div class="error-msg">{{ errors.codigo }}</div>
                    </div>
                    <div class="f2">
                        <label class="label">Título <span class="tvermelho">*</span></label>
                        <Field name="titulo" type="text" class="inputtext light mb1" :class="{ 'error': errors.titulo }" />
                        <div class="error-msg">{{ errors.titulo }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Contexto</label>
                        <Field name="contexto" as="textarea" rows="3" class="inputtext light mb1" :class="{ 'error': errors.contexto }" />
                        <div class="error-msg">{{ errors.contexto }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Complemento</label>
                        <Field name="complemento" as="textarea" rows="3" class="inputtext light mb1" :class="{ 'error': errors.complemento }" />
                        <div class="error-msg">{{ errors.complemento }}</div>
                    </div>
                </div>

                <div class="mb1 mt1">
                    <label class="block">
                        <Field name="compoe_indicador_meta" v-model="compoe_indicador_meta" type="checkbox" value="1" class="inputcheckbox" /><span :class="{ 'error': errors.compoe_indicador_meta }">Compõe o Indicador da meta</span>
                    </label>
                    <div class="error-msg">{{ errors.compoe_indicador_meta }}</div>
                </div>

                <hr class="mt2 mb2"/>

                <label class="label">Órgãos participantes <span class="tvermelho">*</span></label>
                <div class="flex center g2">
                    <label class="f1 label tc300">Órgão</label>
                    <label class="f1 label tc300">Responsável(eis)</label>
                    <div style="flex-basis: 30px;"></div>
                </div>
                <template v-for="(item, index) in orgaos_participantes">
                    <div class="flex mb1 g2">
                        <div class="f1">
                            <select v-model="item.orgao_id" class="inputtext" @change="item.participantes=[]" v-if="organsAvailable.length">
                                <option v-for="(o,k) in organsAvailable.filter(a=>a.orgao_id==item.orgao_id||!orgaos_participantes.map(b=>b.orgao_id).includes(a.orgao_id))" :value="o.orgao_id">{{o.orgao.descricao}}</option>
                            </select>
                        </div>
                        <div class="f1">
                            <div class="suggestion search">
                                <input type="text" v-model="item.busca" @keyup.enter.stop.prevent="buscaResponsible($event,item)" class="inputtext light mb05">
                                <ul>
                                    <li v-if="item.orgao_id" v-for="(r,k) in filterResponsible(item.orgao_id).filter(x=>!item.participantes.includes(x.id)&&x.nome_exibicao.toLowerCase().includes(item.busca.toLowerCase()))"><a @click="pushId(item.participantes,r.id)" tabindex="1">{{r.nome_exibicao}}</a></li>
                                </ul>
                            </div>
                            <span class="tagsmall" v-for="(p,k) in filterResponsible(item.orgao_id).filter(x=>item.participantes.includes(x.id))" @click="removeParticipante(item,p.id)">{{p.nome_exibicao}}<svg width="12" height="12"><use xlink:href="#i_x"></use></svg></span>
                        </div>
                        <div style="flex-basis: 30px;">
                            <a v-if="index" @click="removeOrgao(orgaos_participantes,index)" class="addlink mt1"><svg width="20" height="20"><use xlink:href="#i_remove"></use></svg></a>        
                        </div>
                    </div>
                </template>
                <a @click="addOrgao(orgaos_participantes,true)" class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar orgão participante</span></a>
                
                <hr class="mt2 mb2"/>

                <label class="label">Responsável(eis) na coordenadoria de projetos da Meta* <span class="tvermelho">*</span></label>
                <div class="flex">
                    <div class="f1" v-if="coordsAvailable.length">
                        <div class="suggestion search">
                            <input type="text" v-model="coordenadores_cp.busca" @keyup.enter.stop.prevent="buscaCoord($event,coordenadores_cp)" class="inputtext light mb05">
                            <ul>
                                <li v-for="(r,k) in coordsAvailable.filter(x=>!coordenadores_cp.participantes.includes(x.id)&&x.nome_exibicao.toLowerCase().includes(coordenadores_cp.busca.toLowerCase()))"><a @click="pushId(coordenadores_cp.participantes,r.id)" tabindex="1">{{r.nome_exibicao}}</a></li>
                            </ul>
                        </div>
                        <span class="tagsmall" v-for="(p,k) in coordsAvailable.filter(x=>coordenadores_cp.participantes.includes(x.id))" @click="removeParticipante(coordenadores_cp,p.id)">{{p.nome_exibicao}}<svg width="12" height="12"><use xlink:href="#i_x"></use></svg></span>
                    </div>
                </div>

                <div class="flex spacebetween center mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">Salvar</button>
                    <hr class="ml2 f1"/>
                </div>
            </Form>
        </template>
        
        <template v-if="singleMeta?.loading||!oktogo">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="singleMeta?.error||error">
            <div class="error p1">
                <div class="error-msg">{{singleMeta.error??error}}</div>
            </div>
        </template>
    </Dashboard>
</template>
