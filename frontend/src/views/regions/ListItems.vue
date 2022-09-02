<script setup>
import { ref, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useAuthStore, useRegionsStore } from '@/stores';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const RegionsStore = useRegionsStore();
const { tempRegions } = storeToRefs(RegionsStore);
RegionsStore.clear();
RegionsStore.filterRegions();

const filters = reactive({
    textualSearch: ""
});
let itemsFiltered = ref(tempRegions);

function filterItems(){
    RegionsStore.filterRegions(filters);
}
function toggleAccordeon(t) {
    t.target.closest('.tzaccordeon').classList.toggle('active');
}
</script>
<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>Regiões, Subprefeituras e Distritos</h1>
            <hr class="ml2 f1"/>
            <router-link to="/regioes/novo" class="btn big ml2" v-if="perm.CadastroRegiao.inserir">Nova Região</router-link>
        </div>
        <div class="flex center mb2">
            <div class="f2 search">
                <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
            </div>
        </div>
        
        <table class="tablemain">
            <thead>
                <tr>
                    <th style="width: 45%">Região</th>
                    <th style="width: 45%">Shapefile</th>
                    <th style="width: 10%"></th>
                </tr>
            </thead>
            <tbody>
                <template v-if="itemsFiltered.length">
                    <template v-for="item in itemsFiltered" :key="item.id">
                        <tr class="tzaccordeon" @click="toggleAccordeon">
                            <td><svg v-if="item.children.length" class="arrow" width="13" height="8"><use xlink:href="#i_down"></use></svg> <span>{{ item.descricao }}</span></td>
                            <td>{{ item.shapefile??'-' }}</td>
                            <td style="white-space: nowrap; text-align: right;">
                                <template v-if="perm.CadastroRegiao.editar">
                                    <router-link :to="`/regioes/editar/${item.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                </template>
                            </td>
                        </tr>
                        <tz>
                            <td colspan="56">
                                <table class="tablemain mb1" v-if="item.children.length">
                                    <thead>
                                        <tr>
                                            <th style="width: 45%">Subprefeitura</th>
                                            <th style="width: 45%">Shapefile</th>
                                            <th style="width: 10%"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="item2 in item.children" :key="item2.id">
                                            <tr class="tzaccordeon" @click="toggleAccordeon">
                                                <td><svg v-if="item.children.length" class="arrow" width="13" height="8"><use xlink:href="#i_down"></use></svg> <span>{{ item2.descricao }}</span></td>
                                                <td>{{ item2.shapefile??'-' }}</td>
                                                <td style="white-space: nowrap; text-align: right;">
                                                    <template v-if="perm.CadastroRegiao.editar">
                                                        <router-link :to="`/regioes/editar/${item.id}/${item2.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                                    </template>
                                                </td>
                                            </tr>
                                            <tz>
                                                <td colspan="56">
                                                    <table class="tablemain mb1" v-if="item2.children.length">
                                                        <thead>
                                                            <tr>
                                                                <th style="width: 45%">Distrito</th>
                                                                <th style="width: 45%">Shapefile</th>
                                                                <th style="width: 10%"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <template v-for="item3 in item2.children" :key="item3.id">
                                                                <tr>
                                                                    <td><span>{{ item3.descricao }}</span></td>
                                                                    <td>{{ item3.shapefile??'-' }}</td>
                                                                    <td style="white-space: nowrap; text-align: right;">
                                                                        <template v-if="perm.CadastroRegiao.editar">
                                                                            <router-link :to="`/regioes/editar/${item.id}/${item2.id}/${item3.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                                                        </template>
                                                                    </td>
                                                                </tr>
                                                            </template>
                                                        </tbody>
                                                    </table>
                                                    <router-link :to="`/regioes/novo/${item.id}/${item2.id}`" class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar distrito</span></router-link>
                                                </td>
                                            </tz>
                                        </template>
                                    </tbody>
                                </table>
                                <router-link :to="`/regioes/novo/${item.id}`" class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar subprefeitura</span></router-link>
                            </td>
                        </tz>
                    </template>
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