<script setup>
import { ref, onMounted, onUpdated  } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { Dashboard} from '@/components';
import { default as SimpleOrcamento} from '@/components/orcamento/SimpleOrcamento.vue';

import { useAlertStore, useEditModalStore, useAuthStore, usePdMStore, useMetasStore, useOrcamentosStore } from '@/stores';

const alertStore = useAlertStore();
const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;
const editModalStore = useEditModalStore();

const props = defineProps(['group']);

const route = useRoute();
const meta_id = route.params.meta_id;
const iniciativa_id = route.params.iniciativa_id;
const atividade_id = route.params.atividade_id;

const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);
const parentlink = `${meta_id?'/metas/'+meta_id:''}${iniciativa_id?'/iniciativas/'+iniciativa_id:''}${atividade_id?'/atividades/'+atividade_id:''}`;
const parent_id = atividade_id??iniciativa_id??meta_id??false;
const parent_field = atividade_id?'atividade_id':iniciativa_id?'iniciativa_id':meta_id?'meta_id':false;
let parentLabel = ref(atividade_id?'-':iniciativa_id?'-':meta_id?'Meta':false);

const OrcamentosStore = useOrcamentosStore();
OrcamentosStore.clear();

(async()=>{
    await MetasStore.getPdM();
    if(atividade_id) parentLabel.value = activePdm.value.rotulo_atividade;
    else if(iniciativa_id) parentLabel.value = activePdm.value.rotulo_iniciativa;
})();

function start(){
}
onMounted(()=>{start()});
onUpdated(()=>{start()});
</script>
<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <div>
                <div class="t12 uc w700 tamarelo">{{parentLabel}}</div>
                <h1>Evolução da {{parentLabel}}</h1>
            </div>
            <hr class="ml2 f1"/>
        </div>
        
        <div class="boards">
            <template v-if="activePdm.id">
                <template v-if="fs = activePdm.orcamento_config.filter(x=>x.ano_referencia==new Date().getUTCFullYear())">
                    <h2 v-if="fs.length" class="mb2">Ano corrente</h2>
                    <template v-for="orc in fs" :key="orc.ano_referencia">
                        <SimpleOrcamento :meta_id="meta_id" :config="orc" :parentlink="parentlink" />
                    </template>
                    
                </template>

                <template v-if="fs = activePdm.orcamento_config.filter(x=>x.ano_referencia>new Date().getUTCFullYear()).sort((a,b)=>b.ano_referencia-a.ano_referencia)">
                    <h2 v-if="fs.length" class="mb2">Próximos anos</h2>
                    <template v-for="orc in fs" :key="orc.ano_referencia">
                        <SimpleOrcamento :meta_id="meta_id" :config="orc" :parentlink="parentlink" />
                    </template>
                </template>
                <template v-if="fs = activePdm.orcamento_config.filter(x=>x.ano_referencia<new Date().getUTCFullYear()).sort((a,b)=>b.ano_referencia-a.ano_referencia)">
                    <h2 v-if="fs.length" class="mb2">Anos anteriores</h2>
                    <template v-for="orc in fs" :key="orc.ano_referencia">
                        <SimpleOrcamento :meta_id="meta_id" :config="orc" :parentlink="parentlink" />
                    </template>
                    
                </template>
            </template>
            <template v-else-if="activePdm.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <template v-else-if="activePdm.error">
                <div class="error p1"><p class="error-msg">Error: {{activePdm.error}}</p></div>
            </template>
        </div>
    </Dashboard>
</template>