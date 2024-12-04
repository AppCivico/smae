<template>   
    <div id="projetosConcluidosMesContainer" class="chartContainer" autoresize></div>
</template>

<script setup>

    import * as echarts from 'echarts';
    //import HorizontalSideBySideBarsChart from '@/components/HorizontalSideBySideBarsChart.vue';
    import { defineProps } from 'vue';

    // Parâtros recebidos do container principal
    const props = defineProps({
        projetosPlanejadosMes: {
            type: Array,
            required: true,
        },
        projetosConcluidosMes: {
            type: Array,
            required: true,
        },        
        anosMapaCalorConcluidos: {
            type: Array,
            required: true,
        }
    });

    /************************************************************************************************
    * Parâmetros para plotagem do gráfico de calor:                                                 *
    *     - Objeto para o gráfico:                                                                  *
    *         data: [                                                                               *
    *             {"ano": 2021, "mes": 1,  "coluna": 0,  "linha": 0, "quantidade": 2101},           *
    *             {"ano": 2021, "mes": 2,  "coluna": 1,  "linha": 0, "quantidade": 2102},           *
    *             ......                                                                            *
    *         ]                                                                                     *
    *     - Array dos anos a serem plotados, do menor para o maior                                  *
    *         years = [2024, 2025, 2026, 2027]                                                      *
    *     - Título do tooltip (enviar com formatação HTML, conforme exemplo):                       *
    *         tooltipTitle = "<p>PROJETOS</p><p style="margin-block-start: -15px;">PLANEJADOS</p>"  *
    *     - Rodapé do tooltip:                                                                      *
    *         tooltipFooter = "Projetos Executados"                                                 *
    *     - As 5 cores para o gráfico, da que representa o menor valor para o maior                 *
    *         colorArray = ['#e8e8e8', '#ede5cf', '#d3bf88', '#a77e11', '#7e6113']                  *
    *     - Título do gráfico                                                                       *
    *         chartTitle = "Projetos Planejados"                                                    *
    *************************************************************************************************/

    // Verifica se os dados retornaram íntegros
    if(props.projetosPlanejadosMes != null && props.projetosPlanejadosMes.length > 0 && 
       props.projetosConcluidosMes != null && props.projetosConcluidosMes.length > 0 && 
       props.anosMapaCalorConcluidos != null && props.anosMapaCalorConcluidos.length == 4){

        let data = props.projetosConcluidosMes;
        let secondaryData = props.projetosPlanejadosMes;
        let years = props.anosMapaCalorConcluidos;//.sort();
        let tooltipTitlePlural = '<div>PROJETOS</div><div style="margin-top: -11px;">CONCLUÍDOS</div>';
        let tooltipTitleSingular = '<div>PROJETO</div><div style="margin-top: -11px;">CONCLUÍDO</div>';
        let tooltipFooterPlural = '<div>PROJETOS</div><div style="margin-top: -13px;">PLANEJADOS</div>';
        let tooltipFooterSingular = '<div>PROJETO</div><div style="margin-top: -13px;">PLANEJADO</div>';
        let colorArray = ['#e8e8e8', '#FDF3D6', '#FBE099', '#F7C233', '#D3A730'];     
        let chartTitle = "Projetos Concluidos";

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
        let maxValue = 0;

        // Menor valor dos dados
        let minValue = 9999999999;

        // Redução dos dados para uso no gráfico
        const chartData = data.reduce((acc, item) => {
            // Monta o array para usar no gráfico
            // Dados da plotagem
            // [ posição Y no grid (começando no zero), posição X no grid (começando no zero), valor a ser plotado]
            const tempArray = [];
            tempArray.push(item.coluna);
            tempArray.push(item.linha);
            tempArray.push(item.quantidade);
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
            return [...acc ]
        }, [])

        let heatmapChart;

        let option;

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
                    let footerQuantity = 0;
                    // Mês da posição atual do tooltip, independente do tipo de gráfico
                    let searchMonth = params.data[0] + 1;
                    // Recupera os valores de referência fora da plotagem do gráfico
                    // Ano da posição atual do tooltip
                    let searchYear = years[params.data[1]];
                    // Pega a quantidade
                    let finishedCurrentYear = secondaryData.filter(d => d.ano === searchYear && d.mes === searchMonth);
                    if(finishedCurrentYear[0]){
                        footerQuantity = finishedCurrentYear[0].quantidade;
                    } else{
                        footerQuantity = 0;
                    }
                    let monthYear = displayMonths[params.data[0]] + ' ' + years[params.data[1]];
                    // Verifica se a quantidade principal e secondária para definir plural e singular
                    let tooltipTitle = tooltipTitlePlural;
                    let tooltipFooter = tooltipFooterPlural;
                    if(params.data[2] == 1){
                        tooltipTitle = tooltipTitleSingular
                    }
                    if(footerQuantity == 1){
                        tooltipFooter = tooltipFooterSingular
                    }
                    // Monta o HTML do tooltip
                    let response = 
                        '<div class="grid-container">' +
                            '<div class="firstLine">' +
                                '<hr class="firstLineHR">' +
                                '<div class="firstLineMonthYear">' +
                                    monthYear +
                                '</div>' +
                            '</div>' +
                            '<div class="secondLine">' +
                                '<div class="secondLineQtd">' +
                                    '<b>' + params.data[2] + '</b>' +
                                '</div>' +
                                '<div class="secondLineDes">' +
                                    tooltipTitle +
                                '</div>' +
                            '</div>' +  
                            '<div class="thirdLine">' +
                                '<div class="thirdLineQtd">' +
                                    '<b>' + footerQuantity + '</b>' +
                                '</div>' +
                                '<div class="thirdLineDes"> ' +
                                    tooltipFooter +
                                '</div>' +
                            '</div>' +
                            '<div class="fourthLine">' +
                                '<hr class="fourthLineHR">' +
                            '</div>' +
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
                axisLine: { show: false },
                axisTick: { show: false },           
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
                axisLine: { show: false },
                axisTick: { show: false },            
            },
            visualMap: {
                id: 1,
                type: 'continuous',
                min: 0,
                max: maxValue,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '20%',
                inRange : {   
                        color: colorArray
                    },
                itemWidth: 15,
                itemHeight: 300,
                align: 'top',
                textStyle: {
                    fontFamily: 'Roboto Slab',
                    fontWeight: 400,
                    fontSize: 14,
                    color: '#7E858D',
                },
                indicatorIcon: 'line',
                indicatorSize: '90%',
                indicatorStyle: {
                    color: '#A8A8A8',
                    borderColor: '#A8A8A8',
                    borderWidth: 5,
                    borderType: 'solid',
                    shadowColor: '#FFFFCC',
                    shadowBlur: 10,
                    borderCap: 'round'
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

        // Adicionar o listener para quando a página mudar de tamanho
        window.addEventListener('resize', function() {
            var tt = this;
            this.setTimeout(function() {
                heatmapChart.resize();
            }, 100);    
        });

        // Espera para o DOM estar pronto (talvez possa ser substituido pelo READY).
        setTimeout(() => {
            let chartDom = document.getElementById('projetosConcluidosMesContainer');
            heatmapChart = echarts.init(chartDom, null, {
                renderer: 'canvas'
            });
            option && heatmapChart.setOption(option);
        }, 1000 );
    } else{
        throw new Error('Não foi possível mostrar o gráfico de calor de Projetos Concluídos! Por favor, contacte o atendimento: smae.prefeitura.sp@fgv.br.'); 
    }

</script>

<style lang="less">

    .chartContainer{
        width: auto; 
        min-height: 400px; 
        text-align: center; 
        float: center;
    }

    hr {
        height: 1px;
        border-top: 1px solid #e4e1e1;
    }
        
    // Tooltip traço inicial, mês e ano - 1ª linha
    .firstLine { 
        grid-area: monthYear; 
        margin-top: 0px; 
        margin-bottom: 0px; 
        height: 25px; 
        justify-content: center; 
        align-items: center; 
        text-align: center;
    }

    // Traço inicial
    .firstLineHR{
        width: 65%; 
        margin-left: auto; 
        margin-right: auto;
    }

    // Mês e ano
    .firstLineMonthYear{
        font-size: 10px; 
        height: 13px; 
        line-height: 13px; 
        margin-top: 0px;
    }

    // Tooltip quantidade principal e descrição - 2ª linha
    .secondLine { 
        grid-area: mainQtd; 
        display: flex;
        margin-top: -12px;
        justify-content: center; 
        align-items: center;
    }

    // Quantidade principal
    .secondLineQtd{
        margin-bottom: 7px; 
        font-size: 30px; 
        text-align: end;  
        float: left; 
        width: 50%;
    }

    // Descrição da quantidade principal
    .secondLineDes{ 
        margin-left: 2px; 
        font-size: 10px; 
        text-align: start; 
        align-self: flex-end; 
        float: right; 
        width: 50%;
    }

    // Tooltip quantidade secundária e descrição - 3ª linha
    .thirdLine { 
        grid-area: footerQtd; 
        display: flex;
        margin-top: -7px; 
        justify-content: center; 
        align-items: center;
    }

    // Quantidade secundária
    .thirdLineQtd{
        padding-right: 2px; 
        margin-bottom: 0px; 
        font-size: 18px; 
        text-align: end; 
        float: left; 
        width: 50%;
    }

    // Descrição da quantidade secundária
    .thirdLineDes{
        margin-bottom: -5px; 
        font-size: 8px; 
        text-align: start; 
        align-self: flex-end; 
        float: left; 
        width: 50%;
    }

    // Tooltip traço final - 4ª linha
    .fourthLine { 
        grid-area: footerLine; 
    }

    // Traço final
    .fourthLineHR{
        width: 65%; 
        margin-top: -2px; 
        margin-left: auto; 
        margin-right: auto;
    }

    .grid-container {
    display: grid;
    grid-template-areas:
        'monthYear'
        'mainQtd'
        'footerQtd'
        'footerLine';
    gap: 2px;
    padding: 2px;
    min-width: 110px;
    }

    .grid-container > div {
    text-align: center;
    padding: 0 0;
    }

    .chart {
        height: 400px;
    }

</style>
