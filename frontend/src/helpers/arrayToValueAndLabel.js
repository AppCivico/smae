export default (list) => Object.keys(list).map((x) => ({
  etiqueta: list[x],
  valor: x.toLowerCase(),
}));
