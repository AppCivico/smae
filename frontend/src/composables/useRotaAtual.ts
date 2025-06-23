import { computed } from 'vue';
import { useRoute } from 'vue-router';

function useRotaAtual() {
  const route = useRoute();

  const rotaAtual = computed(() => {
    const rotasEncontradas = route.matched;

    if (!rotasEncontradas.length) {
      return undefined;
    }

    const rotaEncontrada = rotasEncontradas[rotasEncontradas.length - 1];

    return rotaEncontrada;
  });

  return {
    rotaAtual,
  };
}

export default useRotaAtual;
