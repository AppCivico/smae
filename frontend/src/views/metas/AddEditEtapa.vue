<script setup>
import { ref } from 'vue';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { useAlertStore, useEditModalStore, useRegionsStore, useMetasStore, useCronogramasStore, useEtapasStore } from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;
const atividade_id = route.params.atividade_id;
const cronograma_id = route.params.cronograma_id;
const etapa_id = route.params.etapa_id;

const parentVar = atividade_id??iniciativa_id??meta_id??false;
const parentField = atividade_id?'atividade_id':iniciativa_id?'iniciativa_id':meta_id?'meta_id':false;
const currentEdit = route.path.slice(0,route.path.indexOf('/cronograma')+11);

const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);
MetasStore.getPdM();

const CronogramasStore = useCronogramasStore();
const { singleCronograma } = storeToRefs(CronogramasStore);
if(cronograma_id&&(!singleCronograma?.value?.id || singleCronograma?.value.id!=cronograma_id)){
    CronogramasStore.getById(parentVar,parentField,cronograma_id);
}

const EtapasStore = useEtapasStore();
const { singleEtapa } = storeToRefs(EtapasStore);
EtapasStore.clearEdit();

const RegionsStore = useRegionsStore();
const { regions, tempRegions } = storeToRefs(RegionsStore);
if(!regions.length) RegionsStore.getAll();

let title = 'Adicionar etapa';
let level1 = ref(null);
let level2 = ref(null);
let level3 = ref(null);
let regiao_id_mount = ref(null);

let acumulativa_iniciativa = ref(0);
let acumulativa_iniciativa_o = ref(0);
let acumulativa_meta = ref(0);
let acumulativa_meta_o = ref(0);

const virtualParent = ref({});
if(etapa_id){
    title = 'Editar etapa';
    if(!singleEtapa.value.id) Promise.all([EtapasStore.getById(cronograma_id,etapa_id)]).then(()=>{
        if(singleEtapa.value?.etapa.regiao_id){
            if(singleEtapa.value.etapa.regiao_id) (async()=>{
                await RegionsStore.filterRegions({id: singleEtapa.value.etapa.regiao_id});
                level1.value = tempRegions.value[0]?.children[0].index??null;
                level2.value = tempRegions.value[0]?.children[0]?.children[0].index??null;
                level3.value = tempRegions.value[0]?.children[0]?.children[0]?.children[0].index??null;
            })();
        }
    });
    (async()=>{
        var p_cron, mon;
        if(atividade_id) acumulativa_iniciativa.value = {loading:true};
        if(iniciativa_id) acumulativa_meta.value = {loading:true};

        if(atividade_id){
            p_cron = await CronogramasStore.getItemByParent(iniciativa_id,'iniciativa_id');
            mon = await EtapasStore.getMonitoramento(p_cron.id,etapa_id);
            if(mon){
                acumulativa_iniciativa.value = !mon.inativo?"1":false;
                acumulativa_iniciativa_o.value = mon.ordem;
            }
        }
        if(iniciativa_id){
            p_cron = await CronogramasStore.getItemByParent(meta_id,'meta_id');
            mon = await EtapasStore.getMonitoramento(p_cron.id,etapa_id);
            if(mon){
                acumulativa_meta.value = !mon.inativo?"1":false;
                acumulativa_meta_o.value = mon.ordem;
            }
        }
    })();
}


var regx = /^$|^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;

const schema = Yup.object().shape({
    regiao_id: Yup.string().nullable().test('regiao_id','Selecione uma região',(value)=>{ return !singleCronograma?.value?.regionalizavel || value; }),
    
    titulo: Yup.string().required('Preencha o título'),
    descricao: Yup.string().nullable(),
    ordem: Yup.string().nullable(),
    peso: Yup.string().nullable(),
    
    inicio_previsto: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'),
    termino_previsto: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'),
    inicio_real: Yup.string().nullable().matches(regx,'Formato inválido'),
    termino_real: Yup.string().nullable().matches(regx,'Formato inválido'),
});

async function onSubmit(values) {
    try {
        var msg;
        var r;

        values.regiao_id = singleCronograma.value.regionalizavel? Number(values.regiao_id):null;
        values.peso = Number(values.peso)??null;
        values.ordem = Number(values.ordem)??null;
        values.etapa_pai_id = null;

        var rota = false;
        var etapa_id_gen = false;
        if (etapa_id) {
            if(singleEtapa.value.etapa_id==etapa_id){
                r = await EtapasStore.update(etapa_id, values);
                msg = 'Dados salvos com sucesso!';
                rota = currentEdit;
                etapa_id_gen = etapa_id;

                if(values.ordem!=singleEtapa.value.ordem){
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
            if(etapa_id_gen){
                if(values.acumulativa_iniciativa){
                    var ri = await CronogramasStore.getItemByParent(iniciativa_id,'iniciativa_id');
                    if(ri.id){
                        await EtapasStore.monitorar({
                            cronograma_id: ri.id,
                            etapa_id: Number(etapa_id_gen),
                            inativo: !values.acumulativa_iniciativa,
                            ordem: Number(values.acumulativa_iniciativa_o)??null
                        });
                    }
                }
                if(values.acumulativa_meta){
                    var rm = await CronogramasStore.getItemByParent(meta_id,'meta_id');
                    if(rm.id){
                        await EtapasStore.monitorar({
                            cronograma_id: rm.id,
                            etapa_id: Number(etapa_id_gen),
                            inativo: !values.acumulativa_meta,
                            ordem: Number(values.acumulativa_meta_o)??null
                        });
                    }
                }
            }else{
                console.log(r);
                throw 'Ocorreu um erro inesperado.';
            }

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
    if(singleCronograma.value.nivel_regionalizacao==2&&level1.value!==null){ r= regions.value[0].children[level1.value].id; }
    if(singleCronograma.value.nivel_regionalizacao==3&&level1.value!==null&&level2.value!==null){ r= regions.value[0].children[level1.value].children[level2.value].id; }
    if(singleCronograma.value.nivel_regionalizacao==4&&level1.value!==null&&level2.value!==null&&level3.value!==null){ r= regions.value[0].children[level1.value].children[level2.value].children[level3.value].id; }
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
    <div class="flex spacebetween center mb2">
        <h2>{{title}}</h2>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <template v-if="!(singleEtapa?.loading || singleEtapa?.error)&&singleCronograma?.id">
        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="etapa_id?singleEtapa.etapa:virtualParent" v-slot="{ errors, isSubmitting }">
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
                    <Field name="ordem" type="number" class="inputtext light mb1" :value="etapa_id?singleEtapa?.ordem:ordem" :class="{ 'error': errors.ordem }" />
                    <div class="error-msg">{{ errors.ordem }}</div>
                </div>
            </div>

            <div class="">
                <label class="label">Descrição</label>
                <Field name="descricao" as="textarea" rows="3" class="inputtext light mb1" :class="{ 'error': errors.descricao }" />
                <div class="error-msg">{{ errors.descricao }}</div>
            </div>

            <div v-if="singleCronograma.regionalizavel&&regions">
                    
                <label class="label">Região <span class="tvermelho">*</span></label>

                <template v-if="singleCronograma.nivel_regionalizacao>=2">
                    <select class="inputtext light mb1" v-model="level1" @change="lastlevel">
                        <option value="">Selecione</option>
                        <option v-for="(r,i) in regions[0]?.children" :key="i" :value="i">{{r.descricao}}</option>
                    </select>
                    <template v-if="singleCronograma.nivel_regionalizacao>=3&&level1!==null">
                        <select class="inputtext light mb1" v-model="level2" @change="lastlevel">
                            <option value="">Selecione</option>
                            <option v-for="(rr,ii) in regions[0]?.children[level1]?.children" :key="ii" :value="ii">{{rr.descricao}}</option>
                        </select>
                        <template v-if="singleCronograma.nivel_regionalizacao==4&&level2!==null">
                            <select class="inputtext light mb1" v-model="level3" @change="lastlevel">
                                <option value="">Selecione</option>
                                <option v-for="(rrr,iii) in regions[0]?.children[level1]?.children[level2]?.children" :key="iii" :value="iii">{{rrr.descricao}}</option>
                            </select>
                        </template>
                        <template v-else-if="singleCronograma.nivel_regionalizacao==4&&level2===null">
                            <input class="inputtext light mb1" type="text" disabled value="Selecione uma subprefeitura">
                        </template>
                    </template>
                    <template v-else-if="singleCronograma.nivel_regionalizacao>=3&&level1===null">
                        <input class="inputtext light mb1" type="text" disabled value="Selecione uma região">
                    </template>
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

            <template v-if="activePdm.possui_atividade">
                <div class="flex center g2 mb2 mt1" v-if="atividade_id && !acumulativa_iniciativa?.loading">
                    <div class="f2">
                        <label class="block">
                            <Field name="acumulativa_iniciativa" v-model="acumulativa_iniciativa" type="checkbox" value="1" class="inputcheckbox" />
                            <span :class="{ 'error': errors.acumulativa_iniciativa }">Etapa monitorada no cronograma de {{activePdm.rotulo_iniciativa}}</span>
                        </label>
                        <div class="error-msg">{{ errors.acumulativa_iniciativa }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Ordem</label>
                        <Field name="acumulativa_iniciativa_o" v-model="acumulativa_iniciativa_o" type="number" class="inputtext light mb1"/>
                    </div>
                </div>
                <template v-else-if="acumulativa_iniciativa?.loading">
                    <div class="spinner">Carregando</div>
                </template>
            </template>

            <template v-if="activePdm.possui_iniciativa">
                <div class="flex center g2 mb2 mt1" v-if="iniciativa_id && !acumulativa_meta?.loading">
                    <div class="f2">
                        <label class="block">
                            <Field name="acumulativa_meta" v-model="acumulativa_meta" type="checkbox" value="1" class="inputcheckbox" />
                            <span :class="{ 'error': errors.acumulativa_meta }">Etapa monitorada no cronograma da meta</span>
                        </label>
                        <div class="error-msg">{{ errors.acumulativa_meta }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Ordem</label>
                        <Field name="acumulativa_meta_o" v-model="acumulativa_meta_o" type="number" class="inputtext light mb1"/>
                    </div>
                </div>
                <template v-else-if="acumulativa_meta?.loading">
                    <div class="spinner">Carregando</div>
                </template>
            </template>

            <div class="flex spacebetween center mb2">
                <hr class="mr2 f1"/>
                <button class="btn big" :disabled="isSubmitting">Salvar</button>
                <hr class="ml2 f1"/>
            </div>
        </Form>
    </template>
    <template v-if="singleEtapa?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-if="singleEtapa?.error||error">
        <div class="error p1">
            <div class="error-msg">{{singleEtapa.error??error}}</div>
        </div>
    </template>
</template>
