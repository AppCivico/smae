import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';

function fmt(date: string): string {
  return dateIgnorarTimezone(date, 'dd/MM/yyyy') || '-';
}

function hasGap(prev: string, curr: string): boolean {
  const d1 = new Date(prev);
  const d2 = new Date(curr);

  const diffDays = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);

  return diffDays !== 1;
}

export default function obterPrimeiroEUltimoAtraso(
  atrasos: string[] | null,
): string {
  if (!atrasos || atrasos.length === 0) {
    return '';
  }

  if (atrasos.length === 1) {
    return fmt(atrasos[0]);
  }

  const grupos: string[] = [];
  let i = 0;

  while (i < atrasos.length && grupos.length < 3) {
    const inicio = atrasos[i];
    let fim = inicio;

    let j = i + 1;

    while (j < atrasos.length && !hasGap(atrasos[j - 1], atrasos[j])) {
      fim = atrasos[j];
      j += 1;
    }

    if (inicio === fim) {
      grupos.push(fmt(inicio));
    } else {
      grupos.push(`${fmt(inicio)} ⋯ ${fmt(fim)}`);
    }

    i = j;
  }

  const resto = i < atrasos.length;

  return resto ? `${grupos.join(', ')} e outros` : grupos.join(', ');
}
