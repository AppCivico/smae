<template>
    
    <!--<div id="teste" style="height: 400px;">-->
    <div id="heatMapContainer" style="width: 60%; min-height: 400px"></div>



    
  <!--</div>-->
    
</template>


<script setup>

import { provide } from "vue";
//import { HeatmapChart } from 'echarts/charts';
import * as echarts from 'echarts';
import { interval } from "date-fns";

//import { HeatMapComponent as EjsHeatmap, Tooltip, Legend } from 'echarts/charts';


var myChart;
var option;




// prettier-ignore
const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const displayMonths = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// prettier-ignore
const years = [
    '2021', '2022', '2023', '2024'
];
// prettier-ignore

// [ posição Y no grid (começando no zero), posição X no grid (começando no zero), valor a ser plotado]
const data = [
      [0, 0, 5], [0, 1, 1], [0, 2, 0], [0, 3, 20], [0, 4, 0], [0, 5, 18], [0, 6, 0], [0, 7, 0], [0, 8, 0], [0, 9, 0], [0, 10, 0], [0, 11, 2], 
      [1, 0, 7], [1, 1, 15], [1, 2, 30], [1, 3, 0], [1, 4, 0], [1, 5, 0], [1, 6, 25], [1, 7, 0], [1, 8, 35], [1, 9, 0], [1, 10, 5], [1, 11, 2], 
      [2, 0, 1], [2, 1, 1], [2, 2, 25], [2, 3, 40], [2, 4, 0], [2, 5, 25], [2, 6, 0], [2, 7, 0], [2, 8, 0], [2, 9, 0], [2, 10, 3], [2, 11, 2], 
      [3, 0, 7], [3, 1, 3], [3, 2, 0], [3, 3, 40], [3, 4, 0], [3, 5, 0], [3, 6, 0], [3, 7, 50], [3, 8, 1], [3, 9, 0], [3, 10, 5], [3, 11, 4]
    ]
    .map(function (item) {
    return [item[1], item[0], item[2] || '-'];
});


option = {
  tooltip: {
    position: 'top',
    formatter: function (params) {
        var response = 
            '<div>' + 
                
                '<div style="display: flex; font-size: 9px;"><b>' +
                    '<hr>' +
                displayMonths[params.data[0]] + ' ' + years[params.data[1]] + 
                '</div>' +
                '<br>' + 
                '<div style="display: flex; font-size: 14px;"><b>' + 
                    params.data[2] + 
                '</b></div>' + ' ' + 
                params.seriesName + ' ' +  
            '</div>';
            console.log(response);
        return response;
    }
  },
  grid: {
    height: '50%',
    width: '90%',
    top: '10%',
    left: '10%',
    right: '20%'
  },
  xAxis: {
    type: 'category',
    axisLabel: {
      align: 'center',
      interval: 0
    },
    axisTick: {
        alignWithLabel: true
      },
    data: months,
    splitArea: {
      show: true
    }
  },
  yAxis: {
    type: 'category',
    data: years,
    splitArea: {
      show: true
    }
  },
  visualMap: {
    min: 0,
    max: 50,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: '0%',





    inRange : {   
            color: ['#e8e8e8', '#ede5cf', '#d2be87', '#a77e11', '#7e6113'] //From smaller to bigger value ->
        },
    itemWidth: 5,
    padding: 0
  },
  series: [
    {
      name: 'Proj Planejados',
      type: 'heatmap',
      data: data,
      label: {
        show: true
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
          padding: 10
        }
      }
    }
    ]
};










function start() {



}

//provide('heatmap', [Tooltip, Legend])


setTimeout(() => {
    var chartDom = document.getElementById('heatMapContainer');
    myChart = echarts.init(chartDom, null, {
  renderer: 'canvas',
  useDirtyRect: false
});
    option && myChart.setOption(option);
}, 2000 );



</script>



<style lang="less">

</style>
