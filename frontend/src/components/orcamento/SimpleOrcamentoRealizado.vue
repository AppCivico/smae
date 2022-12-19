<script setup>
    import { ref  } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useOrcamentosStore } from '@/stores';
    import { default as LinhaRealizado} from '@/components/orcamento/LinhaRealizado.vue';

    const props = defineProps(['parentlink','config','meta_id']);
    const ano = props.config.ano_referencia;
    const OrcamentosStore = useOrcamentosStore();
    const { OrcamentoRealizado } = storeToRefs(OrcamentosStore);
    OrcamentosStore.getOrcamentoRealizadoById(props.meta_id,props.config.ano_referencia);

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
                <div class="t12 lh1 w700 mb05">Execução orçamentária</div>
                <div class="t12 lh1 w700" v-if="OrcamentoRealizado[ano].length"><span class="tc300">Empenho meta:</span> <span>{{ formataValor(somaItems(OrcamentoRealizado[ano],'soma_valor_empenho')) }}</span> <span class="ml1 tc300">Liquidação meta:</span> <span>{{ formataValor(somaItems(OrcamentoRealizado[ano],'soma_valor_liquidado')) }}</span></div>
            </div>
            <table class="tablemain fix" v-if="config.execucao_disponivel">
                <thead>
                    <tr>
                        <th style="width: 50%">Dotação / Processo / Nota</th>
                        <th>Empenho meta</th>
                        <th>Liquidação meta</th>
                        <th>Registros</th>
                        <th style="width: 50px"></th>
                    </tr>
                </thead>
                <template v-if="groups=agrupaFilhos(OrcamentoRealizado[ano])">
                    <tbody>
                        <LinhaRealizado :group="groups" :permissao="config.execucao_disponivel" :parentlink="parentlink"/>
                    </tbody>

                    <template v-for="(g,k) in groups.filhos">
                        <tbody>
                            <tr>
                                <td class="tc600 w700 pl1"><span class="flex center"><svg class="arrow f0 mr1" width="8" height="13"><use xlink:href="#i_right"></use></svg><span>{{g.label}}</span></span></td>
                                <td class="w700">{{g.items.length?formataValor(g.items.reduce((red,x)=>red+Number(x.soma_valor_empenho),0)):'-'}}</td>
                                <td class="w700">{{g.items.length?formataValor(g.items.reduce((red,x)=>red+Number(x.soma_valor_liquidado),0)):'-'}}</td>
                                <td></td>
                                <td></td>
                            </tr>
                            <LinhaRealizado :group="g" :permissao="config.previsao_custo_disponivel" :parentlink="parentlink"/>
                        </tbody>
                        <template v-for="(gg,kk) in g.filhos">
                            <tbody>
                                <tr>
                                    <td class="tc600 w700 pl2"><span class="flex center"><svg class="arrow f0 mr1" width="8" height="13"><use xlink:href="#i_right"></use></svg><span>{{gg.label}}</span></span></td>
                                    <td class="w700">{{gg.items.length?formataValor(gg.items.reduce((red,x)=>red+Number(x.soma_valor_empenho),0)):'-'}}</td>
                                    <td class="w700">{{gg.items.length?formataValor(gg.items.reduce((red,x)=>red+Number(x.soma_valor_liquidado),0)):'-'}}</td>
                                    <td></td>
                                    <td></td>
                                </tr>
                                <LinhaRealizado :group="gg" :permissao="config.previsao_custo_disponivel" :parentlink="parentlink"/>
                            </tbody>
                        </template>
                    </template>
                </template>
            </table>
            <div class="flex center justifycenter">
                <div class="ml2 dropbtn" v-if="config.execucao_disponivel">
                    <span class="addlink mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar Empenho/Liquidação</span></span>
                    <ul class="tl">
                        <li><router-link :to="`${parentlink}/orcamento/realizado/${ano}/dotacao`">Dotação</router-link></li>
                        <li><router-link :to="`${parentlink}/orcamento/realizado/${ano}/processo`">Processo</router-link></li>
                        <li><router-link :to="`${parentlink}/orcamento/realizado/${ano}/nota`">Nota de empenho</router-link></li>
                    </ul>
                </div>
                <span v-else class="addlink disabled mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar Empenho/Liquidação</span></span>
            </div>
        </div>
    </div>
</template>
