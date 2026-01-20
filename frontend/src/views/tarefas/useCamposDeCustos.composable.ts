import { getYear, parseISO } from 'date-fns';
import { computed, ref, watch } from 'vue';

type Props = {
  values: Record<string, any>;
  tipo: 'estimado' | 'real';
};

export default function useCamposDeCustos(props: Props) {
  function obterListaDeAnos(inicio: string, termino?: string): number[] {
    if (!inicio) {
      return [];
    }

    const anoInicio = getYear(parseISO(inicio));
    let anoTermino: number;

    if (termino) {
      anoTermino = getYear(parseISO(termino));
    } else if (props.tipo === 'estimado') {
      anoTermino = anoInicio + 10;
    } else if (props.tipo === 'real') {
      anoTermino = getYear(new Date());
    } else {
      throw new Error(`Tipo "${props.tipo}" não válido`);
    }

    if (anoInicio === anoTermino) {
      return [anoInicio];
    }

    return [
      ...Array.from(
        { length: anoTermino - anoInicio + 1 },
        (_, i) => anoInicio + i,
      ),
    ];
  }

  const listaDeAnos = ref<number[]>([]);

  const nomeDoCampoDeCusto = computed(() => `custo_${props.tipo}_anualizado`);
  const nomeDoCampoDeCustoAgrupado = computed(() => `custo_${props.tipo}`);

  const listaDeWatchers = {
    estimado: [
      () => props.values?.inicio_planejado,
      () => props.values?.termino_planejado,
    ],
    real: [
      () => props.values?.inicio_real,
      () => props.values?.termino_real,
    ],
  };

  watch(
    listaDeWatchers[props.tipo],
    ([inicio, termino]) => {
      listaDeAnos.value = obterListaDeAnos(inicio, termino);
    },
    { immediate: true },
  );

  return {
    listaDeAnos,
    nomeDoCampoDeCusto,
    tipoDeCusto: props.tipo,
    nomeDoCampoDeCustoAgrupado,
  };
}
