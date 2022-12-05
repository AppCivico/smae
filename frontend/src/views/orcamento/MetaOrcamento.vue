<script setup>
import { ref, onMounted, onUpdated  } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { Dashboard} from '@/components';
import { default as SimpleOrcamento} from '@/components/orcamento/SimpleOrcamento.vue';

import { useAlertStore, useEditModalStore, useAuthStore, useMetasStore, useOrcamentosStore } from '@/stores';

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

(async()=>{
    await MetasStore.getPdM();
    if(atividade_id) parentLabel.value = activePdm.value.rotulo_atividade;
    else if(iniciativa_id) parentLabel.value = activePdm.value.rotulo_iniciativa;
})();

const OrcamentosStore = useOrcamentosStore();
//const { metaOrcamentos } = storeToRefs(OrcamentosStore);
//OrcamentosStore.getById(meta_id);

let metaOrcamentos = ref([
    {
      "meta_id": 205,
      "ano_referencia": 2022,
      "custeio_previsto": 12,
      "investimento_previsto": 23,
      "parte_dotacao": "12.1233.1233.33",
      "ultima_revisao": true,
      "criado_em": "2022-12-05T12:48:40.075Z",
      "criador": {
        "nome_exibicao": "Nome"
      },
      "id": 1
    },
    {
      "meta_id": 205,
      "ano_referencia": 2021,
      "custeio_previsto": null,
      "investimento_previsto": null,
      "parte_dotacao": "",
      "ultima_revisao": true,
      "criado_em": "2022-12-05T12:48:40.075Z",
      "criador": {
        "nome_exibicao": "Nome"
      },
      "id": 1
    },
    {
      "meta_id": 205,
      "ano_referencia": 2019,
      "custeio_previsto": null,
      "investimento_previsto": null,
      "parte_dotacao": "",
      "ultima_revisao": true,
      "criado_em": "2022-12-05T12:48:40.075Z",
      "criador": {
        "nome_exibicao": "Nome"
      },
      "id": 1
    },
    {
      "meta_id": 205,
      "ano_referencia": 2020,
      "custeio_previsto": null,
      "investimento_previsto": null,
      "parte_dotacao": "",
      "ultima_revisao": true,
      "criado_em": "2022-12-05T12:48:40.075Z",
      "criador": {
        "nome_exibicao": "Nome"
      },
      "id": 1
    },
])

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
            <template v-if="metaOrcamentos?.length">
                <template v-if="fs = metaOrcamentos.filter(x=>x.ano_referencia==new Date().getUTCFullYear())">
                    <h2 v-if="fs.length" class="mb2">Ano corrente</h2>
                    <template v-for="orc in fs" :key="orc.ano_referencia">
                        <SimpleOrcamento :item="orc" :parentlink="parentlink" />
                    </template>
                    
                </template>

                <template v-if="fs = metaOrcamentos.filter(x=>x.ano_referencia>new Date().getUTCFullYear()).sort((a,b)=>b.ano_referencia-a.ano_referencia)">
                    <h2 v-if="fs.length" class="mb2">Próximos anos</h2>
                    <template v-for="orc in fs" :key="orc.ano_referencia">
                        <SimpleOrcamento :item="orc" :parentlink="parentlink" />
                    </template>
                </template>
                <template v-if="fs = metaOrcamentos.filter(x=>x.ano_referencia<new Date().getUTCFullYear()).sort((a,b)=>b.ano_referencia-a.ano_referencia)">
                    <h2 v-if="fs.length" class="mb2">Anos anteriores</h2>
                    <template v-for="orc in fs" :key="orc.ano_referencia">
                        <SimpleOrcamento :item="orc" :parentlink="parentlink" />
                    </template>
                    
                </template>
            </template>
            <template v-else-if="metaOrcamentos.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <template v-else-if="metaOrcamentos.error">
                <div class="error p1"><p class="error-msg">Error: {{metaOrcamentos.error}}</p></div>
            </template>
            <template v-else>
                <div class="error p1"><p class="error-msg">Nenhum item encontrado.</p></div>
            </template>
        </div>
    </Dashboard>
</template>