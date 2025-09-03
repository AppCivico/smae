type MapaParaChaveEntrada = {
  id: string | number;
  label: string | string[];
};

type MapaParaChaveSaida = MapaParaChaveEntrada & {
  label: string;
};

function obterLabel(mapaLabel: string | string[], item: any) {
  if (!Array.isArray(mapaLabel)) {
    return item[mapaLabel];
  }

  return mapaLabel.map((chaveLabel) => item[chaveLabel]).join(' - ');
}

function prepararParaSelect(
  valor: Record<string, any>[] | Record<string, any>,
  mapa: MapaParaChaveEntrada,
): MapaParaChaveSaida[] {
  let lista = [];

  if (Array.isArray(valor)) {
    lista = valor;
    // prevenindo erros com código legado que armazena estados de espera no
    // lugar da listagem 🤬
  } else if (typeof valor === 'object' && valor !== null && !valor.loading) {
    lista = Object.values(valor);
  }

  return lista.map<MapaParaChaveSaida>((item) => ({
    id: item[mapa.id],
    label: obterLabel(mapa.label, item),
  }));
}

export default prepararParaSelect;
