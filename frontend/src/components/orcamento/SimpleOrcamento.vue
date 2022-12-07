<script setup>
    import { ref  } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useOrcamentosStore } from '@/stores';
    import { default as LinhaPlanejado} from '@/components/orcamento/LinhaPlanejado.vue';
    
    const props = defineProps(['parentlink','config','meta_id']);
    const ano = props.config.ano_referencia;
    const OrcamentosStore = useOrcamentosStore();
    const { OrcamentoCusteio, OrcamentoPlanejado, OrcamentoRealizado } = storeToRefs(OrcamentosStore);
    OrcamentosStore.getById(props.meta_id,props.config.ano_referencia);
    
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
        return items.reduce((r,x)=>{return x[key]&&Number(x[key]) ? r+x[key] : r;},0);
    }
    function agrupaFilhos(array) {
        let ar = {items:[], filhos:{}};

        array.forEach(x=>{
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
                        <th style="width: 25%">Previsão de Custo</th>
                        <th style="width: 17.5%">Investimento</th>
                        <th style="width: 17.5%">custeio</th>
                        <th style="width: 17.5%">parte da dotação</th>
                        <th style="width: 17.5%">Atualizado em</th>
                        <th style="width: 50px"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in OrcamentoCusteio[ano]" :key="item.id">
                        <td class="w700">{{formataValor(item?.investimento_previsto+item?.custeio_previsto)}}</td>
                        <td>{{formataValor(item?.investimento_previsto)}}</td>
                        <td>{{formataValor(item?.custeio_previsto)}}</td>
                        <td style="word-break: break-all;">{{item?.parte_dotacao}}</td>
                        <td>{{dateToField(item?.criado_em)}}</td>
                        <td style="white-space: nowrap; text-align: right">
                            <router-link 
                                v-if="config.previsao_custo_disponivel"
                                :to="`${parentlink}/orcamento/custeio/${item.ano_referencia}`" 
                                class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-else class="tc">
                <router-link 
                    v-if="config.previsao_custo_disponivel"
                    :to="`${parentlink}/orcamento/custeio/${ano}`" 
                    class="addlink mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar previsão de custo</span></router-link>
                <span v-else class="addlink disabled mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar previsão de custo</span></span>
            </div>
        </div>
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
                                    <td>-</td>
                                    <td>-</td>
                                    <td></td>
                                </tr>
                                <LinhaPlanejado :group="g" :permissao="config.previsao_custo_disponivel" :parentlink="parentlink"/>
                            </tbody>
                            <template v-for="(gg,kk) in g.filhos">
                                <tbody>
                                    <tr>
                                        <td class="tc600 w700 pl2">{{gg.label}}</td>
                                        <td class="w700">{{formataValor(gg.items.reduce((red,x)=>red+x.valor_planejado,0))}}</td>
                                        <td class="w700 tvermelho">{{formataValor(gg.items.reduce((red,x)=>red+Number(x.pressao_orcamentaria_valor),0))}}</td>
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
        <div>
            <div class="tablepreinfo">
                <div class="t12 lh1 w700 mb05">Execução orçamentária</div>
                <div class="t12 lh1 w700" v-if="OrcamentoRealizado[ano].length"><span class="tc300">Empenho meta:</span> <span>{{ formataValor(somaItems(OrcamentoRealizado[ano],'valor_empenho')) }}</span> <span class="ml1 tc300">Liquidado meta:</span> <span>{{ formataValor(somaItems(OrcamentoRealizado[ano],'valor_liquidado')) }}</span></div>
            </div>
            <table class="tablemain fix" v-if="config.custeio_previsto">
                <thead>
                    <tr>
                        <th style="width: 50%">Dotação / Processo / Nota</th>
                        <th>Empenho meta</th>
                        <th>Liquidado meta</th>
                        <th style="width: 50px"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    </tr>
                </tbody>
            </table>
            <div class="flex center justifycenter">
                <div class="ml2 dropbtn" v-if="config.execucao_disponivel">
                    <span class="addlink mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar Empenho/Liquidação</span></span>
                    <ul class="tl">
                        <li><router-link :to="`${parentlink}/orcamento`">Dotação</router-link></li>
                        <li><router-link :to="`${parentlink}/orcamento`">Processo</router-link></li>
                        <li><router-link :to="`${parentlink}/orcamento`">Nota de empenho</router-link></li>
                    </ul>
                </div>
                <span v-else class="addlink disabled mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar Empenho/Liquidação</span></span>
            </div>
        </div>
    </div>
</template>