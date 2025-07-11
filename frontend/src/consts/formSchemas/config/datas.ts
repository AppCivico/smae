function testarData(value: string | undefined, fallback: string) {
  const d = new Date(value ?? '');
  return Number.isNaN(d.getTime()) ? new Date(fallback) : d;
}

export const dataMin = testarData(import.meta.env.VITE_DATA_MIN, '1900-01-01T00:00:00Z');
export const dataMax = testarData(import.meta.env.VITE_DATA_MAX, '2100-12-31T23:59:59Z');

// Carrega os anos possíveis - começa em 2003 e termina no corrente mais cinco
export const endYear = new Date().getFullYear() + 5;
export const startYear = 2003;
