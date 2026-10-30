import { format, isValid, parse } from 'date-fns';

// ano só com 2 ou 4 dígitos: "15/03/202", com um dígito a menos, não vira o ano 202
const FORMATO_BR = /^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/;
const FORMATO_ISO = /^\d{4}\/\d{1,2}\/\d{1,2}$/;

function obterFormato(texto: string): string | null {
  if (FORMATO_ISO.test(texto)) return 'yyyy/M/d';

  const br = texto.match(FORMATO_BR);
  if (br) return br[1].length === 2 ? 'd/M/yy' : 'd/M/yyyy';

  return null;
}

export default function converterDataColada(texto: string): string | null {
  // descarta horário e unifica separadores: "15.03.2025 14:30" vira "15/03/2025"
  const [dataSemHora] = texto.trim().split(/[\sT]/);
  const normalizado = dataSemHora.replace(/[.-]/g, '/');

  const formato = obterFormato(normalizado);
  if (!formato) return null;

  const data = parse(normalizado, formato, new Date());

  return isValid(data) ? format(data, 'yyyy-MM-dd') : null;
}
