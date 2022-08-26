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
        <router-link to="/usuarios" class="btn big mt2">Gerenciar usuários</router-link>
    </Dashboard>
</template>
