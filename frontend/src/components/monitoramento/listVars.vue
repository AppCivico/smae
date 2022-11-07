<script setup>
    const props = defineProps(['list','indexes']);
    function openParent(e) {
        e.target.closest('.accordeon').classList.toggle('active');
    }
</script>
<template>
    <div class="accordeon active p1" v-for="v in props.list" :key="v.variavel.id">
        <div class="flex mb1" @click="openParent">
            <span class="t0"><svg class="arrow" width="13" height="8"><use xlink:href="#i_down"></use></svg></span>
            <h4 class="t1 mb0">{{v.variavel.codigo}} {{v.variavel.titulo}}</h4>
        </div>
        <div class="content">
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
                <tr v-for="val in v.series" :key="val.periodo">
                    <td><div class="flex center"><div class="farol i1"></div> <span>{{val.periodo}}</span></div></td>
                    <td>{{val.series[indexes.indexOf('Previsto')]?.valor_nominal??'-'}}</td>
                    <td>{{val.series[indexes.indexOf('Realizado')]?.valor_nominal??'-'}}</td>
                    <td>{{val.series[indexes.indexOf('PrevistoAcumulado')]?.valor_nominal??'-'}}</td>
                    <td>{{val.series[indexes.indexOf('RealizadoAcumulado')]?.valor_nominal??'-'}}</td>
                    <td style="white-space: nowrap; text-align: right;">
                        <!-- <router-link :to="`${parentlink}/indicadores/${ind.id}`" class="tprimary"><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg></router-link> -->
                    </td>
                </tr>
            </table>
        </div>
    </div>
</template>