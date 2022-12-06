<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard} from '@/components';
import { default as SimpleIndicador } from '@/components/metas/SimpleIndicador.vue';
import { default as EvolucaoGraphComparison } from '@/components/EvolucaoGraphComparison.vue';
import { useAuthStore, useMetasStore, usePaineisStore } from '@/stores';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const meta_id = route.params.meta_id;

const parentlink = `${meta_id?'/metas/'+meta_id:''}`;

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
if(meta_id&&singleMeta.value.id != meta_id) MetasStore.getById(meta_id);
if(meta_id&&!activePdm.value.id) MetasStore.getPdM();

const PaineisStore = usePaineisStore();
const { tempPaineis, SingleSerie } = storeToRefs(PaineisStore);
PaineisStore.clear();
let SelectedPainel = ref(0);
let CurrentPainel = ref({});
let ModeloSerie = ref([]);

let iP = ref(-1);
let iR = ref(-1);
let iPA = ref(-1);
let iRA = ref(-1);

(async()=>{
    await PaineisStore.getByMeta(meta_id);
    selectPainel();
})();
async function selectPainel() {
    if(!SelectedPainel.value&&tempPaineis.value.length){
        SelectedPainel.value = tempPaineis.value[0].id;
    }
    CurrentPainel.value = tempPaineis.value.find(x=>x.id==SelectedPainel.value);
    SingleSerie.value = {};
    if(CurrentPainel.value.id){
        let i = CurrentPainel.value.painel_conteudo.find(x=>x.meta_id==meta_id);
        await PaineisStore.getSerieMeta(SelectedPainel.value,i.id);

        iP.value = SingleSerie.value.ordem_series?.indexOf('Previsto');
        iR.value = SingleSerie.value.ordem_series?.indexOf('Realizado');
        iPA.value = SingleSerie.value.ordem_series?.indexOf('PrevistoAcumulado');
        iRA.value = SingleSerie.value.ordem_series?.indexOf('RealizadoAcumulado');

        if(SingleSerie.value?.meta?.indicador?.series?.length) ModeloSerie.value = SingleSerie.value.meta.indicador.series;
        else if(SingleSerie.value?.detalhes[0]?.series?.length) ModeloSerie.value = SingleSerie.value.detalhes[0].series;
    }
}
function dateToTitle(d) {
    var dd=d?new Date(d):false;
    if(!dd) return d;
    var month = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][dd.getUTCMonth()];
    var year = dd.getUTCFullYear();
    return `${month}/${year}`;
}

// Tables
    let tableScroll = ref(null);
    let pos = { top: 0, left: 0, x: 0, y: 0 };
    let draggin = false;
    const mouseDownHandler = function (e) {
        tableScroll.value.style.cursor = 'grabbing';
        tableScroll.value.style.userSelect = 'none';
        pos = {
            left: tableScroll.value.scrollLeft,
            top: tableScroll.value.scrollTop,
            x: e.clientX,
            y: e.clientY,
        };
        draggin = true;
    };
    const mouseMoveHandler = function (e) {
        if(draggin){
            const dx = e.clientX - pos.x;
            const dy = e.clientY - pos.y;
            tableScroll.value.scrollTop = pos.top - dy;
            tableScroll.value.scrollLeft = pos.left - dx;
        }
    };
    const mouseUpHandler = function (e) {
        tableScroll.value.style.cursor = 'grab';
        tableScroll.value.style.removeProperty('user-select');
        draggin = false;
    };
</script>
<template>
    <Dashboard>
        <div class="flex spacebetween center mb2">
            <div>
                <div class="t12 uc w700 tamarelo">Meta</div>
                <h1>{{singleMeta.titulo}}</h1>
            </div>
            <hr class="ml2 f1"/>
            <router-link v-if="perm?.CadastroMeta?.editar" :to="`/metas/editar/${singleMeta.id}`" class="btn big ml2">Editar</router-link>
        </div>
        
        <div class="boards">
            <template v-if="singleMeta.id">

                <template v-if="tempPaineis.length">
                    <div class="label tc300">Visualizar por</div>
                    <select style="width: 250px" v-model="SelectedPainel" class="inputtext light mb2" @change="selectPainel">
                        <option v-for="p in tempPaineis" :key="p.id" :value="p.id">{{p.nome}}</option>
                    </select>

                    <div>
                        <EvolucaoGraphComparison :single="SingleSerie" :dataserie="[SingleSerie.meta?.indicador].concat(SingleSerie?.detalhes?.filter(x=>x?.iniciativa?.id)?.map(x=>x.iniciativa.indicador[0]))"/>
                    </div>

                    <div class="evolucaoTable" ref="tableScroll" 
                        @mousedown="mouseDownHandler"
                        @mousemove="mouseMoveHandler"
                        @mouseup="mouseUpHandler"
                    >
                        <div class="flex header bb" :style="{width: ((ModeloSerie.length+1)*400)+'px'}">
                            <div class="flex center p1 f0 g1 stickyleft br">
                                <svg class="f0" style="flex-basis: 2rem;" width="28" height="28" viewBox="0 0 28 28" color="#F2890D" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#i_indicador" /></svg>
                                <h2 class="mt1 mb1">Evolução</h2>
                            </div>
                            <div class="f0 end br" style="flex-basis:400px;" v-for="v in ModeloSerie">
                                <div class="t14 w700 p05">{{dateToTitle(v.periodo_inicio)}}</div>
                                <div class="flex">
                                    <div class="f1 label p05 tc200 br">Projetado mensal</div>
                                    <div class="f1 label p05 tc200 br">realizado mensal</div>
                                    <div class="f1 label p05 tc200 br">Projetado acumulado</div>
                                    <div class="f1 label p05 tc200">realizado acumulado</div>
                                </div>
                            </div>
                        </div>

                        <template v-if="SingleSerie?.meta?.indicador">
                            <div class="flex center"
                                v-for="ind in [SingleSerie.meta.indicador]"
                                :style="{width: ((ModeloSerie.length+1)*400)+'px'}"
                            >
                                <div class="flex center br p05 f0 g1 t14 w700 stickyleft">{{ind.codigo}} {{ind.titulo}}</div>
                                <div class="f0 flex" style="flex-basis:400px;" v-for="v in ind.series">
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iP] ? v.valores_nominais[iP] : '-' }}</div>
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iR] ? v.valores_nominais[iR] : '-' }}</div>
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iPA] ? v.valores_nominais[iPA] : '-' }}</div>
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iRA] ? v.valores_nominais[iRA] : '-' }}</div>
                                </div>
                            </div>
                        </template>

                        <div class="flex center"
                            v-for="ind in SingleSerie?.detalhes?.filter(x=>x?.variavel?.id)"
                            :style="{width: ((ModeloSerie.length+1)*400)+'px'}"
                        >
                            <div class="br p05 f0 g1 t14 pl2 stickyleft">{{ind.variavel?.codigo}} {{ind.variavel?.titulo}}</div>
                            <div class="f0 flex" style="flex-basis:400px;" v-for="v in ind.variavel?.series">
                                <div class="f1 p05 t14 br">{{ v.valores_nominais[iP] ? v.valores_nominais[iP] : '-' }}</div>
                                <div class="f1 p05 t14 br">{{ v.valores_nominais[iR] ? v.valores_nominais[iR] : '-' }}</div>
                                <div class="f1 p05 t14 br">{{ v.valores_nominais[iPA] ? v.valores_nominais[iPA] : '-' }}</div>
                                <div class="f1 p05 t14 br">{{ v.valores_nominais[iRA] ? v.valores_nominais[iRA] : '-' }}</div>
                            </div>
                        </div>

                        <template v-for="ini in SingleSerie?.detalhes?.filter(x=>x?.iniciativa?.id)">
                            <div class="flex center bgc50 bb" :style="{width: ((ModeloSerie.length+1)*400)+'px'}">
                                <div class="flex center br p05 pl2 f0 g1 t12 w700 stickyleft bgc50">
                                    <span class="f0"><svg width="20" height="20"><use xlink:href="#i_valores"></use></svg></span>
                                    <span>{{ini.iniciativa.codigo}} {{ini.iniciativa.titulo}}</span>
                                </div>
                            </div>
                            <div class="flex center"
                                v-for="ind in ini.iniciativa.indicador"
                                :style="{width: ((ModeloSerie.length+1)*400)+'px'}"
                            >
                                <div class="flex center br p05 pl2 f0 g1 t14 w700 stickyleft">{{ind.codigo}} {{ind.titulo}}</div>
                                <div class="f0 flex" style="flex-basis:400px;" v-for="v in ind.series">
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iP] ? v.valores_nominais[iP] : '-' }}</div>
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iR] ? v.valores_nominais[iR] : '-' }}</div>
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iPA] ? v.valores_nominais[iPA] : '-' }}</div>
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iRA] ? v.valores_nominais[iRA] : '-' }}</div>
                                </div>
                            </div>

                            <div class="flex center"
                                v-for="ind in ini.filhos?.filter(x=>x?.variavel?.id)"
                                :style="{width: ((ModeloSerie.length+1)*400)+'px'}"
                            >
                                <div class="br p05 f0 g1 t14 pl2 stickyleft">{{ind.variavel?.codigo}} {{ind.variavel?.titulo}}</div>
                                <div class="f0 flex" style="flex-basis:400px;" v-for="v in ind.variavel?.series">
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iP] ? v.valores_nominais[iP] : '-' }}</div>
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iR] ? v.valores_nominais[iR] : '-' }}</div>
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iPA] ? v.valores_nominais[iPA] : '-' }}</div>
                                    <div class="f1 p05 t14 br">{{ v.valores_nominais[iRA] ? v.valores_nominais[iRA] : '-' }}</div>
                                </div>
                            </div>

                            <template v-for="ati in ini.filhos.filter(x=>x?.atividade?.id)">
                                <div class="flex center bgc50 bb" :style="{width: ((ModeloSerie.length+1)*400)+'px'}">
                                    <div class="flex center br p05 pl4 f0 g1 t12 w700 stickyleft bgc50">
                                        <span class="f0"><svg width="20" height="20"><use xlink:href="#i_valores"></use></svg></span>
                                        <span>{{ati.atividade.codigo}} {{ati.atividade.titulo}}</span>
                                    </div>
                                </div>
                                <div class="flex center"
                                    v-for="ind in ati.atividade.indicador"
                                    :style="{width: ((ModeloSerie.length+1)*400)+'px'}"
                                >
                                    <div class="flex center br p05 pl4 f0 g1 t14 w700 stickyleft">{{ind.codigo}} {{ind.titulo}}</div>
                                    <div class="f0 flex" style="flex-basis:400px;" v-for="v in ind.series">
                                        <div class="f1 p05 t14 br">{{ v.valores_nominais[iP] ? v.valores_nominais[iP] : '-' }}</div>
                                        <div class="f1 p05 t14 br">{{ v.valores_nominais[iR] ? v.valores_nominais[iR] : '-' }}</div>
                                        <div class="f1 p05 t14 br">{{ v.valores_nominais[iPA] ? v.valores_nominais[iPA] : '-' }}</div>
                                        <div class="f1 p05 t14 br">{{ v.valores_nominais[iRA] ? v.valores_nominais[iRA] : '-' }}</div>
                                    </div>
                                </div>

                                <div class="flex center"
                                    v-for="ind in ati.filhos?.filter(x=>x?.variavel?.id)"
                                    :style="{width: ((ModeloSerie.length+1)*400)+'px'}"
                                >
                                    <div class="br p05 f0 g1 t14 pl5 stickyleft">{{ind.variavel?.codigo}} {{ind.variavel?.titulo}}</div>
                                    <div class="f0 flex" style="flex-basis:400px;" v-for="v in ind.variavel?.series">
                                        <div class="f1 p05 t14 br">{{ v.valores_nominais[iP] ? v.valores_nominais[iP] : '-' }}</div>
                                        <div class="f1 p05 t14 br">{{ v.valores_nominais[iR] ? v.valores_nominais[iR] : '-' }}</div>
                                        <div class="f1 p05 t14 br">{{ v.valores_nominais[iPA] ? v.valores_nominais[iPA] : '-' }}</div>
                                        <div class="f1 p05 t14 br">{{ v.valores_nominais[iRA] ? v.valores_nominais[iRA] : '-' }}</div>
                                    </div>
                                </div>

                            </template>

                        </template>

                    </div>
                </template>
                <template v-else-if="tempPaineis.loading">
                    <div class="p1"><span>Carregando</span> <svg class="ml1 ib" width="20" height="20"><use xlink:href="#i_spin"></use></svg></div>
                </template>
                <template v-else-if="tempPaineis.error">
                    <div class="error p1"><p class="error-msg">Error: {{singleMeta.error}}</p></div>
                </template>
                <template v-else>
                    <div class="error p1"><p class="error-msg">Nenhum painel encontrado.</p></div>
                </template>

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
<style lang="less">
    @import "@/_less/variables.less";
    .evolucaoTable{
        border: 1px solid @c100; border-top: 8px solid #F2890D;overflow-x:auto;
        .header{
            align-content: stretch;
            .end{display: flex; flex-direction: column; justify-content: flex-end;}
        }
        >div{width: fit-content;}
        .stickyleft{
            flex-basis:400px !important; position: sticky; left:0; z-index: 2; background: white;
            &.bgc50{background: @c50;}
        }
        .label{margin: 0;}
        .bb{border-bottom: 1px solid @c100;}
        .br{border-right: 1px solid @c100;}
    }
</style>