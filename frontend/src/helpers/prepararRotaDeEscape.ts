import isUrlValid from '@/helpers/isUrlValid';
import { merge } from 'lodash';
import type { RouteLocation, RouteLocationRaw } from 'vue-router';

/**
 * Prepara a rota de escape, que é a rota para onde a pessoa será redirecionada
 * @param rota - Rota resolvida pelo Vue Router
 * @param rotaDeEscapeForcada - Nome de uma rota de escape explicitamente definida,
 * que será usada em vez da rota de escape definida na meta da rota
 */
export default (rota: RouteLocation, rotaDeEscapeForcada = '') => {
  let rotaSobrescrita;

  if (typeof rota.query?.escape === 'string') {
    if (isUrlValid(rota.query?.escape)) {
      rotaSobrescrita = { path: rota.query.escape };
    } else {
      rotaSobrescrita = { name: rota.query.escape };
    }
  } else {
    rotaSobrescrita = rota.query?.escape;
  }

  const rotaFinal:RouteLocationRaw = {
    name: rota.meta?.rotaDeEscape as string,
    ...rotaSobrescrita,
  };

  // depois da mesclagem, para garantir que foi sobrescrita
  if (rotaDeEscapeForcada) {
    rotaFinal.name = rotaDeEscapeForcada;
  }

  if (rota.params) {
    rotaFinal.params = merge(rota.params, rotaFinal.params);
  }

  if (rota.query) {
    rotaFinal.query = merge(rota.query, rotaFinal.query);
  }

  if (rotaFinal.query?.escape) {
    delete rotaFinal.query.escape;
  }

  return !rotaFinal.name
    ? null
    : rotaFinal;
};
