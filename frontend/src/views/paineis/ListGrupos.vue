<script setup>
    import { ref, reactive } from 'vue';
    import { storeToRefs } from 'pinia';
    import { Dashboard} from '@/components';
    import { useAuthStore, usePaineisGruposStore } from '@/stores';

    const authStore = useAuthStore();
    const { permissions } = storeToRefs(authStore);
    const perm = permissions.value;

    const PaineisGruposStore = usePaineisGruposStore();
    const { tempPaineisGrupos } = storeToRefs(PaineisGruposStore);
    PaineisGruposStore.clear();
    PaineisGruposStore.filterPaineisGrupos();

    const filters = ref({
        textualSearch: ""
    });
    let itemsFiltered = ref(tempPaineisGrupos);

    function filterItems(){
        PaineisGruposStore.filterPaineisGrupos(filters.value);
    }
</script>
<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>Grupos de paineis</h1>
            <hr class="ml2 f1" />
            <router-link v-if="perm?.CadastroPainel?.inserir" to="/paineis-grupos/novo" class="btn big ml2">Novo Grupo</router-link>
        </div>
        <div class="flex center mb2">
            <div class="f2 search">
                <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
            </div>
        </div>

        <table class="tablemain">
            <thead>
                <tr>
                    <th style="width: 65%">Grupo</th>
                    <th style="width: 25%">Status</th>
                    <th style="width: 10%"></th>
                </tr>
            </thead>
            <tbody>
                <template v-if="itemsFiltered.length">
                    <tr v-for="p in itemsFiltered" :key="p.id">
                        <td>{{p.nome}}</td>
                        <td>{{p.ativo?"Ativo":"Inativo"}}</td>
                        <td style="white-space: nowrap; text-align: right">
                            <router-link v-if="perm?.CadastroPainel?.editar" :to="`/paineis-grupos/${p.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
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
