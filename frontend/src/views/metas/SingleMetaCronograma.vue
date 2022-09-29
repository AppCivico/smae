<script setup>
import { ref, reactive, onMounted, onUpdated  } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useAuthStore, useMetasStore, usePdMStore, useIniciativasStore } from '@/stores';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const meta_id = route.params.meta_id;

const parentlink = `${meta_id?'/metas/'+meta_id:''}`;

const MetasStore = useMetasStore();
const { singleMeta } = storeToRefs(MetasStore);

const IniciativasStore = useIniciativasStore();
const { Iniciativas } = storeToRefs(IniciativasStore);
if(!Iniciativas.value[meta_id]) IniciativasStore.getAll(meta_id);

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
        </div>
        <div class="flex spacebetween center mb2">
            <h1>Cronograma</h1>
            <hr class="ml2 f1"/>
            <div class="ml2 dropbtn">
                <span class="btn">Nova etapa</span>
                <ul>
                    <li><router-link v-if="perm?.CadastroEtapa?.inserir" :to="`${parentlink}/cronograma/id/etapas/novo`">Etapa da Meta</router-link></li>
                    <li><router-link v-if="perm?.CadastroEtapa?.inserir" :to="`${parentlink}/cronograma/id/etapas/novo`">A partir de Iniciativa</router-link></li>
                    <li><router-link v-if="perm?.CadastroEtapa?.inserir" :to="`${parentlink}/cronograma/id/etapas/novo`">A partir de Atividade</router-link></li>
                </ul>
            </div>
        </div>

        <div class="p1 bgc50 mb2">
            <div class="tc">
                <router-link :to="`${parentlink}/cronograma/novo`" class="btn mt1 mb1"><span>Adicionar Cronogram</span></router-link>
            </div>
        </div>

        <div class="boards">
            <div class="flex g2">
                <div class="mr2">
                    <div class="t12 uc w700 mb05 tamarelo">Inicio previsto</div>
                    <div class="t13">-</div>
                </div>
                <div class="mr2">
                    <div class="t12 uc w700 mb05 tamarelo">Término previsto</div>
                    <div class="t13">-</div>
                </div>
                <div class="mr2">
                    <div class="t12 uc w700 mb05 tamarelo">Inicio real</div>
                    <div class="t13">-</div>
                </div>
                <div class="mr2">
                    <div class="t12 uc w700 mb05 tamarelo">Término real</div>
                    <div class="t13">-</div>
                </div>
            </div>
            <hr class="mt2 mb2"/>
            <div>
                <h4>Descrição</h4>
                <div>-</div>
            </div>
            <hr class="mt2 mb2"/>
            <div>
                <h4>Observação</h4>
                <div>-</div>
            </div>
            <hr class="mt2 mb2"/>
        </div>

        <div class="p1 bgc50">
            <div class="tc">
                <router-link :to="`${parentlink}/cronograma/novo`" class="btn mt1 mb1"><span>Adicionar Etapa</span></router-link>
            </div>
        </div>
    </Dashboard>
</template>