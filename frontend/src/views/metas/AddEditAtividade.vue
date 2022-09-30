<script setup>
import { ref, unref } from 'vue';
import { Dashboard} from '@/components';
import { default as AutocompleteField} from '@/components/AutocompleteField.vue';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useIniciativasStore, useAtividadesStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;
const atividade_id = route.params.atividade_id;
var oktogo = ref(0);

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
IniciativasStore.getById(meta_id,iniciativa_id);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);
AtividadesStore.clearEdit();

const orgaos_participantes = ref([
    {orgao_id:null, responsavel:true, participantes:[], busca:''}
]);
const coordenadores_cp = ref({participantes:[], busca:''});

const virtualParent = ref({});
let title = 'Cadastro de Atividade';

const organsAvailable = ref([]);
const usersAvailable = ref({});
const coordsAvailable = ref([]);
if (atividade_id) {
    title = 'Editar Atividade';
}
(async()=>{
    await IniciativasStore.getById(meta_id,iniciativa_id);
    if (atividade_id) await AtividadesStore.getById(iniciativa_id,atividade_id);

    singleIniciativa.value.orgaos_participantes?.forEach(x=>{
        x.orgao_id = x.orgao.id;
        organsAvailable.value.push(x);
        if(!usersAvailable.value[x.orgao_id]) usersAvailable.value[x.orgao_id] = [];
        usersAvailable.value[x.orgao_id] = usersAvailable.value[x.orgao_id].concat(x.participantes);
    });
    singleIniciativa.value.coordenadores_cp?.forEach(x=>{
        coordsAvailable.value.push(x);
    })

    if(atividade_id){
        if(singleAtividade.value.orgaos_participantes){
            orgaos_participantes.value.splice(0,orgaos_participantes.value.length);
            singleAtividade.value.orgaos_participantes.forEach(x=>{
                var z = {};
                z.orgao_id = x.orgao.id;
                z.busca = "";
                z.participantes = x.participantes.map(y=>y?.id??y);
                z.responsavel = x.responsavel;
                orgaos_participantes.value.push(z);
            });
        }
        if(singleAtividade.value.coordenadores_cp){
            coordenadores_cp.value.participantes = singleAtividade.value.coordenadores_cp.map(x=>x?.id??x);
        }
    }
    oktogo.value = true;
})();

const schema = Yup.object().shape({
    codigo: Yup.string().required('Preencha o código'),
    titulo: Yup.string().required('Preencha o titulo'),
    contexto: Yup.string().nullable(),
    complemento: Yup.string().nullable(),

    iniciativa_id: Yup.string().nullable(),
    compoe_indicador_iniciativa: Yup.string().nullable(),
});


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
        
        if(!values.iniciativa_id)values.iniciativa_id = iniciativa_id;
        values.compoe_indicador_iniciativa = values.compoe_indicador_iniciativa?true:false;

        if(er.length) throw er.join('<br />');

        var msg;
        var r;
        var rota;
        if (atividade_id&&singleAtividade.value.id) {
            r = await AtividadesStore.update(singleAtividade.value.id, values);
            msg = 'Dados salvos com sucesso!';
            rota = `/metas/${meta_id}/iniciativas/${iniciativa_id}/atividades/${atividade_id}`;
        } else {
            r = await AtividadesStore.insert(values);
            msg = 'Item adicionado com sucesso!';
            rota = `/metas/${meta_id}/iniciativas/${iniciativa_id}/atividades/${r}`;
        }
        if(r){
            AtividadesStore.clear();
            await router.push(rota);
            alertStore.success(msg);
        }
    } catch (error) {
        alertStore.error(error);
    }
}
async function checkDelete(id) {
    if (id) {
        if(singleAtividade.value.id == id){
            alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{
                if(await AtividadesStore.delete(meta_id,id)){
                    AtividadesStore.clear();
                    await router.push(`/metas/${meta_id}/iniciativas/${iniciativa_id}`);
                    alertStore.success('Iniciativa removida.');
                }
            },'Remover');
        }
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?',`/metas/${meta_id}/iniciativas/${iniciativa_id}`);
}
function addOrgao(obj,r) {
    obj.push({orgao_id:null, responsavel:r??false, participantes:[], busca:''});
}
function removeOrgao(obj,i) {
    obj.splice(i,1);
}
function filterResponsible(orgao_id) {
    var r = usersAvailable.value[orgao_id] ?? [];
    return r.length ? r : [];
}
</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <div>
                <h1>{{title}}</h1>
                <div class="t24">Iniciativa {{singleIniciativa.titulo}}</div>
            </div>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <template v-if="oktogo&&!(singleAtividade?.loading || singleAtividade?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="atividade_id?singleAtividade:virtualParent" v-slot="{ errors, isSubmitting }">
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
                        <Field name="compoe_indicador_iniciativa" v-model="compoe_indicador_iniciativa" type="checkbox" value="1" class="inputcheckbox" /><span :class="{ 'error': errors.compoe_indicador_iniciativa }">Compõe o Indicador da iniciativa</span>
                    </label>
                    <div class="error-msg">{{ errors.compoe_indicador_iniciativa }}</div>
                </div>

                <hr class="mt2 mb2"/>

                <label class="label">Órgãos participantes <span class="tvermelho">*</span></label>
                <div class="flex center g2">
                    <label class="f1 label tc300">Órgão</label>
                    <label class="f1 label tc300">Responsável(eis)</label>
                    <div style="flex-basis: 30px;"></div>
                </div>
                <template v-for="(item, index) in orgaos_participantes" :key="index">
                    <div class="flex mb1 g2">
                        <div class="f1">
                            <select v-model="item.orgao_id" class="inputtext" @change="item.participantes=[]" v-if="organsAvailable.length">
                                <option v-for="o in organsAvailable.filter(a=>a.orgao_id==item.orgao_id||!orgaos_participantes.map(b=>b.orgao_id).includes(a.orgao_id))" 
                                        :key="o.orgao_id"
                                        :value="o.orgao_id"
                                >{{o.orgao.descricao}}</option>
                            </select>
                        </div>
                        <div class="f1">
                            <AutocompleteField :controlador="item" :grupo="filterResponsible(item.orgao_id)" label="nome_exibicao" />
                        </div>
                        <div style="flex-basis: 30px;">
                            <a v-if="index" @click="removeOrgao(orgaos_participantes,index)" class="addlink mt1"><svg width="20" height="20"><use xlink:href="#i_remove"></use></svg></a>        
                        </div>
                    </div>
                </template>
                <a @click="addOrgao(orgaos_participantes,true)" class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar orgão participante</span></a>
                
                <hr class="mt2 mb2"/>

                <label class="label">Responsável(eis) na coordenadoria de planejamento da Meta* <span class="tvermelho">*</span></label>
                <div class="flex">
                    <div class="f1" v-if="coordsAvailable.length">
                        <AutocompleteField :controlador="coordenadores_cp" :grupo="coordsAvailable" label="nome_exibicao" />
                    </div>
                </div>

                <div class="flex spacebetween center mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">Salvar</button>
                    <hr class="ml2 f1"/>
                </div>
            </Form>
        </template>
        
        <template v-if="singleAtividade?.loading||!oktogo">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="singleAtividade?.error||error">
            <div class="error p1">
                <div class="error-msg">{{singleAtividade.error??error}}</div>
            </div>
        </template>

        <template v-if="atividade_id&&singleAtividade.id&&atividade_id==singleAtividade.id">
            <hr class="mt2 mb2"/>
            <button @click="checkDelete(singleAtividade.id)" class="btn amarelo big">Remover item</button>
        </template>
    </Dashboard>
</template>
