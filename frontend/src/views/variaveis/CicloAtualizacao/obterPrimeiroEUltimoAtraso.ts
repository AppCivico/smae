import dateIgnorarTimezone from "@/helpers/dateIgnorarTimezone";

function periodicidadeEmDias(p: string): number {
  switch (p) {
    case "Mensal":
      return 30; // aproximação de 1 mês
    case "Bimestral":
      return 60; // aproximação de 2 meses
    case "Trimestral":
      return 90; // aproximação de 3 meses
    case "Quadrimestral":
      return 120; // aproximação de 4 meses
    case "Semestral":
      return 180; // aproximação de 6 meses
    case "Anual":
      return 365; // aproximação de 1 ano
    case "Quinquenal":
      return 1825; // aproximação de 5 anos
    case "Secular":
      return 36500; // aproximação de 100 anos
    default:
      return 1;
  }
}

function fmt(date: string): string {
  return dateIgnorarTimezone(date, 'dd/MM/yyyy') || '"-"';
}

function hasGap(prev: string, curr: string, expectedDays: number): boolean {
  const d1 = new Date(prev);
  const d2 = new Date(curr);

  const diffDays = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);

  // Hack pragmático usando Math.abs para evitar importar bibliotecas de manipulação
  // de datas (como date-fns ou moment) para fazer a comparação correta de períodos.
  // Para periodicidades curtas (diária), usa tolerância de 0 dias.
  // Para periodicidades longas (mensal+), permite variação de 10% para compensar
  // meses com diferentes quantidades de dias (28, 30, 31).
  const tolerance = expectedDays <= 1 ? 0 : expectedDays * 0.1;
  return Math.abs(diffDays - expectedDays) > tolerance;
}

export default function obterPrimeiroEUltimoAtraso(
  atrasos: string[] | null,
  periodicidade: string,
): string {
  if (!atrasos || atrasos.length === 0) {
    return "";
  }

  if (atrasos.length === 1) {
    return fmt(atrasos[0]);
  }

  const expectedDays = periodicidadeEmDias(periodicidade);
  const grupos: string[] = [];
  let i = 0;

  while (i < atrasos.length && grupos.length < 3) {
    const inicio = atrasos[i];
    let fim = inicio;

    let j = i + 1;

    while (
      j < atrasos.length &&
      !hasGap(atrasos[j - 1], atrasos[j], expectedDays)
    ) {
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

  return resto ? `${grupos.join(", ")} e outros` : grupos.join(", ");
}
