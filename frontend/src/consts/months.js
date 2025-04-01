const meses = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const listaDeMeses = meses.map((item, i) => ({ nome: item, id: i + 1 }));
export const mapaDeMeses = listaDeMeses.reduce((acumulador, item) => {
  acumulador[item.id] = item;

  return acumulador;
}, {});

export default meses;
