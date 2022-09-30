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
                                <svg width="28" height="33" viewBox="0 0 32 38" color="#8EC122" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M24.6052 8.66691H28.074C28.5345 8.6481 28.994 8.72484 29.4233 8.89236C29.8527 9.05989 30.2427 9.31451 30.5686 9.64018C30.8945 9.96585 31.1494 10.3555 31.317 10.7846C31.4847 11.2136 31.5615 11.6727 31.5427 12.1328V34.534C31.5427 35.4532 31.1773 36.3348 30.5267 36.9848C29.8762 37.6348 28.9939 38 28.074 38H3.92613C3.00616 38 2.12388 37.6348 1.47336 36.9848C0.822846 36.3348 0.457372 35.4532 0.457372 34.534V12.1328C0.43855 11.6727 0.515392 11.2136 0.683053 10.7846C0.850714 10.3555 1.10555 9.96585 1.43149 9.64018C1.75742 9.31451 2.14738 9.05989 2.57675 8.89236C3.00611 8.72484 3.46557 8.6481 3.92613 8.66691H7.39489V5.20089H9.39609C9.73497 3.69732 10.5849 2.35757 11.8011 1.40967C13.0173 0.461761 14.5248 -0.0356653 16.0668 0.00199127C17.6027 -0.0109919 19.0979 0.495666 20.309 1.43961C21.5202 2.38355 22.3761 3.70918 22.7374 5.20089H24.6052V8.66691ZM17.7726 3.93137C17.2561 3.62638 16.6668 3.46629 16.0668 3.46792C15.447 3.45647 14.8354 3.61122 14.2958 3.91599C13.7561 4.22077 13.3081 4.66442 12.9983 5.20089H19.0019C18.7139 4.67495 18.2892 4.23637 17.7726 3.93137ZM21.2699 8.66691H10.8636V12.1328H21.2699V8.66691ZM3.92613 34.534H28.074V12.1328H24.6052V15.4655H7.39489V12.1328H3.92613V34.534ZM13.0853 22.3682L15.2264 24.5705L20.6421 19L22.9091 21.4614L15.2264 29.3636L10.8182 24.8295L13.0853 22.3682Z" fill="currentColor"/> </svg>
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