export default function criaOpcoesDoGraficoDeProjetos(categorias, valores) {
  return {
    color: [
      '#1b263b',
      '#2d374a',
      '#3f4858',
      '#515967',
      '#636a76',
      '#757b85',
      '#868c93',
      '#989da2',
      '#aaaeb1',
      '#bcbfc0',
      '#ced0ce',
      '#e0e1dd',
    ],
    tooltip: {
      trigger: 'item',
    },
    grid: {
      left: '0',
      right: '50%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      inverse: true,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: categorias,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: valores,
        barWidth: 35,
        colorBy: 'data',
        label: {
          show: true,
          position: 'right',
          formatter: (params) => {
            const label = categorias[params.dataIndex].toUpperCase();
            const { value } = params;
            return `{number|${value}}\n{text|${label}}`;
          },
          rich: {
            number: {
              fontSize: 30,
              fontWeight: 'bold',
              align: 'left',
              padding: [0, 0, 0, 40],
              fontFamily: 'Roboto Slab',
            },
            text: {
              fontSize: 13,
              color: '#7e858d',
              align: 'left',
              padding: [0, 0, 0, 40],
              fontFamily: 'Roboto',
              fontWeight: '600',
            },
          },
        },
        itemStyle: {
          borderRadius: [999, 0, 0, 999],
        },
        markLine: {
          silent: true,
          label: { show: false },
          symbol: 'none',
          lineStyle: {
            color: '#aaa',
            width: 1,
            type: 'solid',
          },
          data: [{ xAxis: 0 }],
        },
      },
    ],
  };
}
