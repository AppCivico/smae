<script setup>
    import { ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { storeToRefs } from 'pinia';
    import { useAuthStore, usePdMStore, useCiclosStore } from '@/stores';

    const props = defineProps(["parentPage"]);

    const authStore = useAuthStore();
    const { permissions } = storeToRefs(authStore);
    const perm = permissions.value;

    const route = useRoute();
    const meta_id = route.params.meta_id;
    const iniciativa_id = route.params.iniciativa_id;
    const atividade_id = route.params.atividade_id;

    const PdMStore = usePdMStore();
    const { activePdm } = storeToRefs(PdMStore);
    if(!activePdm.value.id)PdMStore.getActive();

    const CiclosStore = useCiclosStore();
    const { SingleMeta } = storeToRefs(CiclosStore);
    let CurrentMeta = ref('');
    let CurrentIniciativa = ref('');
    let CurrentAtividade = ref('');
    if(meta_id)(async ()=>{
        await CiclosStore.getMetaById(meta_id);
        CurrentMeta.value = SingleMeta.value;
        if(iniciativa_id) CurrentIniciativa.value = CurrentMeta.value?.meta?.iniciativas.find(x=>x.iniciativa.id==iniciativa_id);
        if(atividade_id) CurrentAtividade.value = CurrentIniciativa.value?.atividades.find(x=>x.atividade.id==atividade_id);
    })();

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
            <router-link :to="`/monitoramento/${parentPage}`"><span>{{activePdm?.ciclo_fisico_ativo?.data_ciclo ? dateToTitle(activePdm.ciclo_fisico_ativo.data_ciclo) : 'Ciclo ativo'}}</span></router-link>

            <router-link 
                v-if="meta_id&&CurrentMeta.meta?.id" 
                :to="`/monitoramento/${parentPage}/${meta_id}`"
            >
                <span>Meta {{CurrentMeta.meta?.codigo}} {{CurrentMeta.meta?.titulo}}</span>
            </router-link>
            <router-link 
                v-if="iniciativa_id&&activePdm.possui_iniciativa&&CurrentIniciativa.iniciativa?.id" 
                :to="`/monitoramento/${parentPage}/${meta_id}/${iniciativa_id}`"
            >
                <span>{{activePdm.rotulo_iniciativa}} {{CurrentIniciativa.iniciativa?.codigo}} {{CurrentIniciativa.iniciativa?.titulo}}</span>
            </router-link>
            <router-link 
                v-if="atividade_id&&activePdm.possui_atividade&&CurrentAtividade.atividade?.id" 
                :to="`/monitoramento/${parentPage}/${meta_id}/${iniciativa_id}/${atividade_id}`"
            >
                <span>{{activePdm.rotulo_atividade}} {{CurrentAtividade.atividade?.codigo}} {{CurrentAtividade.atividade?.titulo}}</span>
            </router-link>
        </div>
        <div class="subpadding">
            <h2>Ciclo vigente</h2>
            <div class="links-container mb2">
                <router-link to="/monitoramento/fases">Metas por fase do ciclo</router-link>
                <router-link to="/monitoramento/evolucao">Coleta - Evolução</router-link>
                <router-link to="/monitoramento/cronograma">Coleta - Cronograma</router-link>
                <router-link v-if="perm.PDM?.admin_cp||perm.PDM?.tecnico_cp" class="disabled" to="/monitoramento/">Qualificação</router-link>
                <router-link v-if="perm.PDM?.admin_cp||perm.PDM?.tecnico_cp" class="disabled" to="/monitoramento/">Análise de risco</router-link>
                <router-link v-if="perm.PDM?.admin_cp||perm.PDM?.tecnico_cp" class="disabled" to="/monitoramento/">Fechamento</router-link>
            </div>
            <template v-if="perm.CadastroCicloFisico">
                <h2>Configuração</h2>
                <div class="links-container mb2">
                    <router-link to="/monitoramento/ciclos">Próximos ciclos</router-link>
                    <router-link to="/monitoramento/ciclos/fechados">Ciclos fechados</router-link>
                </div>
            </template>
            
        </div>
    </div>
</template>