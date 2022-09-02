<script setup>
    import { storeToRefs } from 'pinia';
    import { useAuthStore } from '@/stores';
    const props = defineProps(['parentPage']);
    const authStore = useAuthStore();
    const { /*user, */permissions } = storeToRefs(authStore);
    const perm = permissions.value;
</script>
<template>
    <div id="submenu">
        <h2>Entrada de dados</h2>
        <div class="links-container mb2">
            <router-link v-if="perm.CadastroPessoa" to="/usuarios">Gerenciar usuários</router-link>
            <router-link v-if="perm.CadastroRegiao" to="/regioes">Regiões, Subprefeituras e Distritos</router-link>
            <router-link v-if="perm.CadastroPdm" to="/pdm" :class="{active: parentPage=='pdm'}">Planos de Meta</router-link>
        </div>
        <h2>Formulários básicos</h2>
        <div class="links-container">
            <router-link v-if="perm.CadastroOrgao" to="/orgaos">Orgãos</router-link>
            <router-link v-if="perm.CadastroFonteRecurso" to="/fonte-recurso">Fontes de Recurso</router-link>
            <router-link v-if="perm.CadastroTipoDocumento" to="/tipo-documento">Tipos de Documento</router-link>
            <router-link v-if="perm.CadastroOds" to="/ods">ODS</router-link>
            <!-- <router-link v-if="perm.CadastroEixo" to="/eixos">Eixo</router-link>
            <router-link v-if="perm.CadastroTag" to="/tags">Tag</router-link>
            <router-link v-if="perm.CadastroObjetivoEstrategico" to="/objetivos-estrategicos">Objetivo Estratégico</router-link> -->
        </div>
    </div>
</template>
<style lang="less">
    @import '@/_less/variables.less';
    #submenu{
        position: fixed; left: 70px; top: 0; bottom: 0; background: white; z-index: 8; padding: 50px; width: 280px; overflow: auto; .transition(); .bs(0 0 40px 20px fadeOut(black,93%));
        h2{color: @c300; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 1em; padding-bottom: 10px; border-bottom: 1px solid @c100;}
        a{
            display: block; padding: 10px 0; border-bottom: 1px solid @c100; font-weight: 700; .transition();
            &:hover{padding-left:10px; color: @amarelo;}
            &:active, &.active{color: @amarelo; border-width: 5px; border-color: @amarelo;}
        }
        label{display: block; font-size: 14px; font-weight: 700; padding: 6px 0; cursor: pointer;}
        form{margin-top: 50px; padding-top: 10px; }
        + #dashboard{margin-left: 350px;}
    }
</style>