<script setup>
    import { ref  } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useOrcamentosStore } from '@/stores';
    import { default as LinhaPlanejado} from '@/components/orcamento/LinhaPlanejado.vue';
    
    const props = defineProps(['parentlink','config','meta_id']);
    const ano = props.config.ano_referencia;
    const OrcamentosStore = useOrcamentosStore();
    const { OrcamentoPlanejado } = storeToRefs(OrcamentosStore);
    OrcamentosStore.getOrcamentoPlanejadoById(props.meta_id,props.config.ano_referencia);
    
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
                <div class="t12 lh1 w700 mb05">Orçamento Planejado</div>
                <div class="t12 lh1 w700" v-if="OrcamentoPlanejado[ano].length"><span class="tc300">Planejado total:</span> <span class="tvermelho">{{ formataValor(somaItems(OrcamentoPlanejado[ano],'valor_planejado')) }}</span></div>
            </div>
            <table class="tablemain fix" v-if="OrcamentoPlanejado[ano].length">
                <thead>
                    <tr>
                        <th style="width: 50%">Dotação</th>
                        <th style="width: 30%">planejado para meta</th>
                        <th style="width: 210px; overflow: visible;"><span>pressão orçamentária</span> <div class="tipinfo right"><svg width="20" height="20"><use xlink:href="#i_i"></use></svg><div>Excedente no PdM em relação ao valor da dotação</div></div></th>
                        <th style="width: 50px"></th>
                    </tr>
                </thead>
                <template v-if="groups=agrupaFilhos(OrcamentoPlanejado[ano])">
                    <tbody>
                        <LinhaPlanejado :group="groups" :permissao="config.previsao_custo_disponivel" :parentlink="parentlink"/>
                    </tbody>
                    
                    <template v-for="(g,k) in groups.filhos">
                        <tbody>
                            <tr>
                                <td class="tc600 w700 pl1">{{g.label}}</td>
                                <td class="w700">{{g.items.length?formataValor(g.items.reduce((red,x)=>red+Number(x.valor_planejado),0)):'-'}}</td>
                                <td class="w700 tvermelho">{{g.items.length?formataValor(g.items.reduce((red,x)=>red+Number(x.pressao_orcamentaria_valor),0)):'-'}}</td>
                                <td></td>
                            </tr>
                            <LinhaPlanejado :group="g" :permissao="config.previsao_custo_disponivel" :parentlink="parentlink"/>
                        </tbody>
                        <template v-for="(gg,kk) in g.filhos">
                            <tbody>
                                <tr>
                                    <td class="tc600 w700 pl2">{{gg.label}}</td>
                                    <td class="w700">{{gg.items.length?formataValor(gg.items.reduce((red,x)=>red+Number(x.valor_planejado),0)):'-'}}</td>
                                    <td class="w700 tvermelho">{{gg.items.length?formataValor(gg.items.reduce((red,x)=>red+Number(x.pressao_orcamentaria_valor),0)):'-'}}</td>
                                    <td></td>
                                </tr>
                                <LinhaPlanejado :group="gg" :permissao="config.previsao_custo_disponivel" :parentlink="parentlink"/>
                            </tbody>
                        </template>
                    </template>
                </template>
            </table>
            <div class="tc">
                <router-link 
                    v-if="config.planejado_disponivel"
                    :to="`${parentlink}/orcamento/planejado/${ano}`" 
                    class="addlink mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar dotação</span></router-link>
                <span v-else class="addlink disabled mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar dotação</span></span>
            </div>
        </div>
    </div>
</template>