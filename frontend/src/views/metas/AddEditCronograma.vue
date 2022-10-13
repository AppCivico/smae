<script setup>
import { ref } from 'vue';
import { Dashboard} from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { useAlertStore, useMetasStore, useIniciativasStore, useAtividadesStore, useCronogramasStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;
const atividade_id = route.params.atividade_id;
const cronograma_id = route.params.cronograma_id;

const MetasStore = useMetasStore();
const { activePdm ,singleMeta } = storeToRefs(MetasStore);
MetasStore.getById(meta_id);

const parentlink = `${meta_id?'/metas/'+meta_id:''}${iniciativa_id?'/iniciativas/'+iniciativa_id:''}${atividade_id?'/atividades/'+atividade_id:''}`;
const parentVar = atividade_id??iniciativa_id??meta_id??false;
const parentField = atividade_id?'atividade_id':iniciativa_id?'iniciativa_id':meta_id?'meta_id':false;
let parentLabel = ref(atividade_id?'-':iniciativa_id?'-':meta_id?'Meta':false);
(async()=>{
    await MetasStore.getPdM();
    if(atividade_id) parentLabel.value = activePdm.value.rotulo_atividade;
    else if(iniciativa_id) parentLabel.value = activePdm.value.rotulo_iniciativa;
})();

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
if(iniciativa_id)IniciativasStore.getById(meta_id,iniciativa_id);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);
if(atividade_id)AtividadesStore.getById(iniciativa_id,atividade_id);

const parentItem = atividade_id?singleAtividade:iniciativa_id?singleIniciativa:meta_id?singleMeta:false;

const CronogramasStore = useCronogramasStore();
const { singleCronograma } = storeToRefs(CronogramasStore);

const schema = Yup.object().shape({
    descricao: Yup.string().required('Preencha o código'), //  : "string",
    observacao: Yup.string().nullable(), //  : "string",
    regionalizavel: Yup.string().nullable(),
    nivel_regionalizacao: Yup.string().nullable().when('regionalizavel', (regionalizavel, field) => regionalizavel=="1" ? field.required("Selecione o nível") : field),
});

let title = 'Adicionar Cronograma';
let regionalizavel = ref(singleCronograma.value.regionalizavel);

if (cronograma_id) {
    title = 'Editar Cronograma';
    CronogramasStore.getById(parentVar,parentField,cronograma_id);
}
function toggleAccordeon(t) {
    t.target.closest('.tzaccordeon').classList.toggle('active');
}

async function onSubmit(values) {
    try {
        var msg;
        var r;
        values.regionalizavel = !!values.regionalizavel;
        values.nivel_regionalizacao = values.regionalizavel ? Number(values.nivel_regionalizacao) : null;
        
        //Parent
        values[parentField] = Number(parentVar);

        if (cronograma_id) {
            if(singleCronograma.value.id){
                r = await CronogramasStore.update(singleCronograma.value.id, values);
                CronogramasStore.clear();
                msg = 'Dados salvos com sucesso!';
            }
        } else {
            r = await CronogramasStore.insert(values);
            CronogramasStore.clear();
            msg = 'Item adicionado com sucesso!';
        }
        if(r){
            router.push(`${parentlink}/cronograma`);
            alertStore.success(msg);
            return;
        }
    } catch (error) {
        alertStore.error(error);
    }
}
async function checkDelete(id) {
    if (id) {
        if(singleCronograma.value.id){
            alertStore.confirmAction('Deseja mesmo remover esse item?',async()=>{
                if(await CronogramasStore.delete(id)){
                    CronogramasStore.clear();
                    await router.push(`${parentlink}/cronograma`);
                    alertStore.success('Cronograma removido.');
                }
            },'Remover');
        }
    }
}
async function checkClose() {
    alertStore.confirm('Deseja sair sem salvar as alterações?',`${parentlink}/cronograma`);
}
</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center">
            <h1>{{title}}</h1>
            <hr class="ml2 f1"/>
            <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
        </div>
        <div v-if="parentItem" class="t24 mb2">{{parentLabel}} {{parentItem.codigo}} {{parentItem.titulo}}</div>

        <template v-if="!(singleCronograma?.loading || singleCronograma?.error)">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="cronograma_id?singleCronograma:{}" v-slot="{ errors, isSubmitting }">
                <div class="f1">
                    <label class="label">Descrição <span class="tvermelho">*</span></label>
                    <Field name="descricao" as="textarea" rows="3" class="inputtext light mb1" :class="{ 'error': errors.descricao }" />
                    <div class="error-msg">{{ errors.descricao }}</div>
                </div>
                <div class="f2">
                    <label class="label">Observação</label>
                    <Field name="observacao" as="textarea" rows="3" class="inputtext light mb1" :class="{ 'error': errors.observacao }" />
                    <div class="error-msg">{{ errors.observacao }}</div>
                </div>
                
                <hr class="mt2 mb2" />
                
                <div class="" v-if="!cronograma_id">
                    <div class="mb1">
                        <label class="block">
                            <Field name="regionalizavel" v-model="regionalizavel" type="checkbox" value="1" class="inputcheckbox" /><span :class="{ 'error': errors.regionalizavel }">Cronograma regionalizável</span>
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
                                <span>Cronograma regionalizável</span>
                            </Field>
                            <div class="tipinfo ml1"><svg width="20" height="20"><use xlink:href="#i_i"></use></svg><div>Não é permitida a troca da regionalização</div></div>
                        </label>
                        <div class="error-msg">{{ errors.regionalizavel }}</div>
                    </div>

                    <div v-if="singleCronograma.nivel_regionalizacao">
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
        <template v-if="singleCronograma?.loading">
            <span class="spinner">Carregando</span>
        </template>
        <template v-if="singleCronograma?.error||error">
            <div class="error p1">
                <div class="error-msg">{{singleCronograma.error??error}}</div>
            </div>
        </template>
        <template v-if="(!cronograma_id&&singleCronograma.length)">
            <div class="error p1">
                <div class="error-msg">Somente um indicador por meta</div>
            </div>
            <div class="tc">
                <router-link :to="`${parentlink}`" class="btn big mt1 mb1"><span>Voltar</span></router-link>
            </div>
        </template>

        <template v-if="cronograma_id&&singleCronograma.id&&cronograma_id==singleCronograma.id">
            <hr class="mt2 mb2"/>
            <button @click="checkDelete(singleCronograma.id)" class="btn amarelo big">Remover item</button>
        </template>

    <!-- CODIGO NOVO -->
        <hr class="mt2 mb2"/>
        <template v-if="cronograma_id&&singleCronograma.id&&cronograma_id==singleCronograma.id">
          
            <h5 class="tc600 uppercase">SUB-ETAPAS E ATIVIDADES</h5>
            <div class="etapa-edit">
                    <!--SUB LIST -->
                    <div class="etapa-edit sub">
                      
                      
                        <div class="tzaccordeon"  @click="toggleAccordeon">
                            <div class="flex">
                            <svg class="arrow" width="13" height="8"><use xlink:href="#i_down"></use></svg>
                            <div class="title "><span class="status ">2.1</span> Execução da obras de telecomunicação</div>
                            </div>

                            <div class="content">
                              
                          
                                <div class="flex center mb05 tc300 w700 t12 uc">
                                    <div class="ml2 f1">Início Prev.</div>
                                    <div class="ml1 f1">Término Prev.</div>
                                    <div class="ml1 f1">Duração</div>
                                    <div class="ml1 f1">Início Real</div>
                                    <div class="ml1 f1">Término Real</div>
                                    <div class="ml1 f1">Atraso</div>
                                    <div class="ml1 f0" style="flex-basis:20px;"></div>
                                </div>
                                <hr/>
                                
                                <div class="flex center t13">
                                    <div class="ml2 f1">05/05/2022</div>
                                    <div class="ml1 f1">05/08/2022</div>
                                    <div class="ml1 f1">120 dias</div>
                                    <div class="ml1 f1">05/05/2022</div>
                                    <div class="ml1 f1">-</div>
                                    <div class="ml1 f1">-</div>
                                    <div class="ml1 f0 flex center mr05" style="flex-basis:20px; height: calc(20px + 1rem);">
                                        <a href="/metas/editar/40/44" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></a>
                                    </div>
                                </div>
                                <hr class="mb3" />
                                
                                
                                <!-- SUB LIST -->
                                <div class="list mt2">
                                    <div class="flex center mb05 tc300 w700 t12 uc ">
                                        <div class="ml2 f1">SUBFASE</div>
                                        <div class="ml1 f1">início prev.</div>
                                        <div class="ml1 f1">Término Prev.</div>
                                        <div class="ml1 f1">Duração</div>
                                        <div class="ml1 f1">Início Real</div>
                                        <div class="ml1 f1">Término Real</div>
                                        <div class="ml1 f1">Atraso</div>
                                        <div class="ml1 f0" style="flex-basis:20px;"></div>

                                    </div>
                                    <hr/>
                                    
                                    <div class="flex center t13">
                                        <div class="ml2 f1"><span  class="farol">x</span> Solicitar Licenças</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f0 flex center mr05" style="flex-basis:20px; height: calc(20px + 1rem);">
                                            <a href="/metas/editar/40/44" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></a>
                                        </div>
                                    </div>
                                    <hr class="mb05" />

                                    <div class="flex center t13">
                                        <div class="ml2 f1"><span  class="farol">x</span> Solicitar Licenças</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f1">LIST</div>
                                        <div class="ml1 f0 flex center mr05" style="flex-basis:20px; height: calc(20px + 1rem);">
                                            <a href="/metas/editar/40/44" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></a>
                                        </div>
                                    </div>
                                    <hr class="mb1" />
                                    
                                    <div class="flex ml2 center t12 w700">
                                    <a href="#" ><svg width="20" height="20" class="flex" style="margin-top: -0.2rem;margin-right: 0.2rem;"><use xlink:href="#i_+"></use></svg> ADICIONAR ATIVIDADE</a>
                                    </div>
                                    <hr class="mt1" />

                                </div>

                                 
                            </div>
                            <div class="flex mt2 center t12 w700">
                              <a href="#" ><svg width="20" height="20" class="flex" style="margin-top: -0.2rem;margin-right: 0.2rem;display: inline-flex;"><use xlink:href="#i_+"></use></svg> ADICIONAR SUB-ETAPA</a>
                            </div>
                                  
                        </div>
                    
                    </div>
            </div>
        
          <div class="flex spacebetween center mb2 mt2">
                    <hr class="mr2 f1"/>
                    <button class="btn big" :disabled="isSubmitting">SALVAR ALTERAÇÕES</button>
                    <hr class="ml2 f1"/>
                </div>
        </template>
   

 






    </Dashboard>
</template>
