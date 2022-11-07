<script setup>
    import { ref, reactive } from 'vue';
    import { storeToRefs } from 'pinia';
    import { Dashboard} from '@/components';
    import { useAuthStore, usePdMStore, useCiclosStore } from '@/stores';
    import { useRoute } from 'vue-router';
    
    const route = useRoute();
    const meta_id = route.params.meta_id;

    const authStore = useAuthStore();
    const { permissions } = storeToRefs(authStore);
    const perm = permissions.value;

    const PdMStore = usePdMStore();
    const { activePdm } = storeToRefs(PdMStore);
    if(!activePdm.value.id)PdMStore.getActive();

    const CiclosStore = useCiclosStore();
    const { SingleMeta } = storeToRefs(CiclosStore);
    CiclosStore.getMetaById(meta_id);
    
    function dateToField(d){
        var dd=d?new Date(d):false;
        return (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
    }
    function dateToTitle(d) {
        var dd=d?new Date(d):false;
        if(!dd) return d;
        var month = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][dd.getUTCMonth()];
        var year = dd.getUTCFullYear();
        return `${month} ${year}`;
    }
</script>
<template>
    <Dashboard>
        <div class="label tamarelo">Metas por fase do ciclo</div>
        <div class="mb2">
            <div class="flex spacebetween center">
                <h1>Meta {{SingleMeta.codigo}} - {{SingleMeta.titulo}}</h1>
                <hr class="ml2 f1" />
            </div>
        </div>
        

        <div class="boards">
            <template v-if="singleMeta.id">
                <div class="flex g2">
                    <div class="mr2" v-if="activePdm.possui_macro_tema">
                        <div class="t12 uc w700 mb05 tamarelo">{{activePdm.rotulo_macro_tema}}</div>
                        <div class="t13">{{singleMeta?.macro_tema?.descricao}}</div>
                    </div>
                    <div class="mr2" v-if="activePdm.possui_tema">
                        <div class="t12 uc w700 mb05 tamarelo">{{activePdm.rotulo_tema}}</div>
                        <div class="t13">{{singleMeta?.tema?.descricao}}</div>
                    </div>
                    <div class="mr2" v-if="activePdm.possui_sub_tema">
                        <div class="t12 uc w700 mb05 tamarelo">{{activePdm.rotulo_sub_tema}}</div>
                        <div class="t13">{{singleMeta?.sub_tema?.descricao}}</div>
                    </div>
                </div>
                <hr class="mt2 mb2"/>
                <div class="flex g2">
                    <div class="mr2" v-if="singleMeta.orgaos_participantes.filter(x=>x.responsavel)">
                        <div class="t12 uc w700 mb05 tamarelo">Órgão(s) responsável(eis)</div>
                        <div class="t13">{{singleMeta.orgaos_participantes.filter(x=>x.responsavel).map(x=>x.orgao.descricao).join(', ')}}</div>
                    </div>
                    <div class="mr2" v-if="singleMeta.orgaos_participantes.filter(x=>!x.responsavel).length">
                        <div class="t12 uc w700 mb05 tamarelo">Órgão(s) participante(s)</div>
                        <div class="t13">{{singleMeta.orgaos_participantes.filter(x=>!x.responsavel).map(x=>x.orgao.descricao).join(', ')}}</div>
                    </div>
                    <div class="mr2" v-if="singleMeta.coordenadores_cp">
                        <div class="t12 uc w700 mb05 tamarelo">Responsável na Coordenadoria de projetos</div>
                        <div class="t13">{{singleMeta.coordenadores_cp.map(x=>x.nome_exibicao).join(', ')}}</div>
                    </div>
                </div>
                <hr class="mt2 mb2"/>
                <div class="" v-if="activePdm.possui_contexto_meta">
                    <h4>{{activePdm.rotulo_contexto_meta}}</h4>
                    <div>{{singleMeta.contexto}}</div>
                </div>
                <hr class="mt2 mb2"/>
                <div class="" v-if="activePdm.possui_complementacao_meta">
                    <h4>{{activePdm.rotulo_complementacao_meta}}</h4>
                    <div>{{singleMeta.complemento}}</div>
                </div>
                
                <hr class="mt2 mb2"/>

                <SimpleIndicador 
                    :parentlink="parentlink"
                    :parent_id="meta_id"
                    parent_field="meta_id"
                />
                <template v-if="activePdm.possui_iniciativa">
                    <div class="flex spacebetween center mt4 mb2">
                        <h2 class="mb0">{{activePdm.rotulo_iniciativa}}</h2>
                        <hr class="ml2 f1"/>
                        <router-link v-if="perm?.CadastroIniciativa?.inserir&&activePdm.possui_iniciativa" :to="`${parentlink}/iniciativas/novo`" class="btn ml2">Adicionar {{activePdm.rotulo_iniciativa}}</router-link>
                    </div>
                    
                    <div class="board_variavel mb2" v-for="ini in Iniciativas[meta_id]" :key="ini.id">
                        <header class="p1">
                            <div class="flex center g2 mb1">
                                <router-link :to="`${parentlink}/iniciativas/${ini.id}`" class="f0" style="flex-basis: 2rem;">
                                    <svg width="28" height="33" viewBox="0 0 32 38" color="#8EC122" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_iniciativa"></use></svg>
                                </router-link>
                                <router-link :to="`${parentlink}/iniciativas/${ini.id}`" class="f1 mt1">
                                    <h2 class="mb1">{{ini.titulo}}</h2>
                                </router-link>
                                <div class="f0">
                                    <router-link :to="`${parentlink}/iniciativas/editar/${ini.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                </div>
                            </div>
                            <div class="f1 ml2">
                                <div class="flex g2 ml2">
                                    <div class="mr1 f0">
                                        <div class="t12 uc w700 mb05 tc300">ID</div>
                                        <div class="t13">{{ini.codigo}}</div>
                                    </div>
                                    <div class="mr1 f1">
                                        <div class="t12 uc w700 mb05 tc300">Órgão(s) participante(s)</div>
                                        <div class="t13">{{ini?.orgaos_participantes?.map(x=>x.orgao.descricao).join(', ')}}</div>
                                    </div>
                                    <div class="f1">
                                        <div class="t12 uc w700 mb05 tc300">Responsável(eis) na Coordenadoria</div>
                                        <div class="t13">{{ini?.coordenadores_cp?.map(x=>x.nome_exibicao).join(', ')}}</div>
                                    </div>
                                </div>
                            </div>
                        </header>
                    </div>

                    <div v-if="!Iniciativas[meta_id].length" class="board_vazio">
                        <div class="tc">
                            <div v-if="Iniciativas[meta_id].loading" class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
                            <router-link v-if="perm?.CadastroIniciativa?.inserir" :to="`${parentlink}/iniciativas/novo`" class="btn mt1 mb1"><span>Adicionar {{activePdm.rotulo_iniciativa}}</span></router-link>
                        </div>
                    </div>
                </template>

            </template>
            <template v-else-if="singleMeta.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <template v-else-if="singleMeta.error">
                <div class="error p1"><p class="error-msg">Error: {{singleMeta.error}}</p></div>
            </template>
            <template v-else>
                <div class="error p1"><p class="error-msg">Nenhum item encontrado.</p></div>
            </template>
        </div>
    </Dashboard>
</template>
