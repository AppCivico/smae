import {
  computed, ComputedRef, onMounted, onUnmounted, ref,
} from 'vue';

let tamanhoDispositivo: Tamanhos | null = null;

type Tamanhos = {
  mobile: ComputedRef<boolean>;
  tablet: ComputedRef<boolean>;
  web: ComputedRef<boolean>;
};

function obterTamanhoDispositivo(): Tamanhos {
  const width = ref(window.outerWidth);

  function atualizarTamanho() {
    width.value = window.innerWidth;
  }

  const mobile = computed<boolean>(() => width.value <= 440);
  const tablet = computed<boolean>(() => width.value > 440 && width.value < 770);
  const web = computed<boolean>(() => width.value >= 770);

  onMounted(() => {
    window.addEventListener('resize', atualizarTamanho);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', atualizarTamanho);
  });

  return {
    mobile,
    tablet,
    web,
  };
}

function useTamanhoDispositivo(): Tamanhos {
  if (!tamanhoDispositivo) {
    tamanhoDispositivo = obterTamanhoDispositivo();
  }

  return tamanhoDispositivo;
}

export default useTamanhoDispositivo;
