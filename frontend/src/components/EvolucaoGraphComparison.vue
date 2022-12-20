<script setup>
import * as d3 from 'd3';
import { onMounted, onUpdated, ref } from 'vue';

const props = defineProps(['single', 'dataserie']);
const evolucao = ref(null);
const tooltipEl = ref(null);

let iP = ref(-1);
let iR = ref(-1);
let iPA = ref(-1);
let iRA = ref(-1);

class smaeChart {
  constructor(ratio, sizes, transitionDuration, locale) {
    this.sizes = {
      width: 1000,
      height: 400,
      margin: {
        top: 50,
        right: 0,
        left: 50,
        bottom: 80
      }
    };
    this.transitionDuration = 1000;
    this.locale = d3.timeFormatLocale({
      "dateTime": "%A, %e %B %Y г. %X",
      "date": "%d.%m.%Y",
      "time": "%H:%M:%S",
      "periods": ["AM", "PM"],
      "days": ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
      "shortDays": ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"],
      "months": ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
      "shortMonths": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    });
  }

  /*DRAW CHART*/
  drawChart(dataMult, el) {

    /*UPDATING SIZE*/
    this.sizes.width = el.getBoundingClientRect().width;
    this.sizes.height = 350;

    /*SVG*/
    const svg = d3.select(el);
    svg.attr('width', this.sizes.width)
      .attr('height', this.sizes.height);

    /*MANIPULATING DATA*/
    //Eval xDomain and xScale for dates
    let X = [];
    dataMult.forEach((data) => {
      const Xp = d3.map(data.series.projetadoAcu, d => new Date(d.date));
      const Xr = d3.map(data.series.realizadoAcu, d => new Date(d.date));
      X = X.concat(Xp);
      X = X.concat(Xr);
    });
    X.sort(function (a, b) { return a - b; });

    const xDomain = d3.extent(X);
    const xScale = d3.scaleTime(xDomain, [this.sizes.margin.left, this.sizes.width - this.sizes.margin.left - this.sizes.margin.right]);

    //Eval yDomain and yScale for linear
    let Y = [];
    dataMult.forEach((data) => {
      const Yp = d3.map(data.series.projetadoAcu, d => d.value).filter(x => x);
      const Yr = d3.map(data.series.realizadoAcu, d => d.value).filter(x => x);
      Y = Y.concat(Yp);
      Y = Y.concat(Yr);
    });
    const yDomain = d3.extent(Y);
    const yScale = d3.scaleLinear(yDomain, [this.sizes.height - this.sizes.margin.bottom, this.sizes.margin.top]);

    //All dates unique on X and sorted by ASC
    X = X.map(function (date) { return date.getTime(); })
      .filter(function (date, i, array) { return array.indexOf(date) === i; })
      .map(function (time) { return new Date(time); });

    //Domain for Years
    const ticksYears = this.formatTicksYears(xScale.domain());

    /*YAXIS*/
    const yAxis = d3.axisLeft(yScale)
      .tickSize(0)
      .tickPadding(10);

    /*XAXIS*/
    //Years
    const xAxis2 = d3.axisBottom(xScale)
      .ticks(d3.timeYear)
      .tickFormat(this.locale.format("%Y"))
      .tickSize(0)
      .tickPadding(9);

    //Months
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeMonth, 10)
      .tickFormat(this.locale.format("%b"))
      .tickSize(0)
      .tickPadding(15);

    /*DRAW Gs*/
    //Draw Y-Axis
    const gYaxis = svg.selectAll("g.yaxis").data([true]);
    gYaxis
      .enter()
      .append('g')
      .attr("class", 'yaxis')
      .attr("transform", 'translate(' + this.sizes.margin.left + ',0)')
      .merge(gYaxis).transition().duration(this.transitionDuration)
      .call(yAxis);

    //Draw X-Axis
    const gXaxis = svg.selectAll("g.xaxis").data([true]);
    gXaxis
      .enter()
      .append("g")
      .attr("class", 'xaxis')
      .attr("transform", 'translate(0,' + (this.sizes.height - this.sizes.margin.bottom) + ')')
      .merge(gXaxis).transition().duration(this.transitionDuration)
      .attr("transform", 'translate(0,' + (this.sizes.height - this.sizes.margin.bottom) + ')')
      .call(xAxis)
      .selectAll("text")
      .call(x => toomuch(this.sizes.width, x))

    function toomuch(w, s, d) {
      let ss = s.size();
      let m = Math.round(w / 50);
      let dif = ss > m ? Math.floor(ss / m) : 1;
      s.style('opacity', (d, i) => { return i % dif == 0 ? 1 : 0 });
    }

    //Draw X-Axis2
    this.rangeYearsLines(svg, ticksYears, xDomain, xScale, this.sizes, this.transitionDuration);
    const gXaxis2 = svg.selectAll("g.xaxis2").data([true]);
    gXaxis2
      .enter()
      .append("g")
      .attr("class", 'xaxis2')
      .attr("transform", 'translate(0,' + (this.sizes.height - this.sizes.margin.bottom / 2) + ')')
      .merge(gXaxis2).transition().duration(this.transitionDuration)
      .attr("transform", 'translate(0,' + (this.sizes.height - this.sizes.margin.bottom / 2) + ')')
      .call(xAxis2);

    svg.selectAll('g.xaxis2 g')
      .insert('rect', 'text')
      .attr('transform', 'translate(-30,2)')
      .attr('width', 60)
      .attr('height', 22)
      .attr('rx', 11);

    svg.selectAll('g.grupos').remove();
    const grupos = svg.append('g').attr('class', 'grupos');

    /*DRAW PROJETADO*/
    dataMult.forEach((data, i) => {
      this.drawDataPoints(grupos, data.series.projetadoAcu, xScale, yScale, this.sizes, { name: "p" + (i + 1), transitionDuration: this.transitionDuration });
    });

    /*DRAW REALIZADO*/
    dataMult.forEach((data, i) => {
      this.drawDataPoints(grupos, data.series.realizadoAcu, xScale, yScale, this.sizes, { name: "r" + (i + 1), transitionDuration: this.transitionDuration });
    });

    /*DRAW META*/
    const metaVal = null;
    let meta = null;
    /*const metaVal = Yp[Yp.length-1];
    let meta = [
      {"date": d3.min(X),"value": metaVal},
      {"date": Xp[Xp.length-1],"value": metaVal}
    ];
    this.drawDataPoints(svg, meta, xScale, yScale, this.sizes, { name: 'meta', r: 10, strokeW: 4, firstCircle: false, transitionDuration: this.transitionDuration } );*/

    /*DRAW INVISIBLE LINES FOR MOUSE EVENTS*/
    this.drawDataToolTipsBars(svg, dataMult, xScale, yScale, X, metaVal, this.sizes, 'rect');
  }

  /*DRAW INVISIBLE LINES FOR MOUSE EVENTS*/
  drawDataToolTipsBars(svg, data, xScale, yScale, X, metaVal, sizes, el = 'rect') {

    //Creating guide line for tooltip
    const guideLineTip = svg.selectAll("line.guideline").data([true]);
    guideLineTip
      .enter()
      .append("line")
      .attr("class", 'guideline')
      .attr("stroke", "#8B9BB1")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "5,5")
      .attr("y1", sizes.margin.top)
      .attr("y2", sizes.height - sizes.margin.bottom);
    const guideLine = svg.select("line.guideline");

    //Prepare new data for tooltips
    let tipArray = this.mergeDataForTooltips(data, X);

    const g = svg.selectAll("g.tooltipslines").data([true]);
    g.enter().append("g").attr("class", 'tooltipslines');
    const gLines = svg.select("g.tooltipslines");

    //Creating tips bars {rect || line}
    switch (el) {
      case 'rect':
        const tipsRects = gLines.selectAll("rect").data(tipArray);
        tipsRects
          .enter()
          .append('rect')
          .merge(tipsRects)
          .attr('x', (d, i) => this.midWayX(tipArray[i - 1], d, tipArray[i + 1], xScale, X).left)
          .attr('y', sizes.margin.top)
          .attr('width', (d, i) => this.midWayX(tipArray[i - 1], d, tipArray[i + 1], xScale, X).right - this.midWayX(tipArray[i - 1], d, tipArray[i + 1], xScale, X).left)
          .attr('height', sizes.height - sizes.margin.bottom - sizes.margin.top)
          .attr('fill', 'black')
          .attr('opacity', 0)
          .on('mouseover', (event, d) => this.showTooltip(event, d, metaVal, guideLine, { x: xScale(d.date), y: yScale(d3.max([d.realizadoAcu, d.projetadoAcu])) }))
          .on("mouseleave", () => this.hideTooltip(guideLine))
          .on("mousemove", (e) => this.moveTooltip(e));
        tipsRects.exit().remove();
        break;

      case 'line':
        const tipsLines = gLines.selectAll("line").data(tipArray);
        tipsLines
          .enter()
          .append('line')
          .merge(tipsRects)
          .attr('x1', d => xScale(new Date(d.date)))
          .attr('y1', sizes.margin.top)
          .attr('x2', d => xScale(new Date(d.date)))
          .attr('y2', sizes.height - sizes.margin.bottom)
          .attr('stroke', 'transparent')
          .attr('stroke-width', 10)
          .on('mouseover', (event, d) => this.showTooltip(event, d, metaVal, guideLine, { x: xScale(d.date), y: yScale(d3.max([d.realizadoAcu, d.projetadoAcu])) }))
          .on("mouseleave", () => this.hideTooltip(guideLine))
          .on("mousemove", (e) => this.moveTooltip(e));
        tipsLines.exit().remove();
        break;
    }
  }

  /*SHOW TOOLTIP*/
  showTooltip(event, d, metaVal, guideLine, pos) {
    let el = d3.select(tooltipEl.value);
    el.classed("on", true)
      .style("left", pos.x + "px")
      .style("top", pos.y + "px");

    guideLine.classed("on", true)
      .attr("x1", pos.x)
      .attr("x2", pos.x);

    //Creating tooltip element
    let mes = this.locale.utcFormat("%B/%Y")(d.date);
    let tipHtml = `<p class="t14 tprimary">${mes}</p>`;

    d.indicadores.forEach(function (el, i) {
      tipHtml += `<p class="t14 indicador tprimary">${el.label}</p>
          <div class="t11 index${i + 1}">
            <p class="r-caption"><i></i> Realizado acumulado: <span>${el.realizadoAcu || '-'}</span> (<span>${el.realizado || '-'}</span>)</p>
            <p class="p-caption"><i></i> Previsto acumulado: <span>${el.projetadoAcu || '-'}</span> (<span>${el.projetado || '-'}</span>)</p>
          </div>`;
    });

    el.html(tipHtml);
  }

  /*HIDE TOOLTIP*/
  hideTooltip(guideLine) {
    let el = d3.select(tooltipEl.value);
    el.classed("on", false);
    guideLine.classed("on", false);
  }

  moveTooltip(e) {
    let el = d3.select(tooltipEl.value);
    el.classed("on", true)
      .classed("after", false)
      //.style("transition", "opacity 200ms ease-in-out, visibility 200ms ease-in-out")
      //.style("left", e.offsetX + "px")
      .style("top", e.offsetY + "px");
  }

  /*MERGE DATA FOR TOOLTIPS PATTERN*/
  mergeDataForTooltips(data, X) {
    //Tip Array with X date domain
    let tipArray = [];
    for (var i = 0; i < X.length; i++) {
      tipArray[i] = { 'date': X[i] }
    }
    //Merging all data points for tips info into Tip Array
    data.forEach((data, index) => {
      const dataKeys = Object.keys(data.series);
      for (var i = 0; i < dataKeys.length; i++) {
        for (var j = 0; j < data.series[dataKeys[i]].length; j++) {
          for (var k = 0; k < tipArray.length; k++) {
            if (tipArray[k].date.getTime() == (new Date(data.series[dataKeys[i]][j].date)).getTime()) {
              tipArray[k]['indicadores'] = tipArray[k]['indicadores'] || [];
              if (!tipArray[k]['indicadores'][index]) tipArray[k]['indicadores'][index] = { "id": data.id, "label": data.label };
              tipArray[k]['indicadores'][index][dataKeys[i]] = data.series[dataKeys[i]][j].value ? data.series[dataKeys[i]][j].value : '-';
              break;
            }
          }
        }
      }
    });
    return tipArray;
  }

  /*FID MIDWAY X FOR A DATAPOINT AND ITS NEIGHBORS*/
  midWayX(c, d, e, xScale, X) {
    c = c == undefined ? { 'date': X[0] } : c;
    e = e == undefined ? { 'date': X[X.length - 1] } : e;

    return {
      left: xScale((c.date.getTime() + d.date.getTime()) / 2),
      right: xScale((d.date.getTime() + e.date.getTime()) / 2)
    };
  }

  /*DRAW YEARS LINES XAXIS-2 FUNCTION*/
  rangeYearsLines(svg, ticksYears, xDomain, xScale, sizes, transitionDuration = 200) {

    //Adjusting data to xDomain limits
    ticksYears[0] = xDomain[0];
    ticksYears[ticksYears.length - 1] = xDomain[1];

    //Creating horizontal lines for years
    const g = svg.selectAll("g.xaxis2lines").data([true]);
    g.enter().append("g").attr("class", 'xaxis2lines');

    const gLines = svg.select("g.xaxis2lines");
    const yearsLines = gLines.selectAll("line").data(ticksYears);
    yearsLines
      .enter()
      .append('line')
      .attr('x1', (d, i) => this.yearsLinesLimits(d, i, ticksYears.length, xScale, 1))
      .attr('y1', sizes.height - sizes.margin.bottom + 53)
      .attr('x2', (d, i) => this.yearsLinesLimits(d, i, ticksYears.length, xScale, 2))
      .attr('y2', sizes.height - sizes.margin.bottom + 53)
      .merge(yearsLines)
      .attr('class', 'year-line')
      .attr('stroke-width', 1)
      .transition().duration(transitionDuration)
      .attr('x1', (d, i) => this.yearsLinesLimits(d, i, ticksYears.length, xScale, 1))
      .attr('y1', sizes.height - sizes.margin.bottom + 53)
      .attr('x2', (d, i) => this.yearsLinesLimits(d, i, ticksYears.length, xScale, 2))
      .attr('y2', sizes.height - sizes.margin.bottom + 53);
    yearsLines.exit().remove();

    //Creating vertical lines for years
    ticksYears.shift();

    const g2 = svg.selectAll("g.yaxis2lines").data([true]);
    g2.enter().append("g").attr("class", 'yaxis2lines');

    const gYlines = svg.select("g.yaxis2lines");
    const yLines = gYlines.selectAll("line").data(ticksYears);
    yLines
      .enter()
      .append('line')
      .attr('x1', d => xScale(new Date(d.getFullYear() + '-01-01T00:00:00.000Z')))
      .attr('y1', sizes.margin.top)
      .attr('x2', d => xScale(new Date(d.getFullYear() + '-01-01T00:00:00.000Z')))
      .attr('y2', sizes.height - sizes.margin.bottom)
      .attr('stroke', '#E3E5E8')
      .attr('stroke-width', 1)
      .merge(yLines)
      .transition().duration(transitionDuration)
      .attr('x1', d => xScale(new Date(d.getFullYear() + '-01-01T00:00:00.000Z')))
      .attr('y1', sizes.margin.top)
      .attr('x2', d => xScale(new Date(d.getFullYear() + '-01-01T00:00:00.000Z')))
      .attr('y2', sizes.height - sizes.margin.bottom);
    yLines.exit().remove();
  }

  /*RETURN X1 AND X2 FOR YEARS LINES*/
  yearsLinesLimits(d, i, iMax, xScale, x) {
    if (x == 1) {
      return i == 0 ? xScale(d) : xScale(new Date(d.getFullYear() + '-01-05T00:00:00.000Z'));
    }
    if (x == 2) {
      return i == iMax - 1 ? xScale(d) : xScale(new Date(d.getFullYear() + '-12-26T00:00:00.000Z'));
    }
  }

  /*DRAW DATA POINTS FUNCTION - CIRCLES AND LINES*/
  drawDataPoints(svg, data, xScale, yScale, sizes, { name = 'none', r = 5, strokeW = 2, firstCircle = true, transitionDuration = 200 } = {}) {

    //Remove first circle
    let first;
    if (!firstCircle) {
      first = data.shift();
    }

    //Creating Data Points
    const g = svg.selectAll("g#" + name).data([true])
      .enter().append("g").attr("id", name);

    const gCircles = g.selectAll("circle").data(data.filter(x => { return x.value !== undefined }));
    gCircles
      .enter()
      .filter(function (d) { return d.value !== ""; })
      .append('circle')
      .attr('class', 'circle-' + name)
      .attr('r', r)
      .attr('cy', sizes.height - sizes.margin.bottom)
      .attr('cx', d => xScale(new Date(d.date)))
      .merge(gCircles)
      .transition().duration(transitionDuration)
      .attr('cy', d => yScale(d.value))
      .attr('cx', d => xScale(new Date(d.date)))
    gCircles.exit().remove();

    //Reinsert first circle (before drawing lines)
    if (!firstCircle) {
      data.unshift(first);
    }

    //Creating Path between Data Points
    let line = d3.line()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(d.value))
      .defined(function (d) { return d.value !== ""; });

    let flatline = d3.line()
      .x(d => xScale(new Date(d.date)))
      .y(sizes.height - sizes.margin.bottom)
      .defined(function (d) { return d.value !== ""; });

    const path = g.selectAll('path').data(data.filter(x => x.value !== undefined));
    path
      .enter()
      .append('path')
      .attr('d', function (d, i) { return i != 0 ? flatline([d, data[i - 1]]) : 'M0 0'; })
      .attr('class', 'line-' + name)
      .attr('stroke-width', strokeW)
      .merge(path)
      .transition().duration(transitionDuration)
      .attr('d', function (d, i) { return i != 0 ? line([d, data[i - 1]]) : 'M0 0'; })
    path.exit().remove();
  }

  /*RETURN ARRAY OF YEARS POSITIONS FUNCTION*/
  formatTicksYears(domain) {
    let startDate = new Date(domain[0]),
      finalDate = new Date(domain[1]);

    let arr = [];

    if (startDate.getMonth() > 5) {
      arr.push(startDate);
    }
    else {
      arr.push(new Date(startDate.getFullYear() + '-06-30T00:00:00.000Z'));
    }

    for (var i = startDate.getFullYear() + 1; i < finalDate.getFullYear(); i++) {
      arr.push(new Date(i + '-06-30T00:00:00.000Z'));
    }

    if (finalDate.getMonth() < 6) {
      arr.push(finalDate);
    }
    else {
      arr.push(new Date(finalDate.getFullYear() + '-06-30T00:00:00.000Z'));
    }

    return arr;
  }
}

const chart = new smaeChart();

function start() {
  if (props.single) {
    iP.value = props.single.ordem_series?.indexOf('Previsto');
    iR.value = props.single.ordem_series?.indexOf('Realizado');
    iPA.value = props.single.ordem_series?.indexOf('PrevistoAcumulado');
    iRA.value = props.single.ordem_series?.indexOf('RealizadoAcumulado');
  }

  if (props.dataserie?.length && props.dataserie[0] && evolucao.value) {
    let data = [];
    props.dataserie.forEach(ind => {
      let a = {
        id: ind.id,
        label: ind.codigo + ' - ' + ind.titulo,
        series: {}
      }
      a.series.projetadoAcu = ind.series.map(x => { return { date: x.periodo_inicio, value: x.valores_nominais[iPA.value] }; });
      a.series.realizadoAcu = ind.series.map(x => { return { date: x.periodo_inicio, value: x.valores_nominais[iRA.value] }; });
      a.series.projetado = ind.series.map(x => { return { date: x.periodo_inicio, value: x.valores_nominais[iP.value] }; });
      a.series.realizado = ind.series.map(x => { return { date: x.periodo_inicio, value: x.valores_nominais[iR.value] }; });
      data.push(a);
    });

    chart.drawChart(data, evolucao.value);
  }
}
onMounted(start);
onUpdated(start);
window.addEventListener('resize', start);
</script>
<template>
  <div style="position: relative;">
    <svg class="lineGraph" ref="evolucao" xmlns:xhtml="http://www.w3.org/1999/xhtml"></svg>
    <div class="tooltipEvolucao" ref="tooltipEl"></div>

    <ul class="captions">
      <li class="captions__item"><i></i> Realizado acumulado</li>
      <li class="captions__item captions__item--p"><i></i> Previsto acumulado</li>
    </ul>
  </div>
</template>
<style lang="less">
@import '@/_less/variables.less';

@cores: #C25E0A,
  #8B9BB1,
  #92D505,
  #89049F,
  #679504,
  #FF9CAE,
  #3B5881,
  #D33939,
  #F8AD6D,
  #C99FCF,
  #F7D479,
  #7C3B03;

.lineGraph {
  width: 100%;
  height: auto;
  margin: 0 auto;
  overflow: visible;

  foreignObject {
    overflow: visible;
  }

  text {
    text-transform: uppercase;
  }
  
  .color-classes(@i: length(@cores)) when (@i > 0) {
    .color-classes(@i - 1);
  
    @cor: extract(@cores, @i);
  
    .line-r@{i} {
      stroke: @cor;
      fill: none;
    }
  
    .circle-r@{i} {
      fill: @cor;
    }
  
    .line-p@{i} {
      stroke: @cor;
      stroke-dasharray: 3 3;
      fill: none;
    }
  
    .circle-p@{i} {
      fill: @cor;
    }
  }
  
  .color-classes();
  
  .meta-circle {
    fill: #152741;
  }
  
  .meta-line {
    stroke: #152741;
    fill: none;
  }
  
  .guideline {
    visibility: hidden;
    opacity: 0;
    transition: all 200ms ease-in-out;
  
    &.on {
      visibility: visible;
      opacity: 1;
    }
  }
  
  .xaxis {
    .domain {
      stroke: #B8C0CC;
    }
  
    .tick {
      text {
        color: #B8C0CC;
        font-size: 11px;
        font-weight: 400;
      }
    }
  }
  
  .xaxis2 {
    .domain {
      stroke: transparent;
    }
  
    .tick {
      rect {
        fill: #152741;
        border-radius: 100%;
      }
  
      text {
        color: #FFF;
        font-size: 11px;
        font-weight: 400;
      }
    }
  }
  
  .yaxis {
    .domain {
      stroke: #B8C0CC;
    }
  
    .tick {
      text {
        color: #B8C0CC;
        font-size: 11px;
        font-weight: 400;
      }
    }
  }
  
  .year-line {
    stroke: #E3E5E8;
  }
}

.tooltipEvolucao {
  transition: all 200ms ease-in-out;
  visibility: hidden;
  opacity: 0;
  width: max-content;
  position: absolute;
  left: 0px;
  top: 0px;
  pointer-events: none;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 5px 5px 15px 10px fade(black, 8);
  transform: translateX(-50%) translateY(calc(-100% - 12px));
  max-width: 230px;
  z-index: 999;

  p {
    font-family: sans-serif;

    span {
      font-weight: 700;
    }

    &.indicador {
      font-weight: 700;
      margin-bottom: 3px;

      &+div {
        margin-bottom: 10px;

        p {
          margin-bottom: 3px;

          i {
            display: inline-block;
            vertical-align: middle;
            margin-right: 3px;
            height: 0px;
            width: 20px;
            border-bottom: solid 2px black;
          }

          &.p-caption i {
            border-bottom-style: dashed;
          }
        }

        .color-classes(@i: length(@cores)) when (@i > 0) {
          .color-classes(@i - 1);
          @cor: extract(@cores, @i);

          &.index@{i} p i {
            border-bottom-color: @cor;
          }
        }

        .color-classes();
      }
    }
  }

  &::after {
    content: '';
    display: block;
    position: absolute;
    left: 50%;
    top: 100%;
    transform: translateX(-50%);
    width: 0;
    height: 0;

    border-style: solid;
    border-width: 10px 10px 0 10px;
    border-color: white transparent transparent transparent;
  }

  &.on {
    visibility: visible;
    opacity: 1;
  }
}

.captions {
  display: table;
  border-spacing: 3px;
  margin-bottom: 20px;
  margin-right: auto;
  margin-left: auto;
  color: #152741;
}

.captions__item {
  display: table-cell;
  list-style: none;

  i {
    color: #C25E0A;
    display: inline-block;
    vertical-align: middle;
    margin-right: 3px;
    height: 0px;
    width: 20px;
    border-bottom: solid 2px currentColor;
  }
}

.captions__item--p {
  i {
    border-bottom-style: dashed;
  }
}
</style>
