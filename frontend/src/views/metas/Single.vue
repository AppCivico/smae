<script setup>
import { ref, reactive, onMounted, onUpdated  } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { useAuthStore, useMetasStore, usePdMStore } from '@/stores';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const id = route.params.id;

const MetasStore = useMetasStore();
const { singleMeta } = storeToRefs(MetasStore);

const PdMStore = usePdMStore();
const { singlePdm } = storeToRefs(PdMStore);

Promise.all([MetasStore.getById(id)]).then(()=>{
    PdMStore.getById(singleMeta.value.pdm_id);
});
</script>
<template>
    <Dashboard>
        <div class="breadcrumb">
            <router-link to="/">Início</router-link>
            <router-link to="/metas">{{singlePdm.nome}}</router-link>
            <router-link to="/metas">{{singleMeta.titulo}}</router-link>
        </div>
        <div class="flex spacebetween center mb2">
            <h1>{{singleMeta.titulo}}</h1>
            <hr class="ml2 f1"/>
            <router-link :to="`/metas/editar/${singleMeta.id}`" class="btn big ml2">Editar</router-link>
        </div>
        
        <div class="boards">
            <template v-if="singleMeta.id">
                <div class="flex g2">
                    <div class="mr2" v-if="singlePdm.possui_macro_tema">
                        <div class="t12 uc w700 mb05 tamarelo">{{singlePdm.rotulo_macro_tema}}</div>
                        <div class="t13">{{singleMeta.macro_tema.descricao}}</div>
                    </div>
                    <div class="mr2" v-if="singlePdm.possui_tema">
                        <div class="t12 uc w700 mb05 tamarelo">{{singlePdm.rotulo_tema}}</div>
                        <div class="t13">{{singleMeta.tema.descricao}}</div>
                    </div>
                    <div class="mr2" v-if="singlePdm.possui_sub_tema">
                        <div class="t12 uc w700 mb05 tamarelo">{{singlePdm.rotulo_sub_tema}}</div>
                        <div class="t13">{{singleMeta.sub_tema.descricao}}</div>
                    </div>
                </div>
                <hr class="mt2 mb2"/>
                <div class="flex g2">
                    <div class="mr2" v-if="singleMeta.orgaos_participantes.filter(x=>x.responsavel)">
                        <div class="t12 uc w700 mb05 tamarelo">Órgão(s) responsável(eis)</div>
                        <div class="t13">{{singleMeta.orgaos_participantes.filter(x=>x.responsavel).map(x=>x.orgao.descricao).join(', ')}}</div>
                    </div>
                    <div class="mr2" v-if="singleMeta.orgaos_participantes.filter(x=>!x.responsavel)">
                        <div class="t12 uc w700 mb05 tamarelo">Órgão(s) participante(s)</div>
                        <div class="t13">{{singleMeta.orgaos_participantes.filter(x=>!x.responsavel).map(x=>x.orgao.descricao).join(', ')}}</div>
                    </div>
                    <div class="mr2" v-if="singleMeta.coordenadores_cp">
                        <div class="t12 uc w700 mb05 tamarelo">Responsável na Coordenadoria de projetos</div>
                        <div class="t13">{{singleMeta.coordenadores_cp.map(x=>x.nome_exibicao).join(', ')}}</div>
                    </div>
                </div>
                <hr class="mt2 mb2"/>
                <div class="" v-if="singlePdm.possui_contexto_meta">
                    <h4>{{singlePdm.rotulo_contexto_meta}}</h4>
                    <div>{{singleMeta.contexto}}</div>
                </div>
                <hr class="mt2 mb2"/>
                <div class="" v-if="singlePdm.possui_complementacao_meta">
                    <h4>{{singlePdm.rotulo_complementacao_meta}}</h4>
                    <div>{{singleMeta.complemento}}</div>
                </div>
            </template>
            <template v-else-if="singleMeta.loading">
                <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
            </template>
            <template v-else-if="singleMeta.error">
                <div class="error p1"><p class="error-msg">Error: {{singleMeta.error}}</p></div>
            </template>
            <template v-else>
                <div class="error p1"><p class="error-msg">Nenhum item encontrado.</p></div>
            </template>
        </div>
    </Dashboard>
</template>