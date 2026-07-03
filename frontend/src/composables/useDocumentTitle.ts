import {
  type MaybeRefOrGetter, computed, ref, toValue, watchEffect,
} from 'vue';

const SUFIXO = 'SMAE';
const SEPARADOR = ' | ';

interface EntradaDePrefixo {
  id: string;
  titulo: MaybeRefOrGetter<string>;
}

// Estado compartilhado entre todas as instâncias do composable, para que o
// título da rota e os prefixos registrados por diálogos abertos em
// qualquer parte da árvore de componentes sejam combinados em um único lugar.
const tituloBase = ref('');
const pilhaDePrefixos = ref<EntradaDePrefixo[]>([]);

const tituloCompleto = computed(() => {
  const prefixos = pilhaDePrefixos.value
    .map((entrada) => toValue(entrada.titulo))
    .filter(Boolean);

  const partes = [...prefixos].reverse();

  if (tituloBase.value) {
    partes.push(tituloBase.value);
  }

  return partes.length ? `${partes.join(SEPARADOR)}${SEPARADOR}${SUFIXO}` : SUFIXO;
});

watchEffect(() => {
  document.title = tituloCompleto.value;
});

function definirTituloBase(titulo: string) {
  tituloBase.value = titulo;
}

function registrarPrefixo(id: string, titulo: MaybeRefOrGetter<string>) {
  pilhaDePrefixos.value = [
    ...pilhaDePrefixos.value.filter((entrada) => entrada.id !== id),
    { id, titulo },
  ];
}

function removerPrefixo(id: string) {
  pilhaDePrefixos.value = pilhaDePrefixos.value.filter((entrada) => entrada.id !== id);
}

export function useDocumentTitle() {
  return {
    tituloCompleto,
    definirTituloBase,
    registrarPrefixo,
    removerPrefixo,
  };
}
