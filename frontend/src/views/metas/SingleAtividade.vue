<script setup>
import { ref, reactive, onMounted, onUpdated  } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useAuthStore, useMetasStore, usePdMStore, useIndicadoresStore, useIniciativasStore, useAtividadesStore } from '@/stores';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;
const atividade_id = route.params.atividade_id;

const parentlink = `${meta_id?'/metas/'+meta_id:''}${iniciativa_id?'/iniciativas/'+iniciativa_id:''}${atividade_id?'/atividades/'+atividade_id:''}`;

const MetasStore = useMetasStore();
const { singleMeta } = storeToRefs(MetasStore);

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
if(singleIniciativa.value.id != iniciativa_id) IniciativasStore.getById(meta_id,iniciativa_id);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);
if(singleAtividade.value.id != atividade_id) AtividadesStore.getById(iniciativa_id,atividade_id);

const IndicadoresStore = useIndicadoresStore();
const { tempIndicadores } = storeToRefs(IndicadoresStore);

const PdMStore = usePdMStore();
const { singlePdm } = storeToRefs(PdMStore);

(async()=>{
    if(!singleMeta.value.id||singleMeta.value.id != meta_id) await MetasStore.getById(meta_id);
    if(!singlePdm.value.id||singlePdm.value.id != singleMeta.value.pdm_id) PdMStore.getById(singleMeta.value.pdm_id);
    if(!tempIndicadores.value.length||tempIndicadores.value[0].atividade_id != atividade_id)IndicadoresStore.filterIndicadores(atividade_id,'atividade_id');
})();

let groupBy = localStorage.getItem('groupBy')??"macro_tema";
let groupByRoute;
switch(groupBy){
    case 'macro_tema': 
        groupByRoute = 'macrotemas';
        break;
    case 'tema': 
        groupByRoute = 'temas';
        break;
    case 'sub_tema': 
        groupByRoute = 'subtemas';
        break;
}

</script>
<template>
    <Dashboard>
        <div class="breadcrumb">
            <router-link to="/">Início</router-link>
            <router-link to="/metas">{{singlePdm.nome}}</router-link>
            <router-link :to="`/metas/${groupByRoute}/${singleMeta[groupBy]?.id}`" v-if="singlePdm['possui_'+groupBy]">{{singleMeta[groupBy]?.descricao}}</router-link>
            <router-link :to="`/metas/${meta_id}`">{{singleMeta?.titulo}}</router-link>
            <router-link :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}`">{{singleIniciativa?.titulo}}</router-link>
        </div>
        <div class="flex spacebetween center mb2">
            <h1>{{singleAtividade.titulo}}</h1>
            <hr class="ml2 f1"/>
            <router-link v-if="perm?.CadastroAtividade?.editar" :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}/atividades/editar/${atividade_id}`" class="btn big ml2">Editar</router-link>
        </div>
        
        <div class="boards">
            <template v-if="singleAtividade.id">
                <div class="flex g2">
                    <div class="mr2">
                        <div class="t12 uc w700 mb05 tamarelo">ID</div>
                        <div class="t13">{{singleAtividade.codigo}}</div>
                    </div>
                    <div class="mr2">
                        <div class="t12 uc w700 mb05 tamarelo">Órgão(s) participante(s)</div>
                        <div class="t13">{{singleAtividade.orgaos_participantes.map(x=>x.orgao.descricao).join(', ')}}</div>
                    </div>
                    <div class="mr2">
                        <div class="t12 uc w700 mb05 tamarelo">Responsável(eis) na Coordenadoria</div>
                        <div class="t13">{{singleAtividade.coordenadores_cp.map(x=>x.nome_exibicao).join(', ')}}</div>
                    </div>
                </div>
                
                <template v-if="singleAtividade.contexto">
                <hr class="mt2 mb2"/>
                <div>
                    <h4>Contexto</h4>
                    <div>{{singleAtividade.contexto}}</div>
                </div>
                </template>

                <template v-if="singleAtividade.complemento">
                <hr class="mt2 mb2"/>
                <div>
                    <h4>Complemento</h4>
                    <div>{{singleAtividade.complemento}}</div>
                </div>
                </template>

                <hr class="mt2 mb2"/>

                <div v-if="tempIndicadores.length" v-for="ind in tempIndicadores" style="border: 1px solid #E3E5E8; border-top: 8px solid #F2890D;">
                    <div class="p1">
                        <div class="flex center g2">
                            <router-link :to="`${parentlink}/evolucao`" class="flex center f1 g2">
                                <svg class="f0" style="flex-basis: 2rem;" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M24.9091 0.36377H3.09091C2.36759 0.36377 1.6739 0.651104 1.16244 1.16257C0.650975 1.67403 0.36364 2.36772 0.36364 3.09104V24.9092C0.36364 25.6325 0.650975 26.3262 1.16244 26.8377C1.6739 27.3492 2.36759 27.6365 3.09091 27.6365H24.9091C25.6324 27.6365 26.3261 27.3492 26.8376 26.8377C27.349 26.3262 27.6364 25.6325 27.6364 24.9092V3.09104C27.6364 2.36772 27.349 1.67403 26.8376 1.16257C26.3261 0.651104 25.6324 0.36377 24.9091 0.36377ZM24.9091 3.09104V8.54559H24.3636L22.1818 10.7274L16.5909 5.1365L11.1364 11.9547L7.18182 8.00012L3.90909 11.2729H3.09091V3.09104H24.9091ZM3.09091 24.9092V14.0001H5L7.18182 11.8183L11.4091 16.0456L16.8636 9.22741L22.1818 14.5456L25.5909 11.2729H24.9091V24.9092H3.09091Z" fill="#F2890D"/> <path d="M7.18182 19.4547H4.45455V23.5456H7.18182V19.4547Z" fill="#F2890D"/> <path d="M12.6364 18.091H9.90909V23.5456H12.6364V18.091Z" fill="#F2890D"/> <path d="M18.0909 15.3638H15.3636V23.5456H18.0909V15.3638Z" fill="#F2890D"/> <path d="M23.5455 18.091H20.8182V23.5456H23.5455V18.091Z" fill="#F2890D"/> </svg>
                                <h2 class="mt1 mb1">{{ind.titulo}}</h2>
                            </router-link>
                            <div class="f0 dropbtn right" v-if="perm?.CadastroIndicador?.editar">
                                <span class="tamarelo"><svg width="20" height="20"><use xlink:href="#i_more"></use></svg></span>
                                <ul>
                                    <li><router-link :to="`${parentlink}/indicadores/${ind.id}`">Editar indicador</router-link></li>
                                </ul>
                            </div>
                        </div>
                        <div class="tc">
                            <router-link :to="`${parentlink}/evolucao`" class="btn big mt1 mb1"><span>Acompanhar evolução</span></router-link>
                        </div>
                    </div>
                </div>
                <div v-if="!tempIndicadores.length&&!tempIndicadores.loading" style="border: 1px solid #E3E5E8; border-top: 8px solid #F2890D;">
                    <div class="p1">
                        <h2 class="mt1 mb1">Evolução</h2>
                    </div>
                    <div class="bgc50" v-if="perm?.CadastroIndicador?.inserir">
                        <div class="tc">
                            <router-link :to="`${parentlink}/indicadores/novo`" class="btn mt1 mb1"><span>Adicionar indicador</span></router-link>
                        </div>
                    </div>
                </div>

            </template>
            <template v-else-if="singleAtividade.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <template v-else-if="singleAtividade.error">
                <div class="error p1"><p class="error-msg">Error: {{singleAtividade.error}}</p></div>
            </template>
            <template v-else>
                <div class="error p1"><p class="error-msg">Nenhum item encontrado.</p></div>
            </template>
        </div>
    </Dashboard>
</template>