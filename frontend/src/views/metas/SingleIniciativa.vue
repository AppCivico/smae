<script setup>
import { ref, reactive, onMounted, onUpdated  } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useAuthStore, useMetasStore, usePdMStore, useIndicadoresStore, useIniciativasStore } from '@/stores';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;

const MetasStore = useMetasStore();
const { singleMeta } = storeToRefs(MetasStore);

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
if(singleIniciativa.value.id != iniciativa_id) IniciativasStore.getById(meta_id,iniciativa_id);

const PdMStore = usePdMStore();
const { singlePdm } = storeToRefs(PdMStore);

(async()=>{
    if(!singleMeta.value.id||singleMeta.value.id != meta_id) await MetasStore.getById(meta_id);
    if(!singlePdm.value.id||singlePdm.value.id != singleMeta.value.pdm_id) PdMStore.getById(singleMeta.value.pdm_id);
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
        </div>
        <div class="flex spacebetween center mb2">
            <h1>{{singleIniciativa.titulo}}</h1>
            <hr class="ml2 f1"/>
            <router-link v-if="perm?.CadastroIniciativa?.editar" :to="`/metas/${meta_id}/iniciativas/editar/${iniciativa_id}`" class="btn big ml2">Editar</router-link>
        </div>
        
        <div class="boards">
            <template v-if="singleIniciativa.id">
                <div class="flex g2">
                    <div class="mr2">
                        <div class="t12 uc w700 mb05 tamarelo">ID</div>
                        <div class="t13">{{singleIniciativa.codigo}}</div>
                    </div>
                    <div class="mr2">
                        <div class="t12 uc w700 mb05 tamarelo">Órgão(s) participante(s)</div>
                        <div class="t13">{{singleIniciativa.orgaos_participantes.map(x=>x.orgao.descricao).join(', ')}}</div>
                    </div>
                    <div class="mr2">
                        <div class="t12 uc w700 mb05 tamarelo">Responsável(eis) na Coordenadoria</div>
                        <div class="t13">{{singleIniciativa.coordenadores_cp.map(x=>x.nome_exibicao).join(', ')}}</div>
                    </div>
                </div>
                
                <template v-if="singleIniciativa.contexto">
                <hr class="mt2 mb2"/>
                <div>
                    <h4>Contexto</h4>
                    <div>{{singleIniciativa.contexto}}</div>
                </div>
                </template>

                <template v-if="singleIniciativa.complemento">
                <hr class="mt2 mb2"/>
                <div>
                    <h4>Complemento</h4>
                    <div>{{singleIniciativa.complemento}}</div>
                </div>
                </template>

                <hr class="mt2 mb2"/>

            </template>
            <template v-else-if="singleIniciativa.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <template v-else-if="singleIniciativa.error">
                <div class="error p1"><p class="error-msg">Error: {{singleIniciativa.error}}</p></div>
            </template>
            <template v-else>
                <div class="error p1"><p class="error-msg">Nenhum item encontrado.</p></div>
            </template>
        </div>
    </Dashboard>
</template>