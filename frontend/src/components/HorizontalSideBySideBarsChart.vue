<template>   
    <div class="barChartBody" onload="init();">
        <div id="barsContainer">
            <ul id="column1" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="label1" style="min-width: fit-content;"></p>
                </li>
                <li id="firstBar" class="horizontalBar" style="background-color: red;">
                    <span id="firstBarTooltip" class="tooltipText">Olha eu aqui 1!</span>
                </li>
            </ul>
            <ul id="column2" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="label2" style="min-width: fit-content;"></p>
                </li>
                <li id="secondBar" class="horizontalBar">
                    <span id="secondBarTooltip" class="tooltipText">Olha eu aqui 2!</span>
                </li>
            </ul>
            <ul  id="column3" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="label3" style="min-width: fit-content;"></p>
                </li>
                <li id="thirdBar" class="horizontalBar">
                    <span id="thirdBarTooltip" class="tooltipText">Olha eu aqui 3!</span>
                </li>
            </ul>
            <ul  id="column4" style="min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="label4" style="min-width: fit-content;"></p>
                </li>
                <li id="fourthBar" class="horizontalBar">
                    <span id="fourthdBarTooltip" class="tooltipText">Olha eu aqui 4!</span>
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
        },
        projetosConcluidosAno: {
            type: Array,
            required: true,
        },
    });

    // Array que receberá o tamanho das barras
    let barsWidth = [];

    // Variável que receberá o total dos valores de projetos
    let totalProjects = 0;

    // Array que receberá o título das barras
    let labels = [];

    // Define a cor da barra
    let barsBackgroundColor = '';

    let projetosPlanejadosAnoTemp =
      [
  {
    "quantidade": 10,
    "ano": 2027
  },
  {
    "quantidade": 20,
    "ano": 2026
  },
  {
    "quantidade": 7,
    "ano": 2025
  },
  {
    "quantidade": 2,
    "ano": 2024
  }
]


    for(let i=0; i < projetosPlanejadosAnoTemp.length; i++){
        labels[i] = "" + projetosPlanejadosAnoTemp[i].ano;
        barsWidth[i] = projetosPlanejadosAnoTemp[i].quantidade;
        // Acumula o total de projetos
        totalProjects = totalProjects + projetosPlanejadosAnoTemp[i].quantidade;
    }

    barsBackgroundColor = "#A77E11";
    // barsBackgroundColor = "#d3a730";
 

    // Calcula o percentual do tamanho das barras
    barsWidth[0] = Math.ceil(barsWidth[0] / totalProjects * 100);
    barsWidth[1] = Math.ceil(barsWidth[1] / totalProjects * 100);
    barsWidth[2] = Math.ceil(barsWidth[2] / totalProjects * 100);
    barsWidth[3] = Math.ceil(barsWidth[3] / totalProjects * 100);

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
        document.getElementById('label1').innerText=labels[0];
        document.getElementById('label2').innerText=labels[1];
        document.getElementById('label3').innerText=labels[2];
        document.getElementById('label4').innerText=labels[3];
        
        // Define o tamanho e a cor de cada barra.
        document.getElementById('column1').style.width=barDefaultWidth1;
        document.getElementById('firstBar').style.backgroundColor=barsBackgroundColor1;
        document.getElementById('column2').style.width=barDefaultWidth2;
        document.getElementById('secondBar').style.backgroundColor=barsBackgroundColor2;
        document.getElementById('column3').style.width=barDefaultWidth3;
        document.getElementById('thirdBar').style.backgroundColor=barsBackgroundColor3;
        document.getElementById('column4').style.width=barDefaultWidth4;
        document.getElementById('fourthBar').style.backgroundColor=barsBackgroundColor4;
    }

    setTimeout(() => {
        init();
    }, 100);

</script>

<style lang="less">

    .barChartBody{
        height: 50px;
        margin-top: 10px;
        font-family: Roboto;
    }

    .horizontalBar {
    border-radius: 15px;
    height: 30px;  
    }

    #firstBar:hover{
        border: 1px solid black;
    }

    #firstBar:hover #firstBarTooltip{
        visibility: visible;
        opacity: 1;
    }

    #secondBar:hover #secondBarTooltip{
        visibility: visible;
        opacity: 1;
    }

    #thirdBar:hover #thirdBarTooltip{
        visibility: visible;
        opacity: 1;
    }

    #fourthBar:hover #fourthBarTooltip{
        visibility: visible;
        opacity: 1;
    } 

    #barsContainer {
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-around;
        /* it will calculate automatically, try space-between too */
    }

    #space{
    width: 5px;
    }

    .tooltipText {
        visibility: hidden;
        width: 180px;
        background-color: #555;
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 5px 0;
        position: relative;
        z-index: 1;
        bottom: -145%;
        left: 70%;
        margin-left: -60px;
        opacity: 0;
        transition: opacity 0.3s;
    }

    .tooltipText::after {
        content: "";
        position: relative;
        top: -145%;
        left: 20%;
        margin-left: -30px;
        border-width: 5px;
        border-style: solid;
        border-color:  transparent transparent #555 transparent;
    }



</style>