<script setup>
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { default as Breadcrumb } from '@/components/metas/BreadCrumb.vue';
import { useAuthStore, useMetasStore, useIniciativasStore } from '@/stores';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const meta_id = route.params.meta_id;

const parentlink = `${meta_id?'/metas/'+meta_id:''}`;

const MetasStore = useMetasStore();
const { singleMeta } = storeToRefs(MetasStore);

const IniciativasStore = useIniciativasStore();
const { Iniciativas } = storeToRefs(IniciativasStore);
if(!Iniciativas.value[meta_id]) IniciativasStore.getAll(meta_id);

(async()=>{
    if(!singleMeta.value.id||singleMeta.value.id != meta_id) await MetasStore.getById(meta_id);
})();

</script>
<template>
    <Dashboard>
        <Breadcrumb />
        
        <div class="flex spacebetween center mb2">
            <h1>Cronograma</h1>
            <hr class="ml2 f1"/>
            <div class="ml2 dropbtn">
                <span class="btn">Nova etapa</span>
                <ul>
                    <li><router-link v-if="perm?.CadastroEtapa?.inserir" :to="`${parentlink}/cronograma/id/etapas/novo`">Etapa da Meta</router-link></li>
                    <li><router-link v-if="perm?.CadastroEtapa?.inserir" :to="`${parentlink}/cronograma/id/etapas/novo`">A partir de Iniciativa</router-link></li>
                    <li><router-link v-if="perm?.CadastroEtapa?.inserir" :to="`${parentlink}/cronograma/id/etapas/novo`">A partir de Atividade</router-link></li>
                </ul>
            </div>
        </div>

        <div class="p1 bgc50 mb2">
            <div class="tc">
                <router-link :to="`${parentlink}/cronograma/novo`" class="btn mt1 mb1"><span>Adicionar Cronogram</span></router-link>
            </div>
        </div>

        <div class="boards">
            <div class="flex g2">
                <div class="mr2">
                    <div class="t12 uc w700 mb05 tamarelo">Inicio previsto</div>
                    <div class="t13">-</div>
                </div>
                <div class="mr2">
                    <div class="t12 uc w700 mb05 tamarelo">Término previsto</div>
                    <div class="t13">-</div>
                </div>
                <div class="mr2">
                    <div class="t12 uc w700 mb05 tamarelo">Inicio real</div>
                    <div class="t13">-</div>
                </div>
                <div class="mr2">
                    <div class="t12 uc w700 mb05 tamarelo">Término real</div>
                    <div class="t13">-</div>
                </div>
            </div>
            <hr class="mt2 mb2"/>
            <div>
                <h4>Descrição</h4>
                <div>-</div>
            </div>
            <hr class="mt2 mb2"/>
            <div>
                <h4>Observação</h4>
                <div>-</div>
            </div>
            <hr class="mt2 mb2"/>
        </div>

        <div class="p1 bgc50">
            <div class="tc">
                <router-link :to="`${parentlink}/cronograma/novo`" class="btn mt1 mb1"><span>Adicionar Etapa</span></router-link>
            </div>
        </div>
    </Dashboard>
</template>