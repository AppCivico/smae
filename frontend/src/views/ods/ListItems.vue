<script setup>
import { ref, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useAuthStore, useODSStore } from '@/stores';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const ODSStore = useODSStore();
const { tempODS } = storeToRefs(ODSStore);
ODSStore.clear();
ODSStore.filterODS();

const filters = reactive({
    textualSearch: ""
});
let itemsFiltered = ref(tempODS);

function filterItems(){
    ODSStore.filterODS(filters);
}
</script>
<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>ODS</h1>
            <hr class="ml2 f1"/>
            <router-link to="/ods/novo" class="btn big ml2" v-if="perm?.CadastroOds?.inserir">Nova ODS</router-link>
        </div>
        <div class="flex center mb2">
            <div class="f2 search">
                <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
            </div>
        </div>
        
        <table class="tablemain">
            <thead>
                <tr>
                    <th style="width: 10%">Número</th>
                    <th style="width: 35%">Título</th>
                    <th style="width: 45%">Descrição</th>
                    <th style="width: 10%"></th>
                </tr>
            </thead>
            <tbody>
                <template v-if="itemsFiltered.length">
                    <tr v-for="item in itemsFiltered" :key="item.id">
                        <td>{{ item.numero }}</td>
                        <td>{{ item.titulo }}</td>
                        <td>{{ item.descricao }}</td>
                        <td style="white-space: nowrap; text-align: right;">
                            <template v-if="perm?.CadastroOds?.editar">
                                <router-link :to="`/ods/editar/${item.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
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