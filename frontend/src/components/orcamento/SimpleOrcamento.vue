<script setup>
    const props = defineProps(['parentlink','item']);
    function dateToField(d){
        var dd=d?new Date(d):false;
        return (dd)?dd.toLocaleString('pt-BR',{dateStyle:'short',timeZone: 'UTC'}):'';
    }
</script>
<template>
    <div class="board_indicador mb2">
        <header class="p1">
            <div class="flex center g2">
                <div class="flex center f1">
                    <h2 class="mt1 mb1 ml1">{{item.ano_referencia}}</h2>
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
            <table class="tablemain" v-if="item.custeio_previsto">
                <thead>
                    <tr>
                        <th style="width: 25%">Previsão de Custo</th>
                        <th style="width: 17.5%">Investimento</th>
                        <th style="width: 17.5%">custeio</th>
                        <th style="width: 17.5%">parte da dotação</th>
                        <th style="width: 17.5%">Atualizado em</th>
                        <th style="width: 5%"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td clas="w700">{{item.investimento_previsto+item.custeio_previsto}}</td>
                        <td>{{item.investimento_previsto}}</td>
                        <td>{{item.custeio_previsto}}</td>
                        <td>{{item.parte_dotacao}}</td>
                        <td>{{dateToField(item.criado_em)}}</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            <div v-else class="tc">
                <router-link 
                    :to="`${parentlink}/orcamento`" 
                    class="addlink mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar previsão de custo</span></router-link>
            </div>
        </div>
        <div>
            <div class="tablepreinfo">
                <div class="t12 lh1 w700 mb05">Orçamento Planejado</div>
                <div class="t12 lh1 w700"><span class="tc300">Planejado total:</span> <span class="tvermelho">R$600.000</span></div>
            </div>
            <table class="tablemain" v-if="item.custeio_previsto">
                <thead>
                    <tr>
                        <th style="width: 25%">Dotação</th>
                        <th style="width: 17.5%">planejado para meta</th>
                        <th style="width: 17.5%">pressão orçamentária</th>
                        <th style="width: 5%"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    </tr>
                </tbody>
            </table>
            <div v-else class="tc">
                <router-link 
                    :to="`${parentlink}/orcamento`" 
                    class="addlink mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar dotação</span></router-link>
            </div>
        </div>
        <div>
            <div class="tablepreinfo">
                <div class="t12 lh1 w700 mb05">Execução orçamentária</div>
                <div class="t12 lh1 w700"><span class="tc300">Emprenho meta:</span> <span>R$600.000</span></div>
            </div>
            <table class="tablemain" v-if="item.custeio_previsto">
                <thead>
                    <tr>
                        <th style="width: 25%">Dotação / Processo / Nota</th>
                        <th style="width: 17.5%">Empenho meta</th>
                        <th style="width: 17.5%">Liquidado meta</th>
                        <th style="width: 5%"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    </tr>
                </tbody>
            </table>
            <div v-else class="flex center justifycenter">
                <div class="ml2 dropbtn">
                    <span class="addlink mt1 mb1"><svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar Empenho/Liquidação</span></span>
                    <ul class="tl">
                        <li><router-link :to="`${parentlink}/orcamento`">Dotação</router-link></li>
                        <li><router-link :to="`${parentlink}/orcamento`">Processo</router-link></li>
                        <li><router-link :to="`${parentlink}/orcamento`">Nota de empenho</router-link></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>