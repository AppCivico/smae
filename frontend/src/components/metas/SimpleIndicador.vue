<script setup>
    import { storeToRefs } from 'pinia';
    import { useAuthStore, useIndicadoresStore } from '@/stores';
    import { default as EvolucaoGraph } from '@/components/EvolucaoGraph.vue';

    const authStore = useAuthStore();
    const { permissions } = storeToRefs(authStore);
    const perm = permissions.value;

    const props = defineProps(['group','parentlink','parent_id','parent_field']);

    const IndicadoresStore = useIndicadoresStore();
    const { tempIndicadores,ValoresInd } = storeToRefs(IndicadoresStore);

    (async()=>{
        if(!tempIndicadores.value.length||tempIndicadores.value[0][props.parent_field] != props.parent_id) await IndicadoresStore.filterIndicadores(props.parent_id,props.parent_field);
        if(tempIndicadores.value[0]?.id) {
            IndicadoresStore.getValores(tempIndicadores.value[0]?.id);
        }
    })();
</script>
<template>
    <template v-if="tempIndicadores.length">
        <div v-for="ind in tempIndicadores" :key="ind.id" style="border: 1px solid #E3E5E8; border-top: 8px solid #F2890D;">
            <div class="p1">
                <div class="flex center g2">
                    <router-link :to="`${parentlink}/evolucao`" class="flex center f1 g2">
                        <svg class="f0" style="flex-basis: 2rem;" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M24.9091 0.36377H3.09091C2.36759 0.36377 1.6739 0.651104 1.16244 1.16257C0.650975 1.67403 0.36364 2.36772 0.36364 3.09104V24.9092C0.36364 25.6325 0.650975 26.3262 1.16244 26.8377C1.6739 27.3492 2.36759 27.6365 3.09091 27.6365H24.9091C25.6324 27.6365 26.3261 27.3492 26.8376 26.8377C27.349 26.3262 27.6364 25.6325 27.6364 24.9092V3.09104C27.6364 2.36772 27.349 1.67403 26.8376 1.16257C26.3261 0.651104 25.6324 0.36377 24.9091 0.36377ZM24.9091 3.09104V8.54559H24.3636L22.1818 10.7274L16.5909 5.1365L11.1364 11.9547L7.18182 8.00012L3.90909 11.2729H3.09091V3.09104H24.9091ZM3.09091 24.9092V14.0001H5L7.18182 11.8183L11.4091 16.0456L16.8636 9.22741L22.1818 14.5456L25.5909 11.2729H24.9091V24.9092H3.09091Z" fill="#F2890D"/> <path d="M7.18182 19.4547H4.45455V23.5456H7.18182V19.4547Z" fill="#F2890D"/> <path d="M12.6364 18.091H9.90909V23.5456H12.6364V18.091Z" fill="#F2890D"/> <path d="M18.0909 15.3638H15.3636V23.5456H18.0909V15.3638Z" fill="#F2890D"/> <path d="M23.5455 18.091H20.8182V23.5456H23.5455V18.091Z" fill="#F2890D"/> </svg>
                        <h2 class="mt1 mb1">{{ind.titulo}}</h2>
                    </router-link>
                    <div class="f0 dropbtn right" v-if="perm?.CadastroIndicador?.editar">
                        <span class="tamarelo"><svg width="20" height="20"><use xlink:href="#i_more"></use></svg></span>
                        <ul>
                            <li><router-link :to="`${parentlink}/indicadores/${ind.id}`">Editar indicador</router-link></li>
                        </ul>
                    </div>
                </div>
                <EvolucaoGraph :dataserie="ValoresInd[ind.id]" />
                <div class="tc">
                    <router-link :to="`${parentlink}/evolucao`" class="btn big mt1 mb1"><span>Acompanhar evolução</span></router-link>
                </div>
            </div>
        </div>
    </template>
    <div v-if="!tempIndicadores.length&&!tempIndicadores.loading" style="border: 1px solid #E3E5E8; border-top: 8px solid #F2890D;">
        <div class="p1">
            <h2 class="mt1 mb1">Evolução</h2>
        </div>
        <div class="bgc50" v-if="perm?.CadastroIndicador?.inserir">
            <div class="tc">
                <router-link :to="`${parentlink}/indicadores/novo`" class="btn mt1 mb1"><span>Adicionar indicador</span></router-link>
            </div>
        </div>
    </div>
</template>