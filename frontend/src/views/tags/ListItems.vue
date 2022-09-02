<script setup>
import { ref, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useAuthStore, useTagsStore } from '@/stores';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const TagsStore = useTagsStore();
const { tempTags } = storeToRefs(TagsStore);
TagsStore.clear();
TagsStore.filterTags();

const filters = reactive({
    textualSearch: ""
});
let itemsFiltered = ref(tempTags);

function filterItems(){
    TagsStore.filterTags(filters);
}
</script>
<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>Tags</h1>
            <hr class="ml2 f1"/>
            <router-link to="/tags/novo" class="btn big ml2" v-if="perm.CadastroTag.inserir">Nova Tag</router-link>
        </div>
        <div class="flex center mb2">
            <div class="f2 search">
                <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
            </div>
        </div>
        
        <table class="tablemain">
            <thead>
                <tr>
                    <th style="width: 30%">Descrição</th>
                    <th style="width: 30%">PdM</th>
                    <th style="width: 30%">OdS</th>
                    <th style="width: 10%"></th>
                </tr>
            </thead>
            <tbody>
                <template v-if="itemsFiltered.length">
                    <tr v-for="item in itemsFiltered" :key="item.id">
                        <td>{{ item.descricao }}</td>
                        <td>{{ item.pdm?.descricao }}</td>
                        <td>{{ item.ods?.titulo }}</td>
                        <td style="white-space: nowrap; text-align: right;">
                            <template v-if="perm.CadastroTag.editar">
                                <router-link :to="`/tags/editar/${item.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
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