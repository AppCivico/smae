<script setup>
    import { ref, reactive } from 'vue';
    import { storeToRefs } from 'pinia';
    import { Dashboard} from '@/components';
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
                <div v-if="MetaVars.meta.indicador" style="border: 1px solid #E3E5E8; border-top: 8px solid #F2890D;">
                    <div class="p1">
                        <div class="flex center g2">
                            <a class="flex center f1 g2">
                                <svg class="f0" style="flex-basis: 2rem;" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M24.9091 0.36377H3.09091C2.36759 0.36377 1.6739 0.651104 1.16244 1.16257C0.650975 1.67403 0.36364 2.36772 0.36364 3.09104V24.9092C0.36364 25.6325 0.650975 26.3262 1.16244 26.8377C1.6739 27.3492 2.36759 27.6365 3.09091 27.6365H24.9091C25.6324 27.6365 26.3261 27.3492 26.8376 26.8377C27.349 26.3262 27.6364 25.6325 27.6364 24.9092V3.09104C27.6364 2.36772 27.349 1.67403 26.8376 1.16257C26.3261 0.651104 25.6324 0.36377 24.9091 0.36377ZM24.9091 3.09104V8.54559H24.3636L22.1818 10.7274L16.5909 5.1365L11.1364 11.9547L7.18182 8.00012L3.90909 11.2729H3.09091V3.09104H24.9091ZM3.09091 24.9092V14.0001H5L7.18182 11.8183L11.4091 16.0456L16.8636 9.22741L22.1818 14.5456L25.5909 11.2729H24.9091V24.9092H3.09091Z" fill="#F2890D"/> <path d="M7.18182 19.4547H4.45455V23.5456H7.18182V19.4547Z" fill="#F2890D"/> <path d="M12.6364 18.091H9.90909V23.5456H12.6364V18.091Z" fill="#F2890D"/> <path d="M18.0909 15.3638H15.3636V23.5456H18.0909V15.3638Z" fill="#F2890D"/> <path d="M23.5455 18.091H20.8182V23.5456H23.5455V18.091Z" fill="#F2890D"/> </svg>
                                <h2 class="mt1 mb1">{{MetaVars.meta.indicador.codigo}} {{MetaVars.meta.indicador.titulo}}</h2>
                            </a>
                        </div>
                    </div>
                </div>
                <template v-if="MetaVars.meta.iniciativas">
                    <div class="flex spacebetween center mt4 mb2">
                        <h2 class="mb0">{{activePdm.rotulo_iniciativa}}(s) e {{activePdm.rotulo_atividade}}(s)</h2>
                        <hr class="ml2 f1"/>
                    </div>
                    
                    <template v-for="ini in MetaVars.meta.iniciativas" :key="ini.iniciativa.id">
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
                        </div>
                        <template v-for="ati in ini.atividades" :key="ati.atividade.id">
                            <div class="board_variavel mb2">
                                <header class="p1">
                                    <div class="flex center g2 mb1">
                                        <a class="f0" style="flex-basis: 2rem;">
                                            <svg width="28" height="33" viewBox="0 0 32 38" color="#8EC122" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_iniciativa"></use></svg>
                                        </a>
                                        <a class="f1 mt1">
                                            <h2 class="mb1">{{ati.atividade.codigo}} {{ati.atividade.titulo}}</h2>
                                        </a>
                                    </div>
                                </header>
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
