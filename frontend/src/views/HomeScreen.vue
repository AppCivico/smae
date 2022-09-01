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
        <router-link to="/usuarios" class="btn big mb1">Gerenciar usuários</router-link><br />
        <router-link to="/orgaos" class="btn big mb1">Gerenciar Orgãos</router-link><br />
        <router-link to="/orgaos/tipos" class="btn big mb1">Gerenciar Tipos de Orgão</router-link><br />
        <router-link to="/fonte-recurso" class="btn big mb1">Fontes de Recurso</router-link><br />
        <router-link to="/tipo-documento" class="btn big mb1">Tipos de Documento</router-link><br />
        <router-link to="/ods" class="btn big mb1">ODS</router-link><br />
        <router-link to="/pdm" class="btn big mb1">PdM</router-link><br />
        <router-link to="/eixos" class="btn big mb1">Eixo</router-link><br />
        <router-link to="/tags" class="btn big mb1">Tag</router-link><br />
        <router-link to="/objetivos-estrategicos" class="btn big mb1">Objetivo Estratégico</router-link><br />

    </Dashboard>
</template>