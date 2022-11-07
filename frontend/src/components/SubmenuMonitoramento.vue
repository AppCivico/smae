<script setup>
    import { useRoute } from 'vue-router';
    import { storeToRefs } from 'pinia';
    import { usePdMStore, useCiclosStore } from '@/stores';

    const route = useRoute();
    const meta_id = route.params.meta_id;

    const PdMStore = usePdMStore();
    const { activePdm } = storeToRefs(PdMStore);
    if(!activePdm.value.id)PdMStore.getActive();

    const CiclosStore = useCiclosStore();
    const { SingleMeta } = storeToRefs(CiclosStore);
    if(meta_id && SingleMeta?.id != meta_id) CiclosStore.getMetaById(meta_id);

    function dateToTitle(d) {
        var dd=d?new Date(d):false;
        if(!dd) return d;
        var month = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][dd.getUTCMonth()];
        var year = dd.getUTCFullYear();
        return `${month} ${year}`;
    }
    
</script>
<template>
    <div id="submenu">
        <div v-if="meta_id" class="breadcrumbmenu">
            <router-link to="/monitoramento/evolucao"><span>{{activePdm?.ciclo_fisico_ativo?.data_ciclo ? dateToTitle(activePdm.ciclo_fisico_ativo.data_ciclo) : 'Ciclo ativo'}}</span></router-link>
            <router-link v-if="SingleMeta?.id" :to="`/monitoramento/metas/${meta_id}`">Meta {{SingleMeta.codigo}} - {{SingleMeta.titulo}}</router-link>
        </div>
        <div class="subpadding">
            <h2>Ciclo vigente</h2>
            <div class="links-container mb2">
                <router-link to="/monitoramento/fases">Metas por fase do ciclo</router-link>
                <router-link to="/monitoramento/evolucao">Coleta - Evolução</router-link>
                <router-link class="disabled" to="/monitoramento/">Coleta - Cronograma</router-link>
                <router-link class="disabled" to="/monitoramento/">Qualificação</router-link>
                <router-link class="disabled" to="/monitoramento/">Análise de risco</router-link>
                <router-link class="disabled" to="/monitoramento/">Fechamento</router-link>
            </div>
            <h2>Configuração</h2>
            <div class="links-container mb2">
                <router-link to="/monitoramento/ciclos">Próximos ciclos</router-link>
                <router-link to="/monitoramento/ciclos/fechados">Ciclos fechados</router-link>
            </div>
            
        </div>
    </div>
</template>