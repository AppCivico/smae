<script setup>
import { ref, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useAuthStore, usePdMStore } from '@/stores';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;
console.log(perm);
const PdMStore = usePdMStore();
const { tempPdM } = storeToRefs(PdMStore);
PdMStore.clear();
PdMStore.filterPdM();

const filters = reactive({
    textualSearch: ""
});
let itemsFiltered = ref(tempPdM);

function filterItems(){
    PdMStore.filterPdM(filters);
}
function toggleAccordeon(t) {
    t.target.closest('.tzaccordeon').classList.toggle('active');
}
</script>
<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>Programa de Metas</h1>
            <hr class="ml2 f1"/>
            <router-link to="/pdm/novo" class="btn big ml2" v-if="perm?.CadastroPdm?.inserir">Novo PdM</router-link>
        </div>
        <div class="flex center mb2">
            <div class="f2 search">
                <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
            </div>
        </div>
        
        <table class="tablemain">
            <thead>
                <tr>
                    <th style="width: 25%">Nome</th>
                    <th style="width: 25%">Descrição</th>
                    <th style="width: 15%">Prefeito</th>
                    <th style="width: 10%">Ativo</th>
                    <th style="width: 10%"></th>
                </tr>
            </thead>
            <tbody>
                <template v-if="itemsFiltered.length">
                    <template v-for="item in itemsFiltered" :key="item.id">
                        <tr class="tzaccordeon" @click="toggleAccordeon">
                            <td><div class="flex"><svg class="arrow" width="13" height="8"><use xlink:href="#i_down"></use></svg><span>{{ item.nome }}</span></div></td>
                            <td>{{ item.descricao }}</td>
                            <td>{{ item.prefeito }}</td>
                            <td>{{ item.ativo?'Sim':'Não' }}</td>
                            <td style="white-space: nowrap; text-align: right;">
                                <template v-if="perm?.CadastroPdm?.editar">
                                    <router-link :to="`/pdm/editar/${item.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                </template>
                            </td>
                        </tr>
                        <tz>
                            <td colspan="56" style="padding-left: 2rem;">
                                <table class="tablemain mb1" v-if="item.eixos.length">
                                    <thead>
                                        <tr>
                                            <th style="width: 90%">Eixos temáticos</th>
                                            <th style="width: 10%"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="subitem in item.eixos" :key="subitem.id">
                                            <tr>
                                                <td>{{ subitem.descricao }}</td>
                                                <td style="white-space: nowrap; text-align: right;">
                                                    <template v-if="perm?.CadastroMacroTema?.editar">
                                                        <router-link :to="`/eixos/editar/${subitem.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                                    </template>
                                                </td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                                <router-link v-if="perm?.CadastroMacroTema?.inserir" :to="`/eixos/novo/${item.id}`" class="addlink mb2"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar Eixo temático</span></router-link>
                                <br />
                                <table class="tablemain mb1" v-if="item.objetivosEstrategicos.length">
                                    <thead>
                                        <tr>
                                            <th style="width: 90%">Objetivo estratégico</th>
                                            <th style="width: 10%"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="subitem in item.objetivosEstrategicos" :key="subitem.id">
                                            <tr>
                                                <td>{{ subitem.descricao }}</td>
                                                <td style="white-space: nowrap; text-align: right;">
                                                    <template v-if="perm?.CadastroTema?.editar">
                                                        <router-link :to="`/objetivos-estrategicos/editar/${subitem.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                                    </template>
                                                </td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                                <router-link v-if="perm?.CadastroTema?.inserir" :to="`/objetivos-estrategicos/novo/${item.id}`" class="addlink mb2"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar Objetivo estratégico</span></router-link>
                                <br />
                                <table class="tablemain mb1" v-if="item.tags.length">
                                    <thead>
                                        <tr>
                                            <th style="width: 90%">Tag</th>
                                            <th style="width: 10%"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="subitem in item.tags" :key="subitem.id">
                                            <tr>
                                                <td>{{ subitem.descricao }}</td>
                                                <td style="white-space: nowrap; text-align: right;">
                                                    <template v-if="perm?.CadastroTag?.editar">
                                                        <router-link :to="`/tags/editar/${subitem.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                                    </template>
                                                </td>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                                <router-link v-if="perm?.CadastroTag?.inserir" :to="`/tags/novo/${item.id}`" class="addlink mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar Tag</span></router-link>
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