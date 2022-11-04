<script setup>
    import { storeToRefs } from 'pinia';
    import { useAuthStore } from '@/stores';
    const authStore = useAuthStore();
    const { permissions } = storeToRefs(authStore);
    const perm = permissions.value;
</script>
<template>
    <div id="submenu">
        <div class="subpadding">
            <h2>Entrada de dados</h2>
            <div class="links-container mb2">
                <router-link v-if="perm?.CadastroPessoa" to="/usuarios">Gerenciar usuários</router-link>
                <router-link v-if="perm?.CadastroRegiao" to="/regioes">Regiões, Subprefeituras e Distritos</router-link>
                <router-link v-if="perm?.CadastroPdm" to="/pdm" :class="{active: parentPage=='pdm'}">Programa de Metas</router-link>
            </div>
            <h2>Formulários básicos</h2>
            <div class="links-container">
                <router-link v-if="perm?.CadastroOrgao" to="/orgaos">Orgãos</router-link>
                <router-link v-if="perm?.CadastroFonteRecurso" to="/fonte-recurso">Fontes de Recurso</router-link>
                <router-link v-if="perm?.CadastroTipoDocumento" to="/tipo-documento">Tipos de Documento</router-link>
                <router-link v-if="perm?.CadastroOds" to="/ods">ODS</router-link>
            </div>
        </div>
    </div>
</template>