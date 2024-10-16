<template>   
    <div id="horizontalBarContainer" style="height: 50px; width: 60%;">
        <HorizontalSideBySideBarsChart />
    </div>
    <div id="heatMapContainer" class="chartContainer"></div>
</template>

<script setup>

    import * as echarts from 'echarts';
    import HorizontalSideBySideBarsChart from '@/components/HorizontalSideBySideBarsChart.vue';

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



    /* Objeto da API com os dados ods projetos concluídos
    const dados = [
        {"ano": 2021, "mes": 1,  "coluna": 0,  "linha": 0, "quantidade": 2101},
        {"ano": 2021, "mes": 2,  "coluna": 1,  "linha": 0, "quantidade": 2102},
        {"ano": 2021, "mes": 3,  "coluna": 2,  "linha": 0, "quantidade": 2103},
        {"ano": 2021, "mes": 4,  "coluna": 3,  "linha": 0, "quantidade": 2104},
        {"ano": 2021, "mes": 5,  "coluna": 4,  "linha": 0, "quantidade": 2105},
        {"ano": 2021, "mes": 6,  "coluna": 5,  "linha": 0, "quantidade": 2106},
        {"ano": 2021, "mes": 7,  "coluna": 6,  "linha": 0, "quantidade": 2107},
        {"ano": 2021, "mes": 8,  "coluna": 7,  "linha": 0, "quantidade": 2108},
        {"ano": 2021, "mes": 9,  "coluna": 8,  "linha": 0, "quantidade": 2109},
        {"ano": 2021, "mes": 10, "coluna": 9,  "linha": 0, "quantidade": 2110},
        {"ano": 2021, "mes": 11, "coluna": 10, "linha": 0, "quantidade": 2111},
        {"ano": 2021, "mes": 12, "coluna": 11, "linha": 0, "quantidade": 2112},
        {"ano": 2022, "mes": 1,  "coluna": 0,  "linha": 1, "quantidade": 2201},
        {"ano": 2022, "mes": 2,  "coluna": 1,  "linha": 1, "quantidade": 2202},
        {"ano": 2022, "mes": 3,  "coluna": 2,  "linha": 1, "quantidade": 2203},
        {"ano": 2022, "mes": 4,  "coluna": 3,  "linha": 1, "quantidade": 2204},
        {"ano": 2022, "mes": 5,  "coluna": 4,  "linha": 1, "quantidade": 2205},
        {"ano": 2022, "mes": 6,  "coluna": 5,  "linha": 1, "quantidade": 2206},
        {"ano": 2022, "mes": 7,  "coluna": 6,  "linha": 1, "quantidade": 2207},
        {"ano": 2022, "mes": 8,  "coluna": 7,  "linha": 1, "quantidade": 2208},
        {"ano": 2022, "mes": 9,  "coluna": 8,  "linha": 1, "quantidade": 2209},
        {"ano": 2022, "mes": 10, "coluna": 9,  "linha": 1, "quantidade": 2210},
        {"ano": 2022, "mes": 11, "coluna": 10, "linha": 1, "quantidade": 2211},
        {"ano": 2022, "mes": 12, "coluna": 11, "linha": 1, "quantidade": 2212},
        {"ano": 2023, "mes": 1,  "coluna": 0,  "linha": 2, "quantidade": 2301},
        {"ano": 2023, "mes": 2,  "coluna": 1,  "linha": 2, "quantidade": 2302},
        {"ano": 2023, "mes": 3,  "coluna": 2,  "linha": 2, "quantidade": 2303},
        {"ano": 2023, "mes": 4,  "coluna": 3,  "linha": 2, "quantidade": 2304},
        {"ano": 2023, "mes": 5,  "coluna": 4,  "linha": 2, "quantidade": 2305},
        {"ano": 2023, "mes": 6,  "coluna": 5,  "linha": 2, "quantidade": 2306},
        {"ano": 2023, "mes": 7,  "coluna": 6,  "linha": 2, "quantidade": 2307},
        {"ano": 2023, "mes": 8,  "coluna": 7,  "linha": 2, "quantidade": 2308},
        {"ano": 2023, "mes": 9,  "coluna": 8,  "linha": 2, "quantidade": 2309},
        {"ano": 2023, "mes": 10, "coluna": 9,  "linha": 2, "quantidade": 2310},
        {"ano": 2023, "mes": 11, "coluna": 10, "linha": 2, "quantidade": 2311},
        {"ano": 2023, "mes": 12, "coluna": 11, "linha": 2, "quantidade": 2312},
        {"ano": 2024, "mes": 1,  "coluna": 0,  "linha": 3, "quantidade": 2401},
        {"ano": 2024, "mes": 2,  "coluna": 1,  "linha": 3, "quantidade": 2402},
        {"ano": 2024, "mes": 3,  "coluna": 2,  "linha": 3, "quantidade": 2403},
        {"ano": 2024, "mes": 4,  "coluna": 3,  "linha": 3, "quantidade": 2404},
        {"ano": 2024, "mes": 5,  "coluna": 4,  "linha": 3, "quantidade": 2405},
        {"ano": 2024, "mes": 6,  "coluna": 5,  "linha": 3, "quantidade": 2406},
        {"ano": 2024, "mes": 7,  "coluna": 6,  "linha": 3, "quantidade": 2407},
        {"ano": 2024, "mes": 8,  "coluna": 7,  "linha": 3, "quantidade": 2408},
        {"ano": 2024, "mes": 9,  "coluna": 8,  "linha": 3, "quantidade": 2409},
        {"ano": 2024, "mes": 10, "coluna": 9,  "linha": 3, "quantidade": 2410},
        {"ano": 2024, "mes": 11, "coluna": 10, "linha": 3, "quantidade": 2411},
        {"ano": 2024, "mes": 12, "coluna": 11, "linha": 3, "quantidade":2412}
    ];

    // Anos que serão plotados no gráfico de projetos concluídos
    const anos_mapa_calor_concluidos = [2021, 2022, 2023, 2024];
    
    */

    /********************************************************/
    // Objeto da API com os dados dos projetos planejados
    const data = [
        {"ano": 2021, "mes": 1,  "coluna": 0,  "linha": 0, "quantidade": 2101},
        {"ano": 2021, "mes": 2,  "coluna": 1,  "linha": 0, "quantidade": 2102},
        {"ano": 2021, "mes": 3,  "coluna": 2,  "linha": 0, "quantidade": 2103},
        {"ano": 2021, "mes": 4,  "coluna": 3,  "linha": 0, "quantidade": 2104},
        {"ano": 2021, "mes": 5,  "coluna": 4,  "linha": 0, "quantidade": 2105},
        {"ano": 2021, "mes": 6,  "coluna": 5,  "linha": 0, "quantidade": 2106},
        {"ano": 2021, "mes": 7,  "coluna": 6,  "linha": 0, "quantidade": 2107},
        {"ano": 2021, "mes": 8,  "coluna": 7,  "linha": 0, "quantidade": 2108},
        {"ano": 2021, "mes": 9,  "coluna": 8,  "linha": 0, "quantidade": 2109},
        {"ano": 2021, "mes": 10, "coluna": 9,  "linha": 0, "quantidade": 2110},
        {"ano": 2021, "mes": 11, "coluna": 10, "linha": 0, "quantidade": 2111},
        {"ano": 2021, "mes": 12, "coluna": 11, "linha": 0, "quantidade": 2112},
        {"ano": 2022, "mes": 1,  "coluna": 0,  "linha": 1, "quantidade": 2201},
        {"ano": 2022, "mes": 2,  "coluna": 1,  "linha": 1, "quantidade": 2202},
        {"ano": 2022, "mes": 3,  "coluna": 2,  "linha": 1, "quantidade": 2203},
        {"ano": 2022, "mes": 4,  "coluna": 3,  "linha": 1, "quantidade": 2204},
        {"ano": 2022, "mes": 5,  "coluna": 4,  "linha": 1, "quantidade": 2205},
        {"ano": 2022, "mes": 6,  "coluna": 5,  "linha": 1, "quantidade": 2206},
        {"ano": 2022, "mes": 7,  "coluna": 6,  "linha": 1, "quantidade": 2207},
        {"ano": 2022, "mes": 8,  "coluna": 7,  "linha": 1, "quantidade": 2208},
        {"ano": 2022, "mes": 9,  "coluna": 8,  "linha": 1, "quantidade": 2209},
        {"ano": 2022, "mes": 10, "coluna": 9,  "linha": 1, "quantidade": 2210},
        {"ano": 2022, "mes": 11, "coluna": 10, "linha": 1, "quantidade": 2211},
        {"ano": 2022, "mes": 12, "coluna": 11, "linha": 1, "quantidade": 2212},
        {"ano": 2023, "mes": 1,  "coluna": 0,  "linha": 2, "quantidade": 2301},
        {"ano": 2023, "mes": 2,  "coluna": 1,  "linha": 2, "quantidade": 2302},
        {"ano": 2023, "mes": 3,  "coluna": 2,  "linha": 2, "quantidade": 2303},
        {"ano": 2023, "mes": 4,  "coluna": 3,  "linha": 2, "quantidade": 2304},
        {"ano": 2023, "mes": 5,  "coluna": 4,  "linha": 2, "quantidade": 2305},
        {"ano": 2023, "mes": 6,  "coluna": 5,  "linha": 2, "quantidade": 2306},
        {"ano": 2023, "mes": 7,  "coluna": 6,  "linha": 2, "quantidade": 2307},
        {"ano": 2023, "mes": 8,  "coluna": 7,  "linha": 2, "quantidade": 2308},
        {"ano": 2023, "mes": 9,  "coluna": 8,  "linha": 2, "quantidade": 2309},
        {"ano": 2023, "mes": 10, "coluna": 9,  "linha": 2, "quantidade": 2310},
        {"ano": 2023, "mes": 11, "coluna": 10, "linha": 2, "quantidade": 2311},
        {"ano": 2023, "mes": 12, "coluna": 11, "linha": 2, "quantidade": 2312},        
        {"ano": 2024, "mes": 1,  "coluna": 0,  "linha": 0, "quantidade": 2401},
        {"ano": 2024, "mes": 2,  "coluna": 1,  "linha": 0, "quantidade": 2402},
        {"ano": 2024, "mes": 3,  "coluna": 2,  "linha": 0, "quantidade": 2403},
        {"ano": 2024, "mes": 4,  "coluna": 3,  "linha": 0, "quantidade": 2404},
        {"ano": 2024, "mes": 5,  "coluna": 4,  "linha": 0, "quantidade": 2405},
        {"ano": 2024, "mes": 6,  "coluna": 5,  "linha": 0, "quantidade": 2406},
        {"ano": 2024, "mes": 7,  "coluna": 6,  "linha": 0, "quantidade": 2407},
        {"ano": 2024, "mes": 8,  "coluna": 7,  "linha": 0, "quantidade": 2408},
        {"ano": 2024, "mes": 9,  "coluna": 8,  "linha": 0, "quantidade": 2409},
        {"ano": 2024, "mes": 10, "coluna": 9,  "linha": 0, "quantidade": 2410},
        {"ano": 2024, "mes": 11, "coluna": 10, "linha": 0, "quantidade": 2411},
        {"ano": 2024, "mes": 12, "coluna": 11, "linha": 0, "quantidade": 2412},
        {"ano": 2025, "mes": 1,  "coluna": 0,  "linha": 1, "quantidade": 2501},
        {"ano": 2025, "mes": 2,  "coluna": 1,  "linha": 1, "quantidade": 2502},
        {"ano": 2025, "mes": 3,  "coluna": 2,  "linha": 1, "quantidade": 2503},
        {"ano": 2025, "mes": 4,  "coluna": 3,  "linha": 1, "quantidade": 2504},
        {"ano": 2025, "mes": 5,  "coluna": 4,  "linha": 1, "quantidade": 2505},
        {"ano": 2025, "mes": 6,  "coluna": 5,  "linha": 1, "quantidade": 2506},
        {"ano": 2025, "mes": 7,  "coluna": 6,  "linha": 1, "quantidade": 2507},
        {"ano": 2025, "mes": 8,  "coluna": 7,  "linha": 1, "quantidade": 2508},
        {"ano": 2025, "mes": 9,  "coluna": 8,  "linha": 1, "quantidade": 2509},
        {"ano": 2025, "mes": 10, "coluna": 9,  "linha": 1, "quantidade": 2510},
        {"ano": 2025, "mes": 11, "coluna": 10, "linha": 1, "quantidade": 2511},
        {"ano": 2025, "mes": 12, "coluna": 11, "linha": 1, "quantidade": 2512},
        {"ano": 2026, "mes": 1,  "coluna": 0,  "linha": 2, "quantidade": 2601},
        {"ano": 2026, "mes": 2,  "coluna": 1,  "linha": 2, "quantidade": 2602},
        {"ano": 2026, "mes": 3,  "coluna": 2,  "linha": 2, "quantidade": 2603},
        {"ano": 2026, "mes": 4,  "coluna": 3,  "linha": 2, "quantidade": 2604},
        {"ano": 2026, "mes": 5,  "coluna": 4,  "linha": 2, "quantidade": 2605},
        {"ano": 2026, "mes": 6,  "coluna": 5,  "linha": 2, "quantidade": 2606},
        {"ano": 2026, "mes": 7,  "coluna": 6,  "linha": 2, "quantidade": 2607},
        {"ano": 2026, "mes": 8,  "coluna": 7,  "linha": 2, "quantidade": 2608},
        {"ano": 2026, "mes": 9,  "coluna": 8,  "linha": 2, "quantidade": 2609},
        {"ano": 2026, "mes": 10, "coluna": 9,  "linha": 2, "quantidade": 2610},
        {"ano": 2026, "mes": 11, "coluna": 10, "linha": 2, "quantidade": 2611},
        {"ano": 2026, "mes": 12, "coluna": 11, "linha": 2, "quantidade": 2612},
        {"ano": 2027, "mes": 1,  "coluna": 0,  "linha": 3, "quantidade": 2701},
        {"ano": 2027, "mes": 2,  "coluna": 1,  "linha": 3, "quantidade": 2702},
        {"ano": 2027, "mes": 3,  "coluna": 2,  "linha": 3, "quantidade": 2703},
        {"ano": 2027, "mes": 4,  "coluna": 3,  "linha": 3, "quantidade": 2704},
        {"ano": 2027, "mes": 5,  "coluna": 4,  "linha": 3, "quantidade": 2705},
        {"ano": 2027, "mes": 6,  "coluna": 5,  "linha": 3, "quantidade": 2706},
        {"ano": 2027, "mes": 7,  "coluna": 6,  "linha": 3, "quantidade": 2707},
        {"ano": 2027, "mes": 8,  "coluna": 7,  "linha": 3, "quantidade": 2708},
        {"ano": 2027, "mes": 9,  "coluna": 8,  "linha": 3, "quantidade": 2709},
        {"ano": 2027, "mes": 10, "coluna": 9,  "linha": 3, "quantidade": 2710},
        {"ano": 2027, "mes": 11, "coluna": 10, "linha": 3, "quantidade": 2711},
        {"ano": 2027, "mes": 12, "coluna": 11, "linha": 3, "quantidade": 2712}
    ]
    
    // Anos que serão plotados no gráfico
    const years = [2024, 2025, 2026, 2027];

    const tooltipTitle = '<p>PROJETOS</p><p style="margin-block-start: -15px;">PLANEJADOS</p>';

    const tooltipFooter = "Projetos Executados";
        
    const colorArray = ['#e8e8e8', '#ede5cf', '#d3bf88', '#a77e11', '#7e6113'];
            
    const chartTitle = "Projetos Planejados";

    /***************************************************/


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

    /**********  CONCLUÍDO **********
    // Descrição do tooltip - Concluídos
    const tooltipTitleExe = '<p>PROJETOS</p><p style="margin-block-start: -15px;">CONCLUÍDOS</p>';
    var finishedMaxValue = 0;
    var finishedMinValue = 9999999999;
    const reducedFinished = dados.reduce((acc, item) => {
        // Verifica a maior quantidade de projetos para usar no gráfico
        const value = item.quantidade;
        if(finishedMaxValue < value){
            finishedMaxValue = value;
        }
        // Verifica a menor quantidade de projetos para usar no gráfico
        if(finishedMinValue >= value){
            finishedMinValue = value;
        }
        // Monta o array para usar no gráfico
        // Dados da plotagem
        // [ posição Y no grid (começando no zero), posição X no grid (começando no zero), valor a ser plotado] 
        const tempArray = [];
        tempArray.push(item.coluna);
        tempArray.push(item.linha);
        tempArray.push(item.quantidade);
        acc.push(tempArray);
        return [...acc ]
    }, [])
    /*

    /**********  GERAL **********/
    var myChart;
    var option;





    // Texto do corpo do tooltip
    var bodyTooltip = "";




    /* Carrega os valores padrão em função do tipo de gráfico
    if(currentChart == "PLA"){ // Se o gráfico for de planejados
        years = anos_mapa_calor_planejados;
        data = reducedValues;
        bodyTooltip = tooltipTitlePla;
        tooltipFooter = tooltipTitleExe;
        maxValue = maxValue;
        minValue = minValue;    
        colorArray = ['#e8e8e8', '#ede5cf', '#d3bf88', '#a77e11', '#7e6113'];
        chartTitle = "Projetos Planejados";
    } else{ // Se o gráfico for de concluídos
        years = anos_mapa_calor_concluidos;
        data = reducedFinished;
        bodyTooltip = tooltipTitleExe;
        tooltipFooter = tooltipTitlePla;    
        maxValue = finishedMaxValue;
        minValue = finishedMinValue;    
        colorArray = ['#e8e8e8', '#fdf3d6', '#fbe099', '#f7c233', '#d3a730'];
        chartTitle = "Projetos Concluídos";
    }
    */

    option = {
    tooltip: {
        position: 'bottom',
        padding: 2,
        formatter: function (params) {
            var footerQuantity = 0;
            // Mês da posição atual do tooltip, independente do tipo de gráfico
            var searchMonth = params.data[0] + 1;
            // Recupera os valores de referência fora da plotagem do gráfico
            //if(currentChart == "PLA"){
                // Ano da posição atual do tooltip, dependendo do tipo de gráfico
                var searchYear = years[params.data[1]];
                // Pega a quantidade de projetos executados no respectivo objeto
                var finishedCurrentYear = data.filter(d => d.ano === searchYear && d.mes === searchMonth);
                if(finishedCurrentYear[0]){
                    footerQuantity = finishedCurrentYear[0].quantidade;
                } else{
                    footerQuantity = 0;
                }
            /*} else{ 
                // Ano da posição atual do tooltip, dependendo do tipo de gráfico
                var searchYear = anos_mapa_calor_concluidos[params.data[1]];
                // Pega a quantidade de projetos planejados no respectivo objeto
                var finishedCurrentYear = projetos_planejados_mes.filter(d => d.ano === searchYear && d.mes === searchMonth);
                if(finishedCurrentYear[0]){
                    footerQuantity = finishedCurrentYear[0].quantidade;
                } else{
                    footerQuantity = 0;
                }
            }*/

            // Monta o HTML do tooltip
            var response = 
                '<div class="containerYearMonth">' +
                    // Ano e mês
                    '<div class="yearMonthTooltip"><b>' +
                        '<hr>' +
                        displayMonths[params.data[0]].toUpperCase() + ' ' + years[params.data[1]] + 
                    '</div>' +
                '</div>' +
                '<div class="bodyQuantityDescription">' +
                    // Quantidade dos dados do gráfico
                    '<div style="font-size: 28px; text-align: end;height: 70%;">' +
                        '<b>' + 
                            params.data[2] + 
                        '</b>' +
                    '</div>' + 
                    // Título do tipo de informação
                    '<div style="font-size: 8px; text-align: start;height: 70%;">' + 
                        tooltipTitle + 
                    '</div>' + 
                '</div>' +
                '<div class="footerQuantityDescription">' +
                    // Quantidade anteriores
                    '<div style="font-size: 16px; text-align: end;">' +
                        '<b>' + 
                            footerQuantity + 
                        '</b>' +
                    '</div>' + 
                    // Título do tipo de informação
                    '<div style="font-size: 6px; text-align: start;">' + 
                        tooltipFooter + 
                    '</div>' +
                '</div>' +
                '<div style="margin-top: -5px;">' +
                    '<hr>' +
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
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '25%',
        inRange : {   
                color: colorArray
            },
        itemWidth: 5,
        padding: 0
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
        }
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
    }, 1000 );

</script>

<style lang="less">

    .yearMonthTooltip{
        font-size: 6px; 
        width: 100%; 
        height: 50%; 
    }

    .chartContainer{
        width: 60%; 
        min-height: 400px; 
        text-align: center; 
        float: center;
    }

    .containerYearMonth {
        display: flex; 
        justify-content: center;
        align-items: center;
        height: 50px; 
        margin-top: -10px; 
        margin-bottom: -15px;
    }
    
    .bodyQuantityDescription{
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        height: 30px;
    }
  
    .footerQuantityDescription{
        display: grid; 
        grid-template-columns: 1fr 1fr;
        height: 25px;
    }

    hr {
        height: 1px;
        border-top: 1px solid #e4e1e1;
    }
        
</style>
