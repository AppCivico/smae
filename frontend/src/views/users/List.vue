<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useUsersStore, useOrgansStore  } from '@/stores';

const usersStore = useUsersStore();
const { temp } = storeToRefs(usersStore);
usersStore.filterUsers();

const organsStore = useOrgansStore();
const { organs } = storeToRefs(organsStore);
organsStore.getAll();

const filters = {};
let orgao = ref("");
let nomeemail = ref("");
let usersFiltered = ref(temp);
function filterUsers(){
    filters.orgao = orgao.value;
    filters.nomeemail = nomeemail.value;
    usersStore.filterUsers(filters);
}
function filterOrgan(orgao_id){
    return organs.value.length ? organs.value.find(o=>o.id==orgao_id) : '-';
}
</script>
<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <h1>Gerenciamento de usuários</h1>
            <hr class="ml2 f1"/>
            <router-link to="/usuarios/novo" class="btn big ml2">Novo usuário</router-link>
        </div>
        <div class="flex center mb2">
            <div class="f1">
                <select v-model="orgao" @change="filterUsers" class="inputtext">
                    <option value="">Todos os órgãos</option>
                    <template v-if="organs.length">
                        <option v-for="organ in organs" :key="organ.id" :value="organ.id">{{ organ.sigla }}</option>
                    </template>
                </select>
            </div>
            <div class="f2 search ml2">
                <input v-model="nomeemail" @input="filterUsers" placeholder="Buscar por nome ou e-mail" type="text" class="inputtext" />
            </div>
            <button @click="filterUsers" class="btn ml2">Filtrar</button>
        </div>
        <table class="tablemain">
            <thead>
                <tr>
                    <th style="width: 30%">E-mail</th>
                    <th style="width: 20%">Nome</th>
                    <th style="width: 20%">Lotação</th>
                    <th style="width: 20%">Órgão</th>
                    <th style="width: 10%"></th>
                </tr>
            </thead>
            <tbody>
                <template v-if="usersFiltered.length">
                    <tr v-for="user in usersFiltered" :key="user.id">
                        <td>{{ user.email }}</td>
                        <td>{{ user.nome_completo }}</td>
                        <td>{{ user.lotacao ?? '-' }}</td>
                        <td>{{ user.orgao_id ? filterOrgan(user.orgao_id).sigla : '-' }}</td>
                        <td style="white-space: nowrap; text-align: right;">
                            <router-link :to="`/usuarios/editar/${user.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                        </td>
                    </tr>
                </template>
                <tr v-if="usersFiltered.loading">
                    <td colspan="54">
                        Carregando
                    </td>
                </tr>
                <tr v-if="usersFiltered.error">
                    <td colspan="54">
                        Error: {{usersFiltered.error}}
                    </td>
                </tr>
            </tbody>
        </table>
    </Dashboard>
</template>
