import { computed } from 'vue';
import { useRouter } from 'vue-router';

function useRotaAtual() {
  const router = useRouter();

  const rotaAtual = computed(() => {
    const rotasEncontradas = router.currentRoute.value.matched;

    const rotaEncontrada = rotasEncontradas[rotasEncontradas.length - 1];

    return rotaEncontrada;
  });

  return {
    rotaAtual,
  };
}

export default useRotaAtual;
