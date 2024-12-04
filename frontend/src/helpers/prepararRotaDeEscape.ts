import isUrlValid from '@/helpers/isUrlValid';
import { merge } from 'lodash';
import type { RouteLocation, RouteLocationNamedRaw } from 'vue-router';

/**
 * Prepara a rota de escape, que é a rota para onde a pessoa será redirecionada
 * @param rota - Rota resolvida pelo Vue Router
 * @param parametrosSobrescritos - Parâmetros que serão sobrescritos na rota de escape
 * que será usada em vez da rota de escape definida na meta da rota
 */
export default (rota: RouteLocation, parametrosSobrescritos = {}) => {
  let parametrosViaQueryString;

  if (typeof rota.query?.escape === 'string') {
    if (isUrlValid(rota.query?.escape)) {
      parametrosViaQueryString = { path: rota.query.escape };
    } else {
      parametrosViaQueryString = { name: rota.query.escape };
    }
  } else if (rota.query?.escape && typeof rota.query?.escape === 'object') {
    parametrosViaQueryString = rota.query?.escape;
  }

  const rotaFinal:RouteLocationNamedRaw = merge(
    {
      name: rota.meta?.rotaDeEscape as string,
    },
    parametrosViaQueryString,
    // por último, para garantir que foi sobrescrita
    parametrosSobrescritos,
  );

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
