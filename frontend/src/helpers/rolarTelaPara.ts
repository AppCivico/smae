import domParamNormalizer from './domParamNormalizer';

export default (seletor:string | HTMLElement = window.location.hash) => {
  const destino = domParamNormalizer(seletor);

  if (destino?.[0]) {
    destino[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }
};
