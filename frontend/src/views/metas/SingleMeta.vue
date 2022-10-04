<script setup>
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { default as Breadcrumb } from '@/components/metas/BreadCrumb.vue';
import { default as SimpleIndicador } from '@/components/metas/SimpleIndicador.vue';
import { useAuthStore, useMetasStore, useIniciativasStore } from '@/stores';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const meta_id = route.params.meta_id;

const parentlink = `${meta_id?'/metas/'+meta_id:''}`;

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
if(meta_id&&singleMeta.value.id != meta_id) MetasStore.getById(meta_id);
if(meta_id&&!activePdm.value.id) MetasStore.getPdM();

const IniciativasStore = useIniciativasStore();
const { Iniciativas } = storeToRefs(IniciativasStore);
if(!Iniciativas.value[meta_id]) IniciativasStore.getAll(meta_id);
</script>
<template>
    <Dashboard>
        <Breadcrumb />
        
        <div class="flex spacebetween center mb2">
            <h1>{{singleMeta.titulo}}</h1>
            <hr class="ml2 f1"/>
            <router-link v-if="perm?.CadastroMeta?.editar" :to="`/metas/editar/${singleMeta.id}`" class="btn big ml2">Editar</router-link>
        </div>
        
        <div class="boards">
            <template v-if="singleMeta.id">
                <div class="flex g2">
                    <div class="mr2" v-if="activePdm.possui_macro_tema">
                        <div class="t12 uc w700 mb05 tamarelo">{{activePdm.rotulo_macro_tema}}</div>
                        <div class="t13">{{singleMeta.macro_tema.descricao}}</div>
                    </div>
                    <div class="mr2" v-if="activePdm.possui_tema">
                        <div class="t12 uc w700 mb05 tamarelo">{{activePdm.rotulo_tema}}</div>
                        <div class="t13">{{singleMeta.tema.descricao}}</div>
                    </div>
                    <div class="mr2" v-if="activePdm.possui_sub_tema">
                        <div class="t12 uc w700 mb05 tamarelo">{{activePdm.rotulo_sub_tema}}</div>
                        <div class="t13">{{singleMeta.sub_tema.descricao}}</div>
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

                <div class="flex spacebetween center mt4 mb2">
                    <h2 class="mb0">Iniciativas</h2>
                    <hr class="ml2 f1"/>
                    <router-link v-if="perm?.CadastroIniciativa?.inserir" :to="`${parentlink}/iniciativas/novo`" class="btn ml2">Adicionar iniciativa</router-link>
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
                        <router-link v-if="perm?.CadastroIniciativa?.inserir" :to="`${parentlink}/iniciativas/novo`" class="btn mt1 mb1"><span>Adicionar iniciativa</span></router-link>
                    </div>
                </div>

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