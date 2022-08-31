<script setup>
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useAuthStore } from '@/stores';
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
</script>

<template>
    <Dashboard>
        <div class="flex spacebetween center">
            <h1>Olá, {{user.nome_exibicao}}</h1>
        </div>
        <router-link to="/usuarios" class="btn big mb1">Gerenciar usuários</router-link><br>
        <router-link to="/orgaos" class="btn big mb1">Gerenciar Orgãos</router-link><br>
        <router-link to="/orgaos/tipos" class="btn big mb1">Gerenciar Tipos de Orgão</router-link><br>
        <router-link to="/fonte-recurso" class="btn big mb1">Fontes de Recurso</router-link><br>

    </Dashboard>
</template>
