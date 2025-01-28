function mapearAtrasoParaCor(grau) {
  switch (grau.toLowerCase()) {
    case 'alto':
      return 'vermelho';

    case 'moderado':
      return 'laranja';

    case 'concluido':
      return 'verde';

    default:
      return null;
  }
}

function achatarGeoLocalizacao(data) {
  let geoLocalizaçãoAchatada = [];

  data.forEach((item) => {
    if (item?.etapa?.geolocalizacao?.length > 0) {
      geoLocalizaçãoAchatada = geoLocalizaçãoAchatada
        .concat(item.etapa.geolocalizacao.map((x) => {
          if (!x?.endereco?.properties?.atraso_grau) {
            // eslint-disable-next-line no-param-reassign
            x.endereco.properties.cor_do_marcador = mapearAtrasoParaCor(item.atraso_grau);
          }

          return x;
        }));
    }

    if (item?.geolocalizacao?.length > 0) {
      geoLocalizaçãoAchatada = geoLocalizaçãoAchatada
        .concat(item.geolocalizacao.map((x) => {
          if (!x?.endereco?.properties?.atraso_grau) {
            // eslint-disable-next-line no-param-reassign
            x.endereco.properties.cor_do_marcador = mapearAtrasoParaCor(item.atraso_grau);
          }

          return x;
        }));
    }

    if (item?.etapa?.etapa_filha?.length > 0) {
      geoLocalizaçãoAchatada = geoLocalizaçãoAchatada
        .concat(achatarGeoLocalizacao(item.etapa.etapa_filha));
    }

    if (item?.etapa_filha?.length > 0) {
      geoLocalizaçãoAchatada = geoLocalizaçãoAchatada
        .concat(achatarGeoLocalizacao(item.etapa_filha));
    }
  });

  return geoLocalizaçãoAchatada;
}

export default achatarGeoLocalizacao;
