<script setup>
    const props = defineProps(['parent','list','indexes','editPeriodo']);
    function openParent(e) {
        e.target.closest('.accordeon').classList.toggle('active');
    }
    function dateToTitle(d) {
        var dd=d?new Date(d):false;
        if(!dd) return d;
        var month = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][dd.getUTCMonth()];
        var year = dd.getUTCFullYear();
        return `${month}/${year}`;
    }
</script>
<template>
    <div class="accordeon active p1" v-for="v in list" :key="v.variavel.id">
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
                        <th style="width: 50px"></th>
                    </tr>
                </thead>
                <tr v-if="v.series[0]?.pode_editar">
                    <td colspan="200" class="tc">
                        <a v-if="editPeriodo" @click="editPeriodo(parent,v.variavel.id,v.series[0].periodo)" class="tprimary addlink">
                            <svg width="20" height="20"><use xlink:href="#i_+"></use></svg> <span>Adicionar {{dateToTitle(v.series[0].periodo)}}</span>
                        </a>
                    </td>
                </tr>
                <tr v-for="val in v.series" :key="val.periodo" :class="{'bgs2':val.aguarda_cp}">
                    <td><div class="flex center"><div class="farol i1"></div> <span>{{dateToTitle(val.periodo)}}</span></div></td>
                    <td>{{val.series[indexes.indexOf('Previsto')]?.valor_nominal??'-'}}</td>
                    <td>{{val.series[indexes.indexOf('Realizado')]?.valor_nominal??'-'}}</td>
                    <td>{{val.series[indexes.indexOf('PrevistoAcumulado')]?.valor_nominal??'-'}}</td>
                    <td>{{val.series[indexes.indexOf('RealizadoAcumulado')]?.valor_nominal??'-'}}</td>
                    <td style="white-space: nowrap; text-align: right;">
                        <a v-if="val.pode_editar&&editPeriodo" @click="editPeriodo(parent,v.variavel.id,val.periodo)" class="tprimary">
                            <svg width="20" height="20"><use xlink:href="#i_edit"></use></svg>
                        </a>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</template>