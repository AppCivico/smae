<script setup>
    import { useRoute } from 'vue-router';
    import { storeToRefs } from 'pinia';
    import { useMetasStore, useIniciativasStore, useAtividadesStore } from '@/stores';
            
    const route = useRoute();
    const meta_id = route.params.meta_id;
    const iniciativa_id = route.params.iniciativa_id;
    const atividade_id = route.params.atividade_id;

    const MetasStore = useMetasStore();
    const { singleMeta, activePdm } = storeToRefs(MetasStore);
    if(meta_id&&singleMeta.value.id != meta_id) MetasStore.getById(meta_id);
    if(meta_id&&!activePdm.value.id) MetasStore.getPdM();

    const IniciativasStore = useIniciativasStore();
    const { singleIniciativa } = storeToRefs(IniciativasStore);
    if(iniciativa_id&&singleIniciativa.value.id != iniciativa_id) IniciativasStore.getById(meta_id,iniciativa_id);

    const AtividadesStore = useAtividadesStore();
    const { singleAtividade } = storeToRefs(AtividadesStore);
    if(atividade_id&&singleAtividade.value.id != atividade_id) AtividadesStore.getById(iniciativa_id,atividade_id);


    let groupBy = localStorage.getItem('groupBy')??"macro_tema";
    let groupByRoute;
    switch(groupBy){
        case 'macro_tema': 
            groupByRoute = 'macrotemas';
            break;
        case 'tema': 
            groupByRoute = 'temas';
            break;
        case 'sub_tema': 
            groupByRoute = 'subtemas';
            break;
    }
</script>
<template>
    <div id="submenu">
        <div class="breadcrumb">
            <router-link to="/">Início</router-link>
            <router-link v-if="activePdm.id" to="/metas">{{activePdm.nome}}</router-link>
            <router-link v-if="meta_id&&activePdm.id&&activePdm['possui_'+groupBy]&&singleMeta[groupBy]" :to="`/metas/${groupByRoute}/${singleMeta[groupBy]?.id}`">{{singleMeta[groupBy]?.descricao}}</router-link>
            <router-link v-if="meta_id&&singleMeta.id" :to="`/metas/${meta_id}`">{{singleMeta?.titulo}}</router-link>
            <router-link v-if="iniciativa_id&&singleIniciativa.id" :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}`">{{singleIniciativa?.titulo}}</router-link>
            <router-link v-if="atividade_id&&singleAtividade.id" :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}/atividades/${atividade_id}`">{{singleAtividade?.titulo}}</router-link>
        </div>
        <div class="subpadding">
            <h2>Programa de Metas</h2>
            <div class="links-container mb2">
                <router-link :to="`/metas/${meta_id}${ iniciativa_id?'/iniciativas/'+iniciativa_id:'' }${ atividade_id?'/atividades/'+atividade_id:'' }`">Resumo</router-link>
                <router-link :to="`/metas/${meta_id}${ iniciativa_id?'/iniciativas/'+iniciativa_id:'' }${ atividade_id?'/atividades/'+atividade_id:'' }/evolucao`">Evolução</router-link>
                <router-link :to="`/metas/${meta_id}${ iniciativa_id?'/iniciativas/'+iniciativa_id:'' }${ atividade_id?'/atividades/'+atividade_id:'' }/cronograma`">Cronograma</router-link>
            </div>
        </div>
    </div>
</template>
<style lang="less">
    @import '@/_less/variables.less';
    #submenu{
        position: fixed; left: 70px; top: 0; bottom: 0; background: white; z-index: 8; width: 280px; overflow: auto; .transition(); .bs(0 0 40px 20px fadeOut(black,93%));
        .subpadding{
            padding: 50px;
        }
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