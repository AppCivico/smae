<script setup>
import { ref, unref } from 'vue';
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useAuthStore, useMetasStore, useOrgansStore, useUsersStore } from '@/stores';
import { useMacrotemasStore, useTemasStore, useSubtemasStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;
var oktogo = ref(0);

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
MetasStore.clear();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const orgaos_participantes = ref([
    {orgao_id:null, responsavel:true, participantes:[], busca:''},
    {orgao_id:null, responsavel:false, participantes:[], busca:''}
]);
const coordenadores_cp = ref({participantes:[], busca:''});

const virtualParent = ref({});
let title = 'Cadastro de Meta';
if (id) {
    title = 'Editar Meta';
    Promise.all([
        MetasStore.getById(id)
    ]).then(()=>{
        if(singleMeta.value?.tema?.id)singleMeta.value.tema_id = singleMeta.value.tema.id;
        if(singleMeta.value?.macro_tema?.id)singleMeta.value.macro_tema_id = singleMeta.value.macro_tema.id;
        if(singleMeta.value?.sub_tema?.id)singleMeta.value.sub_tema_id = singleMeta.value.sub_tema.id;

        if(singleMeta.value.orgaos_participantes){
            orgaos_participantes.value.splice(0,orgaos_participantes.value.length);
            singleMeta.value.orgaos_participantes.map(x=>{
                x.orgao_id = x.orgao.id;
                x.busca = "";
                x.orgao = x.orgao.id;
                x.participantes = x.participantes.map(y=>y.id);
                return x;
            }).forEach(x=>orgaos_participantes.value.push(x));
        }
        if(singleMeta.value.coordenadores_cp){
            coordenadores_cp.value.participantes = singleMeta.value.coordenadores_cp.map(x=>x.id);
        }
    })
}else{
    if(route.params.macro_tema_id) virtualParent.value.macro_tema_id = route.params.macro_tema_id;
    if(route.params.sub_tema_id) virtualParent.value.sub_tema_id = route.params.sub_tema_id;
    if(route.params.tema_id) virtualParent.value.tema_id = route.params.tema_id;
}
const MacrotemaStore = useMacrotemasStore();
const { tempMacrotemas } = storeToRefs(MacrotemaStore);

const TemaStore = useTemasStore();
const { tempTemas } = storeToRefs(TemaStore);

const SubtemaStore = useSubtemasStore();
const { tempSubtemas } = storeToRefs(SubtemaStore);

const OrgansStore = useOrgansStore();

const UserStore = useUsersStore();
const { usersCoord } = storeToRefs(UserStore);

Promise.all([
    MetasStore.getPdM()
]).then(()=>{
    MacrotemaStore.filterByPdm(activePdm.value.id);
    TemaStore.filterByPdm(activePdm.value.id);
    SubtemaStore.filterByPdm(activePdm.value.id);
    OrgansStore.getAllOrganResponsibles();
    UserStore.getCoord();
    oktogo.value = true;
});

const schema = Yup.object().shape({
    codigo: Yup.string().nullable(),
    titulo: Yup.string().required('Preencha o titulo'),
    contexto: Yup.string().required(()=>{return 'Preencha o '+(activePdm.value.possui_contexto_meta?activePdm.value.rotulo_contexto_meta:'texto');}),
    complemento: Yup.string().nullable(),

    pdm_id: Yup.string().nullable(),
    macro_tema_id: Yup.string().nullable(),
    tema_id: Yup.string().nullable(),
    sub_tema_id: Yup.string().nullable(),
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
        values.orgaos_participantes = unref(orgaos_participantes);
        values.coordenadores_cp = coordenadores_cp.value.participantes;
        if(!values.pdm_id)values.pdm_id = activePdm.value.id;
        var msg;
        var r;
        if (id&&singleMeta.value.id) {
            r = await MetasStore.update(singleMeta.value.id, values);
            msg = 'Dados salvos com sucesso!';
        } else {
            r = await MetasStore.insert(values);
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            MetasStore.clear();
            await router.push('/metas');
            alertStore.success(msg);
        }
    } catch (error) {
        alertStore.error(error);
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?','/metas');
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
    var r = OrgansStore.organResponsibles;
    var v = r.length ? r.find(x=>x.id==orgao_id) : false;
    return v?.responsible??[];
}
function buscaResponsible(e,item) {
    e.preventDefault();
    e.stopPropagation();
    if (e.keyCode === 13) {
        var i = filterResponsible(item.orgao_id).find(x=>!item.participantes.includes(x.id)&&x.nome_completo.toLowerCase().includes(item.busca.toLowerCase()));
        if(i) pushId(item.participantes,i.id);
        item.busca="";
    }
}
function buscaCoord(e,item) {
    e.preventDefault();
    e.stopPropagation();
    if (e.keyCode === 13) {
        var i = usersCoord.find(x=>!item.participantes.includes(x.id)&&x.nome_completo.toLowerCase().includes(item.busca.toLowerCase()));
        if(i) pushId(item.participantes,i.id);
        item.busca="";
    }
}
</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="oktogo&&!(singleMeta?.loading || singleMeta?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="id?singleMeta:virtualParent" v-slot="{ errors, isSubmitting }">
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Programa de Metas <span class="tvermelho">*</span></label>
                        <input type="text" class="inputtext light mb1" :value="activePdm.nome" disabled />
                    </div>
                    <div class="f1" v-if="activePdm.possui_macro_tema&&tempMacrotemas.length">
                        <label class="label">{{activePdm.rotulo_macro_tema}} <span class="tvermelho">*</span></label>
                        <Field name="macro_tema_id" as="select" class="inputtext light mb1" :class="{ 'error': errors.macro_tema_id }">
                            <option value="">Selecionar</option>
                            <option v-for="type in tempMacrotemas" :key="type.id" :value="type.id" :selected="macro_tema_id&&type.id==macro_tema_id">{{ type['descricao'] }}</option>
                        </Field>
                        <div class="error-msg">{{ errors.macro_tema_id }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1" v-if="activePdm.possui_tema&&tempTemas.length">
                        <label class="label">{{activePdm.rotulo_tema}} <span class="tvermelho">*</span></label>
                        <Field name="tema_id" as="select" class="inputtext light mb1" :class="{ 'error': errors.tema_id }">
                            <option value="">Selecionar</option>
                            <option v-for="type in tempTemas" :key="type.id" :value="type.id" :selected="tema_id&&type.id==tema_id">{{ type.descricao }}</option>
                        </Field>
                        <div class="error-msg">{{ errors.tema_id }}</div>
                    </div>
                    <div class="f1" v-if="activePdm.possui_sub_tema&&tempSubtemas.length">
                        <label class="label">{{activePdm.rotulo_sub_tema}} <span class="tvermelho">*</span></label>
                        <Field name="sub_tema_id" as="select" class="inputtext light mb1" :class="{ 'error': errors.sub_tema_id }">
                            <option value="">Selecionar</option>
                            <option v-for="type in tempSubtemas" :key="type.id" :value="type.id" :selected="sub_tema_id&&type.id==sub_tema_id">{{ type.descricao }}</option>
                        </Field>
                        <div class="error-msg">{{ errors.sub_tema_id }}</div>
                    </div>
                </div>
                <hr class="mt2 mb2"/>
                <div class="flex g2">
                    <div class="f0" style="flex-basis: 100px;">
                        <label class="label">Código</label>
                        <Field name="codigo" type="text" class="inputtext light mb1" maxlength="30" :class="{ 'error': errors.codigo }" />
                        <div class="error-msg">{{ errors.codigo }}</div>
                    </div>
                    <div class="f2">
                        <label class="label">Título <span class="tvermelho">*</span></label>
                        <Field name="titulo" type="text" class="inputtext light mb1" :class="{ 'error': errors.titulo }" />
                        <div class="error-msg">{{ errors.titulo }}</div>
                    </div>
                </div>
                <div class="flex g2" v-if="activePdm.possui_contexto_meta">
                    <div class="f1">
                        <label class="label">{{activePdm.rotulo_contexto_meta}} <span class="tvermelho">*</span></label>
                        <Field name="contexto" as="textarea" rows="3" class="inputtext light mb1" :class="{ 'error': errors.contexto }" />
                        <div class="error-msg">{{ errors.contexto }}</div>
                    </div>
                </div>
                <div class="flex g2" v-if="activePdm.possui_complementacao_meta">
                    <div class="f1">
                        <label class="label">{{activePdm.rotulo_complementacao_meta}}</label>
                        <Field name="complemento" as="textarea" rows="3" class="inputtext light mb1" :class="{ 'error': errors.complemento }" />
                        <div class="error-msg">{{ errors.complemento }}</div>
                    </div>
                </div>

                <hr class="mt2 mb2"/>

                <label class="label">Órgãos responsáveis <span class="tvermelho">*</span></label>
                <div class="flex center g2">
                    <label class="f1 label tc300">Órgão <span class="tvermelho">*</span></label>
                    <label class="f1 label tc300">Responsável(eis) <span class="tvermelho">*</span></label>
                    <div style="flex-basis: 30px;"></div>
                </div>
                <template v-for="(item, index) in orgaos_participantes">
                    <div v-if="item.responsavel" class="flex mb1 g2">
                        <div class="f1">
                            <select v-model="item.orgao_id" class="inputtext" @change="item.participantes=[]" v-if="OrgansStore.organResponsibles.length">
                                <option v-for="(o,k) in OrgansStore.organResponsibles.filter(a=>a.id==item.orgao_id||!orgaos_participantes.map(b=>b.orgao_id).includes(a.id))" :value="o.id">{{o.descricao}}</option>
                            </select>
                        </div>
                        <div class="f1">
                            <div class="suggestion search">
                                <input type="text" v-model="item.busca" @keyup.enter.stop.prevent="buscaResponsible($event,item)" class="inputtext light mb05">
                                <ul>
                                    <li v-if="item.orgao_id" v-for="(r,k) in filterResponsible(item.orgao_id).filter(x=>!item.participantes.includes(x.id)&&x.nome_completo.toLowerCase().includes(item.busca.toLowerCase()))"><a @click="pushId(item.participantes,r.id)" tabindex="1">{{r.nome_completo}}</a></li>
                                </ul>
                            </div>
                            <span class="tagsmall" v-for="(p,k) in filterResponsible(item.orgao_id).filter(x=>item.participantes.includes(x.id))" @click="removeParticipante(item,p.id)">{{p.nome_completo}}<svg width="12" height="12"><use xlink:href="#i_x"></use></svg></span>
                        </div>
                        <div style="flex-basis: 30px;">
                            <a v-if="index" @click="removeOrgao(orgaos_participantes,index)" class="addlink mt1"><svg width="20" height="20"><use xlink:href="#i_remove"></use></svg></a>        
                        </div>
                    </div>
                </template>
                <a @click="addOrgao(orgaos_participantes,true)" class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar orgão responsável</span></a>
                
                <hr class="mt2 mb2"/>

                <label class="label">Órgãos participantes</label>
                <div class="flex center g2">
                    <label class="f1 label tc300">Órgão</label>
                    <label class="f1 label tc300">Responsável(eis)</label>
                    <div style="flex-basis: 30px;"></div>
                </div>
                <template v-for="(item, index) in orgaos_participantes">
                    <div v-if="!item.responsavel" class="flex mb1 g2">
                        <div class="f1">
                            <select v-model="item.orgao_id" class="inputtext" @change="item.participantes=[]" v-if="OrgansStore.organResponsibles.length">
                                <option v-for="(o,k) in OrgansStore.organResponsibles.filter(a=>a.id==item.orgao_id||!orgaos_participantes.map(b=>b.orgao_id).includes(a.id))" :value="o.id">{{o.descricao}}</option>
                            </select>
                        </div>
                        <div class="f1">
                            <div class="suggestion search">
                                <input type="text" v-model="item.busca" @keyup.enter.stop.prevent="buscaResponsible($event,item)" class="inputtext light mb05">
                                <ul>
                                    <li v-if="item.orgao_id" v-for="(r,k) in filterResponsible(item.orgao_id).filter(x=>!item.participantes.includes(x.id)&&x.nome_completo.toLowerCase().includes(item.busca.toLowerCase()))"><a @click="pushId(item.participantes,r.id)" tabindex="1">{{r.nome_completo}}</a></li>
                                </ul>
                            </div>
                            <span class="tagsmall" v-for="(p,k) in filterResponsible(item.orgao_id).filter(x=>item.participantes.includes(x.id))" @click="removeParticipante(item,p.id)">{{p.nome_completo}}<svg width="12" height="12"><use xlink:href="#i_x"></use></svg></span>
                        </div>
                        <div style="flex-basis: 30px;">
                            <a v-if="index" @click="removeOrgao(orgaos_participantes,index)" class="addlink mt1"><svg width="20" height="20"><use xlink:href="#i_remove"></use></svg></a>        
                        </div>
                    </div>
                </template>
                <a @click="addOrgao(orgaos_participantes,false)" class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar orgão participante</span></a>
                
                <hr class="mt2 mb2"/>

                <label class="label">Responsável(eis) na coordenadoria de projetos* <span class="tvermelho">*</span></label>
                <div class="flex">
                    <div class="f1" v-if="usersCoord.length">
                        <div class="suggestion search">
                            <input type="text" v-model="coordenadores_cp.busca" @keyup.enter.stop.prevent="buscaCoord($event,coordenadores_cp)" class="inputtext light mb05">
                            <ul>
                                <li v-for="(r,k) in usersCoord.filter(x=>!coordenadores_cp.participantes.includes(x.id)&&x.nome_completo.toLowerCase().includes(coordenadores_cp.busca.toLowerCase()))"><a @click="pushId(coordenadores_cp.participantes,r.id)" tabindex="1">{{r.nome_completo}}</a></li>
                            </ul>
                        </div>
                        <span class="tagsmall" v-for="(p,k) in usersCoord.filter(x=>coordenadores_cp.participantes.includes(x.id))" @click="removeParticipante(coordenadores_cp,p.id)">{{p.nome_completo}}<svg width="12" height="12"><use xlink:href="#i_x"></use></svg></span>
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
