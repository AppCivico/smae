<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { Dashboard} from '@/components';
import { default as Breadcrumb } from '@/components/metas/BreadCrumb.vue';
import { default as EvolucaoIndicador } from '@/components/metas/EvolucaoIndicador.vue';
import { useAuthStore, useIniciativasStore } from '@/stores';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;

const props = defineProps(['group']);
const parentlink = `${meta_id?'/metas/'+meta_id:''}${iniciativa_id?'/iniciativas/'+iniciativa_id:''}`;

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
if(singleIniciativa.value.id != iniciativa_id) IniciativasStore.getById(meta_id,iniciativa_id);
</script>
<template>
    <Dashboard>
        <Breadcrumb />
        
        <div class="flex spacebetween center mb2">
            <h1>{{singleIniciativa.titulo}}</h1>
            <hr class="ml2 f1"/>
            <router-link v-if="perm?.CadastroIniciativa?.editar" :to="`/metas/${meta_id}/iniciativas/editar/${iniciativa_id}`" class="btn big ml2">Editar</router-link>
        </div>
        
        <div class="boards">
            <template v-if="singleIniciativa.id">
                <EvolucaoIndicador 
                    :group="props?.group"
                    :parentlink="parentlink"
                    :parent_id="iniciativa_id"
                    parent_field="iniciativa_id"
                />
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