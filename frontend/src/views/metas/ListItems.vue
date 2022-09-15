<script setup>
import { ref, reactive, onMounted, onUpdated  } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useEditModalStore, useAuthStore, useMetasStore } from '@/stores';
import { default as AddEditMacrotemas } from '@/views/pdm/AddEditMacrotemas.vue';
import { default as AddEditTemas } from '@/views/pdm/AddEditTemas.vue';
import { default as AddEditSubtemas } from '@/views/pdm/AddEditSubtemas.vue';
import { default as AddEditTags } from '@/views/pdm/AddEditTags.vue';

const editModalStore = useEditModalStore();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const props = defineProps(['group','type','parentPage']);

const MetasStore = useMetasStore();
const { activePdm, groupedMetas } = storeToRefs(MetasStore);
MetasStore.getPdM();

const filters = reactive({
    groupBy: localStorage.getItem('groupBy')??"macro_tema",
    currentFilter: ""
});
let itemsFiltered = ref(groupedMetas);

function filterItems(){
    MetasStore.filterMetas(filters);
    localStorage.setItem('groupBy',filters.groupBy);
}
filterItems();
function start(){
    if(props.group=='macrotemas') editModalStore.modal(AddEditMacrotemas,props);
    if(props.group=='subtemas') editModalStore.modal(AddEditSubtemas,props);
    if(props.group=='temas') editModalStore.modal(AddEditTemas,props);
    if(props.group=='tags') editModalStore.modal(AddEditTags,props);
}
onMounted(()=>{start()});
onUpdated(()=>{start()});
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
        <div class="flex spacebetween center mb2">
            <h1>{{activePdm.nome}}</h1>
            <hr class="ml2 f1"/>
            <div class="ml2 dropbtn">
                <span class="btn">Adicionar</span>
                <ul>
                    <li><router-link to="/metas/novo">Nova Meta</router-link></li>
                    <li><router-link v-if="activePdm.possui_macro_tema" to="/metas/macrotemas/novo">{{activePdm.rotulo_macro_tema??'Macrotema'}}</router-link></li>
                    <li><router-link v-if="activePdm.possui_tema" to="/metas/temas/novo">{{activePdm.rotulo_tema??'Tema'}}</router-link></li>
                    <li><router-link v-if="activePdm.possui_sub_tema" to="/metas/subtemas/novo">{{activePdm.rotulo_sub_tema??'Subtema'}}</router-link></li>
                    <li><router-link to="/metas/tags/novo">Tag</router-link></li>
                </ul>
            </div>
        </div>
        <div class="flex center mb2">
            <div class="f1 mr1">
                <label class="label tc300">Agrupar por</label>
                <select v-model="filters.groupBy" @change="filterItems" class="inputtext">
                    <option :selected="filters.groupBy=='macro_tema'" v-if="activePdm.possui_macro_tema" value="macro_tema">{{activePdm.rotulo_macro_tema??'Macrotema'}}</option>
                    <option :selected="filters.groupBy=='tema'" v-if="activePdm.possui_tema" value="tema">{{activePdm.rotulo_tema??'Tema'}}</option>
                    <option :selected="filters.groupBy=='sub_tema'" v-if="activePdm.possui_sub_tema" value="sub_tema">{{activePdm.rotulo_sub_tema??'Subtema'}}</option>
                </select>
            </div>
            <div class="f2 ml1">
                
            </div>
        </div>
        
        <div class="boards">
            <template v-if="itemsFiltered.length">
                <div class="flex g2">
                    <div v-for="item in itemsFiltered" :key="item.id" class="board">
                        <router-link :to="`/metas/${groupSlug(filters.groupBy)}/${item.id}`"><h2>{{item.descricao}}</h2></router-link>
                        <div class="t11 tc300 mb2">{{item.children.length}} meta(s)</div>
                        <ul class="metas">
                            <li class="meta flex center mb1" v-for="(m,i) in item.children">
                                <router-link :to="`/metas/${m.id}`" class="flex center f1">
                                    <div class="farol"></div>
                                    <div class="t13">Meta {{m.codigo}} - {{m.titulo}}</div>
                                </router-link>
                                <router-link :to="`/metas/editar/${m.id}`" class="ml1 tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                            </li>
                        </ul>
                        <hr class="mt1 mb1">
                        <router-link :to="`/metas/${groupSlug(filters.groupBy)}/${item.id}/novo`" class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar meta</span></router-link>
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