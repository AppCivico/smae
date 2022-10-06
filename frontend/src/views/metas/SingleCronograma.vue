<script setup>
import { reactive, onMounted, onUpdated } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { default as Breadcrumb } from '@/components/metas/BreadCrumb.vue';
import { useEditModalStore, useAuthStore, useCronogramasStore } from '@/stores';
import { useRoute } from 'vue-router';
import { default as AddEditEtapa } from '@/views/metas/AddEditEtapa.vue';
import { default as AddEditMonitorar } from '@/views/metas/AddEditMonitorar.vue';


const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const props = defineProps(['group','recorte']);
const route = useRoute();
let meta_id = reactive(route.params.meta_id);
let iniciativa_id = reactive(route.params.iniciativa_id);
let atividade_id = reactive(route.params.atividade_id);

let parentlink = `${meta_id?'/metas/'+meta_id:''}${iniciativa_id?'/iniciativas/'+iniciativa_id:''}${atividade_id?'/atividades/'+atividade_id:''}`;
let parentVar = atividade_id??iniciativa_id??meta_id??false;
let parentField = atividade_id?'atividade_id':iniciativa_id?'iniciativa_id':meta_id?'meta_id':false;
let parent_label = atividade_id?'atividade':iniciativa_id?'iniciativa':meta_id?'meta':false;

const CronogramasStore = useCronogramasStore();
const { singleCronograma, singleCronogramaEtapas } = storeToRefs(CronogramasStore);
const editModalStore = useEditModalStore();

CronogramasStore.clearEdit();
CronogramasStore.getActiveByParent(parentVar,parentField);

function start(){
    if(props.group=='etapas')editModalStore.modal(AddEditEtapa,props);
    if(props.group=='monitorar')editModalStore.modal(AddEditMonitorar,props);
}
onMounted(()=>{start()});
onUpdated(()=>{start()});

</script>
<template>
    <Dashboard>
        <Breadcrumb />

        <div class="flex spacebetween center mb2">
            <h1>Cronograma</h1>
            <hr class="ml2 f1"/>
            <router-link v-if="perm?.CadastroCronograma?.editar&&!singleCronograma?.loading&&singleCronograma?.id" :to="`${parentlink}/cronograma/${singleCronograma?.id}`" class="btn ml2">Editar Cronograma</router-link>
            <div class="ml1 dropbtn" v-if="!singleCronograma?.loading&&singleCronograma?.id">
                <span class="btn">Nova etapa</span>
                <ul>
                    <li><router-link v-if="perm?.CadastroEtapa?.inserir" :to="`${parentlink}/cronograma/${singleCronograma?.id}/etapas/novo`">Etapa da {{parent_label}}</router-link></li>
                    <li><router-link v-if="perm?.CadastroEtapa?.inserir&&meta_id&&!iniciativa_id" :to="`${parentlink}/cronograma/${singleCronograma?.id}/monitorar/iniciativa`">A partir de Iniciativa</router-link></li>
                    <li><router-link v-if="perm?.CadastroEtapa?.inserir&&iniciativa_id&&!atividade_id" :to="`${parentlink}/cronograma/${singleCronograma?.id}/monitorar/atividade`">A partir de Atividade</router-link></li>
                </ul>
            </div>
            <div class="ml2" v-else>
                <button class="btn disabled">Nova etapa</button>
            </div>
        </div>

        <template v-if="!singleCronograma?.loading&&singleCronograma?.id">
            <div class="boards">
                <div class="flex g2">
                    <div class="mr2">
                        <div class="t12 uc w700 mb05 tamarelo">Inicio previsto</div>
                        <div class="t13">{{singleCronograma.inicio_previsto ? singleCronograma.inicio_previsto: '--/--/----'}}</div>
                    </div>
                    <div class="mr2">
                        <div class="t12 uc w700 mb05 tamarelo">Término previsto</div>
                        <div class="t13">{{singleCronograma.termino_previsto ? singleCronograma.termino_previsto: '--/--/----'}}</div>
                    </div>
                    <div class="mr2">
                        <div class="t12 uc w700 mb05 tamarelo">Inicio real</div>
                        <div class="t13">{{singleCronograma.inicio_real ? singleCronograma.inicio_real: '--/--/----'}}</div>
                    </div>
                    <div class="mr2">
                        <div class="t12 uc w700 mb05 tamarelo">Término real</div>
                        <div class="t13">{{singleCronograma.termino_real ? singleCronograma.termino_real: '--/--/----'}}</div>
                    </div>
                </div>
                <div v-if="singleCronograma.descricao">
                    <hr class="mt2 mb2"/>
                    <h4>Descrição</h4>
                    <div>{{singleCronograma.descricao}}</div>
                </div>
                <div v-if="singleCronograma.observacao">
                    <hr class="mt2 mb2"/>
                    <h4>Observação</h4>
                    <div>{{singleCronograma.observacao}}</div>
                </div>
                <hr class="mt2 mb2"/>
            </div>

            <div class="etapas" v-if="!singleCronogramaEtapas?.loading&&singleCronogramaEtapas.length">
                <div class="etapa" v-for="(r, index) in singleCronogramaEtapas" :key="r.etapa.id">
                    <div class="status"><span>{{index+1}}</span></div>
                    <div class="title mb1"><h3>{{r.etapa.titulo}}</h3></div>
                    <div class="flex center mb05 tc300 w700 t12 uc">
                        <div class="f1">Início Prev.</div>
                        <div class="ml1 f1">Término Prev.</div>
                        <div class="ml1 f1">Duração</div>
                        <div class="ml1 f1">Início Real</div>
                        <div class="ml1 f1">Término Real</div>
                        <div class="ml1 f1">Atraso</div>
                        <div class="ml1 f0" style="flex-basis:20px;"></div>
                    </div>
                    <hr/>
                    <div class="flex center t13">
                        <div class="f1">{{r.etapa.inicio_previsto}}</div>
                        <div class="ml1 f1">{{r.etapa.termino_previsto}}</div>
                        <div class="ml1 f1">{{r.etapa.duracao??'-'}}</div>
                        <div class="ml1 f1">{{r.etapa.inicio_real}}</div>
                        <div class="ml1 f1">{{r.etapa.termino_real}}</div>
                        <div class="ml1 f1">{{r.etapa.atraso??'-'}}</div>
                        <div class="ml1 f0" style="flex-basis:20px; height: calc(20px + 1rem);">
                            <div class="dropbtn right" v-if="perm?.CadastroEtapa?.editar&&(!r.cronograma_origem_etapa||r.cronograma_origem_etapa.id==singleCronograma?.id)">
                                <span class=""><svg width="20" height="20"><use xlink:href="#i_more"></use></svg></span>
                                <ul>
                                    <li><router-link :to="`${parentlink}/cronograma/${singleCronograma?.id}/etapas/${r.etapa.id}`">Editar Etapa</router-link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <hr class="mb05" />
                    <div class="flex center t11 w700 tc600" v-if="r.cronograma_origem_etapa&&r.cronograma_origem_etapa?.id!=singleCronograma?.id">
                        <router-link 
                            v-if="r.cronograma_origem_etapa.atividade" 
                            :to="`/metas/${r.cronograma_origem_etapa.atividade.iniciativa.meta.id}/iniciativas/${r.cronograma_origem_etapa.atividade.iniciativa.id}/atividades/${r.cronograma_origem_etapa.atividade.id}/cronograma`"
                        >
                            <svg class="mr1" width="12" height="14" viewBox="0 0 12 14" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_atividade"></use></svg>
                            <span>Etapa via atividade {{r.cronograma_origem_etapa.atividade.codigo}} {{r.cronograma_origem_etapa.atividade.titulo}}</span>
                        </router-link>
                        <router-link 
                            v-else-if="r.cronograma_origem_etapa.iniciativa" 
                            :to="`/metas/${r.cronograma_origem_etapa.iniciativa.meta.id}/iniciativas/${r.cronograma_origem_etapa.iniciativa.id}/cronograma`"
                        >
                            <svg class="mr1" width="12" height="14" viewBox="0 0 12 14" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_iniciativa"></use></svg>
                            <span>Etapa via iniciativa {{r.cronograma_origem_etapa.iniciativa.codigo}} {{r.cronograma_origem_etapa.iniciativa.titulo}}</span>
                        </router-link>
                    </div>
                </div>
            </div>
            <template v-else-if="singleCronogramaEtapas?.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <div class="p1 bgc50" v-else>
                <div class="tc">
                    <router-link :to="`${parentlink}/cronograma/${singleCronograma?.id}/etapas/novo`" class="btn mt1 mb1"><span>Adicionar Etapa</span></router-link>
                </div>
            </div>
        </template>
        <template v-else-if="singleCronograma?.loading">
            <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
        </template>
        <div class="p1 bgc50 mb2" v-else>
            <div class="tc">
                <router-link :to="`${parentlink}/cronograma/novo`" class="btn mt1 mb1"><span>Adicionar Cronograma</span></router-link>
            </div>
        </div>
    </Dashboard>
</template>