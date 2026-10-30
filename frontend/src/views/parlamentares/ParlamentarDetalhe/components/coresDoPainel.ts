const cores = ['#221F43', '#2E4059', '#3B5881', '#5C7490', '#778DA9'];

const corDeOutros = '#ACB7C3';

export default function corDoItem(indice: number, outros: boolean): string {
  if (outros) {
    return corDeOutros;
  }

  return cores[indice % cores.length];
}
