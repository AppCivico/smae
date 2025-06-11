export default function criaOpcoesDosGraficosDeVariaveis(categorias, valores, coresPersonalizadas) {
  const cores = coresPersonalizadas ?? [
    '#04233d',
    '#094376',
    '#0e60a7',
    '#7694bf',
    '#a5c1e7',
  ];

  return {
    color: cores,
    tooltip: {
      trigger: 'item',
    },
    grid: {
      left: '20%',
      right: '10%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      inverse: false,
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
      axisLabel: {
        show: true,
        fontSize: 16,
        color: '#2f3542',
        fontWeight: '600',
        fontFamily: 'Roboto',
        padding: [0, 0, 0, 10],
        formatter: (value) => `{label|${value}}`,
        rich: {
          label: {
            align: 'left',
            width: 150,
            fontSize: 13,
            color: '#2f3542',
            fontWeight: '600',
            fontFamily: 'Roboto',
          },
        },
      },
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
            return `{number|${value}}`;
          },
          rich: {
            number: {
              fontSize: 30,
              fontWeight: 'bold',
              align: 'left',
              padding: [0, 0, 0, 10],
              fontFamily: 'Roboto Slab',
            },
          },
        },
        itemStyle: {
          borderRadius: [0, 999, 999, 0],
        },
      },
    ],
  };
}
