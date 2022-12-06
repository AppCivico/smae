<script setup>
    import { ref, watch, onMounted, onUpdated } from 'vue';
    import { storeToRefs } from 'pinia';
    import { Dashboard} from '@/components';
    import { useEditModalStore, useAlertStore, useAuthStore, usePdMStore, useCiclosStore } from '@/stores';
    import { useRoute } from 'vue-router';
    import { router } from '@/router';
    import { default as AddEditEtapa } from '@/views/monitoramento/AddEditEtapa.vue';
    import { default as itemFilho } from '@/components/monitoramento/itemFilho.vue';
    
    const baseUrl = `${import.meta.env.VITE_API_URL}`;
    
    const editModalStore = useEditModalStore();
    const alertStore = useAlertStore();
    const authStore = useAuthStore();
    const { permissions } = storeToRefs(authStore);
    const perm = permissions.value;

    const route = useRoute();
    const meta_id = route.params.meta_id;
    const iniciativa_id = route.params.iniciativa_id;
    const atividade_id = route.params.atividade_id;
    const cron_id = route.params.cron_id;
    const etapa_id = route.params.etapa_id;

    const PdMStore = usePdMStore();
    const { activePdm } = storeToRefs(PdMStore);

    const CiclosStore = useCiclosStore();
    const { SingleMeta, SingleCronograma, SingleCronogramaEtapas } = storeToRefs(CiclosStore);
    
    let parentlink = `${meta_id?meta_id:''}${iniciativa_id?'/'+iniciativa_id:''}${atividade_id?'/'+atividade_id:''}`;
    let parentVar = atividade_id??iniciativa_id??meta_id??false;
    let parentField = atividade_id?'atividade':iniciativa_id?'iniciativa':meta_id?'meta':false;
    let parentFieldId = atividade_id?'atividade_id':iniciativa_id?'iniciativa_id':meta_id?'meta_id':false;
    let parentLabel = ref(atividade_id?activePdm.value?.rotulo_atividade:iniciativa_id?activePdm.value?.rotulo_iniciativa:meta_id?'Meta':false);
    watch(activePdm, async(v, vold) => {
        if(atividade_id) parentLabel.value = v.rotulo_atividade;
        else if(iniciativa_id) parentLabel.value = v.rotulo_iniciativa;
    })

    let currentParent = ref({});
    CiclosStore.getCronogramasActiveByParent(parentVar,parentFieldId);
    (async ()=>{
        await CiclosStore.getMetaById(meta_id);
        currentParent.value = SingleMeta.value;
        if(iniciativa_id) currentParent.value = currentParent.value?.meta?.iniciativas.find(x=>x.iniciativa.id==iniciativa_id);
        if(atividade_id) currentParent.value = currentParent.value?.atividades.find(x=>x.atividade.id==atividade_id);
    })();
    
    function start(){
        if(cron_id&&etapa_id) editModalStore.modal(AddEditEtapa);
    }
    onMounted(()=>{start()});
    onUpdated(()=>{start()});

    function dateToField(d){
        var dd=d?new Date(d):false;
        return (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
    }
    function vazio(s){
        return s ? s : '-';
    }
</script>
<template>
    <Dashboard>
        <div class="label tamarelo">Cronograma de {{parentLabel}}</div>
        <div class="mb2">
            <div class="flex spacebetween center">
                <h1>{{parentLabel}} {{currentParent[parentField]?.codigo}} - {{currentParent[parentField]?.titulo}}</h1>
                <hr class="ml2 f1" />
            </div>
        </div>

        <template v-if="!SingleCronograma?.loading&&SingleCronograma?.id">
            <div class="etapas" v-if="!SingleCronogramaEtapas?.loading&&SingleCronogramaEtapas.length">
                <div class="etapa" v-for="(r, index) in SingleCronogramaEtapas?.filter(x=>!x.inativo).sort((a,b)=>a.ordem-b.ordem)" :key="r.etapa.id">
                    <div class="status"><span>{{index+1}}</span></div>
                    <div class="title mb1"><h3>{{r.etapa.titulo}}</h3></div>
                    <div class="pl3 flex center mb05 tc300 w700 t12 uc">
                        <div class="f1">Início Prev.</div>
                        <div class="ml1 f1">Término Prev.</div>
                        <div class="ml1 f1">Duração</div>
                        <div class="ml1 f1">Início Real</div>
                        <div class="ml1 f1">Término Real</div>
                        <div class="ml1 f1">Atraso</div>
                        <div class="ml1 f0" style="flex-basis:20px;"></div>
                    </div>
                    <hr/>

                    
                    <div class="pl3 flex center t13">
                        <div class="f1">{{r.etapa.inicio_previsto}}</div>
                        <div class="ml1 f1">{{r.etapa.termino_previsto}}</div>
                        <div class="ml1 f1">{{r.etapa.duracao??'-'}}</div>
                        <div class="ml1 f1">{{r.etapa.inicio_real}}</div>
                        <div class="ml1 f1">{{r.etapa.termino_real}}</div>
                        <div class="ml1 f1">{{r.etapa.atraso??'-'}}</div>
                        <div class="ml1 f0 flex center" style="flex-basis:20px; height: calc(20px + 1rem);">
                            <router-link 
                                :to="`/monitoramento/cronograma/${parentlink}/editar/${r.cronograma_id}/${r.etapa.id}`"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                        </div>
                    </div>
                    <hr class="mb05" />
                    <div class="pl3 flex center t11 w700 tc600" v-if="r.cronograma_origem_etapa&&r.cronograma_origem_etapa?.id!=SingleCronograma?.id">
                        <router-link
                            :to="`/monitoramento/cronograma/${meta_id}/${r.cronograma_origem_etapa.atividade.iniciativa.id}/${r.cronograma_origem_etapa.atividade.id}`"
                            v-if="r.cronograma_origem_etapa.atividade" >
                            <svg class="mr1" width="12" height="14" viewBox="0 0 12 14" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_atividade"></use></svg>
                            <span>Etapa via {{activePdm.rotulo_atividade}} {{r.cronograma_origem_etapa.atividade.codigo}} {{r.cronograma_origem_etapa.atividade.titulo}}</span>
                        </router-link>
                        <router-link
                            :to="`/monitoramento/cronograma/${meta_id}/${r.cronograma_origem_etapa.iniciativa.id}`"
                            v-else-if="r.cronograma_origem_etapa.iniciativa" >
                            <svg class="mr1" width="12" height="14" viewBox="0 0 12 14" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_iniciativa"></use></svg>
                            <span>Etapa via {{activePdm.rotulo_iniciativa}} {{r.cronograma_origem_etapa.iniciativa.codigo}} {{r.cronograma_origem_etapa.iniciativa.titulo}}</span>
                        </router-link>
                    </div>

                    <div class="etapa sub" v-for="(rr, rrindex) in r.etapa.etapa_filha" :key="rr.id">
                        <div class="status"><span>{{rrindex+1}}</span></div>
                        <div class="title"><h4>{{rr.titulo}}</h4></div>
                        <div class="pl3 flex center mb05 tc300 w700 t12 uc">
                            <div class="f1">Início Prev.</div>
                            <div class="ml1 f1">Término Prev.</div>
                            <div class="ml1 f1">Duração</div>
                            <div class="ml1 f1">Início Real</div>
                            <div class="ml1 f1">Término Real</div>
                            <div class="ml1 f1">Atraso</div>
                            <div class="ml1 f0" style="flex-basis:20px;"></div>
                        </div>
                        <hr/>
                        <div class="pl3 flex center t13">
                            <div class="f1">{{rr.inicio_previsto}}</div>
                            <div class="ml1 f1">{{rr.termino_previsto}}</div>
                            <div class="ml1 f1">{{rr.duracao??'-'}}</div>
                            <div class="ml1 f1">{{rr.inicio_real}}</div>
                            <div class="ml1 f1">{{rr.termino_real}}</div>
                            <div class="ml1 f1">{{rr.atraso??'-'}}</div>
                            <div class="ml1 f0 flex center" style="flex-basis:20px; height: calc(20px + 1rem);">
                                <router-link
                                    v-if="rr.CronogramaEtapa" 
                                    :to="`/monitoramento/cronograma/${parentlink}/editar/${rr.CronogramaEtapa[0].cronograma_id}/${rr.id}`"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                            </div>
                        </div>
                        <hr class="mb3" />
                        
                        <div class="list mt2" v-if="rr?.etapa_filha?.length">
                            <div class="pl3 flex center mb05 tc300 w700 t12 uc ">
                                <div class="f2">SUBFASE</div>
                                <div class="ml1 f1">início prev.</div>
                                <div class="ml1 f1">Término Prev.</div>
                                <div class="ml1 f1">Duração</div>
                                <div class="ml1 f1">Início Real</div>
                                <div class="ml1 f1">Término Real</div>
                                <div class="ml1 f1">Atraso</div>
                                <div class="ml1 f0" style="flex-basis:20px;"></div>

                            </div>
                            <hr/>
                            <template v-for="(rrr, rrrindex) in rr.etapa_filha" :key="rrr.id">
                                <div class="pl3 flex center t13">
                                    <div class="f2 flex center"><span class="farol f0">{{rrrindex+1}}</span> <span>{{rrr.titulo}}</span></div>
                                    <div class="ml1 f1">{{rrr.inicio_previsto}}</div>
                                    <div class="ml1 f1">{{rrr.termino_previsto}}</div>
                                    <div class="ml1 f1">{{rrr.duracao??'-'}}</div>
                                    <div class="ml1 f1">{{rrr.inicio_real}}</div>
                                    <div class="ml1 f1">{{rrr.termino_real}}</div>
                                    <div class="ml1 f1">{{rrr.atraso??'-'}}</div>
                                    <div class="ml1 f0 flex center" style="flex-basis:20px; height: calc(20px + 1rem);">
                                        <router-link
                                            v-if="rrr.CronogramaEtapa" 
                                            :to="`/monitoramento/cronograma/${parentlink}/editar/${rrr.CronogramaEtapa[0].cronograma_id}/${rrr.id}`"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                    </div>
                                </div>
                                <hr/>
                            </template>
                        </div>
                        <hr class="mb1" />
                    </div>
                </div>
            </div>
            <template v-else-if="SingleCronogramaEtapas?.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <div class="p1 bgc50" v-else>
                <div class="p1"><span>Nenhuma etapa encontrada</span></div>
            </div>
        </template>
        <template v-else-if="SingleCronograma?.loading">
            <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
        </template>

        <template v-if="currentParent.meta?.iniciativas?.length">
            <div class="flex spacebetween center mt4 mb2">
                <h2>{{activePdm.rotulo_iniciativa}}(s) com cronograma</h2>
                <hr class="ml2 f1" />
            </div>
            <itemFilho :group="currentParent.meta.iniciativas" chave="iniciativa" :link="`/monitoramento/cronograma/${meta_id}/`"/>
        </template>
        <template v-if="currentParent.atividades?.length">
            <div class="flex spacebetween center mt4 mb2">
                <h2>{{activePdm.rotulo_atividade}}(s) com cronograma</h2>
                <hr class="ml2 f1" />
            </div>
            <itemFilho :group="currentParent.atividades" chave="atividade" :link="`/monitoramento/cronograma/${meta_id}/${iniciativa_id}/`"/>
        </template>
    </Dashboard>
</template>
