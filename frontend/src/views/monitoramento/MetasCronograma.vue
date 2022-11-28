<script setup>
    import { ref, reactive } from 'vue';
    import { storeToRefs } from 'pinia';
    import { Dashboard} from '@/components';
    import { useEditModalStore, useAlertStore, useAuthStore, usePdMStore, useCiclosStore } from '@/stores';
    import { useRoute } from 'vue-router';
    import { router } from '@/router';
    
    const baseUrl = `${import.meta.env.VITE_API_URL}`;
    
    const route = useRoute();
    const meta_id = route.params.meta_id;

    const editModalStore = useEditModalStore();
    const alertStore = useAlertStore();

    const authStore = useAuthStore();
    const { permissions } = storeToRefs(authStore);
    const perm = permissions.value;

    const PdMStore = usePdMStore();
    const { activePdm } = storeToRefs(PdMStore);

    const CiclosStore = useCiclosStore();
    const { SingleMeta, SingleCronograma, SingleCronogramaEtapas } = storeToRefs(CiclosStore);
    CiclosStore.getMetaById(meta_id);
    CiclosStore.getCronogramasActiveByParent(meta_id,'meta_id');

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
        <div class="label tamarelo">Cronograma da Meta</div>
        <div class="mb2">
            <div class="flex spacebetween center">
                <h1>Meta {{SingleMeta.codigo}} - {{SingleMeta.titulo}}</h1>
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
                        <div class="ml1 f0" style="flex-basis:20px; height: calc(20px + 1rem);">
                            <div class="dropbtn right" v-if="perm?.CadastroEtapa?.editar">
                                <span class=""><svg width="20" height="20"><use xlink:href="#i_more"></use></svg></span>
                                <ul>
                                    <li><router-link v-if="(!r.cronograma_origem_etapa||r.cronograma_origem_etapa.id==SingleCronograma?.id)" :to="`${parentlink}/cronograma/${SingleCronograma?.id}/etapas/${r.etapa.id}`">Editar Etapa</router-link></li>
                                    <li><router-link v-if="r.cronograma_origem_etapa&&r.cronograma_origem_etapa?.id!=SingleCronograma?.id" :to="`${parentlink}/cronograma/${SingleCronograma?.id}/monitorar/${r.etapa.id}`">Editar Monitoramento</router-link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <hr class="mb05" />
                    <div class="pl3 flex center t11 w700 tc600" v-if="r.cronograma_origem_etapa&&r.cronograma_origem_etapa?.id!=SingleCronograma?.id">
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
                            <div class="ml1 f0" style="flex-basis:20px; height: calc(20px + 1rem);">
                                <router-link v-if="(!r.cronograma_origem_etapa||r.cronograma_origem_etapa.id==SingleCronograma?.id)" :to="`${parentlink}/cronograma/${SingleCronograma?.id}/etapas/${r.etapa.id}/${rr.id}`"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
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
                                    <div class="ml1 f0 flex center mr05" style="flex-basis:20px; height: calc(20px + 1rem);">
                                        <router-link v-if="(!r.cronograma_origem_etapa||r.cronograma_origem_etapa.id==SingleCronograma?.id)" :to="`${parentlink}/cronograma/${SingleCronograma?.id}/etapas/${r.etapa.id}/${rr.id}/${rrr.id}`"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                    </div>
                                </div>
                                <hr/>
                            </template>
                        </div>
                        <div class="pl3">
                            <router-link 
                                v-if="(!r.cronograma_origem_etapa||r.cronograma_origem_etapa.id==SingleCronograma?.id)" 
                                :to="`${parentlink}/cronograma/${SingleCronograma?.id}/etapas/${r.etapa.id}/${rr.id}/novo`" 
                                class="addlink mt05 mb05"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar Subfase</span></router-link>
                        </div>
                        <hr class="mb1" />
                    </div>
                    <div class="pl1">
                        <router-link 
                        v-if="(!r.cronograma_origem_etapa||r.cronograma_origem_etapa.id==SingleCronograma?.id)" 
                        :to="`${parentlink}/cronograma/${SingleCronograma?.id}/etapas/${r.etapa.id}/novo`" 
                        class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar Fase</span></router-link>
                    </div>
                </div>
            </div>
            <template v-else-if="SingleCronogramaEtapas?.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <div class="p1 bgc50" v-else>
                <div class="tc">
                    <router-link :to="`${parentlink}/cronograma/${SingleCronograma?.id}/etapas/novo`" class="btn mt1 mb1"><span>Adicionar Etapa</span></router-link>
                </div>
            </div>
        </template>
        <template v-else-if="SingleCronograma?.loading">
            <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
        </template>

    </Dashboard>
</template>
