type MapaParaChave = {
  id: string | number;
  label: string;
};

function prepararParaSelect(
  valor: Record<string, any>[] | Record<string, any>,
  mapa: MapaParaChave,
): MapaParaChave[] {
  let lista = [];

  if (Array.isArray(valor)) {
    lista = valor;
    // prevenindo erros com código legado que armazena estados de espera no
    // lugar da listagem 🤬
  } else if (typeof valor === 'object' && valor !== null && !valor.loading) {
    lista = Object.values(valor);
  }

  return lista.map<MapaParaChave>((item) => ({
    id: item[mapa.id],
    label: item[mapa.label],
  }));
}

export default prepararParaSelect;
