import prepararRotaDeEscape from '@/helpers/prepararRotaDeEscape';
import type { RouteLocation, Router } from 'vue-router';

export default (router: Router, parametrosSobrescritos = {}) => {
  const rotaCorrente: RouteLocation = router.currentRoute.value;

  const rotaDeEscape = prepararRotaDeEscape(
    rotaCorrente,
    parametrosSobrescritos,
  );

  return rotaDeEscape
    ? router.push(rotaDeEscape)
    : Promise.reject();
};
