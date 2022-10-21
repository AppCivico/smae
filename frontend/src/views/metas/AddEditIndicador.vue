<script setup>
import { ref, unref, onMounted, onUpdated } from 'vue';
import { Dashboard, SmallModal} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { useEditModalStore, useAlertStore, useAuthStore, useMetasStore, useIndicadoresStore, useIniciativasStore, useAtividadesStore, useVariaveisStore } from '@/stores';
import { default as AddEditVariavel } from '@/views/metas/AddEditVariavel.vue';
import { default as AddEditValores } from '@/views/metas/AddEditValores.vue';
import { default as AddEditRealizado } from '@/views/metas/AddEditRealizado.vue';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;
const atividade_id = route.params.atividade_id;
const indicador_id = route.params.indicador_id;

const parentlink = `${meta_id?'/metas/'+meta_id:''}${iniciativa_id?'/iniciativas/'+iniciativa_id:''}${atividade_id?'/atividades/'+atividade_id:''}`;
const parentVar = atividade_id??iniciativa_id??meta_id??false;
const parentField = atividade_id?'atividade_id':iniciativa_id?'iniciativa_id':meta_id?'meta_id':false;
const props = defineProps(['group']);

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const MetasStore = useMetasStore();
const { activePdm ,singleMeta } = storeToRefs(MetasStore);
MetasStore.getById(meta_id);
MetasStore.getPdM();

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
if(iniciativa_id)IniciativasStore.getById(meta_id,iniciativa_id);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);
if(atividade_id)AtividadesStore.getById(iniciativa_id,atividade_id);

const IndicadoresStore = useIndicadoresStore();
const { singleIndicadores } = storeToRefs(IndicadoresStore);

const VariaveisStore = useVariaveisStore();
const { Variaveis } = storeToRefs(VariaveisStore);

var regx = /^$|^(?:0[1-9]|1[0-2]|[1-9])\/(?:(?:1[9]|[2-9]\d)?\d{2})$/;

const schema = Yup.object().shape({
    codigo: Yup.string().required('Preencha o código'), //  : "string",
    titulo: Yup.string().required('Preencha o título'), //  : "string",
    polaridade: Yup.string().required('Selecione a polaridade'), //  : "Neutra",
    periodicidade: Yup.string().required('Selecione a periodicidade'), //  : "Diario",
    
    inicio_medicao: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'), //  : "YYYY-MM-DD",
    fim_medicao: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'), //  : "YYYY-MM-DD",
    
    regionalizavel: Yup.string().nullable(),
    nivel_regionalizacao: Yup.string().nullable().when('regionalizavel', (regionalizavel, field) => regionalizavel=="1" ? field.required("Selecione o nível") : field),

    contexto: Yup.string().nullable(),
    complemento: Yup.string().nullable(),
});

let title = 'Adicionar Indicador';
let regionalizavel = ref(singleIndicadores.value.regionalizavel);

let formula = ref("");
let formulaInput = ref(null);
let variaveisFormulaModal = ref(0);
let fieldsVariaveis = ref({});
let variaveisFormula = {};
let currentCaretPos = -1;
let errFormula = ref("");
if (indicador_id) {
    title = 'Editar Indicador';
    
    Promise.all([
        IndicadoresStore.getById(parentVar,parentField,indicador_id),
        VariaveisStore.getAll(indicador_id)
    ]).then(()=>{
        if(singleIndicadores.value.formula){
            formula.value = singleIndicadores.value.formula;
            variaveisFormula = {};
            singleIndicadores.value.formula_variaveis.forEach(x=>{
                variaveisFormula['$'+x.referencia] = {
                    id: '$'+x.referencia,
                    periodo: x.janela<0?-1:x.janela>1?0:1,
                    meses: Math.abs(x.janela),
                    variavel_id: x.variavel_id,
                    usar_serie_acumulada: x.usar_serie_acumulada
                }
            });
            formatFormula();
        }
    });
    
    
}else{
    if(atividade_id){
        IndicadoresStore.getAll(atividade_id,'atividade_id');
    }else if(iniciativa_id){
        IndicadoresStore.getAll(iniciativa_id,'iniciativa_id');
    }else{
        IndicadoresStore.getAll(meta_id,'meta_id');
    }
}
function start(){
    if(props.group=='variaveis')editModalStore.modal(AddEditVariavel,props);
    if(props.group=='valores')editModalStore.modal(AddEditValores,props);
    if(props.group=='retroativos')editModalStore.modal(AddEditRealizado,props);
}
onMounted(()=>{start()});
onUpdated(()=>{start()});

async function onSubmit(values) {
    try {
        var msg;
        var r;
        values.inicio_medicao = fieldToDate(values.inicio_medicao);
        values.fim_medicao = fieldToDate(values.fim_medicao);
        values.regionalizavel = !!values.regionalizavel;
        values.nivel_regionalizacao = values.regionalizavel ? Number(values.nivel_regionalizacao) : null;
        
        //Parent
        if(atividade_id){
            values.atividade_id = Number(atividade_id);
        }else if(iniciativa_id){
            values.iniciativa_id = Number(iniciativa_id);
        }else{
            values.meta_id = Number(meta_id);
        }

        if (indicador_id) {

            values.formula = formula.value;
            let er = await validadeFormula(values.formula);
            if(er){
                errFormula.value = er;
                throw 'Erro na fórmula';
            }
            values.formula_variaveis = Object.values(variaveisFormula).map(x=>{
                return {
                    referencia:x.id.substring(1),
                    janela: x.periodo==0 ? x.meses : x.periodo==-1 ? x.meses*-1 : 1,
                    variavel_id:x.variavel_id,
                    usar_serie_acumulada:!!x.usar_serie_acumulada,
                };
            });

            if(singleIndicadores.value.id){
                r = await IndicadoresStore.update(singleIndicadores.value.id, values);
                MetasStore.clear();
                IndicadoresStore.clear();
                msg = 'Dados salvos com sucesso!';
            }
        } else {
            r = await IndicadoresStore.insert(values);
            MetasStore.clear();
            IndicadoresStore.clear();
            msg = 'Item adicionado com sucesso!';
        }
        if(r == true){
            MetasStore.clear();
            alertStore.success(msg);
            router.push(parentlink);
        }
    } catch (error) {
        alertStore.error(error);
    }
}
async function checkDelete(id) {
    if (id) {
        if(singleIndicadores.value.id){
            alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{
                if(await IndicadoresStore.delete(id)){
                    IndicadoresStore.clear();
                    await router.push(parentlink);
                    alertStore.success('Indicador removido.');
                }
            },'Remover');
        }
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?',parentlink);
}
function maskMonth(el){
    var kC = event.keyCode;
    var data = el.target.value.replace(/[^0-9/]/g,'');
    if( kC!=8 && kC!=46 ){
        if( data.length==2 ){
            el.target.value = data += '/';
        }else{
            el.target.value = data;
        }
    }
}
function fieldToDate(d){
    if(d){
        if(d.length==6){d = '01/0'+d;}
        else if(d.length==7){d = '01/'+d;}
        var x=d.split('/');
        return (x.length==3) ? new Date(Date.UTC(x[2],x[1]-1,x[0])).toISOString().substring(0, 10) : null;
    }
    return null;
}

//Formula
async function validadeFormula(f){
    try { 
        if(typeof window.formula_parser !== 'undefined'){
            window.formula_parser.parse(f.toLocaleUpperCase());
            return false;
        }
    } catch (e) {
        return e.hash;
    }
}
function getCaretPosition(editableDiv) {
    var caretPos = [0,0],
        sel, 
        range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            if (range.commonAncestorContainer.parentNode == editableDiv) {
                let pi = Array.from(editableDiv.childNodes).findIndex(x=>x==range.commonAncestorContainer);
                caretPos = [pi??0,range.endOffset];
            }
        }
    }
    currentCaretPos = caretPos;
    return caretPos;
}
function setCaret(el,p) {
    var range = document.createRange();
    var sel = window.getSelection();
    
    sel.removeAllRanges();
    range.selectNodeContents(el);
    if(p){
        console.log(el.childNodes[p[0]]);
        range.setStart(el.childNodes[p[0]], p[1]);
    }
    range.collapse(true);
    sel.addRange(range);
    el.focus();
}
function labelPeriodo(p,m){
    if(p==0 && m>1){
        return m+' meses atrás';
    }else if(p==-1){
        return 'Média dos últimos '+m+' meses';
    }else{
        return 'Mês corrente';
    }
}
function formatFormula(p){
    var regex = /\$\_[\d]{0,5}/gm;
    formulaInput.value.innerHTML = formula.value.replace(regex,(m,g1)=>{ 
        let r = m;
        if(variaveisFormula[m]){
            let n = variaveisFormula[m].variavel_id;
            let t = '';
            if(Variaveis.value[indicador_id]?.length){
                let v = Variaveis.value[indicador_id].find(x=>x.id == variaveisFormula[m].variavel_id);
                if(v){
                    n = `${v.codigo} - ${v.titulo}`;
                    t = labelPeriodo(variaveisFormula[m].periodo,variaveisFormula[m].meses);
                }

            }

            r = `<span class="v" contenteditable="false"
                data-id="${m}" 
                data-var="${n}"
                title="${t}"
            >${m}</span>&nbsp;`;
        }
        return r;
    });
    
    if(p){
        console.log(p);
        let i = Array.from(formulaInput.value.childNodes).findIndex(x=>{return x?.dataset?.id == p; });
        setCaret(formulaInput.value,[i+1,0]);
    }
}
function editFormula(e) {
    let f = e.target;
    let v = f.innerText;
    getCaretPosition(f);
    formula.value = v;
    if(e.data=='$'){
        document.execCommand("insertText", false, "xxx")
        v = f.innerText;
        formula.value = v;
        newVariavel();
        return;
    }
}
function trackClickFormula(e) {
    let id = e.target?.dataset?.id;
    if(id){
        editVariavel(id);
    }
    getCaretPosition(e.target);
}
function newVariavel() {
    let vs = variaveisFormula?Object.keys(variaveisFormula):[];
    let next = vs.length? '$_'+(Number(vs[vs.length-1].replace('$_',''))+1) : '$_1';
    fieldsVariaveis.value = {
        id: next
    };
    formatFormula(next);
    variaveisFormulaModal.value = 1;
}
function editVariavel(id) {
    if(variaveisFormula[id]){
        fieldsVariaveis.value = variaveisFormula[id];
        variaveisFormulaModal.value = 1;
    }
}
function saveVar(e) {
    e.preventDefault();
    let nova = !variaveisFormula[fieldsVariaveis.value.id];
    variaveisFormula[fieldsVariaveis.value.id] = fieldsVariaveis.value;
    variaveisFormulaModal.value = 0;
    if(nova){
        let v = formula.value;
        let i = v.indexOf('$xxx');
        let id = fieldsVariaveis.value.id;
        formula.value = [v.slice(0, i), id, v.slice(i+4)].join('');
    }
    formatFormula(fieldsVariaveis.value.id);
}
function cancelVar() {
    let v = formula.value;
    let i = v.indexOf('$xxx');
    if(i!=-1) formula.value = [v.slice(0, i), v.slice(i+4)].join('');
    formatFormula(fieldsVariaveis.value.id);
    variaveisFormulaModal.value=0;
}
async function addFunction(f){
    await setCaret(formulaInput.value,currentCaretPos);
    document.execCommand("insertText", false, f);
}
</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <div v-if="atividade_id" class="t24 mb2">{{activePdm.rotulo_atividade}} {{singleAtividade.codigo}} {{singleAtividade.titulo}}</div>
        <div v-else-if="iniciativa_id" class="t24 mb2">{{activePdm.rotulo_iniciativa}} {{singleIniciativa.codigo}} {{singleIniciativa.titulo}}</div>
        <div v-else-if="meta_id" class="t24 mb2">Meta {{singleMeta.codigo}} {{singleMeta.titulo}}</div>

        <template v-if="!(singleIndicadores?.loading || singleIndicadores?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="indicador_id?singleIndicadores:{}" v-slot="{ errors, isSubmitting }">
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Código <span class="tvermelho">*</span></label>
                        <Field name="codigo" type="text" class="inputtext light mb1" :class="{ 'error': errors.codigo }" />
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
                        <label class="label">Polaridade <span class="tvermelho">*</span></label>
                        <Field name="polaridade" as="select" class="inputtext light mb1" :class="{ 'error': errors.polaridade }">
                            <option value="">Selecionar</option>
                            <option value="Neutra">Neutra</option>
                            <option value="Positiva">Positiva</option>
                            <option value="Negativa">Negativa</option>
                        </Field>
                        <div class="error-msg">{{ errors.polaridade }}</div>
                    </div>
                    <div class="f1">
                        <label class="label flex center">Periodicidade <span class="tvermelho">*</span></label>

                        <Field v-if="!indicador_id" name="periodicidade" as="select" class="inputtext light mb1" :class="{ 'error': errors.periodicidade }">
                            <option value="">Selecionar</option>
                            <option value="Mensal">Mensal</option>
                            <option value="Bimestral">Bimestral</option>
                            <option value="Trimestral">Trimestral</option>
                            <option value="Quadrimestral">Quadrimestral</option>
                            <option value="Semestral">Semestral</option>
                            <option value="Anual">Anual</option>
                        </Field>
                        <div class="flex center" v-else>
                            <Field name="periodicidade" type="text" class="inputtext light mb1" disabled :class="{ 'error': errors.periodicidade }" />
                            <div class="tipinfo right ml1"><svg width="20" height="20"><use xlink:href="#i_i"></use></svg><div>Não é permitida a troca da periodicidade</div></div>
                        </div>
                        <div class="error-msg">{{ errors.periodicidade }}</div>
                    </div>
                </div>
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Início da Medição <span class="tvermelho">*</span></label>
                        <Field name="inicio_medicao" type="text" class="inputtext light mb1" :class="{ 'error': errors.inicio_medicao }" maxlength="7" @keyup="maskMonth" />
                        <div class="error-msg">{{ errors.inicio_medicao }}</div>
                    </div>
                    <div class="f1">
                        <label class="label">Fim da Medição <span class="tvermelho">*</span></label>
                        <Field name="fim_medicao" type="text" class="inputtext light mb1" :class="{ 'error': errors.fim_medicao }" maxlength="7" @keyup="maskMonth" />
                        <div class="error-msg">{{ errors.fim_medicao }}</div>
                    </div>
                </div>

                <div class="" v-if="!indicador_id">
                    <div class="mb1">
                        <label class="block">
                            <Field name="regionalizavel" v-model="regionalizavel" type="checkbox" value="1" class="inputcheckbox" /><span :class="{ 'error': errors.regionalizavel }">Indicador regionalizável</span>
                        </label>
                        <div class="error-msg">{{ errors.regionalizavel }}</div>
                    </div>
                    <div class="" v-if="regionalizavel">
                        <label class="label">Nível de regionalização <span class="tvermelho">*</span></label>
                        <Field name="nivel_regionalizacao" v-model="nivel_regionalizacao" as="select" class="inputtext light mb1" :class="{ 'error': errors.nivel_regionalizacao }">
                            <option value="">Selecione</option>
                            <option value="2">Região</option>
                            <option value="3">Subprefeitura</option>
                            <option value="4">Distrito</option>
                        </Field>
                        <div class="error-msg">{{ errors.nivel_regionalizacao }}</div>
                    </div>
                </div>
                <div class="" v-else>
                    <div class="mb1">
                        <label class="flex">
                            <Field v-slot="{ field }" name="regionalizavel" type="checkbox" :value="true">
                                <input type="checkbox" name="regionalizavel" v-bind="field" :value="true" class="inputcheckbox" disabled/>
                                <span>Indicador regionalizável</span>
                            </Field>
                            <div class="tipinfo ml1"><svg width="20" height="20"><use xlink:href="#i_i"></use></svg><div>Não é permitida a troca da regionalização</div></div>
                        </label>
                        <div class="error-msg">{{ errors.regionalizavel }}</div>
                    </div>

                    <div v-if="singleIndicadores.nivel_regionalizacao">
                        <label class="label">Nível de regionalização <span class="tvermelho">*</span></label>
                        <Field name="nivel_regionalizacao" v-model="nivel_regionalizacao" disabled as="select" class="inputtext light mb1" :class="{ 'error': errors.nivel_regionalizacao }">
                            <option value="">Selecione</option>
                            <option value="2">Região</option>
                            <option value="3">Subprefeitura</option>
                            <option value="4">Distrito</option>
                        </Field>
                        <div class="error-msg">{{ errors.nivel_regionalizacao }}</div>
                    </div>
                </div>
                <hr class="mt2 mb2" />
                <div class="f1">
                    <label class="label">Contexto</label>
                    <Field name="contexto" as="textarea" rows="3" class="inputtext light mb1" :class="{ 'error': errors.contexto }" />
                    <div class="error-msg">{{ errors.contexto }}</div>
                </div>
                <div class="f2">
                    <label class="label">Complemento</label>
                    <Field name="complemento" as="textarea" rows="3" class="inputtext light mb1" :class="{ 'error': errors.complemento }" />
                    <div class="error-msg">{{ errors.complemento }}</div>
                </div>
                
                <hr class="mt2 mb2">

                <div v-if="indicador_id&&!Variaveis[indicador_id]?.loading">
                    <label class="label">Fórmula do Agregador <span class="tvermelho">*</span></label>
                    <div class="inputtext light mb1">
                        <div class="formula" contenteditable="true" ref="formulaInput" @input="editFormula" @click="trackClickFormula"></div>
                    </div>
                    <p class="error-msg" v-if="errFormula">{{errFormula}}</p>
                    <p class="tc300 mb1">Passe o mouse sobre as variáves para detalhes sobre o período e operação</p>

                    <label class="label">Adicionar operadores </label>
                    <div class="formula">
                        <span readonly="readonly" class="v" @click="newVariavel">Variável</span>
                        <span readonly="readonly" class="op" @click="addFunction('*')">*</span>
                        <span readonly="readonly" class="op" @click="addFunction('/')">/</span>
                        <span readonly="readonly" class="op" @click="addFunction('-')">-</span>
                        <span readonly="readonly" class="op" @click="addFunction('+')">+</span>
                        <span readonly="readonly" class="op" @click="addFunction('^')">^</span>
                        <span readonly="readonly" class="op" @click="addFunction('FLOOR()')">FLOOR</span>
                        <span readonly="readonly" class="op" @click="addFunction('CEIL()')">CEIL</span>
                        <span readonly="readonly" class="op" @click="addFunction('ROUND()')">ROUND</span>
                        <span readonly="readonly" class="op" @click="addFunction('ABS()')">ABS</span>
                        <span readonly="readonly" class="op" @click="addFunction('DIV()')">DIV</span>
                        <span readonly="readonly" class="op" @click="addFunction('MOD()')">MOD</span>
                        <span readonly="readonly" class="op" @click="addFunction('LOG()')">LOG</span>
                        <span readonly="readonly" class="op" @click="addFunction('LN()')">LN</span>
                        <span readonly="readonly" class="op" @click="addFunction('FACTORIAL()')">FACTORIAL</span>
                    </div>
                </div>
                <div v-else-if="Variaveis[indicador_id]?.loading">
                    <span class="spinner">Carregando</span>
                </div>

                <div class="flex spacebetween center mt2 mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">Salvar</button>
                    <hr class="ml2 f1"/>
                </div>
            </Form>
            <template v-if="indicador_id&&!Variaveis[indicador_id]?.loading">
                <SmallModal :active="variaveisFormulaModal" @close="()=>{variaveisFormulaModal=!variaveisFormulaModal;}">
                    <form @submit="saveVar">
                        <h2 class="mb2">Adicionar Variável</h2>
                        <input type="hidden" name="id" v-model="fieldsVariaveis.id" class="inputtext light mb1" />
                        <label class="label">Variável</label>
                        <select class="inputtext light mb1" name="variavel_id" v-model="fieldsVariaveis.variavel_id">
                            <option value :selected="!fieldsVariaveis.variavel_id">Selecionar</option>
                            <option v-for="v in Variaveis[indicador_id]" :key="v.id" :value="v.id">{{v.codigo}} - {{v.titulo}}</option>
                        </select>
                        <label class="block mb1"><input type="radio" class="inputcheckbox" v-model="fieldsVariaveis.periodo" value="1"><span>Mês corrente</span></label>
                        <label class="block mb1"><input type="radio" class="inputcheckbox" v-model="fieldsVariaveis.periodo" value="-1"><span>Média</span></label>
                        <label class="block mb1"><input type="radio" class="inputcheckbox" v-model="fieldsVariaveis.periodo" value="0"><span>Mês anterior</span></label>

                        <label class="block mt2 mb2"><input type="checkbox" class="inputcheckbox" value="1" v-model="fieldsVariaveis.usar_serie_acumulada"><span>Utilizar valores acumulados</span></label>
                        
                        <label class="label">Meses</label>
                        <input type="number" name="meses" v-model="fieldsVariaveis.meses" min="1" required class="inputtext light mb1" />

                        <p class="t300 tc500">Para média, deixar o campo acima em branco considera todo o período. <br>Para uma média móvel, insira o numero de meses considerados.<br>Para ”mes anterior”, indique quantos meses atrás em relação ao mês corrente está o valor da variável.</p>

                        <div class="tc">
                            <a class="btn outline bgnone tcprimary" @click="cancelVar()">Cancelar</a>
                            <button class="ml1 btn" @click="">Salvar</button>
                        </div>
                    </form>
                </SmallModal>
            </template>
        </template>
        <template v-if="singleIndicadores?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="singleIndicadores?.error||error">
            <div class="error p1">
                <div class="error-msg">{{singleIndicadores.error??error}}</div>
            </div>
        </template>
        <template v-if="(!indicador_id&&singleIndicadores.length)">
            <div class="error p1">
                <div class="error-msg">Somente um indicador por meta</div>
            </div>
            <div class="tc">
                <router-link :to="`${parentlink}`" class="btn big mt1 mb1"><span>Voltar</span></router-link>
            </div>
        </template>

        <div v-if="indicador_id">
            <div class="t12 uc w700 mb2">Variáveis</div>
            <template v-if="Variaveis[indicador_id]?.loading">
                <span class="spinner">Carregando</span>
            </template>
            <table class="tablemain mb1" v-if="!Variaveis[indicador_id]?.loading">
                <thead>
                    <tr>
                        <th style="width:13.3%;">Título</th>
                        <th style="width:13.3%;">Valor base</th>
                        <th style="width:13.3%;">Unidade</th>
                        <th style="width:13.3%;">Peso</th>
                        <th style="width:13.3%;">Casas decimais</th>
                        <th style="width:13.3%;">Região</th>
                        <th style="width:20%"></th>
                    </tr>
                </thead>
                <tr v-for="v in Variaveis[indicador_id]" :key="v.id">
                    <td>{{v.titulo}}</td>
                    <td>{{v.valor_base}}</td>
                    <td>{{v.unidade_medida?.sigla}}</td>
                    <td>{{v.peso}}</td>
                    <td>{{v.casas_decimais}}</td>
                    <td>{{v.regiao?.descricao??'-'}}</td>
                    <td style="white-space: nowrap; text-align: right;">
                        <router-link :to="`${parentlink}/indicadores/${indicador_id}/variaveis/novo/${v.id}`" class="tipinfo tprimary"><svg width="20" height="20"><use xlink:href="#i_copy"></use></svg><div>Duplicar</div></router-link>
                        <router-link :to="`${parentlink}/indicadores/${indicador_id}/variaveis/${v.id}`" class="tipinfo tprimary ml1"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg><div>Editar</div></router-link>
                        <router-link :to="`${parentlink}/indicadores/${indicador_id}/variaveis/${v.id}/valores`" class="tipinfo right tprimary ml1"><svg width="20" height="20"><use xlink:href="#i_valores"></use></svg><div>Valores Previstos e Acumulados</div></router-link>
                        <router-link v-if="perm.CadastroPessoa?.administrador" :to="`${parentlink}/indicadores/${indicador_id}/variaveis/${v.id}/retroativos`" class="tipinfo right tprimary ml1"><svg width="20" height="20"><use xlink:href="#i_check"></use></svg><div>Valores Realizados Retroativos</div></router-link>
                    </td>
                </tr>
            </table>
            <router-link :to="`${parentlink}/indicadores/${indicador_id}/variaveis/novo`" class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar variável</span></router-link>
        </div>

        <template v-if="indicador_id&&singleIndicadores.id&&indicador_id==singleIndicadores.id">
            <hr class="mt2 mb2"/>
            <button @click="checkDelete(singleIndicadores.id)" class="btn amarelo big">Remover item</button>
        </template>
    </Dashboard>
</template>
