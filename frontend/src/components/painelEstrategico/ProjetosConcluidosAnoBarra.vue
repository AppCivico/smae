<template>   
    <div class="ProjetosConcluidosAnoMain" onload="init();">
        <div id="ProjetosConcluidosAnoContainer">
            <ul id="ProjetosConcluidosAnoCol1" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="ProjetosConcluidosAnoLabel1" style="min-width: fit-content;"></p>
                </li>
                <li id="ProjetosConcluidosAnoBarra1" class="ProjetosConcluidosHorizontalBar">
                    <!-- TOOLTIP da primeira barra  -->
                    <div id="ProjetosConcluidosAnoBarra1Tooltip" class="ProjetosConcluidosTooltipTextLeft">
                        <div class="ProjetosConcluidosAnoFirstLine">
                            <hr class="ProjetosConcluidosAnoFirstLineHR">
                            <div id="ProjetosConcluidosAnoBarra1Total" class="ProjetosConcluidosAnoFirstLineMonthYear">
                                TOTAL DE
                            </div>
                        </div>
                        <div class="ProjetosConcluidosAnoSecondLine">
                            <div id="ProjetosConcluidosAnoBarra1Qtd" class="ProjetosConcluidosAnoSecondLineQtd">
                                
                            </div>
                            <div id="ProjetosConcluidosAnoBarra1Desc" class="ProjetosConcluidosAnoSecondLineDes" style="margin-top: -15px;">
                                
                            </div>
                        </div>  
                        <div class="ProjetosConcluidosAnoThirdLine" style="margin-top: 5px;">
                            <hr class="ProjetosConcluidosAnoThirdLineHR">
                        </div>
                    </div>
                </li>
            </ul>
            <ul id="ProjetosConcluidosAnoCol2" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="ProjetosConcluidosAnoLabel2" style="min-width: fit-content;"></p>
                </li>
                <li id="ProjetosConcluidosAnoBarra2" class="ProjetosConcluidosHorizontalBar">
                    <!-- TOOLTIP da segunda barra -->
                    <div id="ProjetosConcluidosAnoBarra2Tooltip" class="ProjetosConcluidosTooltipTextLeft">
                        <div class="ProjetosConcluidosAnoFirstLine">
                            <hr class="ProjetosConcluidosAnoFirstLineHR">
                            <div id="ProjetosConcluidosAnoBarra2Total" class="ProjetosConcluidosAnoFirstLineMonthYear">
                                TOTAL DE
                            </div>
                        </div>
                        <div class="ProjetosConcluidosAnoSecondLine">
                            <div id="ProjetosConcluidosAnoBarra2Qtd" class="ProjetosConcluidosAnoSecondLineQtd">
                                
                            </div>
                            <div id="ProjetosConcluidosAnoBarra2Desc" class="ProjetosConcluidosAnoSecondLineDes" style="margin-top: -15px;">
                                
                            </div>
                        </div>  
                        <div class="ProjetosConcluidosAnoThirdLine" style="margin-top: 5px;">
                            <hr class="ProjetosConcluidosAnoThirdLineHR">
                        </div>
                    </div>
                </li>
            </ul>
            <ul  id="ProjetosConcluidosAnoCol3" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="ProjetosConcluidosAnoLabel3" style="min-width: fit-content;"></p>
                </li>
                <li id="ProjetosConcluidosAnoBarra3" class="ProjetosConcluidosHorizontalBar">
                    <!-- TOOLTIP da terceira barra -->
                    <div id="ProjetosConcluidosAnoBarra3Tooltip" class="ProjetosConcluidosTooltipTextRight">
                        <div class="ProjetosConcluidosAnoFirstLine">
                            <hr class="ProjetosConcluidosAnoFirstLineHR">
                            <div id="ProjetosConcluidosAnoBarra3Total" class="ProjetosConcluidosAnoFirstLineMonthYear">
                                TOTAL DE
                            </div>
                        </div>
                        <div class="ProjetosConcluidosAnoSecondLine">
                            <div id="ProjetosConcluidosAnoBarra3Qtd" class="ProjetosConcluidosAnoSecondLineQtd">
                                
                            </div>
                            <div id="ProjetosConcluidosAnoBarra3Desc" class="ProjetosConcluidosAnoSecondLineDes" style="margin-top: -15px;">
                                
                            </div>
                        </div>  
                        <div class="ProjetosConcluidosAnoThirdLine" style="margin-top: 5px;">
                            <hr class="ProjetosConcluidosAnoThirdLineHR">
                        </div>
                    </div>
                </li>
            </ul>
            <ul  id="ProjetosConcluidosAnoCol4" style="min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="ProjetosConcluidosAnoLabel4" style="min-width: fit-content;"></p>
                </li>
                <li id="ProjetosConcluidosAnoBarra4" class="ProjetosConcluidosHorizontalBar">
                    <!-- TOOLTIP da quarta barra -->
                    <div id="ProjetosConcluidosAnoBarra4Tooltip" class="ProjetosConcluidosTooltipTextRight">
                        <div class="ProjetosConcluidosAnoFirstLine">
                            <hr class="ProjetosConcluidosAnoFirstLineHR">
                            <div id="ProjetosConcluidosAnoBarra4Total" class="ProjetosConcluidosAnoFirstLineMonthYear">
                                TOTAL DE
                            </div>
                        </div>
                        <div class="ProjetosConcluidosAnoSecondLine">
                            <div id="ProjetosConcluidosAnoBarra4Qtd" class="ProjetosConcluidosAnoSecondLineQtd">
                                
                            </div>
                            <div id="ProjetosConcluidosAnoBarra4Desc" class="ProjetosConcluidosAnoSecondLineDes" style="margin-top: -15px;">
                                
                            </div>
                        </div>  
                        <div class="ProjetosConcluidosAnoThirdLine" style="margin-top: 5px;">
                            <hr class="ProjetosConcluidosAnoThirdLineHR">
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>

    import { defineProps } from 'vue';

    // Parâtros recebidos do container principal
    const props = defineProps({
        projetosConcluidosAno: {
            type: Array,
            required: true,
        },
    });

    // Define a cor da barra
    let barsBackgroundColor = '#d3a730';

    // Verifica se os dados retornaram íntegros
    if(props.projetosConcluidosAno != null && props.projetosConcluidosAno.length > 0){

        // Array que receberá o tamanho original das barras, para saber se é plural ou singular
        let originalBarsWidth = [];

        // Array que receberá o tamanho das barras
        let barsWidth = [];

        // Variável que receberá o total dos valores de projetos
        let totalProjects = 0;

        // Array que receberá o título das barras
        let labels = [];

        // Ordena o array de jsons da resposta da API pelo ano
        let dataSortedByYear = props.projetosConcluidosAno.sort((a, b) => {
            if (a.ano < b.ano) {
                return -1;
            }
        });

        // Extrai as informações da resposta da API
        for(let i=0; i < dataSortedByYear.length; i++){
            labels[i] = "" + dataSortedByYear[i].ano;
            originalBarsWidth[i] = dataSortedByYear[i].quantidade;
            // Acumula o total de projetos
            totalProjects = totalProjects + dataSortedByYear[i].quantidade;
        }
    
        // Calcula o percentual do tamanho das barras
        barsWidth[0] = Math.ceil(originalBarsWidth[0] / totalProjects * 100);
        barsWidth[1] = Math.ceil(originalBarsWidth[1] / totalProjects * 100);
        barsWidth[2] = Math.ceil(originalBarsWidth[2] / totalProjects * 100);
        barsWidth[3] = Math.ceil(originalBarsWidth[3] / totalProjects * 100);

        function init(){

            // Valores default para quando a quantidade for igual a 0
            let barDefaultWidth1 = "0px";
            let barDefaultWidth2 = "0px";
            let barDefaultWidth3 = "0px";
            let barDefaultWidth4 = "0px";
            let barsBackgroundColor1 = "#ffffff";
            let barsBackgroundColor2 = "#ffffff";
            let barsBackgroundColor3 = "#ffffff";
            let barsBackgroundColor4 = "#ffffff";
            let barsBorder1 = '1px solid ' + barsBackgroundColor;
            let barsBorder2 = '1px solid ' + barsBackgroundColor;
            let barsBorder3 = '1px solid ' + barsBackgroundColor;
            let barsBorder4 = '1px solid ' + barsBackgroundColor;

            // Se o valor da barra for maior do que 0, define largura e cor da barra
            if(barsWidth[0] > 0){
                barDefaultWidth1 = barsWidth[0] + "%";
                barsBackgroundColor1 = barsBackgroundColor; 
            }
            if(barsWidth[1] > 0){
                barDefaultWidth2 = barsWidth[1] + "%";
                barsBackgroundColor2 = barsBackgroundColor; 
            }
            if(barsWidth[2] > 0){
                barDefaultWidth3 = barsWidth[2] + "%";
                barsBackgroundColor3 = barsBackgroundColor; 
            }
            if(barsWidth[3] > 0){
                barDefaultWidth4 = barsWidth[3] + "%";
                barsBackgroundColor4 = barsBackgroundColor; 
            }

            // Define o label de cada barra e a margem esquerda, dependendo do tamanho da barra
            document.getElementById('ProjetosConcluidosAnoLabel1').innerText=labels[0];
            document.getElementById('ProjetosConcluidosAnoLabel2').innerText=labels[1];
            document.getElementById('ProjetosConcluidosAnoLabel3').innerText=labels[2];
            document.getElementById('ProjetosConcluidosAnoLabel4').innerText=labels[3];
            
            // Define se a descrição da quantidade é no singular ou plural
            let singularExpression = "PROJETO CONCLUÍDO";
            let pluralExpression = "PROJETOS CONCLUÍDOS";
            document.getElementById('ProjetosConcluidosAnoBarra1Desc').innerHTML=pluralExpression;
            document.getElementById('ProjetosConcluidosAnoBarra2Desc').innerHTML=pluralExpression;
            document.getElementById('ProjetosConcluidosAnoBarra3Desc').innerHTML=pluralExpression;
            document.getElementById('ProjetosConcluidosAnoBarra4Desc').innerHTML=pluralExpression;
            if(originalBarsWidth[0] == 1){
                document.getElementById('ProjetosConcluidosAnoBarra1Desc').innerHTML=singularExpression;
            }
            if(originalBarsWidth[1] == 1){
                document.getElementById('ProjetosConcluidosAnoBarra2Desc').innerHTML=singularExpression;
            }
            if(originalBarsWidth[2] == 1){
                document.getElementById('ProjetosConcluidosAnoBarra3Desc').innerHTML=singularExpression;
            }
            if(originalBarsWidth[3] == 1){
                document.getElementById('ProjetosConcluidosAnoBarra4Desc').innerHTML=singularExpression;
            }

            // Define o tamanho, a cor e o texto do tooltip de cada barra.
            document.getElementById('ProjetosConcluidosAnoCol1').style.width=barDefaultWidth1;
            document.getElementById('ProjetosConcluidosAnoBarra1').style.backgroundColor=barsBackgroundColor1;
            document.getElementById('ProjetosConcluidosAnoBarra1Qtd').innerText=props.projetosConcluidosAno[0].quantidade;
            document.getElementById('ProjetosConcluidosAnoCol2').style.width=barDefaultWidth2;
            document.getElementById('ProjetosConcluidosAnoBarra2').style.backgroundColor=barsBackgroundColor2;
            document.getElementById('ProjetosConcluidosAnoBarra2Qtd').innerText=props.projetosConcluidosAno[1].quantidade;
            document.getElementById('ProjetosConcluidosAnoCol3').style.width=barDefaultWidth3;
            document.getElementById('ProjetosConcluidosAnoBarra3').style.backgroundColor=barsBackgroundColor3;
            document.getElementById('ProjetosConcluidosAnoBarra3Qtd').innerText=props.projetosConcluidosAno[2].quantidade;
            document.getElementById('ProjetosConcluidosAnoCol4').style.width=barDefaultWidth4;
            document.getElementById('ProjetosConcluidosAnoBarra4').style.backgroundColor=barsBackgroundColor4;
            document.getElementById('ProjetosConcluidosAnoBarra4Qtd').innerText=props.projetosConcluidosAno[3].quantidade;
            document.getElementById('ProjetosConcluidosAnoBarra4Tooltip').style.marginLeft="20px";
        }

        setTimeout(() => {
            init();
        }, 100);
    } else{
        throw new Error('Não foi possível mostrar o gráfico de barras de Projetos Concluídos! Por favor, contacte o atendimento: smae.prefeitura.sp@fgv.br.');
    }

</script>

<style lang="less">

    .ProjetosConcluidosAnoMain{
        height: 50px;
        margin-top: 10px;
        font-family: Roboto;
    }

    .ProjetosConcluidosHorizontalBar {
        border-radius: 15px;
        height: 30px;  
        border: 1px solid v-bind('barsBackgroundColor');
    }

    #ProjetosConcluidosAnoBarra1:hover{
        border: 1px solid black;
    }

    #ProjetosConcluidosAnoBarra1:hover #ProjetosConcluidosAnoBarra1Tooltip{
        visibility: visible;
        opacity: 1;
    }

    #ProjetosConcluidosAnoBarra2:hover{
        border: 1px solid black;
    }

    #ProjetosConcluidosAnoBarra2:hover #ProjetosConcluidosAnoBarra2Tooltip{
        visibility: visible;
        opacity: 1;
    }

    #ProjetosConcluidosAnoBarra3:hover{
        border: 1px solid black;
    }

    #ProjetosConcluidosAnoBarra3:hover #ProjetosConcluidosAnoBarra3Tooltip{
        visibility: visible;
        opacity: 1;
    }

    #ProjetosConcluidosAnoBarra4:hover{
        border: 1px solid black;
    }

    #ProjetosConcluidosAnoBarra4:hover #ProjetosConcluidosAnoBarra4Tooltip{
        visibility: visible;
        opacity: 1;
    } 

    #ProjetosConcluidosAnoContainer {
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-around;
        /* it will calculate automatically, try space-between too */
    }

    #space{
    width: 5px;
    }

    .ProjetosConcluidosTooltipTextRight {
        font-family: Roboto Slab;
        visibility: hidden;
        background-color: #fff;
        color: #555;
        text-align: center;
        border-radius: 6px;
        padding: 5px 0;
        position: fixed;
        z-index: 2;
        margin-top: 30px;
        margin-left: -85px;
        opacity: 0;
        transition: opacity 0.3s;
        display: grid;
        grid-template-areas:
            'monthYear'
            'mainQtd'
            'footerQtd'
            'footerLine';
        gap: 2px;
        padding: 2px;
        min-width: 110px;
        box-shadow: 0 0 .4em rgb(230, 230, 228);
    }

    .ProjetosConcluidosTooltipTextRight::after {
        content: "";
        width: 1px;
        position: relative;
        top: -57px;
        margin-left: 90px;
        z-index: 1;
        border-width: 5px;
        border-style: solid;
        border-color:  transparent transparent #fff transparent;
    }

    .ProjetosConcluidosTooltipTextLeft {
        font-family: Roboto Slab;
        visibility: hidden;
        background-color: #fff;
        color: #555;
        text-align: center;
        border-radius: 6px;
        padding: 5px 0;
        position: fixed;
        z-index: 2;
        margin-top: 30px;
        margin-left: 0px;
        opacity: 0;
        transition: opacity 0.3s;
        display: grid;
        grid-template-areas:
            'monthYear'
            'mainQtd'
            'footerQtd'
            'footerLine';
        gap: 2px;
        padding: 2px;
        min-width: 110px;
        box-shadow: 0 0 .4em rgb(230, 230, 228);
    }

    .ProjetosConcluidosTooltipTextLeft::after {
        content: "";
        width: 3px;
        position: relative;
        top: -57px;
        margin-left: 7px;
        z-index: 1;
        border-width: 5px;
        border-style: solid;
        border-color:  transparent transparent #fff transparent;
    }

    hr {
        height: 1px;
        border-top: 1px solid #e4e1e1;
    }
        
    // Tooltip traço inicial, mês e ano - 1ª linha
    .ProjetosConcluidosAnoFirstLine { 
        grid-area: monthYear; 
        margin-top: 0px; 
        margin-bottom: 0px; 
        height: 30px; 
        justify-content: center; 
        align-items: center; 
        text-align: center;
    }

    // Traço inicial
    .ProjetosConcluidosAnoFirstLineHR{
        width: 65%; 
        margin-left: auto; 
        margin-right: auto;
    }

    // Mês e ano
    .ProjetosConcluidosAnoFirstLineMonthYear{
        font-size: 10px; 
        height: 18px; 
        line-height: 13px; 
        margin-top: 0px;
    }

    // Tooltip quantidade principal e descrição - 2ª linha
    .ProjetosConcluidosAnoSecondLine { 
        grid-area: mainQtd; 
        display: flex;
        margin-top: -15px;
        justify-content: center; 
        align-items: center;
    }

    // Quantidade principal
    .ProjetosConcluidosAnoSecondLineQtd{
        margin-bottom: -5px; 
        font-size: 30px; 
        text-align: end;  
        float: left; 
        width: 50%;
    }

    // Descrição da quantidade principal
    .ProjetosConcluidosAnoSecondLineDes{ 
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
        margin-top: -10px; 
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
        font-size: 8px; 
        text-align: start; 
        align-self: flex-end; 
        margin-top: -30px;
        float: left; 
        width: 50%;
    }

    // Tooltip traço final - 4ª linha
    .ProjetosConcluidosAnoThirdLine { 
        grid-area: footerLine; 
    }

    // Traço final
    .ProjetosConcluidosAnoThirdLineHR{
        width: 65%; 
        margin-top: -5px; 
        margin-left: auto; 
        margin-right: auto;
    }



</style>