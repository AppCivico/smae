const UM_DIA_EM_MS = 1000 * 60 * 60 * 24;

function dataSemHora(data: string): number {
  return Date.parse(data.slice(0, 10));
}

export function diasEntre(inicio: string, fim?: string | null): number {
  const fimEmMs = dataSemHora(fim || new Date().toISOString());
  return Math.max(0, Math.round((fimEmMs - dataSemHora(inicio)) / UM_DIA_EM_MS));
}

export function formatarDias(dias: number): string {
  if (dias === 0) return 'menos de 1 dia';
  return dias === 1 ? '1 dia' : `${dias} dias`;
}
