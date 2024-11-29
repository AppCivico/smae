import prepararRotaDeEscape from '@/helpers/prepararRotaDeEscape';
import type { RouteLocation, Router } from 'vue-router';
import { useRouter } from 'vue-router';

export function useEscaparDaRota(router: Router = useRouter()) {
  const rotaCorrente:RouteLocation = router.currentRoute.value;

  const rotaDeEscape = prepararRotaDeEscape(rotaCorrente);

  return rotaDeEscape
    ? router.push(rotaDeEscape)
    : Promise.reject();
}
