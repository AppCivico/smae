<script setup>
import { ref, reactive } from 'vue';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { requestS } from '@/helpers';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

import { useAlertStore, useEditModalStore, useMetasStore, useIndicadoresStore, useVariaveisStore, useRegionsStore } from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const route = useRoute();
const meta_id = route.params.meta_id;
const indicador_id = route.params.indicador_id;
const var_id = route.params.var_id;

const ps = defineProps(['props']);
const props = ps.props;

const IndicadoresStore = useIndicadoresStore();
const { singleIndicadores } = storeToRefs(IndicadoresStore);
if(!singleIndicadores?.id || singleIndicadores.id!=indicador_id) IndicadoresStore.getById(meta_id,indicador_id);

const MetasStore = useMetasStore();
const { singleMeta } = storeToRefs(MetasStore);
if(!singleMeta?.id || singleMeta.id!=meta_id) MetasStore.getById(meta_id);

const VariaveisStore = useVariaveisStore();
const { singleVariaveis } = storeToRefs(VariaveisStore);

const RegionsStore = useRegionsStore();
const { regions, tempRegions } = storeToRefs(RegionsStore);
if(!regions.length) RegionsStore.getAll();

let title = 'Adicionar variável';
const responsaveisArr = ref({participantes:[], busca:''});
let orgao_id = ref(0);
let level1 = ref(null);
let level2 = ref(null);
let level3 = ref(null);
let regiao_id_mount = ref(null);

if(var_id){
    title = 'Editar variável';
    if(!singleVariaveis.value.id) Promise.all([VariaveisStore.getById(indicador_id,var_id)]).then(()=>{
        responsaveisArr.value.participantes = singleVariaveis.value?.responsaveis.map(x=>x.id)??[];
        orgao_id.value = singleVariaveis.value?.orgao_id;

        if(singleVariaveis.value?.regiao_id){
            if(singleVariaveis.value.regiao_id) (async()=>{
                await RegionsStore.filterRegions({id: singleVariaveis.value.regiao_id});
                level1.value = tempRegions.value[0]?.children[0].index??null;
                level2.value = tempRegions.value[0]?.children[0]?.children[0].index??null;
                level3.value = tempRegions.value[0]?.children[0]?.children[0]?.children[0].index??null;
            })();
        }
    });
}


const schema = Yup.object().shape({
    orgao_id: Yup.string().required('Selecione um orgão'),
    regiao_id: Yup.string().nullable().test('regiao_id','Selecione uma região',(value, testContext)=>{ return singleIndicadores?.value?.regionalizavel && value; }),
    unidade_medida_id: Yup.string().required('Selecione uma unidade'),
    
    titulo: Yup.string().required('Preencha o título'),
    periodicidade: Yup.string().required('Preencha a periodicidade'),
    
    valor_base: Yup.string().required('Preencha o valor base'),
    casas_decimais: Yup.string().required('Preencha o número de casas decimais'),
    peso: Yup.string().notRequired(),

    acumulativa: Yup.string().nullable(),

    responsaveis: Yup.array().nullable(),
});

async function onSubmit(values) {
    try {
        var msg;
        var r;

        if(!responsaveisArr.value.participantes.length) throw 'Selecione ao menos um responsável';

        values.acumulativa = !!values.acumulativa;
        values.indicador_id = Number(indicador_id);

        values.orgao_id = Number(values.orgao_id);
        values.regiao_id = singleIndicadores.value.regionalizavel? Number(values.regiao_id):null;
        values.unidade_medida_id = Number(values.unidade_medida_id);
        values.valor_base = values.valor_base;
        values.casas_decimais = Number(values.casas_decimais);
        values.peso = values.peso?Number(values.peso):null;
        values.responsaveis = responsaveisArr.value.participantes;
        
        var rota = false;
        if (var_id) {
            if(singleVariaveis.value.id==var_id){
                r = await VariaveisStore.update(var_id, values);
                msg = 'Dados salvos com sucesso!';
                rota = `/metas/${meta_id}/indicadores/${indicador_id}`;
            }
        } else {
            r = await VariaveisStore.insert(values);
            msg = 'Item adicionado com sucesso!';
            rota = `/metas/${meta_id}/indicadores/${indicador_id}/variaveis/${r}/valores`;
        }
        if(r){
            VariaveisStore.clear();
            VariaveisStore.getAll(indicador_id);
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
        router.go(-1);
        editModalStore.clear();
        alertStore.clear();
    });
}
function lastlevel() {
    var r;
    if(singleIndicadores.value.nivel_regionalizacao==2&&level1.value!==null){ r= regions.value[0].children[level1.value].id; }
    if(singleIndicadores.value.nivel_regionalizacao==3&&level1.value!==null&&level2.value!==null){ r= regions.value[0].children[level1.value].children[level2.value].id; }
    if(singleIndicadores.value.nivel_regionalizacao==4&&level1.value!==null&&level2.value!==null&&level3.value!==null){ r= regions.value[0].children[level1.value].children[level2.value].children[level3.value].id; }
    regiao_id_mount.value = r;
}
function pushId(e,id) {
    e.push(id);
    e = [...new Set(e)];
}
function removeParticipante(item,p) {
    item.participantes.splice(item.participantes.indexOf(p),1);
}
function buscaCoord(e,parent,item) {
    e.preventDefault();
    e.stopPropagation();
    if (e.keyCode === 13) {
        var i = parent.find(x=>!item.participantes.includes(x.id)&&x.nome_exibicao.toLowerCase().includes(item.busca.toLowerCase()));
        if(i) pushId(item.participantes,i.id);
        item.busca="";
    }
}
</script>

<template>
    <div class="flex spacebetween center mb2">
        <h2>{{title}}</h2>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>
    <template v-if="!(singleVariaveis?.loading || singleVariaveis?.error)&&singleIndicadores?.id">
        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="singleVariaveis" v-slot="{ errors, isSubmitting }">
            <div>
                <label class="label">Título <span class="tvermelho">*</span></label>
                <Field name="titulo" type="text" class="inputtext light mb1" :class="{ 'error': errors.titulo }" />
                <div class="error-msg">{{ errors.titulo }}</div>
            </div>
            <div>
                <label class="label">Valor base <span class="tvermelho">*</span></label>
                <Field name="valor_base" type="number" class="inputtext light mb1" :class="{ 'error': errors.valor_base }" />
                <div class="error-msg">{{ errors.valor_base }}</div>
            </div>

            <div>
                <label class="label flex center">Periodicidade <span class="tvermelho">*</span></label>
                <Field name="periodicidade" v-model="periodicidade" as="select" class="inputtext light mb1" :class="{ 'error': errors.periodicidade }">
                    <option value="">Selecionar</option>
                    <option value="Diario">Diario</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Bimestral">Bimestral</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Quadrimestral">Quadrimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                    <option value="Quinquenal">Quinquenal</option>
                    <option value="Secular">Secular</option>
                </Field>
                <div class="error-msg">{{ errors.periodicidade }}</div>
            </div>

            <div>
                <label class="label">Unidade <span class="tvermelho">*</span></label>
                <Field name="unidade_medida_id" v-model="unidade_medida_id" as="select" class="inputtext light mb1" :class="{ 'error': errors.unidade_medida_id }">
                    <option value="">Selecione</option>
                    <option value="1">un - unidades</option>
                    <option value="2">º - Ordinal</option>
                    <option value="3">dias - Dias</option>
                    <option value="4">eventos - Eventos</option>
                    <option value="5">acidentes - Acidentes</option>
                    <option value="6">crianças - Crianças</option>
                    <option value="7">m² - Metros quadrados</option>
                    <option value="8">hab - Habitantes</option>
                    <option value="9">nº - Posição nº</option>
                </Field>
                <div class="error-msg">{{ errors.unidade_medida_id }}</div>
            </div>

            <div class="flex g2">
                <div class="f1">
                    <label class="label">Peso</label>
                    <Field name="peso" type="number" class="inputtext light mb1" :class="{ 'error': errors.peso }" />
                    <div class="error-msg">{{ errors.peso }}</div>
                </div>
                <div class="f1">
                    <label class="label">Casas decimais <span class="tvermelho">*</span></label>
                    <Field name="casas_decimais" type="number" class="inputtext light mb1" :class="{ 'error': errors.casas_decimais }" />
                    <div class="error-msg">{{ errors.casas_decimais }}</div>
                </div>
            </div>

            <div class="mb2 mt1">
                <label class="block">
                    <Field name="acumulativa" v-model="acumulativa" type="checkbox" value="1" class="inputcheckbox" /><span :class="{ 'error': errors.acumulativa }">Variável acumulativa</span>
                </label>
                <div class="error-msg">{{ errors.acumulativa }}</div>
            </div>

            <div>
                <label class="label">Orgão responsável <span class="tvermelho">*</span></label>
                <Field v-if="singleMeta?.id" name="orgao_id" v-model="orgao_id" @change="responsaveisArr.participantes.splice(0,responsaveisArr.participantes.length)" as="select" class="inputtext light mb1" :class="{ 'error': errors.orgao_id }">
                    <option v-for="a in singleMeta.orgaos_participantes" :value="a.orgao.id">{{a.orgao.descricao}}</option>
                </Field>
                <div class="error-msg">{{ errors.orgao_id }}</div>

                <label class="label">Responsável(eis)* <span class="tvermelho">*</span></label>
                <div class="mb1" v-if="singleMeta?.orgaos_participantes&&orgao_id">
                    <template v-for="c in [singleMeta.orgaos_participantes.find(x=>x.orgao.id==orgao_id)]">
                        <div class="suggestion search">
                            <input type="text" v-model="responsaveisArr.busca" @keyup.enter.stop.prevent="buscaCoord($event,c.participantes,responsaveisArr)" class="inputtext light mb05">
                            <ul>
                                <li v-for="(r,k) in c.participantes.filter(x=>!responsaveisArr.participantes.includes(x.id)&&x.nome_exibicao.toLowerCase().includes(responsaveisArr.busca.toLowerCase()))"><a @click="pushId(responsaveisArr.participantes,r.id)" tabindex="1">{{r.nome_exibicao}}</a></li>
                            </ul>
                        </div>
                        <span class="tagsmall" v-for="(p,k) in c.participantes.filter(x=>responsaveisArr.participantes.includes(x.id))" @click="removeParticipante(responsaveisArr,p.id)">{{p.nome_exibicao}}<svg width="12" height="12"><use xlink:href="#i_x"></use></svg></span>
                    </template>
                </div>
                <input v-else class="inputtext light mb1" type="text" disabled value="Selecione um órgão">
            </div>

            <div v-if="singleIndicadores.regionalizavel&&regions">
                <label class="label">Região <span class="tvermelho">*</span></label>

                <template v-if="singleIndicadores.nivel_regionalizacao>=2">
                    <select class="inputtext light mb1" v-model="level1" @change="lastlevel">
                        <option value="">Selecione</option>
                        <option v-for="(r,i) in regions[0]?.children" :value="i">{{r.descricao}}</option>
                    </select>
                    <template v-if="singleIndicadores.nivel_regionalizacao>=3&&level1!==null">
                        <select class="inputtext light mb1" v-model="level2" @change="lastlevel">
                            <option value="">Selecione</option>
                            <option v-for="(rr,ii) in regions[0]?.children[level1]?.children" :value="ii">{{rr.descricao}}</option>
                        </select>
                        <template v-if="singleIndicadores.nivel_regionalizacao==4&&level2!==null">
                            <select class="inputtext light mb1" v-model="level3" @change="lastlevel">
                                <option value="">Selecione</option>
                                <option v-for="(rrr,iii) in regions[0]?.children[level1]?.children[level2]?.children" :value="iii">{{rrr.descricao}}</option>
                            </select>
                        </template>
                        <template v-else-if="singleIndicadores.nivel_regionalizacao==4&&level2===null">
                            <input class="inputtext light mb1" type="text" disabled value="Selecione uma subprefeitura">
                        </template>
                    </template>
                    <template v-else-if="singleIndicadores.nivel_regionalizacao>=3&&level1===null">
                        <input class="inputtext light mb1" type="text" disabled value="Selecione uma região">
                    </template>
                </template>
                <Field name="regiao_id" v-model="regiao_id_mount" type="hidden" :class="{ 'error': errors.regiao_id }"/>
                <div class="error-msg">{{ errors.regiao_id }}</div>
            </div>

            <div class="flex spacebetween center mb2">
                <hr class="mr2 f1"/>
                <button class="btn big" :disabled="isSubmitting">Salvar</button>
                <hr class="ml2 f1"/>
            </div>
        </Form>
    </template>
    <template v-if="singleVariaveis?.loading">
        <span class="spinner">Carregando</span>
    </template>
    <template v-if="singleVariaveis?.error||error">
        <div class="error p1">
            <div class="error-msg">{{singleVariaveis.error??error}}</div>
        </div>
    </template>
</template>
