<script setup>
import Big from 'big.js';
import * as d3 from 'd3';
import { niceNumber } from 'nice-number';
import {
  computed, onMounted, onUpdated, ref,
} from 'vue';

const props = defineProps({
  dataserie: {
    type: Object,
    default: () => ({}),
  },
  casasDecimais: {
    type: Number,
    default: 0,
    validator: (value) => typeof value === 'number',
  },
  temCategorica: {
    type: Boolean,
    default: false,
  },
});
const evolucao = ref(null);
const tooltipEl = ref(null);

const casasDecimais = computed(() => props.casasDecimais
  || props.dataserie.variavel?.casas_decimais
  || 0);

const dadosAuxiliares = computed(() => props.dataserie?.dados_auxiliares);
const linhas = computed(() => props.dataserie?.linhas);

function obterDadosTraduzidos(valor) {
  if (!valor) {
    return '-';
  }

  if (!props.temCategorica || !dadosAuxiliares.value) {
    return valor;
  }

  return dadosAuxiliares.value.categoricas?.[valor] || valor;
}

class smaeChart {
  constructor(ratio, sizes, transitionDuration, locale) {
    this.sizes = {
      width: 1000,
      height: 400,
      margin: {
        top: 50,
        right: 0,
        left: 50,
        bottom: 80,
      },
    };
    this.transitionDuration = 1000;
    this.locale = d3.timeFormatLocale({
      dateTime: '%A, %e %B %Y г. %X',
      date: '%d.%m.%Y',
      time: '%H:%M:%S',
      periods: ['AM', 'PM'],
      days: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
      shortDays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
      months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
      shortMonths: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    });
  }

  /* DRAW CHART */
  drawChart(data, el) {
    /* UPDATING SIZE */
    this.sizes.width = el.getBoundingClientRect().width;
    this.sizes.height = 350;

    /* SVG */
    const svg = d3.select(el);
    svg.attr('width', this.sizes.width)
      .attr('height', this.sizes.height);

    /* MANIPULATING DATA */
    // Eval xDomain and xScale for dates
    const Xp = d3.map(data.projetado, (d) => new Date(d.date));
    const Xr = d3.map(data.realizado, (d) => new Date(d.date));
    let X = Xp.concat(Xr).sort((a, b) => a - b);
    const xDomain = d3.extent(X);
    const xScale = d3.scaleUtc(xDomain, [this.sizes.margin.left, this.sizes.width - this.sizes.margin.left - this.sizes.margin.right]);

    // Eval yDomain and yScale for linear
    const Yp = d3.map(data.projetado, (d) => +d.value);
    const Yr = d3.map(data.realizado, (d) => +d.value);
    let Y = Yp;
    if (!props.temCategorica) {
      Y = Yp.concat(Yr);
    }

    const yDomain = d3.extent(Y);
    const yScale = d3.scaleLinear(yDomain, [
      this.sizes.height - this.sizes.margin.bottom,
      this.sizes.margin.top,
    ]);

    // All dates unique on X and sorted by ASC
    X = X.map((date) => date.getTime())
      .filter((date, i, array) => array.indexOf(date) === i)
      .map((time) => new Date(time));

    // Domain for Years
    const ticksYears = this.formatTicksYears(xScale.domain());

    /* YAXIS */
    const yAxis = d3.axisLeft(yScale)
      .tickSize(0)
      .tickFormat((d) => (d > 1000 ? niceNumber(d) : d))
      .tickPadding(10);

    /* XAXIS */
    // Years
    const xAxis2 = d3.axisBottom(xScale)
      .ticks(d3.timeYear)
      .tickFormat(this.locale.format('%Y'))
      .tickSize(0)
      .tickPadding(9);

    // Months
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeMonth, 10)
      .tickFormat(this.locale.format('%b'))
      .tickSize(0)
      .tickPadding(15);

    /* DRAW Gs */
    // Draw Y-Axis
    const gYaxis = svg.selectAll('g.yaxis').data([true]);
    gYaxis
      .enter()
      .append('g')
      .attr('class', 'yaxis')
      .attr('transform', `translate(${this.sizes.margin.left},0)`)
      .merge(gYaxis)
      .transition()
      .duration(this.transitionDuration)
      .call(yAxis);

    // Draw X-Axis
    const gXaxis = svg.selectAll('g.xaxis').data([true]);
    gXaxis
      .enter()
      .append('g')
      .attr('class', 'xaxis')
      .attr('transform', `translate(0,${this.sizes.height - this.sizes.margin.bottom})`)
      .merge(gXaxis)
      .transition()
      .duration(this.transitionDuration)
      .attr('transform', `translate(0,${this.sizes.height - this.sizes.margin.bottom})`)
      .call(xAxis)
      .selectAll('text')
      .call((x) => toomuch(this.sizes.width, x));

    function toomuch(w, s, d) {
      const ss = s.size();
      const m = Math.round(w / 50);
      const dif = ss > m ? Math.floor(ss / m) : 1;
      s.style('opacity', (d, i) => (i % dif == 0 ? 1 : 0));
    }

    // Draw X-Axis2
    this.rangeYearsLines(svg, ticksYears, xDomain, xScale, this.sizes, this.transitionDuration);
    const gXaxis2 = svg.selectAll('g.xaxis2').data([true]);
    gXaxis2
      .enter()
      .append('g')
      .attr('class', 'xaxis2')
      .attr('transform', `translate(0,${this.sizes.height - this.sizes.margin.bottom / 2})`)
      .merge(gXaxis2)
      .transition()
      .duration(this.transitionDuration)
      .attr('transform', `translate(0,${this.sizes.height - this.sizes.margin.bottom / 2})`)
      .call(xAxis2);

    svg.selectAll('g.xaxis2 g')
      .insert('rect', 'text')
      .attr('transform', 'translate(-30,2)')
      .attr('width', 60)
      .attr('height', 22)
      .attr('rx', 11);

    if (!props.temCategorica) {
      this.drawDataPoints(svg, data.projetado, xScale, yScale, this.sizes, { name: 'previsto', transitionDuration: this.transitionDuration });
      this.drawDataPoints(svg, data.realizado, xScale, yScale, this.sizes, { name: 'realizado', transitionDuration: this.transitionDuration });
    } else {
      this.drawDataPoints(svg, data.projetado, xScale, yScale, this.sizes, { name: 'realizado', transitionDuration: this.transitionDuration });
    }

    /* DRAW META */
    const metaVal = Yp[Yp.length - 1];
    const meta = [
      { date: d3.min(X), value: metaVal },
      { date: Xp[Xp.length - 1], value: metaVal },
    ];

    if (!props.temCategorica) {
      this.drawDataPoints(svg, meta, xScale, yScale, this.sizes, {
        name: 'meta', r: 10, strokeW: 4, firstCircle: false, transitionDuration: this.transitionDuration,
      });
    }

    /* DRAW INVISIBLE LINES FOR MOUSE EVENTS */
    this.drawDataToolTipsBars(svg, data, xScale, yScale, X, metaVal, this.sizes, 'rect');
  }

  /* DRAW INVISIBLE LINES FOR MOUSE EVENTS */
  drawDataToolTipsBars(svg, rawData, xScale, yScale, X, metaVal, sizes, el = 'rect') {
    const data = {
      ...rawData,
      projetado: Array.isArray(rawData.projetado) ? rawData.projetado.filter((x) => x.value !== '') : [],
      realizado: Array.isArray(rawData.realizado) ? rawData.realizado.filter((x) => x.value !== '') : [],
    };

    // Creating guide line for tooltip
    const guideLineTip = svg.selectAll('line.guideline').data([true]);
    guideLineTip
      .enter()
      .append('line')
      .attr('class', 'guideline')
      .attr('stroke', '#8B9BB1')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('y1', sizes.margin.top)
      .attr('y2', sizes.height - sizes.margin.bottom);
    const guideLine = svg.select('line.guideline');

    // Prepare new data for tooltips
    const tipArray = this.mergeDataForTooltips(data, X);

    const g = svg.selectAll('g.tooltipslines').data([true]);
    g.enter().append('g').attr('class', 'tooltipslines');
    const gLines = svg.select('g.tooltipslines');

    // Creating tips bars {rect || line}
    switch (el) {
      case 'rect':
        const tipsRects = gLines.selectAll('rect').data(tipArray);
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
          .on('mouseover', (event, d) => this.showTooltip(event, d, metaVal, guideLine, { x: xScale(d.date), y: yScale(d3.max([d.realizadoAcum, d.projetadoAcum])) }))
          .on('mouseleave', () => this.hideTooltip(guideLine))
          .on('mousemove', (e) => this.moveTooltip(e));
        tipsRects.exit().remove();
        break;

      case 'line':
        const tipsLines = gLines.selectAll('line').data(tipArray);
        tipsLines
          .enter()
          .append('line')
          .merge(tipsRects)
          .attr('x1', (d) => xScale(new Date(d.date)))
          .attr('y1', sizes.margin.top)
          .attr('x2', (d) => xScale(new Date(d.date)))
          .attr('y2', sizes.height - sizes.margin.bottom)
          .attr('stroke', 'transparent')
          .attr('stroke-width', 10)
          .on('mouseover', (event, d) => this.showTooltip(event, d, metaVal, guideLine, { x: xScale(d.date), y: yScale(d3.max([d.realizadoAcum, d.projetadoAcum])) }))
          .on('mouseleave', () => this.hideTooltip(guideLine))
          .on('mousemove', (e) => this.moveTooltip(e));
        tipsLines.exit().remove();
        break;

      default:
        break;
    }
  }

  /* SHOW TOOLTIP */
  showTooltip(_event, d, metaVal, guideLine, pos) {
    const el = d3.select(tooltipEl.value);
    el.classed('on', true)
      .style('left', `${pos.x}px`)
      .style('top', `${pos.y}px`);

    guideLine.classed('on', true)
      .attr('x1', pos.x)
      .attr('x2', pos.x);

    let previsto = d.projetado;
    if (props.temCategorica) {
      const iPrevisto = props.dataserie.ordem_series.indexOf('Previsto');
      previsto = linhas.value[d.index].series[iPrevisto].valor_nominal;
    }

    // Creating tooltip element
    const mes = this.locale.utcFormat('%B/%Y')(d.date);
    const tipHtml = `
      <p class="t14 data tprimary">${mes}</p>

      ${props.temCategorica ? '' : `<p class="meta t14 tc300">Meta: <span class="tprimary">${metaVal ?? '-'}</span></p>`}

      ${props.temCategorica ? '' : `<p class="tc300 t14">
          Previsto acumulado até ${mes}: <span>${d.projetadoAcum ?? '-'}</span><br />
          <span class="tamarelo">Realizado acumulado até ${mes}: ${d.realizadoAcum ?? '-'}</span>
        </p>
      `}

      <p class="tc300 t11 mb0">
        Previsto ${mes}: <span>${obterDadosTraduzidos(previsto)}</span><br />
        Realizado ${mes}: <span class="tamarelo">${obterDadosTraduzidos(d.realizado)}</span>
      </p>
    `;

    el.html(tipHtml);
  }

  /* HIDE TOOLTIP */
  hideTooltip(guideLine) {
    const el = d3.select(tooltipEl.value);
    el.classed('on', false);
    guideLine.classed('on', false);
  }

  moveTooltip(e) {
    const el = d3.select(tooltipEl.value);
    el.classed('on', true)
      .classed('after', false)
      // .style("transition", "opacity 200ms ease-in-out, visibility 200ms ease-in-out")
      // .style("left", e.offsetX + "px")
      .style('top', `${e.offsetY}px`);
  }

  /* MERGE DATA FOR TOOLTIPS PATTERN */
  mergeDataForTooltips(data, X) {
    // Tip Array with X date domain
    const tipArray = [];
    for (let i = 0; i < X.length; i += 1) {
      tipArray[i] = { date: X[i] };
    }
    const aux = {};

    // Merging all data points for tips info into Tip Array
    const dataKeys = Object.keys(data);
    for (let i = 0; i < dataKeys.length; i += 1) {
      for (let j = 0; j < data[dataKeys[i]].length; j += 1) {
        for (let k = 0; k < tipArray.length; k += 1) {
          if (!data[dataKeys[i]][j].value) {
            break;
          }

          if (tipArray[k].date.getTime() == (new Date(data[dataKeys[i]][j].date)).getTime()) {
            aux[dataKeys[i]] = aux[dataKeys[i]] || 0;
            tipArray[k][`${dataKeys[i]}Acum`] = Big(data[dataKeys[i]][j].value).toFixed(casasDecimais.value) || 0;
            tipArray[k][dataKeys[i]] = Big(data[dataKeys[i]][j].value)
              .minus(aux[dataKeys[i]])
              .toFixed(casasDecimais.value);
            aux[dataKeys[i]] = data[dataKeys[i]][j].value;
            tipArray[k].index = j;
            break;
          }
        }
      }
    }

    return tipArray;
  }

  /* FID MIDWAY X FOR A DATAPOINT AND ITS NEIGHBORS */
  midWayX(c, d, e, xScale, X) {
    c = c == undefined ? { date: X[0] } : c;
    e = e == undefined ? { date: X[X.length - 1] } : e;

    return {
      left: xScale((c.date.getTime() + d.date.getTime()) / 2),
      right: xScale((d.date.getTime() + e.date.getTime()) / 2),
    };
  }

  /* DRAW YEARS LINES XAXIS-2 FUNCTION */
  rangeYearsLines(svg, ticksYears, xDomain, xScale, sizes, transitionDuration = 200) {
    // Adjusting data to xDomain limits
    ticksYears[0] = xDomain[0];
    ticksYears[ticksYears.length - 1] = xDomain[1];

    // Creating horizontal lines for years
    const g = svg.selectAll('g.xaxis2lines').data([true]);
    g.enter().append('g').attr('class', 'xaxis2lines');

    const gLines = svg.select('g.xaxis2lines');
    const yearsLines = gLines.selectAll('line').data(ticksYears);
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
      .transition()
      .duration(transitionDuration)
      .attr('x1', (d, i) => this.yearsLinesLimits(d, i, ticksYears.length, xScale, 1))
      .attr('y1', sizes.height - sizes.margin.bottom + 53)
      .attr('x2', (d, i) => this.yearsLinesLimits(d, i, ticksYears.length, xScale, 2))
      .attr('y2', sizes.height - sizes.margin.bottom + 53);
    yearsLines.exit().remove();

    // Creating vertical lines for years
    ticksYears.shift();

    const g2 = svg.selectAll('g.yaxis2lines').data([true]);
    g2.enter().append('g').attr('class', 'yaxis2lines');

    const gYlines = svg.select('g.yaxis2lines');
    const yLines = gYlines.selectAll('line').data(ticksYears);
    yLines
      .enter()
      .append('line')
      .attr('x1', (d) => xScale(new Date(`${d.getFullYear()}-01-01T00:00:00.000Z`)))
      .attr('y1', sizes.margin.top)
      .attr('x2', (d) => xScale(new Date(`${d.getFullYear()}-01-01T00:00:00.000Z`)))
      .attr('y2', sizes.height - sizes.margin.bottom)
      .attr('stroke', '#E3E5E8')
      .attr('stroke-width', 1)
      .merge(yLines)
      .transition()
      .duration(transitionDuration)
      .attr('x1', (d) => xScale(new Date(`${d.getFullYear()}-01-01T00:00:00.000Z`)))
      .attr('y1', sizes.margin.top)
      .attr('x2', (d) => xScale(new Date(`${d.getFullYear()}-01-01T00:00:00.000Z`)))
      .attr('y2', sizes.height - sizes.margin.bottom);
    yLines.exit().remove();
  }

  /* RETURN X1 AND X2 FOR YEARS LINES */
  yearsLinesLimits(d, i, iMax, xScale, x) {
    if (x == 1) {
      return i == 0 ? xScale(d) : xScale(new Date(`${d.getFullYear()}-01-05T00:00:00.000Z`));
    }
    if (x == 2) {
      return i == iMax - 1 ? xScale(d) : xScale(new Date(`${d.getFullYear()}-12-26T00:00:00.000Z`));
    }
  }

  /* DRAW DATA POINTS FUNCTION - CIRCLES AND LINES */
  drawDataPoints(svg, rawData, xScale, yScale, sizes, {
    name = 'none', r = 5, strokeW = 2, firstCircle = true, transitionDuration = 200,
  } = {}) {
    const data = rawData.filter((x) => x.value !== '' && x.value !== null && typeof x.value !== 'undefined');

    // Remove first circle
    let first;
    if (!firstCircle) {
      first = data.shift();
    }

    // Creating Data Points
    const g = svg.selectAll(`g#${name}`).data([true]);
    g.enter().append('g').attr('id', name);

    const gName = svg.selectAll(`g#${name}`);
    const gCircles = gName.selectAll('circle').data(data);
    gCircles
      .enter()
      .append('circle')
      .attr('class', `${name}-circle`)
      .attr('r', r)
      .attr('cy', sizes.height - sizes.margin.bottom)
      .attr('cx', (d) => xScale(new Date(d.date)))
      .merge(gCircles)
      .transition()
      .duration(transitionDuration)
      .attr('cy', (d) => yScale(d.value))
      .attr('cx', (d) => xScale(new Date(d.date)));
    gCircles.exit().remove();

    // Reinsert first circle (before drawing lines)
    if (!firstCircle) {
      data.unshift(first);
    }

    // Creating Path between Data Points
    const line = d3.line()
      .x((d) => xScale(new Date(d.date)))
      .y((d) => yScale(d.value))
      .defined((d) => d.value !== '');

    const flatline = d3.line()
      .x((d) => xScale(new Date(d.date)))
      .y(sizes.height - sizes.margin.bottom)
      .defined((d) => d.value !== '');

    const path = gName.selectAll('path').data(data);
    path
      .enter()
      .append('path')
      .data(data)
      .attr('d', (d, i) => (i != 0 ? flatline([d, data[i - 1]]) : 'M0 0'))
      .attr('class', `${name}-line`)
      .attr('stroke-width', strokeW)
      .merge(path)
      .transition()
      .duration(transitionDuration)
      .attr('d', (d, i) => (i != 0 ? line([d, data[i - 1]]) : 'M0 0'));
    path.exit().remove();
  }

  /* RETURN ARRAY OF YEARS POSITIONS FUNCTION */
  formatTicksYears(domain) {
    const startDate = new Date(domain[0]);
    const finalDate = new Date(domain[1]);

    const arr = [];

    if (startDate.getMonth() > 5) {
      arr.push(startDate);
    } else {
      arr.push(new Date(`${startDate.getFullYear()}-06-30T00:00:00.000Z`));
    }

    for (let i = startDate.getFullYear() + 1; i < finalDate.getFullYear(); i += 1) {
      arr.push(new Date(`${i}-06-30T00:00:00.000Z`));
    }

    if (finalDate.getMonth() < 6) {
      arr.push(finalDate);
    } else {
      arr.push(new Date(`${finalDate.getFullYear()}-06-30T00:00:00.000Z`));
    }

    return arr;
  }
}

const chart = new smaeChart();

function start() {
  if (props.dataserie?.linhas?.length && evolucao.value) {
    const data = {};

    const iPrevistoAcumulado = props.dataserie.ordem_series.indexOf('PrevistoAcumulado');
    const iRealizado = props.dataserie.ordem_series.indexOf('Realizado');
    const iRealizadoAcumulado = props.dataserie.ordem_series.indexOf('RealizadoAcumulado');

    data.projetado = props.dataserie.linhas
      .map((x) => ({
        date: x.series[iPrevistoAcumulado].data_valor,
        value: x.series[!props.temCategorica ? iPrevistoAcumulado : iRealizado].valor_nominal,
      }));
    data.realizado = props.dataserie.linhas
      .map((x) => ({
        date: x.series[iRealizadoAcumulado].data_valor,
        value: x.series[iRealizadoAcumulado].valor_nominal,
      }));
    chart.drawChart(data, evolucao.value);
  }
}
onMounted(start);
onUpdated(start);
window.addEventListener('resize', start);
</script>
<template>
  <div style="position: relative;">
    <svg
      ref="evolucao"
      class="lineGraph"
      xmlns:xhtml="http://www.w3.org/1999/xhtml"
    />
    <div
      ref="tooltipEl"
      class="tooltipEvolucao"
    />
  </div>
</template>
<style lang="less">
@import '@/_less/variables.less';

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

  .realizado-line {
    stroke: #F7C234;
    fill: none;
  }
.realizado-circle {
  fill: #F7C234;
}

.projetado-line {
  stroke: #B8C0CC;
  fill: none;
}

.projetado-circle {
  fill: #B8C0CC;
}

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

    &.data,
    span {
      font-weight: 700;
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
</style>
