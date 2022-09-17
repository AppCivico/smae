<script setup>
import { ref, unref,onMounted, onUpdated } from 'vue';
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { useEditModalStore, useAlertStore, useAuthStore, useMetasStore, useIndicadoresStore, useVariaveisStore } from '@/stores';
import { default as AddEditVariavel } from '@/views/metas/AddEditVariavel.vue';
import { default as AddEditValores } from '@/views/metas/AddEditValores.vue';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const meta_id = route.params.meta_id;
const id = route.params.indicador_id;

const props = defineProps(['group']);

const MetasStore = useMetasStore();
const { singleMeta } = storeToRefs(MetasStore);
MetasStore.getById(meta_id);

const IndicadoresStore = useIndicadoresStore();
const { Indicadores, tempIndicadores, agregadores } = storeToRefs(IndicadoresStore);
IndicadoresStore.getAgregadores();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const VariaveisStore = useVariaveisStore();
const { Variaveis,Valores } = storeToRefs(VariaveisStore);

var regx = /^$|^(?:0[1-9]|1[0-2]|[1-9])\/(?:(?:1[9]|[2-9]\d)?\d{2})$/;

const schema = Yup.object().shape({
    codigo: Yup.string().required('Preencha o código'), //  : "string",
    titulo: Yup.string().required('Preencha o título'), //  : "string",
    polaridade: Yup.string().required('Selecione a polaridade'), //  : "Neutra",
    periodicidade: Yup.string().required('Selecione a periodicidade'), //  : "Diario",
    
    inicio_medicao: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'), //  : "YYYY-MM-DD",
    fim_medicao: Yup.string().required('Preencha a data').matches(regx,'Formato inválido'), //  : "YYYY-MM-DD",
    
    agregador_id: Yup.string().required(), //  : 1,
    janela_agregador: Yup.string().nullable().when('agregador_id', (agregador_id, schema) => {
        return agregador_id&&agregador_id==3 ? schema.required('Preencha um valor') : schema;
    }),
    meta_id: Yup.string().nullable(), //  : 1
    regionalizavel: Yup.string().nullable(),
    nivel_regionalizacao: Yup.string().nullable().when('regionalizavel', (regionalizavel, field) => regionalizavel=="1" ? field.required("Selecione o nível") : field),
});

let title = 'Adicionar Indicador';
let agregador_id = ref(tempIndicadores.value.agregador_id);
let regionalizavel = ref(tempIndicadores.value.regionalizavel);

if (id) {
    title = 'Editar Indicador';
    IndicadoresStore.getById(meta_id,id);
    VariaveisStore.getAll(id);
}else{
    IndicadoresStore.getAll(meta_id);
}
function start(){
    if(props.group=='variaveis')editModalStore.modal(AddEditVariavel,props);
    if(props.group=='valores')editModalStore.modal(AddEditValores,props);
}
onMounted(()=>{start()});
onUpdated(()=>{start()});

function fieldToDate(d){
    if(d){
        if(d.length==6){d = '01/0'+d;}
        else if(d.length==7){d = '01/'+d;}
        var x=d.split('/');
        return (x.length==3) ? new Date(x[2],x[1]-1,x[0]).toISOString().substring(0, 10) : null;
    }
    return null;
}
async function onSubmit(values) {
    try {
        var msg;
        var r;
        values.inicio_medicao = fieldToDate(values.inicio_medicao);
        values.fim_medicao = fieldToDate(values.fim_medicao);
        values.meta_id = Number(values.meta_id);
        values.janela_agregador = values.janela_agregador??null;
        values.regionalizavel = !!values.regionalizavel;
        values.nivel_regionalizacao = values.regionalizavel ? Number(values.nivel_regionalizacao) : null;

        if (id) {
            if(tempIndicadores.value.id){
                r = await IndicadoresStore.update(tempIndicadores.value.id, values);
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
            router.push('/metas/'+meta_id);
            alertStore.success(msg);
            return;
        }
    } catch (error) {
        alertStore.error(error);
    }
}
async function checkDelete(id) {
    if (id) {
        if(tempIndicadores.value.id){
            alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{
                if(await IndicadoresStore.delete(id)){
                    IndicadoresStore.clear();
                    await router.push('/metas/'+meta_id);
                    alertStore.success('Indicador removido.');
                }
            },'Remover');
        }
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?','/metas/'+meta_id);
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
</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <div class="t24 mb2">Meta {{singleMeta.codigo}} {{singleMeta.titulo}}</div>

        <template v-if="!(tempIndicadores?.loading || tempIndicadores?.error || Indicadores?.loading)&&!(!id&&Indicadores.length)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="id?tempIndicadores:{}" v-slot="{ errors, isSubmitting }">
                <Field name="meta_id" type="hidden" :value="meta_id"/>
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

                        <Field v-if="!id" name="periodicidade" as="select" class="inputtext light mb1" :class="{ 'error': errors.periodicidade }">
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
                <div class="flex g2">
                    <div class="f1">
                        <label class="label">Agregador <span class="tvermelho">*</span></label>
                        <Field name="agregador_id" v-model="agregador_id" as="select" class="inputtext light mb1" :class="{ 'error': errors.agregador_id }">
                            <option v-for="a in agregadores" :value="a.id">{{a.descricao}}</option>
                        </Field>
                        <div class="error-msg">{{ errors.agregador_id }}</div>
                    </div>
                    <div class="f1" v-if="agregador_id?agregador_id==3:tempIndicadores.agregador_id==3">
                        <label class="label">Janela (ciclos) <span class="tvermelho">*</span></label>
                        <Field name="janela_agregador" type="text" class="inputtext light mb1" :class="{ 'error': errors.janela_agregador }" />
                        <div class="error-msg">{{ errors.janela_agregador }}</div>
                    </div>
                </div>

                <div class="" v-if="!id">
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

                    <div v-if="tempIndicadores.nivel_regionalizacao">
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

                <div class="flex spacebetween center mb2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">Salvar</button>
                    <hr class="ml2 f1"/>
                </div>
            </Form>
        </template>
        <template v-if="tempIndicadores?.loading||Indicadores?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="tempIndicadores?.error||error">
            <div class="error p1">
                <div class="error-msg">{{tempIndicadores.error??error}}</div>
            </div>
        </template>
        <template v-if="(!id&&Indicadores.length)">
            <div class="error p1">
                <div class="error-msg">Somente um indicador por meta</div>
            </div>
            <div class="tc">
                <router-link :to="`/metas/${meta_id}`" class="btn big mt1 mb1"><span>Voltar</span></router-link>
            </div>
        </template>

        <div v-if="id">
            <div class="t12 uc w700 mb2">Variáveis</div>
            <template v-if="Variaveis?.loading">
                <span class="spinner">Carregando</span>
            </template>
            <table class="tablemain mb1" v-if="!Variaveis?.loading">
                <thead>
                    <tr>
                        <th style="width:15%;">Título</th>
                        <th style="width:15%;">Valor base</th>
                        <th style="width:15%;">Unidade</th>
                        <th style="width:15%;">Peso</th>
                        <th style="width:15%;">Casas decimais</th>
                        <th style="width:15%;">Região</th>
                        <th style="width:10%"></th>
                    </tr>
                </thead>
                <tr v-for="v in Variaveis[id]">
                    <td>{{v.titulo}}</td>
                    <td>{{v.valor_base}}</td>
                    <td>{{v.unidade_medida?.sigla}}</td>
                    <td>{{v.peso}}</td>
                    <td>{{v.casas_decimais}}</td>
                    <td>{{v.regiao?.descricao}}</td>
                    <td style="white-space: nowrap; text-align: right;">
                        <router-link :to="`/metas/${meta_id}/indicadores/${id}/variaveis/${v.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                        <router-link :to="`/metas/${meta_id}/indicadores/${id}/variaveis/${v.id}/valores`" class="tprimary ml1"><svg width="20" height="20"><use xlink:href="#i_valores"></use></svg></router-link>
                    </td>
                </tr>
            </table>
            <router-link :to="`/metas/${meta_id}/indicadores/${id}/variaveis/novo`" class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar variável</span></router-link>
        </div>

        <template v-if="id&&tempIndicadores.id&&id==tempIndicadores.id">
            <hr class="mt2 mb2"/>
            <button @click="checkDelete(tempIndicadores.id)" class="btn amarelo big">Remover item</button>
        </template>
    </Dashboard>
</template>
