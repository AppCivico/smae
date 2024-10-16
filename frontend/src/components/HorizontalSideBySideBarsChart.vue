<template>   


<!--
<span
      @mouseover="hover = true"
      @mouseleave="hover = false"
      :class="{ active: hover }"
    >
      Hover me to change the background!
    </span>
-->

    <body class="barChartBody" onload="init();">

        <div id="barsContainer">
            <ul id="column1" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="label1" style="min-width: fit-content;"></p>
                </li>
                <li id="value1" class="rcorners1">
                    
                </li>
            </ul>
            <ul id="column2" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="label2" style="min-width: fit-content;"></p>
                </li>
                <li id="value2" class="rcorners1">
                    
                </li>
            </ul>
            <ul  id="column3" style="margin-right: 3px; min-width: fit-content;">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="label3" style="min-width: fit-content;"></p>
                </li>
                <li>
                    <div id="value3" class="rcorners1"></div> 
                </li>
            </ul>
            <ul  id="column4" style="min-width: fit-content; border: 1px solid black">
                <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
                    <p id="label4" style="min-width: fit-content;"></p>
                </li>
                <li id="value4" class="rcorners1">
                    
                </li>
            </ul>
        </div>
    </body>
</template>

<script setup>

//const hover = ref(false);

    // Tipo de gráfico
    const chartType = "PLA";

    // Dados dos projetos concluídos
    const projetos_concluidos_ano = [
        {
            "ano": 2021,
            "quantidade": 220
        },
        {
            "ano": 2022,
            "quantidade": 0
        },
        {
            "ano": 2023,
            "quantidade": 1
        },{
            "ano": 2024,
            "quantidade": 400
        }
    ];

    // Dados dos projetos planejados
    const projetos_planejados_ano = [
        {
            "ano": 2024,
            "quantidade": 200
        },
        {
            "ano": 2025,
            "quantidade": 300
        },
        {
            "ano": 2026,
            "quantidade": 400
        },{
            "ano": 2027,
            "quantidade": 500
        }
    ];

    // Array que receberá o tamanho das barras
    var barsWidth = [];

    // Variável que receberá o total dos valores de projetos
    var totalProjects = 0;

    // Array que receberá o título das barras
    var labels = [];

    // Dependendo do tipo de gráfico, configura as variáveis
    if(chartType == "PLA"){
        // Lê o objeto e carrega os valores
        for(var i=0; i < projetos_planejados_ano.length; i++){
            labels[i] = "" + projetos_planejados_ano[i].ano;
            barsWidth[i] = projetos_planejados_ano[i].quantidade;
            // Acumula o total de projetos
            totalProjects = totalProjects + projetos_planejados_ano[i].quantidade;
        }

        // Define a cor da barra
        var barsBackgroundColor = "#A77E11";

    } else {
        // Lê o objeto e carrega os valores
        for(var i=0; i < projetos_concluidos_ano.length; i++){
            labels[i] = "" + projetos_concluidos_ano[i].ano;
            barsWidth[i] = projetos_concluidos_ano[i].quantidade;
            // Acumula o total de projetos
            totalProjects = totalProjects + projetos_concluidos_ano[i].quantidade;
        }

        // Define a cor da barra
        var barsBackgroundColor = "#d3a730";
    }

    // Calcula o percentual do tamanho das barras
    barsWidth[0] = Math.ceil(barsWidth[0] / totalProjects * 100);
    barsWidth[1] = Math.ceil(barsWidth[1] / totalProjects * 100);
    barsWidth[2] = Math.ceil(barsWidth[2] / totalProjects * 100);
    barsWidth[3] = Math.ceil(barsWidth[3] / totalProjects * 100);

    function showTooltip(e){
        //$(".rcorners1").css({"height": 100px, "width": 100px });
        alert(e.id);
        //document.getElementById('1').style.width='500px'
    }

    function init(){

        // Valores default para quando a quantidade for igual a 0
        var barDefaultWidth1 = "0px";
        var barDefaultWidth2 = "0px";
        var barDefaultWidth3 = "0px";
        var barDefaultWidth4 = "0px";
        var barsBackgroundColor1 = "#ffffff";
        var barsBackgroundColor2 = "#ffffff";
        var barsBackgroundColor3 = "#ffffff";
        var barsBackgroundColor4 = "#ffffff";

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
        
        const containerWidth = document.getElementById('label3').offsetWidth;

        console.log("************************");
        console.log(containerWidth);
        console.log(barDefaultWidth1 + ' ' + barDefaultWidth2 + ' ' + barDefaultWidth3 + ' ' + barDefaultWidth4);
        console.log(barsBackgroundColor1 + ' ' + barsBackgroundColor2 + ' ' + barsBackgroundColor3 + ' ' + barsBackgroundColor4);

        // Define o tamanho e a cor de cada barra.
        document.getElementById('column1').style.width=barDefaultWidth1;
        document.getElementById('value1').style.backgroundColor=barsBackgroundColor1;
        document.getElementById('column2').style.width=barDefaultWidth2;
        document.getElementById('value2').style.backgroundColor=barsBackgroundColor2;
        document.getElementById('column3').style.width=barDefaultWidth3;
        document.getElementById('value3').style.backgroundColor=barsBackgroundColor3;
        document.getElementById('column4').style.width=barDefaultWidth4;
        document.getElementById('value4').style.backgroundColor=barsBackgroundColor4;
    }

    setTimeout(() => {
        init();
    }, 1000);

</script>

<style lang="less">

    .barChartBody{
        height: 50px;
        margin-top: 10px;
    }

    .rcorners1 {
    border-radius: 25px;

    height: 30px;  
    }

    .rcorners1:hover {
    border: 1px solid black;
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

    p:hover:after {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: #f9cd23;
    border-radius: 8px;
    color: black;
    content: attr(title);
    text-align: center;
    font-size: 16px;
    padding: 8px;
    width: 200px;
    }

    /*for the tooltip triangle*/
    p:hover:before {
    left: 50%;
    transform: translateX(-50%);
    top: -20px;
    position: absolute;
    border: solid;
    border-color: #f9cd23 transparent;
    border-width: 15px 15px 0 15px;
    content: '';
    }

    .active {
    background: green;
    }

</style>