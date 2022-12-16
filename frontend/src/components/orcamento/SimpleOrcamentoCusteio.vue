<script setup>
    import { ref  } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useOrcamentosStore } from '@/stores';
    import { default as LinhaCusteio} from '@/components/orcamento/LinhaCusteio.vue';
    
    const props = defineProps(['parentlink','config','meta_id']);
    const ano = props.config.ano_referencia;
    const OrcamentosStore = useOrcamentosStore();
    const { OrcamentoCusteio } = storeToRefs(OrcamentosStore);
    OrcamentosStore.getOrcamentoCusteioById(props.meta_id,props.config.ano_referencia);
    
    function dateToField(d){
        var dd=d?new Date(d):false;
        return (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
    }
    function formataValor(d){
        return Number(d).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }) ?? d;
    }
    function somaItems(items,key) {
        return items.reduce((r,x)=>{return x[key]&&Number(x[key]) ? r+Number(x[key]) : r;},0);
    }
    function maiorData(items,key) {
        return items.reduce((r,x)=>{
            let k = x[key] ? new Date(x[key]) : 1;
            return k>r?k:r;
        },new Date(0));
    }
    function agrupaFilhos(array) {
        let ar = {items:[], filhos:{}};

        if(array.length)array.forEach(x=>{
            if(x.iniciativa?.id&&!ar.filhos[x.iniciativa.id]) ar.filhos[x.iniciativa.id] = {id:x.iniciativa.id,label:x.iniciativa.codigo+' - '+x.iniciativa.titulo,filhos:{},items:[]};
            if(x.atividade?.id&&!ar.filhos[x.iniciativa.id].filhos[x.atividade.id]) ar.filhos[x.iniciativa.id].filhos[x.atividade.id] = {id:x.atividade.id,label:x.atividade.codigo+' - '+x.atividade.titulo,filhos:{},items:[]};

            if(x.atividade?.id){
                ar.filhos[x.iniciativa.id].filhos[x.atividade.id].items.push(x);
            }else if(x.iniciativa?.id){
                ar.filhos[x.iniciativa.id].items.push(x);
            }else if(x.meta?.id){
                ar.items.push(x);
            }
        });
        return ar;
    }
</script>
<template>
    <div class="board_indicador mb2">
        <header class="p1">
            <div class="flex center g2">
                <div class="flex center f1">
                    <h2 class="mt1 mb1 ml1">{{config.ano_referencia}}</h2>
                </div>
            </div>
        </header>
        <div>
            <div class="tablepreinfo">
                <div class="flex spacebetween">
                    <div class="flex center">
                        <div class="t12 lh1 w700">Previsão de custeio</div>
                    </div>
                </div>
            </div>
            <table class="tablemain fix" v-if="OrcamentoCusteio[ano].length">
                <thead>
                    <tr>
                        <th style="width: 25%">Previsão de Custo total</th>
                        <th style="width: 25%">Investimento total</th>
                        <th style="width: 25%">Custeio total</th>
                        <th style="width: 25%">Atualizado em</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="w700">{{formataValor(somaItems(OrcamentoCusteio[ano],'custeio_previsto')+somaItems(OrcamentoCusteio[ano],'investimento_previsto'))}}</td>
                        <td>{{formataValor(somaItems(OrcamentoCusteio[ano],'investimento_previsto'))}}</td>
                        <td>{{formataValor(somaItems(OrcamentoCusteio[ano],'custeio_previsto'))}}</td>
                        <td>{{dateToField(maiorData(OrcamentoCusteio[ano],'criado_em'))}}</td>
                    </tr>
                </tbody>
            </table>
            <table class="tablemain fix" v-if="OrcamentoCusteio[ano].length">
                <thead>
                    <tr>
                        <th style="width: 50%">Parte da dotação</th>
                        <th style="width: 25%">Previsão investimento</th>
                        <th style="width: 25%">Previsão de custeio</th>
                        <th style="width: 50px"></th>
                    </tr>
                </thead>
                <template v-if="groups=agrupaFilhos(OrcamentoCusteio[ano])">
                    <tbody>
                        <LinhaCusteio :group="groups" :permissao="config.previsao_custo_disponivel" :parentlink="parentlink"/>
                    </tbody>
                    
                    <template v-for="(g,k) in groups.filhos">
                        <tbody>
                            <tr>
                                <td class="tc600 w700 pl1">{{g.label}}</td>
                                <td class="w700">{{g.items.length?formataValor(g.items.reduce((red,x)=>red+Number(x.investimento_previsto),0)):'-'}}</td>
                                <td class="w700">{{g.items.length?formataValor(g.items.reduce((red,x)=>red+Number(x.custeio_previsto),0)):'-'}}</td>
                                <td></td>
                            </tr>
                            <LinhaCusteio :group="g" :permissao="config.previsao_custo_disponivel" :parentlink="parentlink"/>
                        </tbody>
                        <template v-for="(gg,kk) in g.filhos">
                            <tbody>
                                <tr>
                                    <td class="tc600 w700 pl2">{{gg.label}}</td>
                                    <td class="w700">{{gg.items.length?formataValor(gg.items.reduce((red,x)=>red+Number(x.investimento_previsto),0)):'-'}}</td>
                                    <td class="w700">{{gg.items.length?formataValor(gg.items.reduce((red,x)=>red+Number(x.custeio_previsto),0)):'-'}}</td>
                                    <td></td>
                                </tr>
                                <LinhaCusteio :group="gg" :permissao="config.previsao_custo_disponivel" :parentlink="parentlink"/>
                            </tbody>
                        </template>
                    </template>
                </template>
            </table>
            <div class="tc">
                <router-link 
                    v-if="config.previsao_custo_disponivel"
                    :to="`${parentlink}/orcamento/custeio/${ano}`" 
                    class="addlink mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar previsão de custo</span></router-link>
                <span v-else class="addlink disabled mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar previsão de custo</span></span>
            </div>
        </div>
    </div>
</template>