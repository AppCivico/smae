<script setup>
import { ref, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useAuthStore, useDocumentTypesStore } from '@/stores';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);

const documentTypesStore = useDocumentTypesStore();
const { tempDocumentTypes } = storeToRefs(documentTypesStore);
documentTypesStore.clear();
documentTypesStore.filterDocumentTypes();

const filters = reactive({
    textualSearch: ""
});
let itemsFiltered = ref(tempDocumentTypes);

function filterItems(){
    documentTypesStore.filterDocumentTypes(filters);
}
</script>
<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>Tipos de Documento</h1>
            <hr class="ml2 f1"/>
            <router-link to="/tipo-documento/novo" class="btn big ml2" v-if="permissions.insertpermission>0">Novo tipo</router-link>
        </div>
        <div class="flex center mb2">
            <div class="f2 search">
                <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
            </div>
        </div>
        
        <table class="tablemain">
            <thead>
                <tr>
                    <th style="width: 10%">Código</th>
                    <th style="width: 25%">Tipo</th>
                    <th style="width: 35%">Descrição</th>
                    <th style="width: 20%">Extensões</th>
                    <th style="width: 10%"></th>
                </tr>
            </thead>
            <tbody>
                <template v-if="itemsFiltered.length">
                    <tr v-for="item in itemsFiltered" :key="item.id">
                        <td>{{ item.codigo }}</td>
                        <td>{{ item.titulo }}</td>
                        <td>{{ item.descricao }}</td>
                        <td>{{ item.extensoes }}</td>
                        <td style="white-space: nowrap; text-align: right;">
                            <template v-if="permissions.editpermission>0">
                                <router-link :to="`/tipo-documento/editar/${item.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
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