<script setup>
    import { onMounted, onUpdated  } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useEditModalStore, useAuthStore, useIndicadoresStore, useVariaveisStore } from '@/stores';
    import { default as AddEditValores } from '@/views/metas/AddEditValores.vue';
    import { default as AddEditVariavel } from '@/views/metas/AddEditVariavel.vue';
    import { default as AddEditRealizado } from '@/views/metas/AddEditRealizado.vue';

    const authStore = useAuthStore();
    const { permissions } = storeToRefs(authStore);
    const perm = permissions.value;

    const editModalStore = useEditModalStore();

    const props = defineProps(['group','parentlink','parent_id','parent_field']);

    const IndicadoresStore = useIndicadoresStore();
    const { tempIndicadores } = storeToRefs(IndicadoresStore);

    const VariaveisStore = useVariaveisStore();
    const { Variaveis, Valores } = storeToRefs(VariaveisStore);

    (async()=>{
        if(!tempIndicadores.value.length||tempIndicadores.value[0][props.parent_field] != props.parent_id) await IndicadoresStore.filterIndicadores(props.parent_id,props.parent_field);
        if(tempIndicadores.value[0]?.id) await VariaveisStore.getAll(tempIndicadores.value[0]?.id);

        if(Variaveis.value[tempIndicadores.value[0]?.id]) Variaveis.value[tempIndicadores.value[0]?.id].forEach(x=>{
            VariaveisStore.getValores(x.id);
        })
    })();

    function start(){
        if(props.group=='variaveis')editModalStore.modal(AddEditVariavel,props);
        if(props.group=='valores')editModalStore.modal(AddEditValores,props);
    }
    onMounted(()=>{start()});
    onUpdated(()=>{start()});
</script>
<template>
    <template v-if="tempIndicadores.length">
        <template v-for="ind in tempIndicadores" :key="ind.id">
            <div class="board_indicador mb2">
                <header class="p1">
                    <div class="flex center g2">
                        <div class="flex center f1">
                            <svg width="28" height="28" viewBox="0 0 28 28" color="#F2890D" xmlns="http://www.w3.org/2000/svg"> <path d="M24.9091 0.36377H3.09091C2.36759 0.36377 1.6739 0.651104 1.16244 1.16257C0.650975 1.67403 0.36364 2.36772 0.36364 3.09104V24.9092C0.36364 25.6325 0.650975 26.3262 1.16244 26.8377C1.6739 27.3492 2.36759 27.6365 3.09091 27.6365H24.9091C25.6324 27.6365 26.3261 27.3492 26.8376 26.8377C27.349 26.3262 27.6364 25.6325 27.6364 24.9092V3.09104C27.6364 2.36772 27.349 1.67403 26.8376 1.16257C26.3261 0.651104 25.6324 0.36377 24.9091 0.36377ZM24.9091 3.09104V8.54559H24.3636L22.1818 10.7274L16.5909 5.1365L11.1364 11.9547L7.18182 8.00012L3.90909 11.2729H3.09091V3.09104H24.9091ZM3.09091 24.9092V14.0001H5L7.18182 11.8183L11.4091 16.0456L16.8636 9.22741L22.1818 14.5456L25.5909 11.2729H24.9091V24.9092H3.09091Z" fill="currentColor"/> <path d="M7.18182 19.4547H4.45455V23.5456H7.18182V19.4547Z" fill="currentColor"/> <path d="M12.6364 18.091H9.90909V23.5456H12.6364V18.091Z" fill="currentColor"/> <path d="M18.0909 15.3638H15.3636V23.5456H18.0909V15.3638Z" fill="currentColor"/> <path d="M23.5455 18.091H20.8182V23.5456H23.5455V18.091Z" fill="currentColor"/> </svg>
                            <h2 class="mt1 mb1 ml1">{{ind.titulo}}</h2>
                        </div>
                        <div class="f0 ml2">
                            <select class="inputtext">
                                <option>Até mês corrente</option>
                                <option>Mês corrente</option>
                                <option>Todo período</option>
                                <option>Meses futuros</option>
                            </select>
                        </div>
                        <div class="f0 dropbtn right" v-if="perm?.CadastroIndicador?.editar">
                            <span class="tamarelo"><svg width="20" height="20"><use xlink:href="#i_more"></use></svg></span>
                            <ul>
                                <li><router-link :to="`${parentlink}/indicadores/${ind.id}`">Editar indicador</router-link></li>
                            </ul>
                        </div>
                    </div>
                </header>
            </div>

            <div class="t12 uc w700 mb05 tc300">Variáveis</div>
            <hr class="mb2">
            <template v-if="!Variaveis[ind.id]?.loading">
                <div class="board_variavel" v-for="v in Variaveis[ind.id]" :key="v.id">
                    <header class="p1">
                        <div class="flex center g2">
                            <div class="flex center f1">
                                <svg width="28" height="28" viewBox="0 0 28 28" color="#8EC122" xmlns="http://www.w3.org/2000/svg"> <path d="M24.9091 0.36377H3.09091C2.36759 0.36377 1.6739 0.651104 1.16244 1.16257C0.650975 1.67403 0.36364 2.36772 0.36364 3.09104V24.9092C0.36364 25.6325 0.650975 26.3262 1.16244 26.8377C1.6739 27.3492 2.36759 27.6365 3.09091 27.6365H24.9091C25.6324 27.6365 26.3261 27.3492 26.8376 26.8377C27.349 26.3262 27.6364 25.6325 27.6364 24.9092V3.09104C27.6364 2.36772 27.349 1.67403 26.8376 1.16257C26.3261 0.651104 25.6324 0.36377 24.9091 0.36377ZM24.9091 3.09104V8.54559H24.3636L22.1818 10.7274L16.5909 5.1365L11.1364 11.9547L7.18182 8.00012L3.90909 11.2729H3.09091V3.09104H24.9091ZM3.09091 24.9092V14.0001H5L7.18182 11.8183L11.4091 16.0456L16.8636 9.22741L22.1818 14.5456L25.5909 11.2729H24.9091V24.9092H3.09091Z" fill="currentColor"/> <path d="M7.18182 19.4547H4.45455V23.5456H7.18182V19.4547Z" fill="currentColor"/> <path d="M12.6364 18.091H9.90909V23.5456H12.6364V18.091Z" fill="currentColor"/> <path d="M18.0909 15.3638H15.3636V23.5456H18.0909V15.3638Z" fill="currentColor"/> <path d="M23.5455 18.091H20.8182V23.5456H23.5455V18.091Z" fill="currentColor"/> </svg>
                                <h2 class="mt1 mb1 ml1">{{v.titulo}}</h2>
                            </div>
                            <div class="f0">
                                <router-link :to="`${parentlink}/evolucao/${ind.id}/variaveis/${v.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                <router-link :to="`${parentlink}/evolucao/${ind.id}/variaveis/${v.id}/valores`" class="tprimary ml1"><svg width="20" height="20"><use xlink:href="#i_valores"></use></svg></router-link>
                            </div>
                        </div>
                    </header>
                    <div>
                        <div class="tablepreinfo">
                            <div class="flex spacebetween">
                                <div class="flex center">
                                    <div class="t12 lh1 w700 uc tc400">Projetado X Realizado</div>
                                    <div class="tipinfo ml1"><svg width="20" height="20"><use xlink:href="#i_i"></use></svg><div>Indicador calculado pelo média móvel das variáveis</div></div>
                                </div>
                                <!-- <div>
                                    <a class="addlink"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg><span>Adicionar período</span></a>
                                </div> -->
                            </div>
                        </div>
                        <table class="tablemain">
                            <thead>
                                <tr>
                                    <th style="width: 25%">Mês/Ano</th>
                                    <th style="width: 17.5%">Projetado Mensal</th>
                                    <th style="width: 17.5%">Realizado Mensal</th>
                                    <th style="width: 17.5%">Projetado Acumulado</th>
                                    <th style="width: 17.5%">Realizado Acumulado</th>
                                    <th style="width: 5%"></th>
                                </tr>
                            </thead>
                            <tr v-for="val in Valores[v.id]?.previsto" :key="val.id">
                                <td><div class="flex center"><div class="farol i1"></div> <span>{{val.periodo}}</span></div></td>
                                <td>{{val.series[Valores[v.id].ordem_series.indexOf('Previsto')]?.valor_nominal??'-'}}</td>
                                <td>{{val.series[Valores[v.id].ordem_series.indexOf('Realizado')]?.valor_nominal??'-'}}</td>
                                <td>{{val.series[Valores[v.id].ordem_series.indexOf('PrevistoAcumulado')]?.valor_nominal??'-'}}</td>
                                <td>{{val.series[Valores[v.id].ordem_series.indexOf('RealizadoAcumulado')]?.valor_nominal??'-'}}</td>
                                <td style="white-space: nowrap; text-align: right;">
                                    <!-- <router-link :to="`${parentlink}/indicadores/${ind.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link> -->
                                </td>
                            </tr>
                            <tr v-if="Valores[v.id]?.loading">
                                <td colspan="555"><span class="spinner">Carregando</span></td>
                            </tr>
                            <!-- <tr class="tzaccordeon" @click="toggleAccordeon">
                                <td colspan="56"><svg class="arrow" width="13" height="8"><use xlink:href="#i_down"></use></svg> <span>2020</span></td>
                            </tr>
                            <tbody>
                                <tr>
                                    <td><div class="flex center"><div class="farol"></div> <span>01/2020</span></div></td>
                                    <td>5</td>
                                    <td>10</td>
                                    <td>15</td>
                                    <td>20</td>
                                    <td style="white-space: nowrap; text-align: right;">
                                        <router-link :to="`${parentlink}/indicadores/${ind.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                    </td>
                                </tr>
                            </tbody>
                            <tr class="tzaccordeon" @click="toggleAccordeon">
                                <td colspan="56"><svg class="arrow" width="13" height="8"><use xlink:href="#i_down"></use></svg> <span>2021</span></td>
                            </tr>
                            <tbody>
                                <tr>
                                    <td><div class="flex center"><div class="farol i1"></div> <span>01/2020</span></div></td>
                                    <td>5</td>
                                    <td>10</td>
                                    <td>15</td>
                                    <td>20</td>
                                    <td style="white-space: nowrap; text-align: right;">
                                        <router-link :to="`${parentlink}/indicadores/${ind.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                                    </td>
                                </tr>
                            </tbody> -->
                        </table>
                    </div>
                </div>
            </template>
            <div v-else class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
        </template>
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