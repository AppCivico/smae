<template>   
    <div class="ProjetosPlanejadosAnoMain" onload="init();">
        <div id="ProjetosPlanejadosAnoContainer">
            <ul id="ProjetosPlanejadosAnoCol1" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="ProjetosPlanejadosAnoLabel1" style="min-width: fit-content;"></p>
                </li>
                <li id="ProjetosPlanejadosAnoBarra1" class="ProjetosPlanejadosHorizontalBar">
                    <!-- TOOLTIP da primeira barra  -->
                    <div id="ProjetosPlanejadosAnoBarra1Tooltip" class="ProjetosConcluidosTooltipTextLeft">
                        <div class="ProjetosPlanejadosAnoFirstLine">
                            <hr class="ProjetosPlanejadosAnoFirstLineHR">
                            <div id="ProjetosPlanejadosAnoBarra1Total" class="ProjetosPlanejadosAnoFirstLineMonthYear">
                                TOTAL DE
                            </div>
                        </div>
                        <div class="ProjetosPlanejadosAnoSecondLine">
                            <div id="ProjetosPlanejadosAnoBarra1Qtd" class="ProjetosPlanejadosAnoSecondLineQtd">
                                
                            </div>
                            <div id="ProjetosPlanejadosAnoBarra1Desc" class="ProjetosPlanejadosAnoSecondLineDes" style="margin-top: -15px;">
                                
                            </div>
                        </div>  
                        <div class="ProjetosPlanejadosAnoThirdLine" style="margin-top: 5px;">
                            <hr class="ProjetosPlanejadosAnoThirdLineHR">
                        </div>
                    </div>
                </li>
            </ul>
            <ul id="ProjetosPlanejadosAnoCol2" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="ProjetosPlanejadosAnoLabel2" style="min-width: fit-content;"></p>
                </li>
                <li id="ProjetosPlanejadosAnoBarra2" class="ProjetosPlanejadosHorizontalBar">
                    <!-- TOOLTIP da segunda barra -->
                    <div id="ProjetosPlanejadosAnoBarra2Tooltip" class="ProjetosConcluidosTooltipTextLeft">
                        <div class="ProjetosPlanejadosAnoFirstLine">
                            <hr class="ProjetosPlanejadosAnoFirstLineHR">
                            <div id="ProjetosPlanejadosAnoBarra2Total" class="ProjetosPlanejadosAnoFirstLineMonthYear">
                                TOTAL DE
                            </div>
                        </div>
                        <div class="ProjetosPlanejadosAnoSecondLine">
                            <div id="ProjetosPlanejadosAnoBarra2Qtd" class="ProjetosPlanejadosAnoSecondLineQtd">
                                
                            </div>
                            <div id="ProjetosPlanejadosAnoBarra2Desc" class="ProjetosPlanejadosAnoSecondLineDes" style="margin-top: -15px;">
                                
                            </div>
                        </div>  
                        <div class="ProjetosPlanejadosAnoThirdLine" style="margin-top: 5px;">
                            <hr class="ProjetosPlanejadosAnoThirdLineHR">
                        </div>
                    </div>
                </li>
            </ul>
            <ul  id="ProjetosPlanejadosAnoCol3" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="ProjetosPlanejadosAnoLabel3" style="min-width: fit-content;"></p>
                </li>
                <li id="ProjetosPlanejadosAnoBarra3" class="ProjetosPlanejadosHorizontalBar">
                    <!-- TOOLTIP da terceira barra -->
                    <div id="ProjetosPlanejadosAnoBarra3Tooltip" class="ProjetosConcluidosTooltipTextRight">
                        <div class="ProjetosPlanejadosAnoFirstLine">
                            <hr class="ProjetosPlanejadosAnoFirstLineHR">
                            <div id="ProjetosPlanejadosAnoBarra3Total" class="ProjetosPlanejadosAnoFirstLineMonthYear">
                                TOTAL DE
                            </div>
                        </div>
                        <div class="ProjetosPlanejadosAnoSecondLine">
                            <div id="ProjetosPlanejadosAnoBarra3Qtd" class="ProjetosPlanejadosAnoSecondLineQtd">
                                
                            </div>
                            <div id="ProjetosPlanejadosAnoBarra3Desc" class="ProjetosPlanejadosAnoSecondLineDes" style="margin-top: -15px;">
                                
                            </div>
                        </div>  
                        <div class="ProjetosPlanejadosAnoThirdLine" style="margin-top: 5px;">
                            <hr class="ProjetosPlanejadosAnoThirdLineHR">
                        </div>
                    </div>
                </li>
            </ul>
            <ul  id="ProjetosPlanejadosAnoCol4" style="min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="ProjetosPlanejadosAnoLabel4" style="min-width: fit-content;"></p>
                </li>
                <li id="ProjetosPlanejadosAnoBarra4" class="ProjetosPlanejadosHorizontalBar">
                    <!-- TOOLTIP da quarta barra -->
                    <div id="ProjetosPlanejadosAnoBarra4Tooltip" class="ProjetosConcluidosTooltipTextRight">
                        <div class="ProjetosPlanejadosAnoFirstLine">
                            <hr class="ProjetosPlanejadosAnoFirstLineHR">
                            <div id="ProjetosPlanejadosAnoBarra4Total" class="ProjetosPlanejadosAnoFirstLineMonthYear">
                                TOTAL DE
                            </div>
                        </div>
                        <div class="ProjetosPlanejadosAnoSecondLine">
                            <div id="ProjetosPlanejadosAnoBarra4Qtd" class="ProjetosPlanejadosAnoSecondLineQtd">
                                
                            </div>
                            <div id="ProjetosPlanejadosAnoBarra4Desc" class="ProjetosPlanejadosAnoSecondLineDes" style="margin-top: -15px;">
                                
                            </div>
                        </div>  
                        <div class="ProjetosPlanejadosAnoThirdLine" style="margin-top: 5px;">
                            <hr class="ProjetosPlanejadosAnoThirdLineHR">
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
        projetosPlanejadosAno: {
            type: Array,
            required: true,
        }
    });

    // Define a cor da barra
    let barsBackgroundColor = '#A77E11';
    
    // Verifica se os dados retornaram íntegros
    if(props.projetosPlanejadosAno != null && props.projetosPlanejadosAno.length > 0){

        // Array que receberá o tamanho original das barras, para saber se é plural ou singular
        let originalBarsWidth = [];

        // Array que receberá o tamanho das barras para usar no gráfico
        let barsWidth = [];

        // Variável que receberá o total dos valores de projetos
        let totalProjects = 0;

        // Array que receberá o título das barras
        let labels = [];

        // Ordena o array de jsons da resposta da API pelo ano
        let dataSortedByYear = props.projetosPlanejadosAno.sort((a, b) => {
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
            document.getElementById('ProjetosPlanejadosAnoLabel1').innerText=labels[0];
            document.getElementById('ProjetosPlanejadosAnoLabel2').innerText=labels[1];
            document.getElementById('ProjetosPlanejadosAnoLabel3').innerText=labels[2];
            document.getElementById('ProjetosPlanejadosAnoLabel4').innerText=labels[3];

            // Define se a descrição da quantidade é no singular ou plural
            let singularExpression = "PROJETO PLANEJADO";
            let pluralExpression = "PROJETOS PLANEJADOS";
            document.getElementById('ProjetosPlanejadosAnoBarra1Desc').innerHTML=pluralExpression;
            document.getElementById('ProjetosPlanejadosAnoBarra2Desc').innerHTML=pluralExpression;
            document.getElementById('ProjetosPlanejadosAnoBarra3Desc').innerHTML=pluralExpression;
            document.getElementById('ProjetosPlanejadosAnoBarra4Desc').innerHTML=pluralExpression;
            if(originalBarsWidth[0] == 1){
                document.getElementById('ProjetosPlanejadosAnoBarra1Desc').innerHTML=singularExpression;
            }
            if(originalBarsWidth[1] == 1){
                document.getElementById('ProjetosPlanejadosAnoBarra2Desc').innerHTML=singularExpression;
            }
            if(originalBarsWidth[2] == 1){
                document.getElementById('ProjetosPlanejadosAnoBarra3Desc').innerHTML=singularExpression;
            }
            if(originalBarsWidth[3] == 1){
                document.getElementById('ProjetosPlanejadosAnoBarra4Desc').innerHTML=singularExpression;
            }

            // Define o tamanho, a cor e o texto do tooltip de cada barra.
            document.getElementById('ProjetosPlanejadosAnoCol1').style.width=barDefaultWidth1;
            document.getElementById('ProjetosPlanejadosAnoBarra1').style.backgroundColor=barsBackgroundColor1;
            document.getElementById('ProjetosPlanejadosAnoBarra1Qtd').innerText=props.projetosPlanejadosAno[0].quantidade;
            document.getElementById('ProjetosPlanejadosAnoCol2').style.width=barDefaultWidth2;
            document.getElementById('ProjetosPlanejadosAnoBarra2').style.backgroundColor=barsBackgroundColor2;
            document.getElementById('ProjetosPlanejadosAnoBarra2Qtd').innerText=props.projetosPlanejadosAno[1].quantidade;
            document.getElementById('ProjetosPlanejadosAnoCol3').style.width=barDefaultWidth3;
            document.getElementById('ProjetosPlanejadosAnoBarra3').style.backgroundColor=barsBackgroundColor3;
            document.getElementById('ProjetosPlanejadosAnoBarra3Qtd').innerText=props.projetosPlanejadosAno[2].quantidade;
            document.getElementById('ProjetosPlanejadosAnoCol4').style.width=barDefaultWidth4;
            document.getElementById('ProjetosPlanejadosAnoBarra4').style.backgroundColor=barsBackgroundColor4;
            document.getElementById('ProjetosPlanejadosAnoBarra4Qtd').innerText=props.projetosPlanejadosAno[3].quantidade;
            document.getElementById('ProjetosConcluidosAnoBarra4Tooltip').style.marginLeft="20px";
        }

        setTimeout(() => {
            init();
        }, 100);
    } else{
        throw new Error('Não foi possível mostrar o gráfico de barras de Projetos Planejados! Por favor, contacte o atendimento: smae.prefeitura.sp@fgv.br.');
    }

</script>

<style lang="less">

    .ProjetosPlanejadosAnoMain{
        height: 50px;
        margin-top: 10px;
        font-family: Roboto;
    }

    .ProjetosPlanejadosHorizontalBar {
        border-radius: 15px;
        height: 30px;  
        border: 1px solid v-bind('barsBackgroundColor');
    }

    #ProjetosPlanejadosAnoBarra1:hover{
        border: 1px solid black;
    }

    #ProjetosPlanejadosAnoBarra1:hover #ProjetosPlanejadosAnoBarra1Tooltip{
        visibility: visible;
        opacity: 1;
    }

    #ProjetosPlanejadosAnoBarra2:hover{
        border: 1px solid black;
    }

    #ProjetosPlanejadosAnoBarra2:hover #ProjetosPlanejadosAnoBarra2Tooltip{
        visibility: visible;
        opacity: 1;
    }

    #ProjetosPlanejadosAnoBarra3:hover{
        border: 1px solid black;
    }

    #ProjetosPlanejadosAnoBarra3:hover #ProjetosPlanejadosAnoBarra3Tooltip{
        visibility: visible;
        opacity: 1;
    }

    #ProjetosPlanejadosAnoBarra4:hover{
        border: 1px solid black;
    }

    #ProjetosPlanejadosAnoBarra4:hover #ProjetosPlanejadosAnoBarra4Tooltip{
        visibility: visible;
        opacity: 1;
    } 

    #ProjetosPlanejadosAnoContainer {
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
    .ProjetosPlanejadosAnoFirstLine { 
        grid-area: monthYear; 
        margin-top: 0px; 
        margin-bottom: 0px; 
        height: 30px; 
        justify-content: center; 
        align-items: center; 
        text-align: center;
    }

    // Traço inicial
    .ProjetosPlanejadosAnoFirstLineHR{
        width: 65%; 
        margin-left: auto; 
        margin-right: auto;
    }

    // Mês e ano
    .ProjetosPlanejadosAnoFirstLineMonthYear{
        font-size: 10px; 
        height: 18px; 
        line-height: 13px; 
        margin-top: 0px;
    }

    // Tooltip quantidade principal e descrição - 2ª linha
    .ProjetosPlanejadosAnoSecondLine { 
        grid-area: mainQtd; 
        display: flex;
        margin-top: -15px;
        justify-content: center; 
        align-items: center;
    }

    // Quantidade principal
    .ProjetosPlanejadosAnoSecondLineQtd{
        margin-bottom: -5px; 
        font-size: 30px; 
        text-align: end;  
        float: left; 
        width: 50%;
    }

    // Descrição da quantidade principal
    .ProjetosPlanejadosAnoSecondLineDes{ 
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
    .ProjetosPlanejadosAnoThirdLine { 
        grid-area: footerLine; 
    }

    // Traço final
    .ProjetosPlanejadosAnoThirdLineHR{
        width: 65%; 
        margin-top: -5px; 
        margin-left: auto; 
        margin-right: auto;
    }



</style>