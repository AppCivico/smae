/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
/* eslint-disable no-use-before-define */

// Copyright(c) 2017, Skcript Technologies Pvt.Ltd.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files(the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and / or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import {
  axisBottom,
  axisLeft,
  max as d3max,
  select as d3select,
  scaleBand,
  scaleTime,
  timeFormat,
} from 'd3';
import dayjs from 'dayjs';
import 'dayjs/locale/pt';
import isBetween from 'dayjs/plugin/isBetween';
import localeData from 'dayjs/plugin/localeData';
import { range } from 'lodash';

dayjs.locale('pt');
dayjs.extend(isBetween);
dayjs.extend(localeData);
dayjs().localeData();

function declararTipoDeDependência(analisado, focado) {
  return focado.dependencias?.find((x) => x.dependencia_tarefa_id === analisado.id)?.tipo;
}

/**
 * Draw Gantt chart
 *
 * @param {*} config
 * @link https://gist.github.com/varun-raj/5d2caa6a9ad7de08bd5d86698e3a2403#file-license-md
 */
export default function ganttChart(config) {
  const { data } = config;
  const ELEMENT = d3select(config.element);
  const CHART_WIDTH = ELEMENT.node().getBoundingClientRect().width;
  const CHART_HEIGHT = d3max([((data.length * 100) + 100), 300]);
  const PROGRESSBAR_WIDTH = 200;
  const PROGRESSBAR_BOUNDARY = 380;
  const EMPTYBLOCK_WIDTH = ((80 * CHART_WIDTH) / 100);
  const EMPTYBLOCK_HEIGHT = 150;
  const BUTTON_COLOR = '#15bfd8';

  const currentDay = {
    start_date: dayjs().startOf('day').toDate(),
    end_date: dayjs().endOf('day').toDate(),
  };

  function goToNext() {
    switch (config.metrics.type) {
      case 'yearly':
        config.metrics.year += 1;
        break;

      case 'sprint':
        break;

      case 'monthly':
        config.metrics.month = dayjs(`01 ${config.metrics.month}`).add(1, 'months').format('MMMM YYYY');
        break;

      case 'quarterly':
      {
        const months_count = config.metrics.months.length;
        for (let i = 0; i < months_count; i += 1) {
          config.metrics.months[i] = dayjs(`01 ${config.metrics.months[i]}`).add(months_count, 'months').format('MMMM YYYY');
        }
        break;
      }

      case 'overall':
      default:
        for (let i = 0; i < config.metrics.years.length; i += 1) {
          config.metrics.years[i] += config.metrics.years.length;
        }
        break;
    }

    draw('next');
  }

  function goToPrevious() {
    switch (config.metrics.type) {
      case 'yearly':
        config.metrics.year -= 1;
        break;

      case 'sprint':
        break;

      case 'monthly':
        config.metrics.month = dayjs(`01 ${config.metrics.month}`).subtract(1, 'months').format('MMMM YYYY');
        break;

      case 'quarterly':
      {
        const months_count = config.metrics.months.length;
        for (let i = 0; i < months_count; i += 1) {
          config.metrics.months[i] = dayjs(`01 ${config.metrics.months[i]}`, 'MMMM').subtract(months_count, 'months').format('MMMM YYYY');
        }
        break;
      }

      case 'overall':
      default:
        for (let i = 0; i < config.metrics.years.length; i += 1) {
          config.metrics.years[i] -= config.metrics.years.length;
        }
        break;
    }
    draw('previous');
  }

  draw('initial');

  function draw(state) {
    const date_boundary = [];
    let subheader_ranges = [];
    let months = [];
    let header_ranges = [];

    d3select(config.element).node().innerHTML = '';
    switch (config.metrics.type) {
      case 'monthly':
        months = [`01 ${config.metrics.month}`];
        header_ranges = getMonthsRange(months);
        subheader_ranges = getDaysRange(months);
        break;

      case 'quarterly':
      {
        months = config.metrics.months;
        subheader_ranges = getMonthsRange(months);
        const year = dayjs(`01 ${config.metrics.months[0]}`).format('YYYY');

        header_ranges = [{
          start_date: dayjs(`01 ${config.metrics.months[0]}`).startOf('month').toDate(),
          end_date: dayjs(config.metrics.months[config.metrics.months.length - 1], 'MMMM YYYY').endOf('month').toDate(),
          name: year,
        }];
        break;
      }

      case 'yearly':
        months = getMonthsOfTheYear(config.metrics.year);
        subheader_ranges = getMonthsRange(months);
        header_ranges = [getYearBoundary(config.metrics.year)];
        break;

      case 'sprint':
        months = getMonthsOfTheYear(config.metrics.year);
        subheader_ranges = config.metrics.cycles;
        header_ranges = [getYearBoundary(config.metrics.year)];
        break;

      case 'overall':
      default:
      {
        const { years } = config.metrics;
        const yearsRange = [];
        years.forEach((year) => {
          months = months.concat(getMonthsOfTheYear(year));
          yearsRange.push(getYearBoundary(year));
        });
        header_ranges = [{
          name: 'Projeto',
          start_date: yearsRange[0].start_date,
          end_date: yearsRange[yearsRange.length - 1].end_date,
        }];
        subheader_ranges = yearsRange;
        break;
      }
    }

    date_boundary[0] = dayjs(months[0]).startOf('month').toDate();
    date_boundary[1] = dayjs(months[months.length - 1]).endOf('month').toDate();

    const margin = {
      top: 20, right: 50, bottom: 100, left: 50,
    };
    const width = d3max([CHART_WIDTH, 400]) - margin.left - margin.right;
    const height = CHART_HEIGHT - margin.top - margin.bottom;

    const x = scaleTime()
      .domain(date_boundary)
      .range([0, width]);

    const y = scaleBand()
      .rangeRound([0, height])
      .padding(0.1);

    y.domain(data.map((d, i) => i + 1));

    /* const xAxis =  */axisBottom(x)
      .tickFormat(timeFormat('%d/%m/%Y'));

    /* const yAxis = */ axisLeft(y)
      .tickSize(0)
      .tickPadding(6);

    const first_section = ELEMENT
      .append('div')
      .attr('class', 'first_section')
      .style('height', 40)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', 40)
      .append('g');

    const second_section = ELEMENT
      .append('div')
      .attr('class', 'second_section')
      .style('height', 40)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', 40)
      .append('g');

    switch (state) {
      case 'next':
        second_section
          .attr('transform', 'translate( 1000, 0)')
          .transition()
          .attr('transform', `translate( ${margin.left}, 0)`);
        first_section
          .attr('transform', 'translate( 1000, 30)')
          .transition()
          .attr('transform', `translate( ${margin.left}, 30)`);
        break;

      case 'previous':
        second_section
          .attr('transform', 'translate( -1000, 0)')
          .transition()
          .attr('transform', `translate( ${margin.left}, 0)`);
        first_section
          .attr('transform', 'translate( -1000, 30)')
          .transition()
          .attr('transform', `translate( ${margin.left}, 30)`);
        break;

      case 'initial':
      default:
        first_section
          .attr('transform', `translate( ${margin.left}, 30)`);
        second_section
          .attr('transform', `translate( ${margin.left}, 0)`);
        break;
    }

    const DRAWAREA = ELEMENT
      .append('div')
      .attr('class', 'draw_area')
      .append('svg')
      .attr('class', 'DRAWAREA')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const svg = DRAWAREA
      .append('g')
      .attr('transform', `translate(${margin.left},${0})`)
      .call(appendStartLine);

    const lines = svg.append('g').attr('transform', 'translate(0,0)');

    /* const currentDayArea = */ svg.append('line')
      .attr('width', getActualWidth(currentDay))
      .attr('class', 'CurrentDay-Area')
      .attr('x1', x(new Date(currentDay.start_date)))
      .attr('x2', x(new Date(currentDay.start_date)))
      .attr('y1', 0)
      .attr('y2', height);

    /* const leftClickableArea =  */svg.append('rect')
      .attr('width', (width) / 2)
      .attr('height', height)
      .attr('fill', 'transparent')
      .on('click', () => {
        if (config.metrics.type !== 'overall') {
          goToPrevious();
          config.onAreaClick('left');
        }
      });

    /* const rightClickableArea =  */svg.append('rect')
      .attr('width', (width) / 2)
      .attr('transform', `translate(${(width) / 2} ,0)`)
      .attr('height', height)
      .attr('fill', 'transparent')
      .on('click', () => {
        if (config.metrics.type !== 'overall') {
          goToNext();
          config.onAreaClick('right');
        }
      });

    first_section.selectAll('.bar')
      .data(header_ranges)
      .enter().append('text')
      .attr('class', 'first-title')
      .attr('y', -5)
      .attr('x', (d) => x(new Date(d.start_date)) + (getWidth(d) / 2))
      .attr('width', (d) => getWidth(d))
      .attr('height', y.bandwidth())
      .text((d) => d.name);

    second_section
      .append('rect')
      .attr('x', x(new Date(date_boundary[0])))
      .attr('width', Math.abs(x(new Date(date_boundary[0])) - x(new Date(date_boundary[1]))))
      .attr('height', 40)
      .attr('class', 'Date-Block-Outline');

    second_section
      .append('g')
      .selectAll('.bar')
      .data(subheader_ranges)
      .enter()
      .append('rect')
      .attr('x', (d) => x(new Date(d.start_date)))
      .attr('width', (d) => getWidth(d))
      .attr('height', 40)
      .attr('class', (d) => `Date-Block Date-${dayjs(d.start_date).format('MMYYYY')}`);

    second_section
      .append('g')
      .selectAll('.bar')
      .data(subheader_ranges)
      .enter()
      .append('text')
      .attr('x', (d) => (x(new Date(d.start_date)) + 10))
      .attr('width', (d) => getWidth(d))
      .attr('y', 25)
      .text((d) => d.name)
      .attr('class', (d) => `second-title Date Date-${dayjs(d).format('MMYYYY')}`);

    lines.selectAll('.lines')
      .data(subheader_ranges)
      .enter()
      .append('line')
      .attr('class', 'date-line')
      .attr('x1', (d) => x(new Date(d.start_date)))
      .attr('x2', (d) => x(new Date(d.start_date)))
      .attr('y1', 0)
      .attr('y2', height);

    if (config.data.length === 0) {
      const EmptyBlockX = ((CHART_WIDTH / 2) - (EMPTYBLOCK_WIDTH / 2));
      const EMPTYBLOCK = DRAWAREA
        .append('g')
        .attr('class', 'EmptyMessageBlock')
        .attr('transform', `translate(${EmptyBlockX}, 20)`);

      EMPTYBLOCK
        .append('rect')
        .attr('fill', '#fff')
        .attr('stroke', '#ccc')
        .attr('x', 0)
        .attr('width', EMPTYBLOCK_WIDTH)
        .attr('height', EMPTYBLOCK_HEIGHT);

      EMPTYBLOCK
        .append('text')
        .attr('class', 'EmptyMessage')
        .attr('font-size', 25)
        .attr('y', 25)
        .text('Não há tarefas para essa seleção');

      const EMPTRYBLOCK_BUTTON = EMPTYBLOCK
        .append('g')
        .attr('class', 'empty_button')
        .attr('transform', `translate(${Math.abs((EMPTYBLOCK_WIDTH / 2) - 50)}, 100)`)
        .on('click', (d) => {
          config.onEmptyButtonClick();
        });

      EMPTRYBLOCK_BUTTON
        .append('foreignObject')
        .attr('width', 100)
        .attr('height', 48)
        .html('<button class="btn">Criar tarefa</button>');

      const textBlock = EMPTYBLOCK.select('.EmptyMessage');

      const EmptyMessageWidth = textBlock.node().getComputedTextLength();
      const EmptyMessageX = Math.abs((EMPTYBLOCK_WIDTH / 2) - (EmptyMessageWidth / 2));

      textBlock
        .attr('transform', `translate(${EmptyMessageX},20)`);
    }

    const bars = svg.append('g').attr('transform', 'translate(0, 20)');

    const Blocks = bars.selectAll('.bar')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'Single--Block cp')
      .attr('transform', (d, i) => `translate(${x(new Date(d.start_date))},${0})`)
      .attr('data-is-milestone', (b) => String(!!b.eh_marco))
      .call(appendBar);

    Blocks
      .append('foreignObject')
      .attr('width', 100)
      .attr('height', 50)
      .attr('x', 0)
      .attr('y', (d, i) => y(i + 1))
      .attr('transform', (d, i) => 'translate(-50, -25)')
      .attr('data-is-milestone', (b) => String(!!b.eh_marco))
      .html((d) => `<div class="btn hierarchy">${d.hierarquia}</div>`);

    Blocks
      .append('g')
      .attr('transform', (d) => {
        if (startsBefore(d) && isVisible(d)) {
          const position = Math.abs(x(new Date(d.start_date)));
          return `translate(${position}, 15)`;
        }
        return 'translate(0, 15)';
      })
      .call(appendTitle)
      .call(appendFooter);

    Blocks
      .on('click', (d) => {
        config.onClick(d);
      })
      .on('mouseover', function (d, o) {
        svg.selectAll('.Single--Block')
          .style('opacity', (b, i) => ((o.id === b.id) ? 1 : 0.3))
          .attr('class', (b, i) => ((o.id === b.id)
            ? 'Single--Block cp Single--Block--focused'
            : 'Single--Block cp'))
          .attr('data-dependency-type', (b) => declararTipoDeDependência(b, o));

        svg.selectAll('.start-lines, .end-lines')
          .style('stroke-width', (b, i) => ((o.id === b.id) ? 3 : 1))
          .style('opacity', (b, i) => Number(o.id === b.id));

        svg.selectAll('.Single--Node')
          .attr('width', (b) => {
            if (o.id === b.id) {
              if (startsBefore(o) || endsAfter(o)) {
                if (getWidth(b) < 500) {
                  return (getActualWidth(b) + (500 - getWidth(b)) + 10);
                }
              }
              return ((d3max([getActualWidth(b), 500])) + 10);
            }
            return getActualWidth(b);
          });

        svg.selectAll('.ProgressBar')
          .attr('opacity', (b) => Number(o.id === b.id || getWidth(b) > 480));

        svg.selectAll('.Duration')
          .attr('opacity', (b) => Number(o.id === b.id || getWidth(b) > 200));

        svg.selectAll('.TermType')
          .attr('opacity', (b) => Number(o.id === b.id || getWidth(b) > 80));

        second_section.selectAll('.Date')
          .attr('data-current', (b, i) => (dayjs(b.start_date, 'MM/DD/YYYY').isBetween(o.start_date, o.end_date, 'days') || dayjs(b.end_date, 'MM/DD/YYYY').isBetween(o.start_date, o.end_date, 'days')));
        second_section.selectAll('.Date-Block')
          .attr('data-current', (b, i) => (dayjs(b.start_date, 'MM/DD/YYYY').isBetween(o.start_date, o.end_date, 'days') || dayjs(b.end_date, 'MM/DD/YYYY').isBetween(o.start_date, o.end_date, 'days')));

        d3select(this).selectAll('.Title')
          .text((o) => o.title);

        d3select(this).each(function (o, i) {
          const thisWidth = ((d3max([getWidth(o), 500])) + 10);
          trimTitle(thisWidth, this, config.box_padding * 2);
        });
      })
      .on('mouseout', function (d, o) {
        svg.selectAll('.Single--Block')
          .style('opacity', 1);
        svg.selectAll('.start-lines, .end-lines')
          .style('stroke-width', 1)
          .style('opacity', 1);

        svg.selectAll('.Single--Node')
          .attr('width', (b) => (getActualWidth(b) + 10));

        svg.selectAll('.ProgressBar')
          .attr('opacity', (b) => Number(getWidth(b) > PROGRESSBAR_BOUNDARY));

        svg.selectAll('.Duration')
          .attr('opacity', (b) => Number(getWidth(b) > 200));

        svg.selectAll('.TermType')
          .attr('opacity', (b) => Number(getWidth(b) > 80));
        second_section.selectAll('.Date')
          .style('fill', '');
        second_section.selectAll('.Date-Block')
          .style('fill', '');

        d3select(this).each(function (d, i) {
          trimTitle(getWidth(d), this, config.box_padding * 2);
        });
      })
      .each(function (d, i) {
        trimTitle(getWidth(d), this, config.box_padding * 2);
      });

    function appendBar(d, i) {
      d.append('rect')
        .attr('class', (d1) => {
          let nodeClass = 'Single--Node';

          if (!d1.inicio_real && !d1.termino_real) {
            nodeClass += ' Single--Node--estimated';
          } else if (!d1.inicio_real || !d1.termino_real) {
            nodeClass += ' Single--Node--half-estimated';
          }

          return nodeClass;
        })
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('height', 60)
        .attr('x', 0)
        .attr('y', (d, i) => y(i + 1))
        .attr('width', (d) => (getActualWidth(d) + 10));
    }

    function appendTitle(d, i) {
      d.append('text')
        .attr('class', 'Title')
        .attr('x', config.box_padding)
        .attr('y', (d, i) => (y(i + 1) + 20))
        .text((d) => d.title);
    }

    function appendFooter(d, i) {
      /* const footer =  */d.append('g')
        .attr('transform', (d, i) => {
          let position = config.box_padding;
          if (position < 10) {
            position = 0;
          }
          return `translate(${position}, ${y(i + 1) + 35})`;
        })
        .call(renderTerm)
        .call(renderDuration)
        .call(appendProgressBar);
    }

    function appendProgressBar(d, i) {
      d.append('rect')
        .attr('class', 'ProgressBar')
        .attr('fill', '#ddd')
        .attr('width', PROGRESSBAR_WIDTH);

      d.append('rect')
        .attr('class', 'ProgressBar ProgressBar-Fill')
        .attr('width', (d) => ((d.completion_percentage * PROGRESSBAR_WIDTH) / 100));

      d.selectAll('.ProgressBar')
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('y', -7)
        .attr('height', 7)
        .attr('x', 180)
        .attr('opacity', (d) => Number(getWidth(d) > PROGRESSBAR_BOUNDARY));
    }

    function appendStartLine(d) {
      d.selectAll('.start-lines')
        .data(data)
        .enter()
        .append('line')
        .attr('class', 'start-lines')
        .attr('stroke', (d) => d.color)
        .attr('x1', (d) => x(new Date(d.start_date)) + 10)
        .attr('x2', (d) => x(new Date(d.start_date)) + 10)
        .attr('y1', 0)
        .attr('y2', (d, i) => (y(i + 1) + 20));

      d.selectAll('.end-lines')
        .data(data)
        .enter()
        .append('line')
        .attr('stroke', (d) => d.color)
        .attr('class', 'end-lines')
        .attr('x1', (d) => x(new Date(d.end_date)) + 5)
        .attr('x2', (d) => x(new Date(d.end_date)) + 5)
        .attr('y1', 0)
        .attr('y2', (d, i) => (y(i + 1) + 20));
    }

    function renderTerm(d, i) {
      d.append('text')
        .attr('class', 'TermType')
        .text((d) => d.term)
        .attr('opacity', (d) => Number(getWidth(d) > 80));
    }

    function renderDuration(d, i) {
      d.append('text')
        .attr('class', 'Duration')
        .attr('x', 60)
        .text((d) => getDuration(d))
        .attr('opacity', (d) => Number(getWidth(d) > 200));
    }

    // function type(d) {
    //     d.value = +d.value;
    //     return d;
    // }

    function getDuration(d) {
      const startDate = dayjs(d.start_date);
      const startYear = startDate.format('YY');
      const endDate = dayjs(d.end_date);
      const endYear = endDate.format('YY');

      return startYear !== endYear
        ? `${startDate.format('DD MMM YY')} - ${endDate.format('DD MMM YY')}`
        : `${startDate.format('DD MMM')} - ${endDate.format('DD MMM')}`;
    }

    function trimTitle(thisWidth, node, padding) {
      const textBlock = d3select(node).select('.Title');

      let textLength = textBlock.node().getComputedTextLength();
      let text = textBlock.text();
      while (textLength > (thisWidth - padding) && text.length > 0) {
        text = text.slice(0, -1);
        textBlock.text(`${text}...`);
        textLength = textBlock.node().getComputedTextLength();
      }
    }

    function getWidth(node) {
      if (endsAfter(node)) {
        return Math.abs(x(new Date(date_boundary[1])) - x(new Date(node.start_date)));
      }

      if (startsBefore(node)) {
        return Math.abs(x(new Date(date_boundary[0])) - x(new Date(node.end_date)));
      }
      return getActualWidth(node);
    }

    function getActualWidth(node) {
      return Math.abs(x(new Date(node.end_date)) - x(new Date(node.start_date)));
    }

    function startsBefore(node) {
      return dayjs(node.start_date, 'MM/DD/YYYY').isBefore(date_boundary[0]);
    }

    function endsAfter(node) {
      return dayjs(node.end_date, 'MM/DD/YYYY').isAfter(date_boundary[1]);
    }

    function isVisible(node) {
      const startDateVisible = dayjs(node.start_date, 'MM/DD/YYYY').isBetween(date_boundary[0], date_boundary[1], 'days');
      const endDateVisible = dayjs(node.end_date, 'MM/DD/YYYY').isBetween(date_boundary[0], date_boundary[1], 'days');

      return startDateVisible || endDateVisible;
    }

    function getDaysRange(monthsToCalc) {
      const ranges = [];
      monthsToCalc.forEach((month) => {
        const startOfMonth = dayjs(month).startOf('month');
        const endOfMonth = dayjs(month).endOf('month');
        let day = startOfMonth;

        while (day <= endOfMonth) {
          ranges.push({
            name: dayjs(day).format('DD'),
            start_date: day.toDate(),
            end_date: day.clone().add(1, 'd').toDate(),
          });
          day = day.clone().add(1, 'd');
        }
      });
      return ranges;
    }

    function getMonthsRange(monthsToCalc) {
      const ranges = [];
      monthsToCalc.forEach((month) => {
        const startOfMonth = dayjs(month).startOf('month');
        const endOfMonth = dayjs(month).endOf('month');

        ranges.push({
          name: dayjs(startOfMonth).format('MMMM'),
          start_date: startOfMonth.toDate(),
          end_date: endOfMonth.clone().add(1, 'd').toDate(),
        });
      });

      return ranges;
    }

    function getYearBoundary(year) {
      const yearDate = dayjs(`01 01 ${year}`, 'YYYY');
      const startOfYear = dayjs(yearDate).startOf('year');
      const endOfYear = dayjs(yearDate).endOf('year');

      return {
        name: year,
        start_date: startOfYear.toDate(),
        end_date: endOfYear.toDate(),
      };
    }

    function getMonthsOfTheYear(year) {
      return range(1, 13).map((m) => `${year}-${String(m).padStart(2, '0')}-01`);
      // return dayjs.months().map((month) => `01/${month}/`);
    }
  }
}
