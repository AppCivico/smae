<template>   
    <div id="horizontalBarContainer" style="height: 50px;">
        <HorizontalSideBySideBarsChart />
    </div>
    <div id="heatMapContainer" class="chartContainer"></div>
</template>

<script setup>

    import * as echarts from 'echarts';
    import HorizontalSideBySideBarsChart from '@/components/HorizontalSideBySideBarsChart.vue';
    import { defineProps } from 'vue';

    const props = defineProps({
        projetosPlanejadosMes: {
            type: Array,
            required: true,
        },
        projetosConcluidosMes: {
            type: Array,
            required: true,
        },        
        anosMapaCalorPlanejados: {
            type: Array,
            required: true,
        }
    });

    /*
    Parâmetros para plotagem do gráfico de calor:

        - Objeto para o gráfico:
            data: [
                {"ano": 2021, "mes": 1,  "coluna": 0,  "linha": 0, "quantidade": 2101},
                {"ano": 2021, "mes": 2,  "coluna": 1,  "linha": 0, "quantidade": 2102},
                ......
            ]

        - Array dos anos a serem plotados, do menor para o maior
            years = [2024, 2025, 2026, 2027]

        - Título do tooltip (enviar com formatação HTML, conforme exemplo):
            tooltipTitle = "<p>PROJETOS</p><p style="margin-block-start: -15px;">PLANEJADOS</p>"

        - Rodapé do tooltip:
            tooltipFooter = "Projetos Executados"
        
        - As 5 cores para o gráfico, da que representa o menor valor para o maior
            colorArray = ['#e8e8e8', '#ede5cf', '#d3bf88', '#a77e11', '#7e6113']
            
        - Título do gráfico    
            chartTitle = "Projetos Planejados"
    */

const var1 = 300;



    const data = props.projetosPlanejadosMes;

    const years = props.anosMapaCalorPlanejados;

    const tooltipTitle = '<div>PROJETOS</div><div style="margin-top: -13px;">PLANEJADOS</div>';

    const tooltipFooter = '<div>PROJETOS</div><div style="margin-top: -15px;">EXECUTADOS</div>';
        
    const colorArray = ['#e8e8e8', '#ede5cf', '#d3bf88', '#a77e11', '#7e6113'];
            
    const chartTitle = "Projetos Planejados";

    // Meses do eixo X
    const months = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    // Meses por extenso do tooltip
    const displayMonths = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Ano atual para usar nas comparações.
    const currentYear = new Date().getFullYear();

    // Maior valor dos dados
    var maxValue = 0;

    // Menor valor dos dados
    var minValue = 9999999999;

    // Redução dos dados para uso no gráfico
    const chartData = data.reduce((acc, item) => {
        // Monta o array para usar no gráfico
        // Dados da plotagem
        // [ posição Y no grid (começando no zero), posição X no grid (começando no zero), valor a ser plotado]
        const tempArray = [];
        tempArray.push(item.coluna);
        tempArray.push(item.linha);
        tempArray.push(item.quantidade);
        // Como o objeto pode conter valores de anos anteriores, só fazer o reduce do ano atual em diante.
        if(item.ano >= currentYear){
            const value = item.quantidade;
            // Verifica a maior quantidade para usar no gráfico
            if(maxValue < value){
                maxValue = value;
            }
            // Verifica a menor quantidade para usar no gráfico
            if(minValue >= value){
                minValue = value;
            }
                acc.push(tempArray);
        }
        return [...acc ]
    }, [])

    var myChart;
    var option;

    option = {
        tooltip: {
            position: 'bottom',
            padding: 2,
            cornerRadius: 20,
            borderColor: '#ffffff',
            textStyle: {
                fontFamily: 'Roboto Slab',
                color: '#221F43'
            },
            formatter: function (params) {
                var footerQuantity = 0;
                // Mês da posição atual do tooltip, independente do tipo de gráfico
                var searchMonth = params.data[0] + 1;
                // Recupera os valores de referência fora da plotagem do gráfico
                // Ano da posição atual do tooltip
                var searchYear = years[params.data[1]];
                // Pega a quantidade
                var finishedCurrentYear = data.filter(d => d.ano === searchYear && d.mes === searchMonth);
                if(finishedCurrentYear[0]){
                    footerQuantity = finishedCurrentYear[0].quantidade;
                } else{
                    footerQuantity = 0;
                }
                var monthYear = displayMonths[params.data[0]] + ' ' + years[params.data[1]];
                // Monta o HTML do tooltip
                var response = 
                    '<div style="background-color: lightBlue; min-width: 100px; justify-content: center; align-items: center;">' +
                    '<ul class="containerYearMonth" style="height: 15px; border: 1px solid black;">' +
                        '<li class="yearMonthTooltip" style="margin-top: 0px; margin-bottom: 0px;height: 15px;"><b>' +
                            // Linha inicial
                            '<hr>' +
                            // Ano e mês
                            '<div style="display: flex; height: 13px; line-height: 13px;">' + monthYear + '</div>' + 
                        '</li>' +
                    '</ul>' +
                    '<ul class="bodyQuantityDescription" style=" border: 1px solid black; display: flex; justify-content: center; align-items: center;">' +
                        '<li>' +
                            // Quantidade dos dados do gráfico
                            '<div style=" border: 1px solid black; padding-right: 2px; margin-bottom: 2px; font-size: 28px; text-align: end;  float: left; width: 50%;">' + '<b>' + params.data[2] + '</b>' + '</div>' + 
                            // Descrição dos dados
                            '<div style=" border: 1px solid black; font-size: 8px; text-align: start; align-self: flex-end; float: right; width: 50%;">' + tooltipTitle.toUpperCase() + '</div>' +
                        '</li>' +
                    '</ul>' +
                    '<ul class="footerQuantityDescription" style=" border: 1px solid black; display: flex; justify-content: center; align-items: center;">' +        
                        '<li>' +
                            // Quantidade anterior
                            '<div style=" border: 1px solid black; padding-right: 2px; font-size: 16px; text-align: end;  float: left; width: 50%;">' + '<b>' + footerQuantity + '</b>' + '</div>' + 
                            // Descrição da quantidade anterior
                            '<div style=" border: 1px solid black; font-size: 6px; text-align: start; align-self: flex-end; float: left; width: 50%;">' + tooltipFooter.toUpperCase() + '</div>' +
                            // Linha final
                            '<hr style="margin-top: -35px;">' +
                        '</li>' +
                    '</ul>' +
                    '</div>';
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
            },
            axisLabel: {
                fontFamily: 'Roboto',
                fontWeight: 600,
                color: '#7E858D',
                fontSize: 12,
            },
        },
        yAxis: {
            type: 'category',
            data: years,
            splitArea: {
                show: true
            },
            axisLabel: {
                fontFamily: 'Roboto',
                fontWeight: 600,
                color: '#7E858D',
                fontSize: 12,
            },
        },
        visualMap: {
            min: 0,
            max: maxValue,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '25%',
            inRange : {   
                    color: colorArray
                },
            itemWidth: 10,
            itemHeight: var1,
            align: 'top',
            textStyle: {
                fontFamily: 'Roboto Slab',
                fontWeight: 400,
                fontSize: 14,
                color: '#7E858D',
                height:60,
            }
        },
        series: [
            {
                name: chartTitle,
                type: 'heatmap',
                data: chartData,
                label: {
                    show: false
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                        padding: 10
                    }
                },
                itemStyle: {
                    borderWidth: 3,
                    borderColor: 'rgba(255, 255, 255, 1)',
                },
            }
        ]
    };

    function start() {

    }

    // Talvez possa ser substituido pelo READY.
    setTimeout(() => {
        var chartDom = document.getElementById('heatMapContainer');
        myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        option && myChart.setOption(option);

        console.log("******************************");
console.log(chartDom);



    }, 1000 );

</script>

<style lang="less">

    .yearMonthTooltip{
        font-size: 6px; 
        //width: 100%; 
        //height: 50%; 
    }

    .chartContainer{
        width: auto; 
        min-height: 400px; 
        text-align: center; 
        float: center;
    }

    .containerYearMonth {
        display: flex; 
        justify-content: center;
        align-items: center;
        font-weight: 600;
        font-size: 7px;
        line-height: 20px;
    }
    
    .bodyQuantityDescription{
        display: grid; 
        grid-template-columns: 1fr 1fr;
        font-weight: 600;
        font-size: 30px;
    }
  
    .footerQuantityDescription{
        display: grid; 
        grid-template-columns: 1fr 1fr;
        font-weight: 600;
        font-size: 15px;
        margin-bottom: 0px;
    }

    hr {
        height: 1px;
        border-top: 1px solid #e4e1e1;
    }
        
</style>
