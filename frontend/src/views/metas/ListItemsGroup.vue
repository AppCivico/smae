<script setup>
import { ref, reactive, onMounted, onUpdated  } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useEditModalStore, useAuthStore, useMetasStore } from '@/stores';
import { useMacrotemasStore, useTemasStore, useSubtemasStore } from '@/stores';
import { useRoute } from 'vue-router';
const editModalStore = useEditModalStore();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

console.log(perm);
const props = defineProps(['group','type','parentPage']);

const MetasStore = useMetasStore();
const { activePdm, tempMetas } = storeToRefs(MetasStore);
MetasStore.getPdM();


const route = useRoute();
const id = route.params.id;
var currentStore;
var currentStoreKey;
switch(props.group){
    case 'macro_tema': 
        currentStore = useMacrotemasStore(); 
        currentStoreKey = 'tempMacrotemas';
        break;
    case 'tema': 
        currentStore = useTemasStore(); 
        currentStoreKey = 'tempTemas';
        break;
    case 'sub_tema': 
        currentStore = useSubtemasStore(); 
        currentStoreKey = 'tempSubtemas';
        break;
}
currentStore.getById(id);

const filters = reactive({
    groupBy: props.group,
    currentFilter: id
});
let itemsFiltered = ref(tempMetas);

function filterItems(){
    MetasStore.filterMetas(filters);
    localStorage.setItem('groupBy',filters.groupBy);
}
filterItems();
function groupSlug(s) {
    switch(s){
        case 'macro_tema': return 'macrotemas'; break;
        case 'tema': return 'temas'; break;
        case 'sub_tema': return 'subtemas'; break;
        default: return s;
    }
}
</script>
<template>
    <Dashboard>
        <div class="breadcrumb">
            <router-link to="/">Início</router-link>
            <router-link to="/metas">{{activePdm.nome}}</router-link>
        </div>
        <div class="mb2">
            <div class="label tc300">{{activePdm['rotulo_'+filters.groupBy]}}</div>
            <h1>{{currentStore[currentStoreKey]?.descricao}}</h1>
        </div>
        
        <div class="boards">
            <template v-if="itemsFiltered.length">
                <div class="bgc50 p1">
                    <ul class="metas">
                        <li class="meta flex center" v-for="(m,i) in itemsFiltered">
                            <router-link :to="`/metas/${m.id}`" class="flex center f1">
                                <div class="farol"></div>
                                <div class="t13">Meta {{m.codigo}} - {{m.titulo}}</div>
                            </router-link>
                            <router-link :to="`/metas/editar/${m.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                        </li>
                    </ul>
                    <hr class="mt2 mb2"/>
                    <div class="tc">
                        <router-link :to="`/metas/${groupSlug(filters.groupBy)}/${id}/novo`" class="btn big"><span>Adicionar meta</span></router-link>
                    </div>
                </div>
            </template>
            <template v-else-if="itemsFiltered.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <template v-else-if="itemsFiltered.error">
                <div class="error p1"><p class="error-msg">Error: {{itemsFiltered.error}}</p></div>
            </template>
            <template v-else>
                <div class="error p1"><p class="error-msg">Nenhum item encontrado.</p></div>
            </template>
        </div>
    </Dashboard>
</template>