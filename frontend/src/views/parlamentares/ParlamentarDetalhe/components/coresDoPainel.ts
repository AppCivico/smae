const cores = ['#221F43', '#2E4059', '#3B5881', '#5C7490', '#778DA9'];

const coresDePartido = ['#2A78D6', '#EB6834', '#1BAF7A', '#EDA100', '#E87BA4'];

const corDeOutros = '#ACB7C3';

export function corDoPartido(indice: number, outros: boolean): string {
  if (outros) {
    return corDeOutros;
  }

  return coresDePartido[indice % coresDePartido.length];
}

export default function corDoItem(indice: number, outros: boolean): string {
  if (outros) {
    return corDeOutros;
  }

  return cores[indice % cores.length];
}
