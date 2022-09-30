<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { Dashboard} from '@/components';
import { default as Breadcrumb } from '@/components/metas/BreadCrumb.vue';
import { default as EvolucaoIndicador } from '@/components/metas/EvolucaoIndicador.vue';
import { useAuthStore, useAtividadesStore } from '@/stores';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;
const atividade_id = route.params.atividade_id;

const props = defineProps(['group']);
const parentlink = `${meta_id?'/metas/'+meta_id:''}${iniciativa_id?'/iniciativas/'+iniciativa_id:''}${atividade_id?'/atividades/'+atividade_id:''}`;

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);
if(singleAtividade.value.id != atividade_id) AtividadesStore.getById(iniciativa_id,atividade_id);
</script>
<template>
    <Dashboard>
        <Breadcrumb />
        
        <div class="flex spacebetween center mb2">
            <h1>{{singleAtividade.titulo}}</h1>
            <hr class="ml2 f1"/>
            <router-link v-if="perm?.CadastroAtividade?.editar" :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}/atividades/editar/${atividade_id}`" class="btn big ml2">Editar</router-link>
        </div>
        
        <div class="boards">
            <template v-if="singleAtividade.id">
                <EvolucaoIndicador 
                    :group="props?.group"
                    :parentlink="parentlink"
                    :parent_id="atividade_id"
                    parent_field="atividade_id"
                />
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