<template>
  <div
    class="barChartBody"
    onload="init();"
  >
    <div id="barsContainer">
      <ul
        id="column1"
        style="margin-right: 3px; min-width: fit-content;"
      >
        <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
          <p
            id="label1"
            style="min-width: fit-content;"
          />
        </li>
        <li
          id="firstBar"
          class="horizontalBar"
        >
          <!-- TOOLTIP da primeira barra -->
          <div
            id="firstBarTooltip"
            class="tooltipText"
          >
            <div class="firstLine">
              <hr class="firstLineHR">
              <div
                id="firstBarTotal"
                class="firstLineMonthYear"
              >
                TOTAL DE
              </div>
            </div>
            <div class="secondLine">
              <div
                id="firstBarQtd"
                class="secondLineQtd"
              />
              <div
                id="firstBarDesc"
                class="secondLineDes"
                style="margin-top: -15px;"
              >
                PROJETOS PLANEJADOS
              </div>
            </div>
            <div
              class="fourthLine"
              style="margin-top: 5px;"
            >
              <hr class="fourthLineHR">
            </div>
          </div>
        </li>
      </ul>
      <ul
        id="column2"
        style="margin-right: 3px; min-width: fit-content;"
      >
        <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
          <p
            id="label2"
            style="min-width: fit-content;"
          />
        </li>
        <li
          id="secondBar"
          class="horizontalBar"
        >
          <!-- TOOLTIP da segunda barra -->
          <div
            id="secondBarTooltip"
            class="tooltipText"
          >
            <div class="firstLine">
              <hr class="firstLineHR">
              <div
                id="secondBarTotal"
                class="firstLineMonthYear"
              >
                TOTAL DE
              </div>
            </div>
            <div class="secondLine">
              <div
                id="secondBarQtd"
                class="secondLineQtd"
              />
              <div
                id="secondBarDesc"
                class="secondLineDes"
                style="margin-top: -15px;"
              >
                PROJETOS PLANEJADOS
              </div>
            </div>
            <div
              class="fourthLine"
              style="margin-top: 5px;"
            >
              <hr class="fourthLineHR">
            </div>
          </div>
        </li>
      </ul>
      <ul
        id="column3"
        style="margin-right: 3px; min-width: fit-content;"
      >
        <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
          <p
            id="label3"
            style="min-width: fit-content;"
          />
        </li>
        <li
          id="thirdBar"
          class="horizontalBar"
        >
          <!-- TOOLTIP da terceira barra -->
          <div
            id="thirdBarTooltip"
            class="tooltipText"
          >
            <div class="firstLine">
              <hr class="firstLineHR">
              <div
                id="thirdBarTotal"
                class="firstLineMonthYear"
              >
                TOTAL DE
              </div>
            </div>
            <div class="secondLine">
              <div
                id="thirdBarQtd"
                class="secondLineQtd"
              />
              <div
                id="thirdBarDesc"
                class="secondLineDes"
                style="margin-top: -15px;"
              >
                PROJETOS PLANEJADOS
              </div>
            </div>
            <div
              class="fourthLine"
              style="margin-top: 5px;"
            >
              <hr class="fourthLineHR">
            </div>
          </div>
        </li>
      </ul>
      <ul
        id="column4"
        style="min-width: fit-content;"
      >
        <li style="text-align: center; margin-bottom: -10px; min-width: fit-content;">
          <p
            id="label4"
            style="min-width: fit-content;"
          />
        </li>
        <li
          id="fourthBar"
          class="horizontalBar"
        >
          <!-- TOOLTIP da terceira barra -->
          <div
            id="fourthBarTooltip"
            class="tooltipText"
          >
            <div class="firstLine">
              <hr class="firstLineHR">
              <div
                id="fourthBarTotal"
                class="firstLineMonthYear"
              >
                TOTAL DE
              </div>
            </div>
            <div class="secondLine">
              <div
                id="fourthBarQtd"
                class="secondLineQtd"
              />
              <div
                id="fourthBarDesc"
                class="secondLineDes"
                style="margin-top: -15px;"
              >
                PROJETOS PLANEJADOS
              </div>
            </div>
            <div
              class="fourthLine"
              style="margin-top: 5px;"
            >
              <hr class="fourthLineHR">
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
  },
  projetosConcluidosAno: {
    type: Array,
    required: true,
  },
});

// Array que receberá o tamanho das barras
const barsWidth = [];

// Variável que receberá o total dos valores de projetos
let totalProjects = 0;

// Array que receberá o título das barras
const labels = [];

// Define a cor da barra
let barsBackgroundColor = '';

for (let i = 0; i < props.projetosPlanejadosAno.length; i++) {
  labels[i] = `${props.projetosPlanejadosAno[i].ano}`;
  barsWidth[i] = props.projetosPlanejadosAno[i].quantidade;
  // Acumula o total de projetos
  totalProjects += props.projetosPlanejadosAno[i].quantidade;
}

barsBackgroundColor = '#A77E11';
// barsBackgroundColor = "#d3a730";

// Calcula o percentual do tamanho das barras
barsWidth[0] = Math.ceil(barsWidth[0] / totalProjects * 100);
barsWidth[1] = Math.ceil(barsWidth[1] / totalProjects * 100);
barsWidth[2] = Math.ceil(barsWidth[2] / totalProjects * 100);
barsWidth[3] = Math.ceil(barsWidth[3] / totalProjects * 100);

function init() {
  // Valores default para quando a quantidade for igual a 0
  let barDefaultWidth1 = '0px';
  let barDefaultWidth2 = '0px';
  let barDefaultWidth3 = '0px';
  let barDefaultWidth4 = '0px';
  let barsBackgroundColor1 = '#ffffff';
  let barsBackgroundColor2 = '#ffffff';
  let barsBackgroundColor3 = '#ffffff';
  let barsBackgroundColor4 = '#ffffff';

  // Se o valor da barra for maior do que 0, define largura e cor da barra
  if (barsWidth[0] > 0) {
    barDefaultWidth1 = `${barsWidth[0]}%`;
    barsBackgroundColor1 = barsBackgroundColor;
  }
  if (barsWidth[1] > 0) {
    barDefaultWidth2 = `${barsWidth[1]}%`;
    barsBackgroundColor2 = barsBackgroundColor;
  }
  if (barsWidth[2] > 0) {
    barDefaultWidth3 = `${barsWidth[2]}%`;
    barsBackgroundColor3 = barsBackgroundColor;
  }
  if (barsWidth[3] > 0) {
    barDefaultWidth4 = `${barsWidth[3]}%`;
    barsBackgroundColor4 = barsBackgroundColor;
  }

  // Define o label de cada barra e a margem esquerda, dependendo do tamanho da barra
  document.getElementById('label1').innerText = labels[0];
  document.getElementById('label2').innerText = labels[1];
  document.getElementById('label3').innerText = labels[2];
  document.getElementById('label4').innerText = labels[3];

  // Define o tamanho, a cor e o texto do tooltip de cada barra.
  document.getElementById('column1').style.width = barDefaultWidth1;
  document.getElementById('firstBar').style.backgroundColor = barsBackgroundColor1;
  document.getElementById('firstBarQtd').innerText = props.projetosPlanejadosAno[0].quantidade;
  document.getElementById('column2').style.width = barDefaultWidth2;
  document.getElementById('secondBar').style.backgroundColor = barsBackgroundColor2;
  document.getElementById('secondBarQtd').innerText = props.projetosPlanejadosAno[1].quantidade;
  document.getElementById('column3').style.width = barDefaultWidth3;
  document.getElementById('thirdBar').style.backgroundColor = barsBackgroundColor3;
  document.getElementById('thirdBarQtd').innerText = props.projetosPlanejadosAno[2].quantidade;
  document.getElementById('column4').style.width = barDefaultWidth4;
  document.getElementById('fourthBar').style.backgroundColor = barsBackgroundColor4;
  document.getElementById('fourthBarQtd').innerText = props.projetosPlanejadosAno[3].quantidade;
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

    .tooltipText::after {
        content: "";
        width: 3px;
        position: relative;
        top: -57px;
        margin-left: 7px;
        z-index: 1;
        border-width: 5px;
        border-style: solid;
        border-color:  transparent transparent #fff transparent;
        //box-shadow: 0 0 .4em rgb(230, 230, 228);
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
        height: 30px;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    // Traço inicial
    .firstLineHR{
        width: 50%;
        margin-left: auto;
        margin-right: auto;
    }

    // Mês e ano
    .firstLineMonthYear{
        font-size: 8px;
        height: 18px;
        line-height: 13px;
        margin-top: 0px;
    }

    // Tooltip quantidade principal e descrição - 2ª linha
    .secondLine {
        grid-area: mainQtd;
        display: flex;
        margin-top: -15px;
        justify-content: center;
        align-items: center;
    }

    // Quantidade principal
    .secondLineQtd{
        margin-bottom: -5px;
        font-size: 28px;
        text-align: end;
        float: left;
        width: 50%;
    }

    // Descrição da quantidade principal
    .secondLineDes{
        margin-left: 2px;
        font-size: 8px;
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
        font-size: 16px;
        text-align: end;
        float: left;
        width: 50%;
    }

    // Descrição da quantidade secundária
    .thirdLineDes{
        font-size: 6px;
        text-align: start;
        align-self: flex-end;
        margin-top: -30px;
        float: left;
        width: 50%;
    }

    // Tooltip traço final - 4ª linha
    .fourthLine {
        grid-area: footerLine;
    }

    // Traço final
    .fourthLineHR{
        width: 50%;
        margin-top: -5px;
        margin-left: auto;
        margin-right: auto;
    }

</style>
