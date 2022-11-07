<script setup>
    import { ref, reactive } from 'vue';
    import { storeToRefs } from 'pinia';
    import { Dashboard} from '@/components';
    import { default as listVars } from '@/components/monitoramento/listVars.vue';
    import { default as countVars } from '@/components/monitoramento/countVars.vue';
    import { useAuthStore, usePdMStore, useCiclosStore } from '@/stores';
    import { useRoute } from 'vue-router';
    
    const route = useRoute();
    const meta_id = route.params.meta_id;

    const authStore = useAuthStore();
    const { permissions } = storeToRefs(authStore);
    const perm = permissions.value;

    const PdMStore = usePdMStore();
    const { activePdm } = storeToRefs(PdMStore);
    if(!activePdm.value.id)PdMStore.getActive();

    const CiclosStore = useCiclosStore();
    const { SingleMeta, MetaVars } = storeToRefs(CiclosStore);
    CiclosStore.getMetaById(meta_id);
    CiclosStore.getMetaVars(meta_id);

    function dateToField(d){
        var dd=d?new Date(d):false;
        return (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
    }
    function dateToTitle(d) {
        var dd=d?new Date(d):false;
        if(!dd) return d;
        var month = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][dd.getUTCMonth()];
        var year = dd.getUTCFullYear();
        return `${month} ${year}`;
    }
</script>
<template>
    <Dashboard>
        <div class="label tamarelo">Metas por fase do ciclo</div>
        <div class="mb2">
            <div class="flex spacebetween center">
                <h1>Meta {{SingleMeta.codigo}} - {{SingleMeta.titulo}}</h1>
                <hr class="ml2 f1" />
            </div>
        </div>
        

        <div class="boards">
            <template v-if="MetaVars.meta">
                <countVars :list="MetaVars.meta.totais"/>
                <div v-if="MetaVars.meta.indicador" style="border: 1px solid #E3E5E8; border-top: 8px solid #F2890D;">
                    <div class="p1">
                        <div class="flex center g2">
                            <a class="flex center f1 g2">
                                <svg class="f0 tlaranja" style="flex-basis: 2rem;" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_indicador"></use></svg>
                                <h2 class="mt1 mb1">{{MetaVars.meta.indicador.codigo}} {{MetaVars.meta.indicador.titulo}}</h2>
                            </a>
                        </div>
                    </div>
                    <listVars :list="MetaVars.meta.variaveis" :indexes="MetaVars.ordem_series"/>
                </div>
                <template v-if="MetaVars.meta.iniciativas.length">
                    <div class="flex spacebetween center mt4 mb2">
                        <h2 class="mb0">{{activePdm.rotulo_iniciativa}}(s) e {{activePdm.rotulo_atividade}}(s)</h2>
                        <hr class="ml2 f1"/>
                    </div>
                    <template v-for="ini in MetaVars.meta.iniciativas" :key="ini.iniciativa.id">
                        <countVars :list="ini.totais"/>
                        <div class="board_variavel mb2">
                            <header class="p1">
                                <div class="flex center g2 mb1">
                                    <a class="f0" style="flex-basis: 2rem;">
                                        <svg width="28" height="33" viewBox="0 0 32 38" color="#8EC122" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_iniciativa"></use></svg>
                                    </a>
                                    <a class="f1 mt1">
                                        <h2 class="mb1">{{ini.iniciativa.codigo}} {{ini.iniciativa.titulo}}</h2>
                                    </a>
                                </div>
                            </header>
                            <listVars :list="ini.variaveis" :indexes="MetaVars.ordem_series"/>
                        </div>
                        <p class="label mb2" v-if="ini.atividades.length">{{activePdm.rotulo_atividade}}(s) em {{activePdm.rotulo_iniciativa}} {{ini.iniciativa.codigo}} {{ini.iniciativa.titulo}}</p>
                        <template v-for="ati in ini.atividades" :key="ati.atividade.id">
                            <countVars :list="ati.totais"/>
                            <div class="board_variavel mb2">
                                <header class="p1">
                                    <div class="flex center g2 mb1">
                                        <a class="f0" style="flex-basis: 2rem;">
                                            <svg width="28" height="33" viewBox="0 0 32 38" color="#8EC122" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_atividade"></use></svg>
                                        </a>
                                        <a class="f1 mt1">
                                            <h2 class="mb1">{{ati.atividade.codigo}} {{ati.atividade.titulo}}</h2>
                                        </a>
                                    </div>
                                </header>
                                <listVars :list="ati.variaveis" :indexes="MetaVars.ordem_series"/>
                            </div>
                        </template>
                    </template>
                </template>

            </template>
            <template v-else-if="MetaVars.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <template v-else-if="MetaVars.error">
                <div class="error p1"><p class="error-msg">Error: {{MetaVars.error}}</p></div>
            </template>
            <template v-else>
                <div class="error p1"><p class="error-msg">Nenhum item encontrado.</p></div>
            </template>
        </div>
    </Dashboard>
</template>
