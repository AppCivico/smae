<script setup>
import { ref, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useAuthStore, useResourcesStore } from '@/stores';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);

const resourcesStore = useResourcesStore();
const { tempResources } = storeToRefs(resourcesStore);
resourcesStore.clear();
resourcesStore.filterResources();

const filters = reactive({
    textualSearch: ""
});
let itemsFiltered = ref(tempResources);

function filterItems(){
    resourcesStore.filterResources(filters);
}
</script>
<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>Fontes de recurso</h1>
            <hr class="ml2 f1"/>
            <router-link to="/fonte-recurso/novo" class="btn big ml2" v-if="permissions.insertpermission>0">Nova fonte</router-link>
        </div>
        <div class="flex center mb2">
            <div class="f2 search">
                <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
            </div>
        </div>
        
        <table class="tablemain">
            <thead>
                <tr>
                    <th style="width: 45%">Fonte</th>
                    <th style="width: 45%">Sigla</th>
                    <th style="width: 10%"></th>
                </tr>
            </thead>
            <tbody>
                <template v-if="itemsFiltered.length">
                    <tr v-for="item in itemsFiltered" :key="item.id">
                        <td>{{ item.fonte }}</td>
                        <td>{{ item.sigla }}</td>
                        <td style="white-space: nowrap; text-align: right;">
                            <template v-if="permissions.editpermission>0">
                                <router-link :to="`/fonte-recurso/editar/${item.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                            </template>
                        </td>
                    </tr>
                </template>
                <tr v-else-if="itemsFiltered.loading">
                    <td colspan="54">
                        Carregando
                    </td>
                </tr>
                <tr v-else-if="itemsFiltered.error">
                    <td colspan="54">
                        Error: {{itemsFiltered.error}}
                    </td>
                </tr>
                <tr v-else>
                    <td colspan="54">
                        Nenhum resultado encontrado.
                    </td>
                </tr>
            </tbody>
        </table>
    </Dashboard>
</template>