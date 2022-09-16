<script setup>
    import { storeToRefs } from 'pinia';
    import { useAuthStore } from '@/stores';
    import { useRoute } from 'vue-router';
    
    const props = defineProps(['parentPage']);
    const authStore = useAuthStore();
    const { /*user, */permissions } = storeToRefs(authStore);
    const perm = permissions.value;

    const route = useRoute();
    const meta_id = route.params.meta_id;
</script>
<template>
    <div id="submenu">
        <h2>Programa de Metas</h2>
        <div class="links-container mb2">
            <router-link :to="`/metas/${meta_id}`">Resumo</router-link>
            <router-link :to="`/metas/${meta_id}/evolucao`">Evolução</router-link>
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