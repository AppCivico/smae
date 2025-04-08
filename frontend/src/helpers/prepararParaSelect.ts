type MapaParaChave = {
  id: string | number;
  label: string;
};

function prepararParaSelect(
  valor: Record<string, any>[] | Record<string, any>,
  mapa: MapaParaChave,
): MapaParaChave[] {
  let lista = [];
  if (typeof valor === 'object') {
    lista = Object.values(valor);
  } else {
    lista = valor;
  }

  return lista.map<MapaParaChave>((item) => ({
    id: item[mapa.id],
    label: item[mapa.label],
  }));
}

export default prepararParaSelect;
