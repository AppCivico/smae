export default (listaDeVariáveis = []) => {
  const compostas = {};
  const órfãs = [];

  if (Array.isArray(listaDeVariáveis)) {
    listaDeVariáveis.forEach((x) => {
      if (!Array.isArray(x.variavel_formula_composta)
      || !x.variavel_formula_composta?.length) {
        órfãs.push(x);
      } else {
        x.variavel_formula_composta.forEach((y) => {
          if (y?.id) {
            if (!compostas[y.id]) {
              compostas[y.id] = {
                ...y,
                variaveis: [],
              };
            }
            compostas[y.id].variaveis.push(x);
          }
        });
      }
    });
  }

  return {
    órfãs,
    compostas: Object.values(compostas),
  };
};
